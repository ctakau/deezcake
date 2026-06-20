"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Product, FLAVORS } from "@/lib/catalogue";
import { vt } from "@/lib/accounting";
import { supabaseBrowser } from "@/lib/supabase-client";

export const Pill = ({ children, bg, fg }: any) => (
  <span className="tag-pill" style={{ background: bg, color: fg }}>
    {children}</span>
);

const STATUS_STYLE: Record<string, [string, string]> = {
  Pending: ["var(--warnBg)", "var(--warn)"], Confirmed: ["var(--goodBg)", "var(--good)"],
  "In progress": ["var(--warnBg)", "var(--warn)"], "Ready for pickup": ["var(--goodBg)", "var(--good)"],
  Completed: ["#EDE7DD", "var(--muted)"], Cancelled: ["var(--badBg)", "var(--bad)"],
  Unpaid: ["var(--badBg)", "var(--bad)"], "Partially paid": ["var(--warnBg)", "var(--warn)"],
  Paid: ["var(--goodBg)", "var(--good)"],
};
export const StatusPill = ({ s }: { s: string }) => {
  const [bg, fg] = STATUS_STYLE[s] || ["#eee", "#555"];
  return <Pill bg={bg} fg={fg}>{s}</Pill>;
};

export const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid var(--line)",
  background: "var(--cream)", fontSize: 14, color: "var(--ink)", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
};
export const Field = ({ label, children }: any) => (
  <label style={{ display: "block", marginBottom: 14 }}>
    <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--forest)",
      marginBottom: 6 }}>{label}</span>{children}
  </label>
);
export const Btn = ({ children, onClick, bg = "var(--forest)", fg = "#fff", disabled, style }: any) => (
  <button onClick={onClick} disabled={disabled} style={{ background: disabled ? "#C9C0B2" : bg,
    color: fg, border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 700,
    fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
    transition: "background .2s ease, transform .15s ease", ...style }}>
    {children}</button>
);
export const Row = ({ k, v, strong }: any) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0",
    fontSize: strong ? 16 : 14, fontWeight: strong ? 700 : 500,
    color: strong ? "var(--forest)" : "var(--ink)" }}>
    <span style={{ color: strong ? "var(--forest)" : "var(--muted)" }}>{k}</span><span>{v}</span></div>
);

const CAKE_GRADIENTS: Record<string, string> = {
  birthday: "linear-gradient(135deg, #FECDD3, #FDE68A)",
  wedding: "linear-gradient(135deg, #E8D5B7, #F5F0EB)",
  cupcakes: "linear-gradient(135deg, #FBCFE8, #DDD6FE)",
  character: "linear-gradient(135deg, #A7F3D0, #BAE6FD)",
  chocolate: "linear-gradient(135deg, #78350F, #A16207)",
  fruit: "linear-gradient(135deg, #FED7AA, #FECACA)",
};

const CAKE_ICONS: Record<string, React.ReactNode> = {
  birthday: <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#B5483D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>,
  wedding: <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C99A4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M15 21v-5a3 3 0 0 0-3-3H12a3 3 0 0 0-3 3v5"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="3"/><path d="M8.5 2.5 12 6l3.5-3.5"/></svg>,
  cupcakes: <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3c0 1.5.5 2.5 1.5 3.5L12 10l1.5-1.5C14.5 7.5 15 6.5 15 5a3 3 0 0 0-3-3z"/><path d="M5 12h14l-1.5 9H6.5L5 12z"/><path d="M5 12c0-2 1.5-3 3.5-3h7c2 0 3.5 1 3.5 3"/></svg>,
  character: <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  chocolate: <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/><path d="M2 14h20"/><path d="M6 6v12"/><path d="M10 6v12"/><path d="M14 6v12"/><path d="M18 6v12"/></svg>,
  fruit: <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 1 5 5c0 4-5 9-5 9S7 11 7 7a5 5 0 0 1 5-5z"/><path d="M12 2C9 2 8 4 8 4"/><circle cx="12" cy="7" r="1" fill="#DC2626"/></svg>,
};

export const isOwner = (user: any) =>
  user?.email === process.env.NEXT_PUBLIC_OWNER_EMAIL;

export function Nav({ user }: { user: any }) {
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(251,247,240,.92)",
      backdropFilter: "blur(12px)", borderBottom: "1px solid var(--line)", padding: "14px 24px",
      display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--rose)",
          color: "#fff", display: "grid", placeItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>
        </span>
        <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 19,
          color: "var(--rose)" }}>DEEZCAKERY BLISS</span>
      </Link>
      <div style={{ display: "flex", gap: 4, marginLeft: "auto", alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/menu" className="nav-link">Our Cakes</Link>
        <Link href="/account" className="nav-link">My Orders</Link>
        {isOwner(user) && <Link href="/admin" className="nav-link">Admin</Link>}
      </div>
    </nav>
  );
}

export function CakeCard({ p, onOrder }: { p: Product; onOrder: (p: Product) => void }) {
  const from = Math.min(...p.sizes.filter((s) => s.price > 0).map((s) => s.price));
  const gradient = CAKE_GRADIENTS[p.id] || "linear-gradient(135deg, #B5483D18, #C99A4B22)";
  const icon = CAKE_ICONS[p.id];
  return (
    <div className="cake-card" onClick={() => onOrder(p)}>
      <div className="cake-card-img-wrap">
        <div className="cake-card-img" style={{ background: gradient }}>
          {icon || <span style={{ fontSize: 56 }}>{p.emoji}</span>}
        </div>
        <span style={{ position: "absolute", top: 12, right: 12 }}>
          <Pill bg="var(--rose)" fg="#fff">{p.tag}</Pill></span>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700,
          fontFamily: "Fraunces, serif" }}>{p.name}</h3>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 16px", flex: 1,
          lineHeight: 1.5 }}>{p.blurb}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "var(--forest)", fontSize: 15 }}>from {vt(from)}</span>
          <button className="btn-order" onClick={(e) => { e.stopPropagation(); onOrder(p); }}>
            Order now</button>
        </div>
      </div>
    </div>
  );
}

export function Overlay({ children, onClose, narrow }: any) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(43,33,24,.55)",
      display: "grid", placeItems: "center", padding: 16, zIndex: 100, overflowY: "auto",
      backdropFilter: "blur(4px)" }}>
      <div onClick={(e) => e.stopPropagation()} className="animate-in" style={{
        background: "#fff", borderRadius: 20, padding: 28, width: "100%",
        maxWidth: narrow ? 380 : 460, position: "relative",
        boxShadow: "0 24px 64px rgba(0,0,0,.25)", margin: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, border: "none",
          background: "none", fontSize: 22, color: "var(--muted)", cursor: "pointer",
          width: 36, height: 36, borderRadius: 8, display: "grid", placeItems: "center",
          transition: "background .2s ease" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--cream)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "none")}>
          ×</button>
        {children}
      </div>
    </div>
  );
}

export function OrderModal({ product, user, onClose, onPlaced }: any) {
  const [sizeId, setSizeId] = useState("");
  const [flavor, setFlavor] = useState(FLAVORS[0]);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const size = product.sizes.find((s: any) => s.id === sizeId);
  const isCustom = size && size.price === 0;
  const total = isCustom ? (parseInt(customPrice, 10) || 0) : (size ? size.price : 0);
  const minDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10); }, []);
  const valid = size && total > 0 && date && customerName.trim() &&
    (customerEmail.trim() || customerPhone.trim()) && !busy;

  const submit = async () => {
    setBusy(true); setError("");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const sb = supabaseBrowser();
    const { data: { session } } = await sb.auth.getSession();
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    const res = await fetch("/api/orders", {
      method: "POST", headers,
      body: JSON.stringify({
        productId: product.id, sizeLabel: size.label,
        flavor, message, pickupDate: date, notes, total,
        customer: customerName.trim(),
        email: customerEmail.trim() || null,
        phone: customerPhone.trim() || null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || "Could not place order."); return; }
    onPlaced(data.order);
  };

  const icon = CAKE_ICONS[product.id];

  return (
    <Overlay onClose={onClose}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        {icon || <span style={{ fontSize: 40 }}>{product.emoji}</span>}
      </div>
      <h2 style={{ fontFamily: "Fraunces, serif", textAlign: "center", fontSize: 26,
        fontWeight: 600, margin: "0 0 4px" }}>Order Your {product.name.replace(/s$/, "")}</h2>
      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, marginBottom: 22 }}>
        Fill in your details and preferences below</p>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr", marginBottom: 4 }}>
        <Field label="Your Name *">
          <input style={inputStyle} value={customerName} placeholder="e.g. Rosa"
            onChange={(e) => setCustomerName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <input style={inputStyle} value={customerPhone} placeholder="+678 555 1234"
            onChange={(e) => setCustomerPhone(e.target.value)} />
        </Field>
      </div>
      <Field label="Email">
        <input style={inputStyle} type="email" value={customerEmail} placeholder="rosa@example.com"
          onChange={(e) => setCustomerEmail(e.target.value)} />
      </Field>
      <Field label="Cake Size & Price">
        <select style={inputStyle} value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
          <option value="">— Select size —</option>
          {product.sizes.map((s: any) => (
            <option key={s.id} value={s.id}>{s.price > 0 ? `${vt(s.price)} — ${s.label}` : s.label}</option>
          ))}
        </select>
      </Field>
      {isCustom && (
        <Field label="Your budget (VT) — we'll confirm a quote">
          <input style={inputStyle} type="number" min="0" value={customPrice}
            placeholder="e.g. 8000" onChange={(e) => setCustomPrice(e.target.value)} />
        </Field>
      )}
      <Field label="Flavour">
        <select style={inputStyle} value={flavor} onChange={(e) => setFlavor(e.target.value)}>
          {FLAVORS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </Field>
      <Field label="Message on cake (optional)">
        <input style={inputStyle} value={message} maxLength={60}
          placeholder="Happy Birthday Rosa!" onChange={(e) => setMessage(e.target.value)} />
      </Field>
      <Field label="Pickup Date">
        <input style={inputStyle} type="date" min={minDate} value={date}
          onChange={(e) => setDate(e.target.value)} />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Please order at least 3 days in advance</span>
      </Field>
      <Field label="Notes / special instructions (optional)">
        <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
          value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div style={{ background: "var(--cream)", borderRadius: 12, padding: 16, marginBottom: 16,
        border: "1px solid var(--line)" }}>
        <Row k="Cake" v={`${product.name} · ${flavor}`} />
        {size && <Row k="Size" v={size.label} />}
        <Row k="Total" v={total > 0 ? vt(total) : "—"} strong />
      </div>
      {error && <p style={{ color: "var(--bad)", fontSize: 13 }}>{error}</p>}
      <Btn disabled={!valid} onClick={submit} style={{ width: "100%", padding: 14, fontSize: 15 }}>
        {busy ? "Placing…" : "Place order — generate confirmation"}
      </Btn>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
        <b>Pickup only</b> — DeezCakery Bliss does not offer delivery.</p>
    </Overlay>
  );
}

export function Footer() {
  return (
    <footer style={{ background: "var(--forestDk)", color: "#fff", padding: "40px 24px 32px", marginTop: 48 }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex",
        justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--rose)",
              color: "#fff", display: "grid", placeItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/></svg>
            </span>
            <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 18,
              color: "var(--gold)" }}>DEEZCAKERY BLISS</span>
          </div>
          <p style={{ color: "#C9C0B2", fontSize: 13, maxWidth: 280, lineHeight: 1.6 }}>
            Fresh cakes made to order in Port Vila, Vanuatu. Premium ingredients, custom designs.</p>
        </div>
        <div style={{ fontSize: 13, color: "#C9C0B2", lineHeight: 1.8 }}>
          <b style={{ color: "#fff", fontSize: 14 }}>Contact</b><br />
          Port Vila, Efate · Vanuatu<br />
          Pickup only · Order 3+ days in advance</div>
      </div>
      <div style={{ maxWidth: 1040, margin: "24px auto 0", borderTop: "1px solid rgba(255,255,255,.1)",
        paddingTop: 20, textAlign: "center", color: "#7E776B", fontSize: 12 }}>
        © 2026 DeezCakery Bliss</div>
    </footer>
  );
}
