import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validateTxn, type Txn } from "@/lib/accounting";

/* POST /api/journal
   Body: a Txn (date, desc, ref, source, splits[]).
   The engine validates BEFORE we touch the database. Even though the Postgres
   trigger would also reject an unbalanced entry, we check here first so the
   client gets a clean, specific error and we never write a half-row. */
export async function POST(req: Request) {
  let txn: Txn;
  try {
    txn = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // IFRS ENFORCEMENT POINT (server side).
  const err = validateTxn(txn);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  const db = supabaseAdmin();

  // Insert header, then splits. The deferred balance trigger fires at commit,
  // so all splits must be present and balanced or the whole transaction aborts.
  const { data: header, error: hErr } = await db
    .from("transactions")
    .insert({
      txn_date: txn.date,
      description: txn.desc,
      reference: txn.ref,
      source: txn.source ?? "manual",
      order_num: (txn as any).orderNum ?? null,
    })
    .select("id")
    .single();
  if (hErr || !header)
    return NextResponse.json({ error: hErr?.message ?? "Insert failed." }, { status: 500 });

  const rows = txn.splits.map((s) => ({
    transaction_id: header.id,
    account_code: s.account,
    debit: Math.round(+s.debit || 0),
    credit: Math.round(+s.credit || 0),
  }));
  const { error: sErr } = await db.from("splits").insert(rows);
  if (sErr) {
    // Trigger or constraint rejected it — roll back the orphan header.
    await db.from("transactions").delete().eq("id", header.id);
    return NextResponse.json({ error: sErr.message }, { status: 422 });
  }

  await db.from("audit_logs").insert({
    entity_type: "transaction", entity_id: String(header.id),
    action: "post", detail: { ref: txn.ref, desc: txn.desc },
  });

  return NextResponse.json({ ok: true, id: header.id });
}
