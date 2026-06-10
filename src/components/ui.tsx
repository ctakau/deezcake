"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Product, FLAVORS } from "@/lib/catalogue";
import { vt } from "@/lib/accounting";

export const Pill = ({ children, bg, fg }: any) => (
  <span style={{ background: bg, color: fg, fontSize: 11, fontWeight: 700,
    padding: "3px 9px", borderRadius: 999, letterSpacing: 0.3, textTransform: "uppercase" }}>
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
    fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", ...style }}>
    {children}</button>
);
export const Row = ({ k, v, strong }: any) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0",
    fontSize: strong ? 16 : 14, fontWeight: strong ? 700 : 500,
    color: strong ? "var(--forest)" : "var(--ink)" }}>
    <span style={{ color: strong ? "var(--forest)" : "var(--muted)" }}>{k}</span><span>{v}</span></div>
);

export function Nav({ user }: { user: any }) {
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(251,247,240,.92)",
      backdropFilter: "blur(8px)", borderBottom: "1px solid var(--line)", padding: "12px 22px",
      display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <span style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--rose)",
          color: "#fff", display: "grid", placeItems: "center", fontSize: 18 }}>🎂</span>
        <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 19,
          color: "var(--rose)" }}>DEEZCAKERY BLISS</span>
      </Link>
      <div style={{ display: "flex", gap: 18, marginLeft: "auto", alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/" style={navLink}>Home</Link>
        <Link href="/menu" style={navLink}>Our Cakes</Link>
        <Link href="/account" style={navLink}>My Orders</Link>
        <Link href="/admin" style={navLink}>Admin</Link>
      </div>
    </nav>
  );
}
const navLink: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: "var(--ink)",
  textDecoration: "none" };

export function CakeCard({ p, onOrder }: { p: Product; onOrder: (p: Product) => void }) {
  const from = Math.min(...p.sizes.filter((s) => s.price > 0).map((s) => s.price));
  return (
    <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--line)",
      overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: 150,
        background: "linear-gradient(135deg, #B5483D18, #C99A4B22)", display: "grid",
        placeItems: "center", fontSize: 56 }}>
        {p.emoji}
        <span style={{ position: "absolute", top: 12, right: 12 }}>
          <Pill bg="var(--rose)" fg="#fff">{p.tag}</Pill></span>
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 18, textTransform: "uppercase" }}>{p.name}</h3>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 12px", flex: 1 }}>{p.blurb}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "var(--forest)" }}>from {vt(from)}</span>
          <Btn onClick={() => onOrder(p)} style={{ padding: "9px 16px" }}>Order now</Btn>
        </div>
      </div>
    </div>
  );
}

export function Overlay({ children, onClose, narrow }: any) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(43,33,24,.55)",
      display: "grid", placeItems: "center", padding: 16, zIndex: 100, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18,
        padding: 26, width: "100%", maxWidth: narrow ? 380 : 460, position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,.3)", margin: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, border: "none",
          background: "none", fontSize: 22, color: "var(--muted)", cursor: "pointer" }}>×</button>
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const size = product.sizes.find((s: any) => s.id === sizeId);
  const isCustom = size && size.price === 0;
  const total = isCustom ? (parseInt(customPrice, 10) || 0) : (size ? size.price : 0);
  const minDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10); }, []);
  const valid = size && total > 0 && date && !busy;

  const submit = async () => {
    setBusy(true); setError("");
    const res = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id, productName: product.name, sizeLabel: size.label,
        flavor, message, pickupDate: date, notes, total,
        cogs: Math.round(product.est * 1000), customer: user?.name ?? "Guest",
        email: user?.email, phone: user?.phone, userId: user?.id,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || "Could not place order."); return; }
    onPlaced(data.order);
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ textAlign: "center", fontSize: 40 }}>{product.emoji}</div>
      <h2 style={{ fontFamily: "Fraunces, serif", textAlign: "center", fontSize: 26,
        fontWeight: 600, margin: "0 0 4px" }}>Order Your {product.name.replace(/s$/, "")}</h2>
      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, marginBottom: 22 }}>
        Select your preferences below</p>
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
      <div style={{ background: "var(--cream)", borderRadius: 10, padding: 14, marginBottom: 16,
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
    <footer style={{ background: "var(--forestDk)", color: "#fff", padding: "32px 22px", marginTop: 40 }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex",
        justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 18,
            color: "var(--gold)" }}>DEEZCAKERY BLISS</div>
          <p style={{ color: "#C9C0B2", fontSize: 13, maxWidth: 260, marginTop: 6 }}>
            Fresh cakes made to order in Port Vila, Vanuatu. Pickup only.</p>
        </div>
        <div style={{ fontSize: 13, color: "#C9C0B2" }}>
          <b style={{ color: "#fff" }}>Contact</b><br />Port Vila, Efate · Vanuatu<br />
          Order 3+ days in advance</div>
      </div>
      <div style={{ textAlign: "center", color: "#7E776B", fontSize: 12, marginTop: 24 }}>
        © 2026 DeezCakery Bliss · Accounting engine benchmarked to IFRS</div>
    </footer>
  );
}
