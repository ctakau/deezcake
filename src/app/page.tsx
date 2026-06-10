"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PRODUCTS, Product } from "@/lib/catalogue";
import { Nav, Footer, CakeCard, OrderModal, Btn, Pill } from "@/components/ui";
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
        <section style={{ padding: "64px 22px 48px", textAlign: "center",
          background: "radial-gradient(1200px 400px at 50% -120px, #B5483D22, transparent), var(--cream)" }}>
          <Pill bg="#fff" fg="var(--rose)">Port Vila · Efate Island</Pill>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "clamp(34px,6vw,60px)",
            margin: "16px auto 8px", maxWidth: 760, lineHeight: 1.05, fontWeight: 600 }}>
            Cakes made fresh<br />to order, for every<br />
            <span style={{ color: "var(--rose)" }}>celebration.</span></h1>
          <p style={{ color: "var(--muted)", maxWidth: 540, margin: "0 auto 26px", fontSize: 16 }}>
            Premium ingredients and custom designs tailored to your day.
            Log in, choose your cake, and we'll have it ready for pickup.</p>
          <Btn onClick={() => router.push("/menu")} style={{ padding: "14px 30px", fontSize: 16 }}>
            Order a Cake →</Btn>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 14 }}>
            Pickup only · Please order at least 3 days in advance</p>
        </section>

        <section style={{ padding: "8px 22px 40px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gap: 18,
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {PRODUCTS.slice(0, 3).map((p) => <CakeCard key={p.id} p={p} onOrder={onOrder} />)}
          </div>
        </section>

        <section style={{ padding: "30px 22px 56px", maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Fraunces, serif", textAlign: "center", fontSize: 28,
            fontWeight: 600, marginBottom: 30 }}>How ordering works</h2>
          <div style={{ display: "grid", gap: 22,
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            {[["1", "Choose", "Pick your cake type, size and flavour."],
              ["2", "Order", "Log in and place your order with the details."],
              ["3", "Enjoy", "Collect fresh in Port Vila. Celebrate!"]].map(([n, t, d]) => (
              <div key={n} style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--forest)",
                  color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 12px",
                  fontWeight: 700, fontSize: 22, fontFamily: "Fraunces, serif" }}>{n}</div>
                <h3 style={{ margin: "0 0 6px", fontSize: 17, textTransform: "uppercase" }}>{t}</h3>
                <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{d}</p>
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
