"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, ClipboardList, LogOut, MessageCircle, MoreHorizontal, ShoppingBag, UserRound, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { localizeCustomerCopy } from "@/components/customer-localization";

const items = [
  { href: "/", key: "catalog", icon: BookOpen },
  { href: "/profile", key: "profile", icon: UserRound },
  { href: "/orders", key: "myOrders", icon: ClipboardList },
  { href: "/cart", key: "cart", icon: ShoppingBag },
  { href: "/chat", key: "supportChat", icon: MessageCircle }
];

export function CustomerSidebar({ user }: { user: any }) {
  const { language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(3);
  const [startIndex, setStartIndex] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  const labels: Record<string, [string, string]> = {
    catalog: ["الكتالوج", "Catalog"],
    profile: ["الملف الشخصي", "Profile"],
    myOrders: ["طلباتي", "My orders"],
    cart: ["السلة", "Cart"],
    supportChat: ["الدعم", "Support"]
  };
  const label = (key: string) => labels[key]?.[language === "ar" ? 0 : 1] || key;
  const isActive = (href: string) => href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(href + "/");

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      setVisibleCount(width <= 360 ? 2 : width <= 450 ? 3 : 4);
    };
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const pageCount = Math.ceil(items.length / visibleCount);
  const currentPage = Math.min(Math.floor(startIndex / visibleCount), pageCount - 1);
  const visibleItems = items.slice(currentPage * visibleCount, currentPage * visibleCount + visibleCount);

  useEffect(() => {
    const activeIndex = items.findIndex(item => isActive(item.href));
    if (activeIndex >= 0) setStartIndex(Math.floor(activeIndex / visibleCount) * visibleCount);
    setMoreOpen(false);
  }, [pathname, visibleCount]);

  if (!user || user.role !== "customer") return null;

  function movePage(direction: -1 | 1) {
    const nextPage = (currentPage + direction + pageCount) % pageCount;
    setStartIndex(nextPage * visibleCount);
    setMoreOpen(false);
  }

  function openItem(index: number) {
    setStartIndex(Math.floor(index / visibleCount) * visibleCount);
    setMoreOpen(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("nova-cart");
    router.replace("/");
    router.refresh();
  }

  const PreviousIcon = language === "ar" ? ChevronRight : ChevronLeft;
  const NextIcon = language === "ar" ? ChevronLeft : ChevronRight;

  return <>
    <aside className="customer-sidebar" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="customer-sidebar-heading">
        <div className="customer-sidebar-user">
          <span className="customer-sidebar-avatar">{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
          <span><b>{user.name}</b><small>{user.email}</small></span>
        </div>
      </div>
      <span className="customer-sidebar-caption">{localizeCustomerCopy("MY ACCOUNT",language)}</span>
      <nav>
        {items.map(item => {
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : ""}>
            <Icon size={18}/><span>{label(item.key)}</span>
          </Link>;
        })}
      </nav>
      <button className="customer-sidebar-logout" onClick={logout}>
        <LogOut size={18}/><span>{language === "ar" ? "تسجيل الخروج" : "Sign out"}</span>
      </button>
    </aside>

    <nav className="customer-bottom-nav" dir={language === "ar" ? "rtl" : "ltr"} aria-label={language === "ar" ? "التنقل بين صفحات الحساب" : "Customer navigation"}>
      <button type="button" className="customer-bottom-arrow" onClick={() => movePage(-1)} disabled={pageCount <= 1} aria-label={language === "ar" ? "الصفحات السابقة" : "Previous pages"} title={language === "ar" ? "السابق" : "Previous"}>
        <PreviousIcon size={19}/>
      </button>

      <div className="customer-bottom-links">
        {visibleItems.map(item => {
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className={isActive(item.href) ? "active" : ""} aria-current={isActive(item.href) ? "page" : undefined}>
            <Icon size={19}/><span>{label(item.key)}</span>
          </Link>;
        })}
      </div>

      <button type="button" className={moreOpen ? "customer-bottom-more active" : "customer-bottom-more"} onClick={() => setMoreOpen(value => !value)} aria-expanded={moreOpen}>
        {moreOpen ? <X size={18}/> : <MoreHorizontal size={20}/>}
        <span>{language === "ar" ? "المزيد" : "More"}</span>
      </button>

      <button type="button" className="customer-bottom-arrow" onClick={() => movePage(1)} disabled={pageCount <= 1} aria-label={language === "ar" ? "الصفحات التالية" : "Next pages"} title={language === "ar" ? "التالي" : "Next"}>
        <NextIcon size={19}/>
      </button>

      {moreOpen && <>
        <button className="customer-more-backdrop" aria-label={language === "ar" ? "إغلاق القائمة" : "Close menu"} onClick={() => setMoreOpen(false)}/>
        <section className="customer-more-panel">
          <div className="customer-more-heading">
            <strong>{language === "ar" ? "كل الصفحات" : "All pages"}</strong>
            <small>{language === "ar" ? "اختر الصفحة التي تريد فتحها" : "Choose where you want to go"}</small>
          </div>
          <div className="customer-more-grid">
            {items.map((item, index) => {
              const Icon = item.icon;
              return <Link key={item.href} href={item.href} onClick={() => openItem(index)} className={isActive(item.href) ? "active" : ""}>
                <Icon size={18}/><span>{label(item.key)}</span>
              </Link>;
            })}
          </div>
          <button type="button" className="customer-more-logout" onClick={logout}>
            <LogOut size={17}/><span>{language === "ar" ? "تسجيل الخروج" : "Sign out"}</span>
          </button>
        </section>
      </>}
    </nav>
  </>;
}
