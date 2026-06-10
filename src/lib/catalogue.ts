// src/lib/catalogue.ts — pulled from the live deezcake.com order modals. Pickup-only.
export const STD_SIZES = [
  { id: "r12", label: 'Round 12" / 21cm · H 6cm', price: 2500 },
  { id: "rect", label: 'Rectangle 12"/30cm · W 9"/22cm · H 5cm', price: 3500 },
  { id: "r13", label: 'Round 13" / 33cm · H 6cm', price: 5000 },
  { id: "custom", label: "Custom size (negotiable)", price: 0 },
];
export const WEDDING_SIZES = [
  { id: "w-s", label: "Small wedding cake", price: 15000 },
  { id: "w-m", label: "Medium wedding cake", price: 20000 },
  { id: "w-l", label: "Large wedding cake", price: 25000 },
  { id: "w-g", label: "Grand wedding cake", price: 30000 },
  { id: "w-p", label: "Premium wedding cake", price: 35000 },
  { id: "w-c", label: "Custom size (negotiable)", price: 0 },
];
export const CUPCAKE_SIZES = [
  { id: "cc24", label: "24 cupcakes", price: 3500 },
  { id: "cc42", label: "42 cupcakes", price: 7000 },
  { id: "cc84", label: "84 cupcakes", price: 10500 },
];
export interface Product {
  id: string; emoji: string; name: string; tag: string; blurb: string;
  sizes: { id: string; label: string; price: number }[]; est: number;
}
export const PRODUCTS: Product[] = [
  { id: "birthday", emoji: "🎂", name: "Birthday Cakes", tag: "POPULAR",
    blurb: "Custom designs in any flavor you love. All ages welcome.", sizes: STD_SIZES, est: 2 },
  { id: "wedding", emoji: "💍", name: "Wedding Cakes", tag: "SIGNATURE",
    blurb: "Tiered centrepieces, finished to order for your big day.", sizes: WEDDING_SIZES, est: 28 },
  { id: "cupcakes", emoji: "🧁", name: "Cupcakes", tag: "PARTY READY",
    blurb: "Delicious cupcakes with beautiful custom toppers.", sizes: CUPCAKE_SIZES, est: 3.5 },
  { id: "character", emoji: "🦄", name: "Character Cakes", tag: "KIDS' FAVOURITE",
    blurb: "Themed character cakes for parties and milestones.", sizes: STD_SIZES, est: 2.5 },
  { id: "chocolate", emoji: "🍫", name: "Chocolate Cakes", tag: "BESTSELLER",
    blurb: "Rich chocolate with whipped cream — a Deez classic.", sizes: STD_SIZES, est: 2.2 },
  { id: "fruit", emoji: "🍓", name: "Fruit Cakes", tag: "FRESH",
    blurb: "Topped with fresh seasonal fruit.", sizes: STD_SIZES, est: 2.4 },
];
export const FLAVORS = ["Vanilla", "Chocolate", "Marble", "Red Velvet", "Lemon", "Banana"];
export const cogsFor = (productId: string, qty = 1) => {
  const p = PRODUCTS.find((x) => x.id === productId);
  return Math.round((p ? p.est : 2) * 1000) * qty;
};
