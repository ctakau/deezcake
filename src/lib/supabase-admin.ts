import { createClient } from "@supabase/supabase-js";

// ponytail: safe fallback when service key isn't set — callers must handle null
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseAdmin = () =>
  SERVICE_KEY ? createClient(SUPA_URL, SERVICE_KEY, { auth: { persistSession: false } }) : null;
