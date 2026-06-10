"use client";
import { createBrowserClient } from "@supabase/ssr";

// Browser client — uses the public anon key. Safe to ship to the client.
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
