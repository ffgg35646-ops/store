import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { LanguageProvider } from "@/components/language-provider";
import { StoreHeader, StoreFooter } from "@/components/store-shell";

export const metadata: Metadata = {
  title: "Nova Digital — The Digital Marketplace",
  description: "Discover premium digital subscriptions, entertainment, software and digital essentials.",
  applicationName: "Nova Digital",
  icons: { icon: "/favicon.svg" },
  keywords: ["digital subscriptions", "digital products", "streaming", "software"]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" suppressHydrationWarning><body><LanguageProvider><CartProvider><StoreHeader/>{children}<StoreFooter/></CartProvider></LanguageProvider></body></html>;
}
