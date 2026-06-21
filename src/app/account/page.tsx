"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Nav, Footer, Field, Btn, inputStyle, Row, StatusPill } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase-client";
import { vt } from "@/lib/accounting";

type View = "signin" | "signup" | "forgot" | "reset-sent";

export default function Account() {
  return (
    <Suspense>
      <AccountInner />
    </Suspense>
  );
}

function AccountInner() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const params = useSearchParams();

  useEffect(() => {
    const prefill = params.get("prefill");
    if (prefill) { setEmail(prefill); setView("signup"); }
  }, [params]);

  useEffect(() => {
    const sb = supabaseBrowser();
    const loadUser = (u: any) => {
      setUser(u);
      sb.from("orders").select("*").eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .then(({ data: rows }) => setOrders(rows || []));
    };
    sb.auth.getUser().then(({ data }) => {
      if (data.user) loadUser(data.user);
      setLoading(false);
    });
    // ponytail: handles token exchange from email confirm/reset URL hash
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (session?.user && !user) { loadUser(session.user); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const clear = () => { setMsg(""); setErr(""); };

  const handleSignIn = async () => {
    clear(); setBusy(true);
    if (!email.trim() || !password) { setErr("Email and password required."); setBusy(false); return; }
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    window.location.reload();
  };

  const handleSignUp = async () => {
    clear(); setBusy(true);
    if (!email.trim() || !password) { setErr("Email and password required."); setBusy(false); return; }
    if (password.length < 8) { setErr("Password must be at least 8 characters."); setBusy(false); return; }
    if (password !== confirmPw) { setErr("Passwords do not match."); setBusy(false); return; }
    const sb = supabaseBrowser();
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
    if (error) { setErr(error.message); setBusy(false); return; }
    // ponytail: if email confirm is off, session comes back immediately — auto-login
    if (data.session) { window.location.reload(); return; }
    // email confirm is on — tell user to check email
    setBusy(false);
    setMsg("Account created! Check your email to confirm, then sign in.");
    setView("signin");
    setPassword(""); setConfirmPw("");
  };

  const handleForgot = async () => {
    clear(); setBusy(true);
    if (!email.trim()) { setErr("Enter your email address."); setBusy(false); return; }
    const sb = supabaseBrowser();
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/account/reset-password",
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setView("reset-sent");
  };

  const handleSignOut = async () => {
    const sb = supabaseBrowser();
    await sb.auth.signOut();
    window.location.reload();
  };

  if (loading) return null;

  if (user) {
    return (
      <>
        <Nav user={user} />
        <main style={{ padding: "44px 22px 56px", maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 600 }}>My Orders</h1>
            <button onClick={handleSignOut} className="nav-link"
              style={{ cursor: "pointer", border: "1px solid var(--line)", borderRadius: 8,
                padding: "8px 16px", background: "var(--cream)" }}>Sign out</button>
          </div>
          <p style={{ color: "var(--muted)", marginBottom: 24 }}>Signed in as {user.email}</p>
          {orders.length === 0
            ? <div style={{ textAlign: "center", padding: 40, color: "var(--muted)",
                border: "1px dashed var(--line)", borderRadius: 14 }}>
                No orders yet. Head to Our Cakes to place your first one.</div>
            : orders.map((o) => (
              <div key={o.id} style={{ background: "var(--card)", border: "1px solid var(--line)",
                borderRadius: 14, padding: 18, marginBottom: 14, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div><div style={{ fontWeight: 700, fontSize: 16 }}>{o.order_num}</div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>pickup {o.pickup_date}</div></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <StatusPill s={o.status} /><StatusPill s={o.pay_status} /></div>
                </div>
                <Row k="Cake" v={`${o.product_name} · ${o.flavor}`} />
                <Row k="Size" v={o.size_label} />
                {o.message && <Row k="Message" v={`"${o.message}"`} />}
                <Row k="Total" v={vt(Number(o.total))} strong />
                {Number(o.paid) > 0 && <Row k="Paid" v={vt(Number(o.paid))} />}
              </div>
            ))}
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav user={null} />
      <main style={{ maxWidth: 400, margin: "60px auto", padding: "0 22px" }}>
        {view === "signin" && (
          <>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 600,
              textAlign: "center" }}>Sign in</h1>
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
              Sign in to view and track your orders</p>
            {msg && <p style={{ textAlign: "center", fontSize: 13, color: "var(--good)",
              marginBottom: 14, padding: "10px 14px", background: "var(--goodBg)", borderRadius: 10 }}>{msg}</p>}
            <Field label="Email">
              <input style={inputStyle} type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="rosa@example.com"
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()} />
            </Field>
            <Field label="Password">
              <input style={inputStyle} type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="Your password"
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()} />
            </Field>
            {err && <p style={{ color: "var(--bad)", fontSize: 13, marginBottom: 10 }}>{err}</p>}
            <Btn bg="var(--forest)" onClick={handleSignIn} disabled={busy}
              style={{ width: "100%", padding: 13 }}>
              {busy ? "Signing in..." : "Sign in"}</Btn>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
              <button onClick={() => { clear(); setView("forgot"); }}
                style={{ border: "none", background: "none", color: "var(--rose)", fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit" }}>Forgot password?</button>
              <button onClick={() => { clear(); setView("signup"); }}
                style={{ border: "none", background: "none", color: "var(--forest)", fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Create account</button>
            </div>
          </>
        )}

        {view === "signup" && (
          <>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 600,
              textAlign: "center" }}>Create account</h1>
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
              Track your orders and order faster next time</p>
            <Field label="Email">
              <input style={inputStyle} type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="rosa@example.com" />
            </Field>
            <Field label="Password (min 8 characters)">
              <input style={inputStyle} type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" />
            </Field>
            <Field label="Confirm Password">
              <input style={inputStyle} type="password" value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm your password"
                onKeyDown={(e) => e.key === "Enter" && handleSignUp()} />
            </Field>
            {err && <p style={{ color: "var(--bad)", fontSize: 13, marginBottom: 10 }}>{err}</p>}
            <Btn bg="var(--rose)" onClick={handleSignUp} disabled={busy}
              style={{ width: "100%", padding: 13 }}>
              {busy ? "Creating..." : "Create account"}</Btn>
            <p style={{ textAlign: "center", marginTop: 14, fontSize: 13 }}>
              Already have an account?{" "}
              <button onClick={() => { clear(); setView("signin"); }}
                style={{ border: "none", background: "none", color: "var(--forest)", fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Sign in</button>
            </p>
          </>
        )}

        {view === "forgot" && (
          <>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 600,
              textAlign: "center" }}>Reset password</h1>
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
              Enter your email and we'll send a reset link</p>
            <Field label="Email">
              <input style={inputStyle} type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="rosa@example.com"
                onKeyDown={(e) => e.key === "Enter" && handleForgot()} />
            </Field>
            {err && <p style={{ color: "var(--bad)", fontSize: 13, marginBottom: 10 }}>{err}</p>}
            <Btn bg="var(--forest)" onClick={handleForgot} disabled={busy}
              style={{ width: "100%", padding: 13 }}>
              {busy ? "Sending..." : "Send reset link"}</Btn>
            <p style={{ textAlign: "center", marginTop: 14, fontSize: 13 }}>
              <button onClick={() => { clear(); setView("signin"); }}
                style={{ border: "none", background: "none", color: "var(--forest)", fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit" }}>Back to sign in</button>
            </p>
          </>
        )}

        {view === "reset-sent" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--good)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600,
              marginBottom: 8 }}>Check your email</h2>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
              We've sent a password reset link to <b>{email}</b>. Click the link in the email to set a new password.</p>
            <button onClick={() => { clear(); setView("signin"); }}
              style={{ border: "none", background: "none", color: "var(--forest)", fontSize: 14,
                cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Back to sign in</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
