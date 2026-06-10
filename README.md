# DeezCakery Bliss — Next.js + Supabase

Cake ordering site for customers + an IFRS double-entry accounting back office for the owner.
Built with **Next.js 14 (App Router)**, **TypeScript**, and **Supabase** (Postgres + Auth).

Customers log in with email or phone, place pickup orders, and see their own order history.
Every order auto-posts a balanced journal entry. The owner dashboard shows the full ledger:
chart of accounts, general ledger, trial balance, P&L, Statement of Financial Position, and
cash flow — each with a tie-out check.

---

## Why the double-entry rule can't be broken here

The rule (every transaction has ≥ 2 splits and debits = credits) is enforced in three places:

1. **The engine** (`src/lib/accounting.ts`) validates before anything is sent.
2. **The API routes** (`src/app/api/*`) re-validate server-side using the same engine.
3. **Postgres** rejects an unbalanced or short entry with a database trigger (`supabase/schema.sql`).

A customer can never write to the ledger — only the server (using the service-role key) can,
and even it must pass the trigger. This is the server-side guarantee a plain document store can't give.

---

## 1. Run it locally

You need **Node.js** and **Git** installed (the video walks through both).

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys (step 2)
npm run dev                  # opens http://localhost:3000
```

## 2. Set up the database (Supabase)

1. Create a free project at supabase.com.
2. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and run it.
   This creates the tables, the balance-enforcing trigger, row-level security, and seeds the
   chart of accounts.
3. Open **Settings → API** and copy three values into `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...        # Project URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # anon public key
   SUPABASE_SERVICE_ROLE_KEY=...       # service_role key — SERVER ONLY, never NEXT_PUBLIC
   ```
4. Open **Authentication → Providers** and enable **Email** (and **Phone** if you want phone login).

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "DeezCakery Bliss"
# create an empty repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## 4. Deploy

This is a standard Next.js app, so it deploys to either host. Pick one.

### Vercel (free, recommended for Next.js)
1. Go to vercel.com, **Add New → Project**, import your GitHub repo.
2. Add the three environment variables from step 2 under **Settings → Environment Variables**.
3. Deploy. Every `git push` to `main` redeploys automatically.

### Hostinger (the video's method, paid)
1. In Hostinger, choose a plan with the **Node.js app installer**.
2. **Import Git repository → connect GitHub**, pick this repo.
3. Framework preset will detect **Next.js**. Add the three environment variables.
4. Deploy. Pushing to `main` redeploys automatically.

> Note: the env var names matter. `SUPABASE_SERVICE_ROLE_KEY` must **not** have the
> `NEXT_PUBLIC_` prefix, or it would be exposed to the browser. Keep it server-side.

---

## Project structure

```
src/
  app/
    page.tsx            home / landing
    menu/page.tsx       full cake menu
    account/page.tsx    customer login (email/phone) + own orders
    admin/page.tsx      owner dashboard — all IFRS statements
    api/
      orders/route.ts   save order + auto-post sale & COGS journals
      journal/route.ts  manual journal entry (validates, then posts)
      payments/route.ts record payment (cash/bank up, A/R down)
  lib/
    accounting.ts       the IFRS engine — shared by UI and server
    catalogue.ts        cakes & prices (from the live deezcake.com modals)
    supabase-client.ts  browser client (anon key)
    supabase-admin.ts   server client (service-role key)
  components/ui.tsx      nav, footer, cards, order & auth modals
supabase/schema.sql      tables + balance trigger + RLS + seed
```

## Notes

- Prices are in integer Vanuatu Vatu, pickup-only — matching the live site.
- COGS uses placeholder per-cake ingredient costs in `catalogue.ts` (the `est` field).
  Replace with real recipe costs when you have them.
- The accounting engine is benchmarked to IFRS: statement names and the current/non-current
  split follow IAS 1; cash flow follows IAS 7; revenue recognition follows IFRS 15.
