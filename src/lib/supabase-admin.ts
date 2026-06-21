import { createClient } from "@supabase/supabase-js";

// ponytail: safe fallback when service key isn't set — callers must handle null
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseAdmin = () =>
  KEY ? createClient(URL, KEY, { auth: { persistSession: false } }) : null;
