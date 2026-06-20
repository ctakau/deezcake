import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (code) {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await sb.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/account`);
}
