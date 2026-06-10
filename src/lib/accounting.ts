/* ============================================================================
   src/lib/accounting.ts
   IFRS double-entry engine. Source of truth = ifrs-accounting-system skill.
   Pure functions, no I/O — imported by both the UI and the server API route.
   The SERVER re-runs validateTxn before any insert, and Postgres enforces the
   same rules with constraints + a trigger (see supabase/schema.sql), so the
   double-entry rule holds even if the client is bypassed.
   Base currency: VUV (integer vatu).
   ========================================================================== */

export type AccountType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";

export interface Account {
  code: string;
  name: string;
  type: AccountType;
  cur?: "current" | "noncurrent";
}
export interface Split {
  account: string;
  debit: number;
  credit: number;
}
export interface Txn {
  id?: number;
  date: string;
  desc: string;
  ref: string;
  source: string;
  status?: "posted" | "voided" | "reversed";
  splits: Split[];
}

export const DEBIT_NORMAL = new Set<AccountType>(["Asset", "Expense"]);

// Five-class chart of accounts (IAS 1 current/non-current tagged on assets/liabilities).
export const CHART: Account[] = [
  { code: "1000", name: "Cash on Hand", type: "Asset", cur: "current" },
  { code: "1100", name: "Bank — BSP", type: "Asset", cur: "current" },
  { code: "1300", name: "Accounts Receivable", type: "Asset", cur: "current" },
  { code: "1400", name: "Inventory — Ingredients", type: "Asset", cur: "current" },
  { code: "1500", name: "Baking Equipment", type: "Asset", cur: "noncurrent" }, // IAS 16
  { code: "2100", name: "Accounts Payable", type: "Liability", cur: "current" },
  { code: "2200", name: "Customer Deposits", type: "Liability", cur: "current" },
  { code: "3100", name: "Owner's Capital", type: "Equity" },
  { code: "3200", name: "Retained Earnings", type: "Equity" },
  { code: "4100", name: "Cake Sales", type: "Income" },
  { code: "4200", name: "Custom Design Fees", type: "Income" },
  { code: "5100", name: "Cost of Goods Sold", type: "Expense" },
  { code: "5200", name: "Packaging", type: "Expense" },
  { code: "5300", name: "Utilities", type: "Expense" },
  { code: "5400", name: "Staff Wages", type: "Expense" },
  { code: "5500", name: "Marketing", type: "Expense" },
  { code: "5800", name: "Bank Charges", type: "Expense" },
];
export const acctByCode: Record<string, Account> =
  Object.fromEntries(CHART.map((a) => [a.code, a]));
export const acctLabel = (code: string) =>
  `${code} ${acctByCode[code]?.name ?? "?"}`;
export const vt = (n: number) => "VT " + Math.round(n).toLocaleString("en-US");

// IFRS ENFORCEMENT POINT — mirrors Ledger._validate in the Python engine.
// Returns an error string, or null if the transaction may post.
export function validateTxn(txn: Txn): string | null {
  if (!txn.splits || txn.splits.length < 2)
    return `Double-entry requires ≥ 2 splits (got ${txn.splits?.length ?? 0}).`;
  for (const s of txn.splits) {
    if (!acctByCode[s.account]) return `Unknown account ${s.account}.`;
    const d = +s.debit || 0, c = +s.credit || 0;
    if (d < 0 || c < 0) return "Split amounts must be non-negative.";
    if ((d > 0) === (c > 0))
      return "Each split must have exactly one of debit / credit non-zero.";
  }
  const td = txn.splits.reduce((a, s) => a + (+s.debit || 0), 0);
  const tc = txn.splits.reduce((a, s) => a + (+s.credit || 0), 0);
  if (Math.round(td) !== Math.round(tc))
    return `Unbalanced: debits ${vt(td)} ≠ credits ${vt(tc)}. Accounting equation violated.`;
  return null;
}

export function balanceOf(code: string, txns: Txn[]): number {
  const t = acctByCode[code].type;
  let net = 0;
  for (const tx of txns) {
    if (tx.status && tx.status !== "posted") continue;
    for (const s of tx.splits)
      if (s.account === code) net += (+s.debit || 0) - (+s.credit || 0);
  }
  return Math.round(DEBIT_NORMAL.has(t) ? net : -net);
}
export const classTotal = (type: AccountType, txns: Txn[]) =>
  CHART.filter((a) => a.type === type)
    .reduce((sum, a) => sum + balanceOf(a.code, txns), 0);

export function trialBalance(txns: Txn[]) {
  let dr = 0, cr = 0;
  const rows: (Account & { debit: number; credit: number })[] = [];
  for (const a of CHART) {
    const bal = balanceOf(a.code, txns);
    if (bal === 0) continue;
    let d = 0, c = 0;
    if (DEBIT_NORMAL.has(a.type)) bal >= 0 ? (d = bal) : (c = -bal);
    else bal >= 0 ? (c = bal) : (d = -bal);
    dr += d; cr += c;
    rows.push({ ...a, debit: d, credit: c });
  }
  return { rows, dr, cr, balanced: Math.round(dr) === Math.round(cr) };
}
export function profitOrLoss(txns: Txn[]) {
  const income = classTotal("Income", txns);
  const expense = classTotal("Expense", txns);
  return { income, expense, profit: income - expense };
}
export function financialPosition(txns: Txn[]) {
  const assets = classTotal("Asset", txns);
  const liabilities = classTotal("Liability", txns);
  const equity = classTotal("Equity", txns) + profitOrLoss(txns).profit;
  return { assets, liabilities, equity, balanced: assets === liabilities + equity };
}
// IAS 7 — classify cash movements operating / investing / financing.
export function cashFlow(txns: Txn[]) {
  const cashCodes = new Set(["1000", "1100"]);
  const buckets = { operating: 0, investing: 0, financing: 0 };
  for (const tx of txns) {
    if (tx.status && tx.status !== "posted") continue;
    let cashDelta = 0;
    const codes: string[] = [];
    for (const s of tx.splits) {
      if (cashCodes.has(s.account)) cashDelta += (+s.debit || 0) - (+s.credit || 0);
      else codes.push(s.account);
    }
    if (cashDelta === 0) continue;
    let bucket: keyof typeof buckets = "operating";
    if (codes.some((c) => c === "1500")) bucket = "investing";              // IAS 16 PP&E
    else if (codes.some((c) => acctByCode[c].type === "Equity")) bucket = "financing";
    buckets[bucket] += cashDelta;
  }
  return { ...buckets, net: buckets.operating + buckets.investing + buckets.financing };
}
export function registerFor(code: string, txns: Txn[]) {
  const sign = DEBIT_NORMAL.has(acctByCode[code].type) ? 1 : -1;
  let running = 0;
  const out: { date: string; ref: string; desc: string; debit: number; credit: number; balance: number }[] = [];
  const sorted = [...txns]
    .filter((t) => !t.status || t.status === "posted")
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id ?? 0) - (b.id ?? 0)));
  for (const tx of sorted)
    for (const s of tx.splits)
      if (s.account === code) {
        running += sign * ((+s.debit || 0) - (+s.credit || 0));
        out.push({ date: tx.date, ref: tx.ref, desc: tx.desc,
          debit: +s.debit || 0, credit: +s.credit || 0, balance: running });
      }
  return out;
}

/* Build the balanced journal entries for a placed order.
   Returns an array of Txns (sale + COGS), each guaranteed to validate. */
export function orderJournals(o: {
  num: string; date: string; productName: string; customer: string;
  total: number; cogs: number;
}): Txn[] {
  const sale: Txn = {
    date: o.date, ref: o.num, source: "order",
    desc: `Sale — ${o.productName} (${o.customer})`,
    splits: [
      { account: "1300", debit: o.total, credit: 0 }, // A/R up
      { account: "4100", debit: 0, credit: o.total },  // Sales income (IFRS 15)
    ],
  };
  const out = [sale];
  if (o.cogs > 0) {
    out.push({
      date: o.date, ref: o.num, source: "order",
      desc: `COGS — ${o.productName}`,
      splits: [
        { account: "5100", debit: o.cogs, credit: 0 },
        { account: "1400", debit: 0, credit: o.cogs },
      ],
    });
  }
  return out;
}
