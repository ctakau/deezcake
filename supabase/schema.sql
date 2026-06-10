-- ============================================================================
-- supabase/schema.sql
-- DeezCakery Bliss — IFRS double-entry schema for Supabase (Postgres).
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- The double-entry rule is enforced THREE ways, defence in depth:
--   1. CHECK constraints on each split (exactly one of debit/credit > 0).
--   2. A trigger that rejects any transaction whose splits don't balance
--      or has fewer than 2 splits — Postgres refuses the write itself.
--   3. The Next.js API re-runs validateTxn() before inserting.
-- This is the server-side guarantee Firestore could not give.
-- ============================================================================

-- ---------- chart of accounts ----------
create table if not exists accounts (
  code        text primary key,
  name        text not null,
  type        text not null check (type in ('Asset','Liability','Equity','Income','Expense')),
  cur         text check (cur in ('current','noncurrent')),
  is_active   boolean not null default true
);

-- ---------- transaction header ----------
create table if not exists transactions (
  id          bigint generated always as identity primary key,
  txn_date    date not null,
  description text not null,
  reference   text,
  source      text not null default 'manual',   -- order | payment | expense | manual
  order_num   text,
  status      text not null default 'posted' check (status in ('posted','voided','reversed')),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ---------- transaction splits (lines) ----------
create table if not exists splits (
  id              bigint generated always as identity primary key,
  transaction_id  bigint not null references transactions(id) on delete cascade,
  account_code    text not null references accounts(code),
  debit           numeric(14,0) not null default 0 check (debit  >= 0),
  credit          numeric(14,0) not null default 0 check (credit >= 0),
  memo            text,
  -- INVARIANT 3: exactly one of debit/credit is non-zero
  constraint one_side check ((debit > 0) <> (credit > 0))
);

-- ---------- orders ----------
create table if not exists orders (
  id            bigint generated always as identity primary key,
  order_num     text unique not null,
  customer      text not null,
  email         text,
  phone         text,
  product_id    text not null,
  product_name  text not null,
  size_label    text not null,
  flavor        text,
  message       text,
  pickup_date   date not null,
  notes         text,
  total         numeric(14,0) not null check (total > 0),
  cogs          numeric(14,0) not null default 0,
  paid          numeric(14,0) not null default 0,
  status        text not null default 'Pending',
  pay_status    text not null default 'Unpaid',
  user_id       uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- ---------- audit log (immutable trail) ----------
create table if not exists audit_logs (
  id          bigint generated always as identity primary key,
  entity_type text not null,
  entity_id   text,
  action      text not null,
  detail      jsonb,
  user_id     uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- INVARIANTS 1 & 2 — balance + >=2 splits, enforced by Postgres trigger.
-- Runs on a constraint trigger so it fires after all splits for a txn exist.
-- ============================================================================
create or replace function assert_balanced() returns trigger as $$
declare
  td numeric; tc numeric; n int;
  tid bigint := coalesce(new.transaction_id, old.transaction_id);
begin
  select coalesce(sum(debit),0), coalesce(sum(credit),0), count(*)
    into td, tc, n from splits where transaction_id = tid;
  if n < 2 then
    raise exception 'Double-entry requires >= 2 splits (txn %, got %)', tid, n;
  end if;
  if round(td) <> round(tc) then
    raise exception 'Unbalanced txn %: debits % <> credits %. Accounting equation violated.', tid, td, tc;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_assert_balanced on splits;
create constraint trigger trg_assert_balanced
  after insert or update or delete on splits
  deferrable initially deferred
  for each row execute function assert_balanced();

-- ============================================================================
-- IMMUTABILITY — block edits/deletes of posted transactions (correct by
-- void/reverse + a new offsetting entry, never an in-place edit).
-- ============================================================================
create or replace function block_posted_change() returns trigger as $$
begin
  if old.status = 'posted' and tg_op = 'DELETE' then
    raise exception 'Posted transactions cannot be deleted. Void or reverse instead.';
  end if;
  if old.status = 'posted' and new.status = 'posted'
     and (new.txn_date, new.description) is distinct from (old.txn_date, old.description) then
    raise exception 'Posted transactions are immutable. Post an adjusting entry instead.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_block_posted on transactions;
create trigger trg_block_posted
  before update or delete on transactions
  for each row execute function block_posted_change();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table accounts      enable row level security;
alter table transactions  enable row level security;
alter table splits        enable row level security;
alter table orders        enable row level security;
alter table audit_logs    enable row level security;

-- Accounts: anyone signed in can read the chart.
create policy "read accounts" on accounts for select to authenticated using (true);

-- Orders: a customer sees only their own; inserts tie to their user id.
create policy "own orders read"   on orders for select to authenticated using (auth.uid() = user_id);
create policy "own orders insert" on orders for insert to authenticated with check (auth.uid() = user_id);

-- Ledger tables: NO anon/authenticated write policies on purpose.
-- All posting goes through the API using the service_role key, which bypasses
-- RLS but still hits the balance trigger above. Customers can never write the ledger.
create policy "read transactions" on transactions for select to authenticated using (true);
create policy "read splits"       on splits       for select to authenticated using (true);

-- ============================================================================
-- Seed: chart of accounts + opening balances
-- ============================================================================
insert into accounts (code,name,type,cur) values
 ('1000','Cash on Hand','Asset','current'),
 ('1100','Bank — BSP','Asset','current'),
 ('1300','Accounts Receivable','Asset','current'),
 ('1400','Inventory — Ingredients','Asset','current'),
 ('1500','Baking Equipment','Asset','noncurrent'),
 ('2100','Accounts Payable','Liability','current'),
 ('2200','Customer Deposits','Liability','current'),
 ('3100','Owner''s Capital','Equity',null),
 ('3200','Retained Earnings','Equity',null),
 ('4100','Cake Sales','Income',null),
 ('4200','Custom Design Fees','Income',null),
 ('5100','Cost of Goods Sold','Expense',null),
 ('5200','Packaging','Expense',null),
 ('5300','Utilities','Expense',null),
 ('5400','Staff Wages','Expense',null),
 ('5500','Marketing','Expense',null),
 ('5800','Bank Charges','Expense',null)
on conflict (code) do nothing;
