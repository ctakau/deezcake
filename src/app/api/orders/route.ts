import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validateTxn, orderJournals } from "@/lib/accounting";

/* POST /api/orders
   Body: the order draft + the authenticated user's id.
   Saves the order, then auto-posts the balanced sale (+ COGS) journals.
   Every journal is validated by the engine before it is written. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const db = supabaseAdmin();
  const orderNum = "DCB-" + String(1000 + Math.floor(Math.random() * 9000));
  const today = new Date().toISOString().slice(0, 10);

  const { data: order, error: oErr } = await db
    .from("orders")
    .insert({
      order_num: orderNum,
      customer: body.customer,
      email: body.email ?? null,
      phone: body.phone ?? null,
      product_id: body.productId,
      product_name: body.productName,
      size_label: body.sizeLabel,
      flavor: body.flavor ?? null,
      message: body.message ?? null,
      pickup_date: body.pickupDate,
      notes: body.notes ?? null,
      total: Math.round(body.total),
      cogs: Math.round(body.cogs ?? 0),
      user_id: body.userId ?? null,
    })
    .select("*")
    .single();
  if (oErr || !order)
    return NextResponse.json({ error: oErr?.message ?? "Order insert failed." }, { status: 500 });

  // Auto-post the journals. Validate each first.
  const journals = orderJournals({
    num: orderNum, date: today, productName: body.productName,
    customer: body.customer, total: Math.round(body.total),
    cogs: Math.round(body.cogs ?? 0),
  });
  for (const j of journals) {
    const err = validateTxn(j);
    if (err) return NextResponse.json({ error: "Journal rejected: " + err }, { status: 422 });
    const { data: h } = await db.from("transactions").insert({
      txn_date: j.date, description: j.desc, reference: j.ref,
      source: "order", order_num: orderNum,
    }).select("id").single();
    if (h) {
      await db.from("splits").insert(j.splits.map((s) => ({
        transaction_id: h.id, account_code: s.account,
        debit: Math.round(s.debit), credit: Math.round(s.credit),
      })));
    }
  }

  return NextResponse.json({ ok: true, order });
}
