"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PRODUCTS, Product } from "@/lib/catalogue";
import { Nav, Footer, CakeCard, OrderModal } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase-client";

export default function Menu() {
  const [user, setUser] = useState<any>(null);
  const [modal, setModal] = useState<Product | null>(null);
  const router = useRouter();
  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, name: data.user.email?.split("@")[0], email: data.user.email });
    });
  }, []);
  const onOrder = (p: Product) => setModal(p);
  return (
    <>
      <Nav user={user} />
      <main style={{ padding: "44px 22px 56px", maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 34, fontWeight: 600, marginBottom: 6 }}>Our Cakes</h1>
        <p style={{ color: "var(--muted)", marginBottom: 28 }}>Every cake is made fresh to order. Prices in Vanuatu Vatu.</p>
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {PRODUCTS.map((p) => <CakeCard key={p.id} p={p} onOrder={onOrder} />)}
        </div>
      </main>
      <Footer />
      {modal && <OrderModal product={modal} user={user} onClose={() => setModal(null)}
        onPlaced={(order: any) => { setModal(null); alert(`Order ${order.order_num} placed! We'll contact you to confirm. Pickup only.`); }} />}
    </>
  );
}
