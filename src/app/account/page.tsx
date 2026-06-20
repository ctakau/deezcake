"use client";
import React, { useState, useEffect } from "react";
import { Nav, Footer, Field, Btn, inputStyle, Row, StatusPill } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase-client";
import { vt } from "@/lib/accounting";

export default function Account() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        sb.from("orders").select("*").eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .then(({ data: rows }) => setOrders(rows || []));
      }
    });
  }, []);

  // Supabase Auth: email magic-link OR phone OTP — no password stored client-side.
  const signIn = async () => {
    const sb = supabaseBrowser();
    setMsg("");
    if (mode === "email") {
      const { error } = await sb.auth.signInWithOtp({ email });
      setMsg(error ? error.message : "Check your email for the login link.");
    } else {
      const { error } = await sb.auth.signInWithOtp({ phone });
      setMsg(error ? error.message : "Check your phone for the code.");
    }
    if (!msg) setSent(true);
  };

  if (!user) {
    return (
      <>
        <Nav user={null} />
        <main style={{ maxWidth: 420, margin: "60px auto", padding: "0 22px" }}>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 600,
            textAlign: "center" }}>Log in to order</h1>
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
            Use your email or phone number</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {(["email", "phone"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: 10, borderRadius: 9,
                cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13,
                border: `1px solid ${mode === m ? "var(--forest)" : "var(--line)"}`,
                background: mode === m ? "var(--forest)" : "#fff",
                color: mode === m ? "#fff" : "var(--ink)", textTransform: "capitalize" }}>{m}</button>
            ))}
          </div>
          {mode === "email"
            ? <Field label="Email"><input style={inputStyle} type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="rosa@example.com" /></Field>
            : <Field label="Phone number"><input style={inputStyle} value={phone}
                onChange={(e) => setPhone(e.target.value)} placeholder="+678 555 1234" /></Field>}
          <Btn bg="var(--rose)" onClick={signIn} style={{ width: "100%", padding: 13 }}>
            Send login link</Btn>
          {(msg || sent) && <p style={{ textAlign: "center", fontSize: 13, color: "var(--forest)",
            marginTop: 14 }}>{msg || "Link sent."}</p>}
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: 14 }}>
            Powered by Supabase Auth. Enable Email and Phone providers in your Supabase dashboard.</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav user={user} />
      <main style={{ padding: "44px 22px 56px", maxWidth: 820, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 600 }}>My Orders</h1>
          <button onClick={() => supabaseBrowser().auth.signOut().then(() => location.reload())}
            style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>Sign out</button>
        </div>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>Signed in as {user.email || user.phone}</p>
        {orders.length === 0
          ? <div style={{ textAlign: "center", padding: 40, color: "var(--muted)",
              border: "1px dashed var(--line)", borderRadius: 14 }}>
              No orders yet. Head to Our Cakes to place your first one.</div>
          : orders.map((o) => (
            <div key={o.id} style={{ background: "var(--card)", border: "1px solid var(--line)",
              borderRadius: 14, padding: 18, marginBottom: 14 }}>
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
