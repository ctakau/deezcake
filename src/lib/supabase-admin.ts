import { createClient } from "@supabase/supabase-js";

// SERVER ONLY. Uses the service_role key — bypasses RLS so the API can post
// to the ledger, but the Postgres balance trigger still applies. This file
// must never be imported into a client component. The key is read from a
// non-NEXT_PUBLIC env var so it is never bundled to the browser.
export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
