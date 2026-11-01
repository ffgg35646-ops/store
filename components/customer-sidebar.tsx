"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, CircleUserRound, ClipboardList, Wallet, Bell, ShoppingBag, MessageCircle, UserRound, LogOut, X, Menu } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const items = [
  { href: "/", key: "catalog", icon: BookOpen, exact: true },
  { href: "/account", key: "myAccount", icon: CircleUserRound, exact: true },
  { href: "/account?tab=profile", key: "profile", icon: UserRound },
  { href: "/account?tab=orders", key: "myOrders", icon: ClipboardList },
  { href: "/account?tab=wallet", key: "walletTab", icon: Wallet },
  { href: "/account?tab=notifications", key: "notifications", icon: Bell },
  { href: "/cart", key: "cart", icon: ShoppingBag },
  { href: "/chat", key: "supportChat", icon: MessageCircle }
];

export function CustomerSidebar({ user }: { user: any }) {
  const { language } = useLanguage();
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!user || user.role !== "customer") return null;
  const labels: Record<string, [string, string]> = {
    catalog: ["الكتالوج", "Catalog"], myAccount: ["نظرة عامة", "Overview"],
    profile: ["الملف الشخصي", "Profile"], myOrders: ["طلباتي", "My orders"],
    walletTab: ["المحفظة", "Wallet"], notifications: ["الإشعارات", "Notifications"],
    cart: ["سلة التسوق", "Shopping cart"], supportChat: ["الدعم الفني", "Support"]
  };
  const active = (item: typeof items[number]) => {
    if (item.href === "/") return pathname === "/";
    if (item.href === "/account") return pathname === "/account" && !params.get("tab");
    if (item.href.startsWith("/account?")) return pathname === "/account" && params.get("tab") === item.href.split("=")[1];
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("nova-cart");
    router.replace("/");
    router.refresh();
  }
  const label = (key: string) => labels[key]?.[language === "ar" ? 0 : 1] || key;
  return <>
    <button className="customer-sidebar-mobile-trigger" onClick={() => setOpen(true)} aria-label={language === "ar" ? "فتح القائمة" : "Open menu"}><Menu size={19}/></button>
    {open && <button className="customer-sidebar-backdrop" aria-label="Close menu" onClick={() => setOpen(false)}/>}
    <aside className={`customer-sidebar ${open ? "is-open" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="customer-sidebar-heading">
        <div className="customer-sidebar-user"><span className="customer-sidebar-avatar">{user.name?.charAt(0)?.toUpperCase() || "U"}</span><span><b>{user.name}</b><small>{user.email}</small></span></div>
        <button className="customer-sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18}/></button>
      </div>
      <span className="customer-sidebar-caption">{language === "ar" ? "حسابي" : "MY ACCOUNT"}</span>
      <nav>{items.map(item => { const Icon=item.icon; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={active(item) ? "active" : ""}><Icon size={18}/><span>{label(item.key)}</span></Link>; })}</nav>
      <button className="customer-sidebar-logout" onClick={logout}><LogOut size={18}/><span>{language === "ar" ? "تسجيل الخروج" : "Sign out"}</span></button>
    </aside>
  </>;
}
