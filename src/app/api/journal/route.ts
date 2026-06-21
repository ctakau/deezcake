import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validateTxn, type Txn } from "@/lib/accounting";
import { getAuthUser, isOwnerEmail } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isOwnerEmail(user.email))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let txn: Txn;
  try {
    txn = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!txn.date || !txn.desc || !Array.isArray(txn.splits))
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  if (String(txn.desc).length > 500)
    return NextResponse.json({ error: "Description too long." }, { status: 400 });
  if (txn.splits.length > 20)
    return NextResponse.json({ error: "Too many splits." }, { status: 400 });

  const err = validateTxn(txn);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: header, error: hErr } = await db
    .from("transactions")
    .insert({
      txn_date: txn.date,
      description: String(txn.desc).slice(0, 500),
      reference: txn.ref ? String(txn.ref).slice(0, 100) : null,
      source: txn.source ?? "manual",
      order_num: (txn as any).orderNum ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (hErr || !header)
    return NextResponse.json({ error: hErr?.message ?? "Insert failed." }, { status: 500 });

  const rows = txn.splits.map((s) => ({
    transaction_id: header.id,
    account_code: String(s.account).slice(0, 10),
    debit: Math.round(+s.debit || 0),
    credit: Math.round(+s.credit || 0),
  }));
  const { error: sErr } = await db.from("splits").insert(rows);
  if (sErr) {
    await db.from("transactions").delete().eq("id", header.id);
    return NextResponse.json({ error: sErr.message }, { status: 422 });
  }

  await db.from("audit_logs").insert({
    entity_type: "transaction", entity_id: String(header.id),
    action: "post", detail: { ref: txn.ref, desc: txn.desc },
    user_id: user.id,
  });

  return NextResponse.json({ ok: true, id: header.id });
}
