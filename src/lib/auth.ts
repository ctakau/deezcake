import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "chesta.takau@gmail.com";

export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await sb.auth.getUser(token);
  return user;
}

export function isOwnerEmail(email: string | undefined | null): boolean {
  return email === OWNER_EMAIL;
}
