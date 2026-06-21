import { createClient } from "@supabase/supabase-js";

// ponytail: safe fallback when service key isn't set — callers must handle null
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseAdmin = () =>
  SUPA_KEY ? createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } }) : null;
