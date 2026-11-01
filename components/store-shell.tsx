"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Check, ChevronDown, CircleUserRound, Languages, LogOut, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useLanguage } from "@/components/language-provider";
import { CustomerSidebar } from "@/components/customer-sidebar";

export function StoreHeader() {
  const cart = useCart();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [storeName, setStoreName] = useState("Nova Digital");
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCustomer = user?.role === "customer";
  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname === "/admin-login") return;
    let active = true;
    const load = async () => {
      try {
        const [me, notes, settings] = await Promise.all([fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json()), fetch("/api/notifications", { cache: "no-store" }).then(r => r.json()), fetch("/api/admin/settings").then(r => r.json())]);
        if (active) { setUser(me.user); setNotifications(notes.notifications || []); setUnread(notes.unread || 0); setStoreName(settings.settings?.storeName || "Nova Digital"); }
      } catch {}
    };
    load();
    const timer = setInterval(load, 25000);
    return () => { active = false; clearInterval(timer); };
  }, [pathname]);
  async function toggleNotifications() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/account?tab=notifications")}`);
      return;
    }
    if (notificationOpen) {
      setNotificationOpen(false);
      return;
    }
    setNotificationOpen(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnread(Number(data.unread || 0));
      }
    } catch {}
  }
  async function markNotificationRead(note: any) {
    if (note.isRead) return;
    try {
      const response = await fetch(`/api/notifications/${note._id}`, { method: "PATCH" });
      if (response.ok) {
        setNotifications(current => current.map(item => item._id === note._id ? { ...item, isRead: true } : item));
        setUnread(current => Math.max(0, current - 1));
      }
    } catch {}
  }
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); cart.clear(); localStorage.removeItem("nova-cart"); setUser(null); router.push("/"); router.refresh(); }
  function submitSearch(e: React.FormEvent) { e.preventDefault(); router.push(`/?q=${encodeURIComponent(search)}#catalog`); setMobileOpen(false); }
  useEffect(() => { setNotificationOpen(false); }, [pathname]);
  if (pathname.startsWith("/admin") || pathname === "/admin-login") return null;
  return (
    <>
    <header className={isCustomer ? "site-header site-header-internal" : "site-header site-header-public"}>
      <div className="header-inner">
        <Link href="/" className="brand"><span className="brand-mark">N</span><span>{storeName}<small>{t("marketplace")}</small></span></Link>
        {!isCustomer && <>
          <nav className="desktop-nav">
            <Link className={pathname === "/" ? "active" : ""} href="/">{t("discover")}</Link>
            <Link href="/#catalog">{t("catalog")}</Link>
            <Link href="/#deals">{t("deals")}</Link>
          </nav>
          <form className="header-search" onSubmit={submitSearch}><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("search")}/><kbd>↵</kbd></form>
        </>}
        {isCustomer && <div className="internal-header-title">{language === "ar" ? "مساحة العميل" : "CUSTOMER AREA"}</div>}
        <div className="header-actions">
          <button type="button" className="language-toggle" onClick={()=>setLanguage(language==="en"?"ar":"en")} aria-label={t("language")} title={t("language")}><Languages size={17}/><span>{language==="en"?"العربية":"English"}</span></button>
          {user?.role !== "admin" && <div className="notification-menu">
            <button type="button" className="header-icon notification-trigger" aria-label={t("notifications")} aria-expanded={notificationOpen} onClick={() => void toggleNotifications()}>
              <Bell size={19}/>{unread > 0 && <i className="notification-dot">{unread > 9 ? "9+" : unread}</i>}
            </button>
            {notificationOpen && <div className="notification-panel" role="dialog" aria-label={t("notificationsPreview")} dir={language === "ar" ? "rtl" : "ltr"}>
              <div className="notification-panel-head"><b>{t("notificationsPreview")}</b><span>{t("unreadCount").replace("{count}", String(unread))}</span></div>
              <div className="notification-panel-list">
                {notifications.length ? notifications.slice(0, 6).map(note => <Link href={note.href || "/account?tab=notifications"} key={note._id} className={note.isRead ? "notification-preview-row" : "notification-preview-row unread"} onClick={() => { void markNotificationRead(note); setNotificationOpen(false); }}>
                  <i className="notification-preview-indicator"/>
                  <span className="notification-preview-copy"><b>{note.title}</b><span>{note.body}</span><small>{new Date(note.createdAt).toLocaleString(language === "ar" ? "ar-EG" : "en-US")}</small></span>
                  {!note.isRead && <Check size={15} className="notification-preview-check"/>}
                </Link>) : <div className="notification-preview-empty"><Bell size={21}/><span>{user ? t("noNotifications") : t("signInForNotifications")}</span></div>}
              </div>
              <Link href="/account?tab=notifications" className="notification-panel-footer" onClick={() => setNotificationOpen(false)}>{t("viewAllNotifications")} <ChevronDown size={14}/></Link>
            </div>}
          </div>}
          {user?.role !== "admin" && <Link href="/cart" className="header-icon cart-icon" aria-label={t("cart")}><ShoppingBag size={19}/>{cart.count > 0 && <i className="cart-count">{cart.count}</i>}</Link>}
          {user ? <div className="user-menu"><Link href={user.role === "admin" ? "/admin" : "/account"} className="account-link"><CircleUserRound size={18}/><span>{user.name?.split(" ")[0]}</span><ChevronDown size={14}/></Link><div className="user-dropdown">{user.role === "admin" ? <Link href="/admin">{t("adminDashboard")}</Link> : <><Link href="/account">{t("myAccount")}</Link><Link href="/orders">{t("myOrders")}</Link><Link href="/chat">{t("supportChat")}</Link></>}<button onClick={logout}><LogOut size={15}/> {t("signOut")}</button></div></div> : <Link href="/login" className="button button-small">{t("signIn")}</Link>}
          {!isCustomer && <button className="mobile-toggle" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">{mobileOpen ? <X/> : <Menu/>}</button>}
        </div>
      </div>
      {!isCustomer && mobileOpen && <div className="mobile-nav"><Link href="/" onClick={()=>setMobileOpen(false)}>{t("discover")}</Link><Link href="/#catalog" onClick={()=>setMobileOpen(false)}>{t("catalog")}</Link><Link href="/#deals" onClick={()=>setMobileOpen(false)}>{t("deals")}</Link><Link href="/chat" onClick={()=>setMobileOpen(false)}><MessageCircle size={16}/> {t("support")}</Link><Link href="/login" onClick={()=>setMobileOpen(false)}>{t("signIn")}</Link><form onSubmit={submitSearch}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("search")}/><button><Search size={16}/></button></form></div>}
    </header>
    {user?.role === "customer" && <CustomerSidebar user={user}/>}
    </>
  );
}

export function StoreFooter() {
  const { t } = useLanguage();
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname === "/admin-login") return null;
  return <footer className="site-footer"><div className="footer-inner"><div className="brand footer-brand"><span className="brand-mark">N</span><span>NOVA<span className="brand-light"> DIGITAL</span><small>{t("marketplace")}</small></span></div><p>{t("footerDescription")}</p><div className="footer-links"><Link href="/#catalog">{t("exploreCatalog")}</Link><Link href="/about">{t("aboutUs")}</Link><Link href="/privacy">{t("privacyPolicy")}</Link><Link href="/terms">{t("terms")}</Link><Link href="/contact">{t("contact")}</Link><Link href="/chat">{t("customerSupport")}</Link><Link href="/account">{t("myAccount")}</Link></div><span className="copyright">© {new Date().getFullYear()} Nova Digital. All rights reserved.</span></div></footer>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return <div className="page-intro">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>;
}
