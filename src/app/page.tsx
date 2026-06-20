"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PRODUCTS, Product } from "@/lib/catalogue";
import { Nav, Footer, CakeCard, OrderModal, Pill } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase-client";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [modal, setModal] = useState<Product | null>(null);
  const router = useRouter();

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, name: data.user.email?.split("@")[0],
        email: data.user.email });
    });
  }, []);

  const onOrder = (p: Product) => (user ? setModal(p) : router.push("/account"));

  return (
    <>
      <Nav user={user} />
      <main>
        <section className="hero-section">
          <div className="animate-in">
            <Pill bg="#fff" fg="var(--rose)">Port Vila · Efate Island</Pill>
          </div>
          <h1 className="animate-in-delay-1" style={{ fontFamily: "Fraunces, serif",
            fontSize: "clamp(36px,6vw,62px)", margin: "20px auto 12px", maxWidth: 760,
            lineHeight: 1.05, fontWeight: 600 }}>
            Cakes made fresh<br />to order, for every<br />
            <span style={{ color: "var(--rose)" }}>celebration.</span></h1>
          <p className="animate-in-delay-2" style={{ color: "var(--muted)", maxWidth: 520,
            margin: "0 auto 32px", fontSize: 17, lineHeight: 1.6 }}>
            Premium ingredients and custom designs tailored to your day.
            Choose your cake, and we'll have it ready for pickup.</p>
          <div className="animate-in-delay-3">
            <button className="btn-cta" onClick={() => router.push("/menu")}>
              Order a Cake</button>
          </div>
          <p className="animate-in-delay-3" style={{ color: "var(--muted)", fontSize: 13,
            marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Pickup only · Please order at least 3 days in advance</p>
        </section>

        <section style={{ padding: "48px 22px 48px", maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Fraunces, serif", textAlign: "center", fontSize: 30,
            fontWeight: 600, marginBottom: 8 }}>Our Cakes</h2>
          <p style={{ textAlign: "center", color: "var(--muted)", marginBottom: 32, fontSize: 15 }}>
            Every cake is made fresh to order with love</p>
          <div style={{ display: "grid", gap: 22,
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
            {PRODUCTS.slice(0, 3).map((p) => <CakeCard key={p.id} p={p} onOrder={onOrder} />)}
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button className="btn-primary" onClick={() => router.push("/menu")}>
              View all cakes</button>
          </div>
        </section>

        <section style={{ padding: "48px 22px 64px", maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Fraunces, serif", textAlign: "center", fontSize: 30,
            fontWeight: 600, marginBottom: 36 }}>How ordering works</h2>
          <div style={{ display: "grid", gap: 28,
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            {[
              ["1", "Choose", "Pick your cake type, size and flavour from our menu."],
              ["2", "Order", "Log in and place your order with the details."],
              ["3", "Enjoy", "Collect your cake fresh in Port Vila. Celebrate!"],
            ].map(([n, t, d]) => (
              <div key={n} style={{ textAlign: "center" }}>
                <div className="step-circle">{n}</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontFamily: "Fraunces, serif",
                  fontWeight: 600 }}>{t}</h3>
                <p style={{ color: "var(--muted)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>{d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      {modal && <OrderModal product={modal} user={user} onClose={() => setModal(null)}
        onPlaced={() => { setModal(null); router.push("/account"); }} />}
    </>
  );
}
