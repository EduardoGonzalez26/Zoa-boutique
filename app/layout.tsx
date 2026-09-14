import type { Metadata } from "next";
import "./globals.css";
import { Marcellus, Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTABanner from "@/components/CTABanner";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";

// ── Logo/heading font: Marcellus — classical, distinctive, editorial elegance ─
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-marcellus",
  display: "swap",
});

// ── Body font: Inter ─────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://zoa.mx"),
  title: { default: "Zoa — Moda Femenina | Boutique Online México", template: "%s | Zoa" },
  description: "Boutique de moda femenina con carácter. Blusas, vestidos, sacos, sweaters y más. Envíos a todo México. Pago seguro con Mercado Pago.",
  keywords: ["moda femenina", "boutique online", "ropa de mujer", "zoa", "blusas", "vestidos", "sweaters", "México"],
  openGraph: {
    title: "Zoa — Moda Femenina",
    description: "Piezas pensadas para la mujer que abraza su esencia. Envíos a todo México.",
    url: "https://zoa.mx",
    siteName: "Zoa",
    locale: "es_MX",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Zoa — Moda Femenina" }],
  },
  twitter: { card: "summary_large_image", title: "Zoa — Moda Femenina", description: "Boutique de moda femenina · Envíos a todo México." },
  alternates: { canonical: "https://zoa.mx" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${marcellus.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-[var(--color-cream)]">
        <Navbar />
        {/* Runs synchronously right after Navbar HTML is in the DOM, before paint.
            Sets data-home and --nc so the CSS rule fires correctly pre-hydration. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=document.querySelector(".zoa-navbar");if(!h)return;var p=location.pathname;if(p==="/"||p===""){h.setAttribute("data-home","true");h.style.setProperty("--nc","#ffffff")}else{h.setAttribute("data-home","false");h.style.setProperty("--nc","var(--color-charcoal)")}})()`,
          }}
        />
        <CartDrawer />
        <WhatsAppButton />
        <main className="flex-1">{children}</main>
        <CTABanner />
        <Footer />
      </body>
    </html>
  );
}
