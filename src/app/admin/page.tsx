"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Nav, Footer, Btn, inputStyle, StatusPill, isOwner } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase-client";
import {
  CHART, acctByCode, acctLabel, DEBIT_NORMAL, vt, validateTxn,
  balanceOf, trialBalance, profitOrLoss, financialPosition, cashFlow, registerFor,
  type Txn,
} from "@/lib/accounting";

// Pull all posted transactions + splits from Supabase into the engine's Txn[] shape.
function useLedger() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const reload = async () => {
    const sb = supabaseBrowser();
    const { data: t } = await sb.from("transactions").select("id,txn_date,description,reference,status").order("id");
    const { data: s } = await sb.from("splits").select("transaction_id,account_code,debit,credit");
    const { data: o } = await sb.from("orders").select("*").order("created_at", { ascending: false });
    const byTxn: Record<number, Txn> = {};
    (t || []).forEach((h: any) => { byTxn[h.id] = { id: h.id, date: h.txn_date, desc: h.description,
      ref: h.reference, source: "", status: h.status, splits: [] }; });
    (s || []).forEach((sp: any) => {
      byTxn[sp.transaction_id]?.splits.push({ account: sp.account_code,
        debit: Number(sp.debit), credit: Number(sp.credit) });
    });
    setTxns(Object.values(byTxn));
    setOrders(o || []);
  };
  useEffect(() => { reload(); }, []);
  return { txns, orders, reload };
}

const tdS: React.CSSProperties = { padding: "9px 10px", fontSize: 13, borderBottom: "1px solid var(--line)" };
const thS: React.CSSProperties = { ...tdS, fontWeight: 700, color: "var(--forest)", textAlign: "left",
  borderBottom: "2px solid var(--line)", fontSize: 12, textTransform: "uppercase" };
const num: React.CSSProperties = { textAlign: "right", fontVariantNumeric: "tabular-nums" };
const Card = ({ children, style }: any) => (
  <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14,
    padding: 18, ...style }}>{children}</div>
);
const Verify = ({ ok, text }: { ok: boolean; text: string }) => (
  <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10,
    background: ok ? "var(--goodBg)" : "var(--badBg)", color: ok ? "var(--good)" : "var(--bad)",
    fontSize: 13, fontWeight: 600 }}>{ok ? "✓ " : "⚠ "}{text}</div>
);

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const { txns, orders, reload } = useLedger();
  const [tab, setTab] = useState("dash");

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthChecked(true);
      if (!data.user || !isOwner(data.user)) router.replace("/");
    });
  }, [router]);

  if (!authChecked) return null;
  if (!isOwner(user)) return null;
  const tabs = [["dash", "Dashboard"], ["orders", "Orders"], ["journal", "Journal entry"],
    ["ledger", "General ledger"], ["tb", "Trial balance"], ["pl", "Profit & loss"],
    ["sofp", "Financial position"], ["cf", "Cash flow"], ["coa", "Chart of accounts"]];

  return (
    <>
      <Nav user={user} />
      <main style={{ padding: "30px 22px 56px", maxWidth: 1040, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 600 }}>Owner Dashboard</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
          IFRS double-entry · base currency VUV · posted entries immutable (correct via void / reverse).
          Validation runs in the API and again in Postgres.</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22 }}>
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: "7px 13px", borderRadius: 8,
              cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: tab === id ? 700 : 500,
              border: `1px solid ${tab === id ? "var(--forest)" : "var(--line)"}`,
              background: tab === id ? "var(--forest)" : "#fff",
              color: tab === id ? "#fff" : "var(--ink)" }}>{label}</button>
          ))}
        </div>
        {tab === "dash" && <Dash orders={orders} txns={txns} />}
        {tab === "orders" && <OrdersAdmin orders={orders} reload={reload} />}
        {tab === "journal" && <JournalEntry reload={reload} />}
        {tab === "ledger" && <Ledger txns={txns} />}
        {tab === "tb" && <TB txns={txns} />}
        {tab === "pl" && <PL txns={txns} />}
        {tab === "sofp" && <SoFP txns={txns} />}
        {tab === "cf" && <CF txns={txns} />}
        {tab === "coa" && <COA txns={txns} />}
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value, color = "var(--ink)", sub }: any) {
  return (
    <Card>
      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, margin: "6px 0 2px" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)" }}>{sub}</div>}
    </Card>
  );
}
function Dash({ orders, txns }: any) {
  const pl = profitOrLoss(txns);
  const unpaid = orders.filter((o: any) => o.pay_status !== "Paid")
    .reduce((s: number, o: any) => s + (Number(o.total) - Number(o.paid)), 0);
  return (
    <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
      <Stat label="Revenue (recognised)" value={vt(pl.income)} color="var(--forest)" />
      <Stat label="Expenses" value={vt(pl.expense)} color="var(--rose)" />
      <Stat label="Net profit" value={vt(pl.profit)} color={pl.profit >= 0 ? "var(--good)" : "var(--bad)"} sub="Income − expenses" />
      <Stat label="Unpaid balances" value={vt(unpaid)} color="var(--warn)" sub="Accounts receivable" />
      <Stat label="Pending orders" value={orders.filter((o: any) => o.status === "Pending").length} />
      <Stat label="Completed orders" value={orders.filter((o: any) => o.status === "Completed").length} />
    </div>
  );
}

function OrdersAdmin({ orders, reload }: any) {
  const STATUSES = ["Pending", "Confirmed", "In progress", "Ready for pickup", "Completed", "Cancelled"];
  const setStatus = async (o: any, status: string) => {
    await supabaseBrowser().from("orders").update({ status }).eq("id", o.id); reload();
  };
  const pay = async (o: any, amount: number, method: string) => {
    await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNum: o.order_num, amount, method }) }); reload();
  };
  return (
    <>
      {orders.length === 0 && <Card>No orders yet.</Card>}
      {orders.map((o: any) => (
        <Card key={o.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div><b>{o.order_num}</b> · {o.customer}
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{o.product_name} · {o.flavor} · {o.size_label}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>pickup {o.pickup_date} · {o.email || o.phone}</div></div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700 }}>{vt(Number(o.total))}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                paid {vt(Number(o.paid))} · owing {vt(Number(o.total) - Number(o.paid))}</div>
              <div style={{ marginTop: 4, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <StatusPill s={o.status} /><StatusPill s={o.pay_status} /></div></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <select style={{ ...inputStyle, maxWidth: 180, padding: "8px 10px" }} value={o.status}
              onChange={(e) => setStatus(o, e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            {o.pay_status !== "Paid" && <PayCtrl order={o} onPay={pay} />}
          </div>
        </Card>
      ))}
    </>
  );
}
function PayCtrl({ order, onPay }: any) {
  const [amt, setAmt] = useState(Number(order.total) - Number(order.paid));
  const [method, setMethod] = useState("Cash");
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <input style={{ ...inputStyle, maxWidth: 110, padding: "8px 10px" }} type="number" value={amt}
        onChange={(e) => setAmt(parseInt(e.target.value, 10) || 0)} />
      <select style={{ ...inputStyle, maxWidth: 130, padding: "8px 10px" }} value={method}
        onChange={(e) => setMethod(e.target.value)}>
        {["Cash", "Bank transfer", "Card", "Mobile money"].map((m) => <option key={m}>{m}</option>)}</select>
      <Btn bg="var(--gold)" fg="var(--ink)" style={{ padding: "8px 12px" }}
        disabled={amt <= 0 || amt > Number(order.total) - Number(order.paid)}
        onClick={() => onPay(order, amt, method)}>Record payment</Btn>
    </div>
  );
}

function JournalEntry({ reload }: { reload: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState(""); const [ref, setRef] = useState("");
  const [splits, setSplits] = useState([{ account: "5300", debit: 0, credit: 0 },
    { account: "1000", debit: 0, credit: 0 }]);
  const [msg, setMsg] = useState("");
  const set = (i: number, k: string, v: any) => setSplits((p) =>
    p.map((s, j) => (j === i ? { ...s, [k]: k === "account" ? v : (parseInt(v, 10) || 0) } : s)));
  const td = splits.reduce((a, s) => a + (+s.debit || 0), 0);
  const tc = splits.reduce((a, s) => a + (+s.credit || 0), 0);
  const txn: Txn = { date, desc, ref, source: "manual", splits };
  const err = validateTxn(txn) || (!desc.trim() ? "Add a description." : null);
  const post = async () => {
    const res = await fetch("/api/journal", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(txn) });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error); return; }
    setMsg("Posted ✓"); setDesc(""); setRef("");
    setSplits([{ account: "5300", debit: 0, credit: 0 }, { account: "1000", debit: 0, credit: 0 }]);
    reload();
  };
  return (
    <Card>
      <b style={{ fontSize: 15 }}>New journal entry</b>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 16px" }}>
        Split editor. Post stays disabled until debits = credits and there are ≥ 2 splits.
        The server and Postgres both re-check before it lands.</p>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 8 }}>
        <label style={{ fontSize: 12 }}>Date<input style={inputStyle} type="date" value={date}
          onChange={(e) => setDate(e.target.value)} /></label>
        <label style={{ fontSize: 12 }}>Reference<input style={inputStyle} value={ref}
          placeholder="EXP-02" onChange={(e) => setRef(e.target.value)} /></label>
        <label style={{ fontSize: 12 }}>Description<input style={inputStyle} value={desc}
          placeholder="Pay electricity from cash" onChange={(e) => setDesc(e.target.value)} /></label>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
        <thead><tr><th style={thS}>Account</th><th style={{ ...thS, ...num }}>Debit</th>
          <th style={{ ...thS, ...num }}>Credit</th><th style={thS}></th></tr></thead>
        <tbody>
          {splits.map((s, i) => (
            <tr key={i}>
              <td style={tdS}><select style={{ ...inputStyle, padding: "7px 8px" }} value={s.account}
                onChange={(e) => set(i, "account", e.target.value)}>
                {CHART.map((a) => <option key={a.code} value={a.code}>{acctLabel(a.code)}</option>)}</select></td>
              <td style={{ ...tdS, ...num }}><input style={{ ...inputStyle, ...num, maxWidth: 110, padding: "7px 8px" }}
                type="number" value={s.debit || ""} onChange={(e) => set(i, "debit", e.target.value)} /></td>
              <td style={{ ...tdS, ...num }}><input style={{ ...inputStyle, ...num, maxWidth: 110, padding: "7px 8px" }}
                type="number" value={s.credit || ""} onChange={(e) => set(i, "credit", e.target.value)} /></td>
              <td style={tdS}>{splits.length > 2 &&
                <button onClick={() => setSplits((p) => p.filter((_, j) => j !== i))}
                  style={{ border: "none", background: "none", color: "var(--bad)", cursor: "pointer", fontSize: 16 }}>×</button>}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700 }}><td style={tdS}>Totals</td>
            <td style={{ ...tdS, ...num }}>{vt(td)}</td>
            <td style={{ ...tdS, ...num, color: td === tc ? "var(--good)" : "var(--bad)" }}>{vt(tc)}</td>
            <td style={tdS}></td></tr>
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <button onClick={() => setSplits((p) => [...p, { account: "1000", debit: 0, credit: 0 }])}
          style={{ border: "1px solid var(--line)", background: "#fff", borderRadius: 8, padding: "8px 12px",
            cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>+ Add split</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: td === tc && td > 0 ? "var(--good)" : "var(--muted)", fontWeight: 600 }}>
            {td === tc && td > 0 ? "✓ Balanced" : `Out of balance: ${vt(Math.abs(td - tc))}`}</span>
          <Btn disabled={!!err} onClick={post}>Post entry</Btn>
        </div>
      </div>
      {msg && <p style={{ fontSize: 12, marginTop: 8, color: msg.includes("✓") ? "var(--good)" : "var(--bad)" }}>{msg}</p>}
    </Card>
  );
}

function Ledger({ txns }: { txns: Txn[] }) {
  const used = CHART.filter((a) => registerFor(a.code, txns).length > 0);
  const [code, setCode] = useState(used[0]?.code || "1100");
  const reg = registerFor(code, txns);
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <b style={{ fontSize: 15 }}>General ledger — account register</b>
        <select style={{ ...inputStyle, maxWidth: 280 }} value={code} onChange={(e) => setCode(e.target.value)}>
          {(used.length ? used : CHART).map((a) => <option key={a.code} value={a.code}>{acctLabel(a.code)}</option>)}</select>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={thS}>Date</th><th style={thS}>Ref</th><th style={thS}>Description</th>
          <th style={{ ...thS, ...num }}>Debit</th><th style={{ ...thS, ...num }}>Credit</th>
          <th style={{ ...thS, ...num }}>Balance</th></tr></thead>
        <tbody>{reg.map((r, i) => (
          <tr key={i}><td style={tdS}>{r.date}</td><td style={tdS}>{r.ref}</td><td style={tdS}>{r.desc}</td>
            <td style={{ ...tdS, ...num }}>{r.debit ? vt(r.debit) : ""}</td>
            <td style={{ ...tdS, ...num }}>{r.credit ? vt(r.credit) : ""}</td>
            <td style={{ ...tdS, ...num, fontWeight: 600 }}>{vt(r.balance)}</td></tr>
        ))}
        {reg.length === 0 && <tr><td style={{ ...tdS, color: "var(--muted)" }} colSpan={6}>No postings.</td></tr>}</tbody>
      </table>
    </Card>
  );
}
function TB({ txns }: { txns: Txn[] }) {
  const tb = trialBalance(txns);
  return (
    <Card>
      <b style={{ fontSize: 15 }}>Trial balance</b>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 14px" }}>
        The bridge from ledger to statements. Must balance before any statement is trusted.</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={thS}>Code</th><th style={thS}>Account</th>
          <th style={{ ...thS, ...num }}>Debit</th><th style={{ ...thS, ...num }}>Credit</th></tr></thead>
        <tbody>{tb.rows.map((r) => (
          <tr key={r.code}><td style={tdS}>{r.code}</td><td style={tdS}>{r.name}</td>
            <td style={{ ...tdS, ...num }}>{r.debit ? vt(r.debit) : ""}</td>
            <td style={{ ...tdS, ...num }}>{r.credit ? vt(r.credit) : ""}</td></tr>))}
          <tr style={{ fontWeight: 700 }}><td style={tdS} colSpan={2}>Totals</td>
            <td style={{ ...tdS, ...num }}>{vt(tb.dr)}</td><td style={{ ...tdS, ...num }}>{vt(tb.cr)}</td></tr>
        </tbody>
      </table>
      <Verify ok={tb.balanced} text={tb.balanced ? `Balanced — debits ${vt(tb.dr)} = credits ${vt(tb.cr)}.`
        : `OUT OF BALANCE by ${vt(Math.abs(tb.dr - tb.cr))}.`} />
    </Card>
  );
}
const SectionRow = ({ label }: any) => (
  <tr><td colSpan={2} style={{ ...tdS, fontWeight: 700, color: "var(--forest)", paddingTop: 14,
    textTransform: "uppercase", fontSize: 12, borderBottom: "none" }}>{label}</td></tr>);
const SubRow = ({ label }: any) => (
  <tr><td colSpan={2} style={{ ...tdS, fontStyle: "italic", color: "var(--muted)", borderBottom: "none", paddingBottom: 2 }}>{label}</td></tr>);
const LineRow = ({ label, v }: any) => (
  <tr><td style={{ ...tdS, paddingLeft: 22 }}>{label}</td><td style={{ ...tdS, ...num }}>{vt(v)}</td></tr>);
const TotalRow = ({ label, v, grand, color }: any) => (
  <tr style={{ fontWeight: 700 }}>
    <td style={{ ...tdS, borderTop: grand ? "2px solid var(--forest)" : "none", color: color || "var(--ink)" }}>{label}</td>
    <td style={{ ...tdS, ...num, borderTop: grand ? "2px solid var(--forest)" : "none", color: color || "var(--ink)" }}>{vt(v)}</td></tr>);

function PL({ txns }: { txns: Txn[] }) {
  const pl = profitOrLoss(txns);
  const inc = CHART.filter((a) => a.type === "Income" && balanceOf(a.code, txns) !== 0);
  const exp = CHART.filter((a) => a.type === "Expense" && balanceOf(a.code, txns) !== 0);
  return (
    <Card><b style={{ fontSize: 15 }}>Statement of Profit or Loss</b>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}><tbody>
        <SectionRow label="Revenue" />
        {inc.map((a) => <LineRow key={a.code} label={a.name} v={balanceOf(a.code, txns)} />)}
        <TotalRow label="Total revenue" v={pl.income} />
        <SectionRow label="Expenses" />
        {exp.map((a) => <LineRow key={a.code} label={a.name} v={balanceOf(a.code, txns)} />)}
        <TotalRow label="Total expenses" v={pl.expense} />
        <TotalRow label="Profit for the period" v={pl.profit} grand color={pl.profit >= 0 ? "var(--good)" : "var(--bad)"} />
      </tbody></table>
    </Card>
  );
}
function SoFP({ txns }: { txns: Txn[] }) {
  const fp = financialPosition(txns);
  const sec = (type: any, cur?: any) => CHART.filter((a) => a.type === type &&
    (cur === undefined || a.cur === cur) && balanceOf(a.code, txns) !== 0);
  const re = profitOrLoss(txns).profit;
  return (
    <Card><b style={{ fontSize: 15 }}>Statement of Financial Position</b>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 12px" }}>Current vs non-current split per IAS 1.</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
        <SectionRow label="ASSETS" /><SubRow label="Current assets" />
        {sec("Asset", "current").map((a) => <LineRow key={a.code} label={a.name} v={balanceOf(a.code, txns)} />)}
        <SubRow label="Non-current assets" />
        {sec("Asset", "noncurrent").map((a) => <LineRow key={a.code} label={a.name} v={balanceOf(a.code, txns)} />)}
        <TotalRow label="Total assets" v={fp.assets} />
        <SectionRow label="LIABILITIES" />
        {sec("Liability").map((a) => <LineRow key={a.code} label={a.name} v={balanceOf(a.code, txns)} />)}
        <TotalRow label="Total liabilities" v={fp.liabilities} />
        <SectionRow label="EQUITY" />
        {sec("Equity").map((a) => <LineRow key={a.code} label={a.name} v={balanceOf(a.code, txns)} />)}
        <LineRow label="Retained earnings (current period)" v={re} />
        <TotalRow label="Total equity" v={fp.equity} />
        <TotalRow label="Liabilities + Equity" v={fp.liabilities + fp.equity} grand />
      </tbody></table>
      <Verify ok={fp.balanced} text={fp.balanced
        ? `Equation holds — Assets ${vt(fp.assets)} = Liabilities ${vt(fp.liabilities)} + Equity ${vt(fp.equity)}.`
        : `Equation does NOT hold — off by ${vt(Math.abs(fp.assets - fp.liabilities - fp.equity))}.`} />
    </Card>
  );
}
function CF({ txns }: { txns: Txn[] }) {
  const cf = cashFlow(txns);
  const cashNow = balanceOf("1000", txns) + balanceOf("1100", txns);
  return (
    <Card><b style={{ fontSize: 15 }}>Statement of Cash Flows</b>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 12px" }}>
        Classified operating / investing / financing per IAS 7.</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
        <LineRow label="Operating activities" v={cf.operating} />
        <LineRow label="Investing activities" v={cf.investing} />
        <LineRow label="Financing activities" v={cf.financing} />
        <TotalRow label="Net change in cash" v={cf.net} grand />
      </tbody></table>
      <Verify ok={cf.net === cashNow} text={cf.net === cashNow
        ? `Reconciles — net cash flow ${vt(cf.net)} = cash & bank on hand ${vt(cashNow)}.`
        : `Cash flow ${vt(cf.net)} vs cash on hand ${vt(cashNow)} — review classification.`} />
    </Card>
  );
}
function COA({ txns }: { txns: Txn[] }) {
  return (
    <Card><b style={{ fontSize: 15 }}>Chart of Accounts</b>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 12px" }}>
        Five IFRS classes. Assets/Expenses debit-normal; Liabilities/Equity/Income credit-normal.</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={thS}>Code</th><th style={thS}>Account</th><th style={thS}>Class</th>
          <th style={thS}>Normal</th><th style={{ ...thS, ...num }}>Balance</th></tr></thead>
        <tbody>{CHART.map((a) => (
          <tr key={a.code}><td style={tdS}>{a.code}</td><td style={tdS}>{a.name}</td><td style={tdS}>{a.type}</td>
            <td style={tdS}>{DEBIT_NORMAL.has(a.type) ? "Debit" : "Credit"}</td>
            <td style={{ ...tdS, ...num }}>{vt(balanceOf(a.code, txns))}</td></tr>))}</tbody>
      </table>
    </Card>
  );
}
