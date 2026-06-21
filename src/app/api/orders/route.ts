import { NextResponse } from "next/server";
import { validateTxn, orderJournals } from "@/lib/accounting";
import { PRODUCTS, cogsFor } from "@/lib/catalogue";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const user = await getAuthUser(req);

  const product = PRODUCTS.find((p) => p.id === body.productId);
  if (!product) return NextResponse.json({ error: "Unknown product." }, { status: 400 });

  const size = product.sizes.find((s) => s.label === body.sizeLabel);
  if (!size) return NextResponse.json({ error: "Unknown size." }, { status: 400 });

  const total = size.price > 0 ? size.price : Math.round(Number(body.total) || 0);
  if (total <= 0) return NextResponse.json({ error: "Invalid total." }, { status: 400 });

  const cogs = cogsFor(body.productId);
  if (!body.pickupDate) return NextResponse.json({ error: "Pickup date required." }, { status: 400 });

  const customer = String(body.customer || "").slice(0, 100);
  if (!customer) return NextResponse.json({ error: "Name required." }, { status: 400 });

  const email = body.email ? String(body.email).slice(0, 200) : null;
  const phone = body.phone ? String(body.phone).slice(0, 30) : null;
  if (!email && !phone) return NextResponse.json({ error: "Email or phone required." }, { status: 400 });

  const message = body.message ? String(body.message).slice(0, 60) : null;
  const notes = body.notes ? String(body.notes).slice(0, 500) : null;
  const flavor = body.flavor ? String(body.flavor).slice(0, 50) : null;

  // ponytail: use anon key for order insert (RLS allows it), service key for journals if available
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const orderNum = "DCB-" + randomBytes(4).toString("hex").toUpperCase();

  const { data: order, error: oErr } = await db
    .from("orders")
    .insert({
      order_num: orderNum, customer, email, phone,
      product_id: body.productId, product_name: product.name,
      size_label: size.label, flavor, message,
      pickup_date: body.pickupDate, notes, total, cogs,
      user_id: user?.id ?? null,
    })
    .select("*")
    .single();
  if (oErr || !order)
    return NextResponse.json({ error: oErr?.message ?? "Order insert failed." }, { status: 500 });

  // ponytail: journal auto-post is best-effort — order succeeds even if journals fail
  if (SUPABASE_SERVICE_KEY) {
    try {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
      const today = new Date().toISOString().slice(0, 10);
      const journals = orderJournals({ num: orderNum, date: today, productName: product.name, customer, total, cogs });
      for (const j of journals) {
        const err = validateTxn(j);
        if (err) continue;
        const { data: h } = await admin.from("transactions").insert({
          txn_date: j.date, description: j.desc, reference: j.ref,
          source: "order", order_num: orderNum, created_by: user?.id ?? null,
        }).select("id").single();
        if (h) {
          await admin.from("splits").insert(j.splits.map((s) => ({
            transaction_id: h.id, account_code: s.account,
            debit: Math.round(s.debit), credit: Math.round(s.credit),
          })));
        }
      }
    } catch { /* journals are best-effort */ }
  }

  return NextResponse.json({ ok: true, order });
}
