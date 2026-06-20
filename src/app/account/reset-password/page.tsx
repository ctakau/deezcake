"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Nav, Footer, Field, Btn, inputStyle } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase-client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const sb = supabaseBrowser();
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    setErr(""); setBusy(true);
    if (password.length < 8) { setErr("Password must be at least 8 characters."); setBusy(false); return; }
    if (password !== confirmPw) { setErr("Passwords do not match."); setBusy(false); return; }
    const sb = supabaseBrowser();
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setMsg("Password updated! Redirecting...");
    setTimeout(() => router.push("/account"), 1500);
  };

  return (
    <>
      <Nav user={null} />
      <main style={{ maxWidth: 400, margin: "60px auto", padding: "0 22px" }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 600,
          textAlign: "center" }}>Set new password</h1>
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
          Choose a new password for your account</p>

        {!ready ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            <p>Loading your reset session...</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>If this takes too long, the reset link may have expired.
              <br /><a href="/account" style={{ color: "var(--forest)" }}>Request a new one</a></p>
          </div>
        ) : (
          <>
            {msg && <p style={{ textAlign: "center", fontSize: 13, color: "var(--good)",
              marginBottom: 14, padding: "10px 14px", background: "var(--goodBg)", borderRadius: 10 }}>{msg}</p>}
            <Field label="New Password (min 8 characters)">
              <input style={inputStyle} type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="New password"
                onKeyDown={(e) => e.key === "Enter" && handleReset()} />
            </Field>
            <Field label="Confirm New Password">
              <input style={inputStyle} type="password" value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm new password"
                onKeyDown={(e) => e.key === "Enter" && handleReset()} />
            </Field>
            {err && <p style={{ color: "var(--bad)", fontSize: 13, marginBottom: 10 }}>{err}</p>}
            <Btn bg="var(--forest)" onClick={handleReset} disabled={busy}
              style={{ width: "100%", padding: 13 }}>
              {busy ? "Updating..." : "Update password"}</Btn>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
