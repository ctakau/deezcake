import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validateTxn, type Txn } from "@/lib/accounting";

/* POST /api/payments
   Body: { orderNum, amount, method }
   Posts Cash/Bank up + A/R down, then updates the order's paid/pay_status. */
export async function POST(req: Request) {
  const { orderNum, amount, method } = await req.json().catch(() => ({}));
  if (!orderNum || !amount || amount <= 0)
    return NextResponse.json({ error: "orderNum and positive amount required." }, { status: 400 });

  const db = supabaseAdmin();
  const { data: order } = await db.from("orders").select("*").eq("order_num", orderNum).single();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const owing = Number(order.total) - Number(order.paid);
  if (amount > owing)
    return NextResponse.json({ error: `Amount exceeds balance owing (${owing}).` }, { status: 422 });

  const cashAcct = method === "Cash" ? "1000" : "1100";
  const txn: Txn = {
    date: new Date().toISOString().slice(0, 10), ref: orderNum, source: "payment",
    desc: `Payment received — ${orderNum} (${method})`,
    splits: [
      { account: cashAcct, debit: amount, credit: 0 },
      { account: "1300", debit: 0, credit: amount }, // clear receivable
    ],
  };
  const err = validateTxn(txn);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  const { data: h } = await db.from("transactions").insert({
    txn_date: txn.date, description: txn.desc, reference: txn.ref,
    source: "payment", order_num: orderNum,
  }).select("id").single();
  if (h) {
    await db.from("splits").insert(txn.splits.map((s) => ({
      transaction_id: h.id, account_code: s.account,
      debit: Math.round(s.debit), credit: Math.round(s.credit),
    })));
  }

  const paid = Number(order.paid) + amount;
  const pay_status = paid >= Number(order.total) ? "Paid" : paid > 0 ? "Partially paid" : "Unpaid";
  const status = paid >= Number(order.total) && order.status === "Pending" ? "Confirmed" : order.status;
  await db.from("orders").update({ paid, pay_status, status }).eq("order_num", orderNum);

  return NextResponse.json({ ok: true, paid, pay_status });
}
