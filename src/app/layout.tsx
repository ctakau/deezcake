import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeezCakery Bliss — Fresh cakes made to order in Port Vila",
  description:
    "Custom birthday, wedding, cupcake and character cakes made fresh to order in Port Vila, Vanuatu. Pickup only. Order at least 3 days in advance.",
  openGraph: {
    title: "DeezCakery Bliss",
    description: "Fresh cakes made to order in Port Vila, Vanuatu.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
