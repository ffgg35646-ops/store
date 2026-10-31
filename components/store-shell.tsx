"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, CircleUserRound, LogOut, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";

export function StoreHeader() {
  const cart = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [storeName, setStoreName] = useState("Nova Digital");
  const [unread, setUnread] = useState(0);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [me, notes, settings] = await Promise.all([fetch("/api/auth/me").then(r => r.json()), fetch("/api/notifications").then(r => r.json()), fetch("/api/admin/settings").then(r => r.json())]);
        if (active) { setUser(me.user); setUnread(notes.unread || 0); setStoreName(settings.settings?.storeName || "Nova Digital"); }
      } catch {}
    };
    load();
    const timer = setInterval(load, 25000);
    return () => { active = false; clearInterval(timer); };
  }, [pathname]);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); router.push("/"); router.refresh(); }
  function submitSearch(e: React.FormEvent) { e.preventDefault(); router.push(`/?q=${encodeURIComponent(search)}#catalog`); setMobileOpen(false); }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand"><span className="brand-mark">N</span><span>{storeName}<small>THE DIGITAL MARKETPLACE</small></span></Link>
        <nav className="desktop-nav">
          <Link className={pathname === "/" ? "active" : ""} href="/">Discover</Link>
          <Link href="/#catalog">Catalog</Link>
          <Link href="/#deals">Deals</Link>
        </nav>
        <form className="header-search" onSubmit={submitSearch}><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search digital products..."/><kbd>↵</kbd></form>
        <div className="header-actions">
          <Link href="/account?tab=notifications" className="header-icon" aria-label="Notifications"><Bell size={19}/>{unread > 0 && <i className="notification-dot">{unread > 9 ? "9+" : unread}</i>}</Link>
          <Link href="/cart" className="header-icon cart-icon" aria-label="Shopping cart"><ShoppingBag size={19}/>{cart.count > 0 && <i className="cart-count">{cart.count}</i>}</Link>
          {user ? <div className="user-menu"><Link href={user.role === "admin" ? "/admin" : "/account"} className="account-link"><CircleUserRound size={18}/><span>{user.name?.split(" ")[0]}</span><ChevronDown size={14}/></Link><div className="user-dropdown"><Link href="/account">My account</Link><Link href="/orders">My orders</Link><Link href="/chat">Support chat</Link>{user.role === "admin" && <Link href="/admin">Admin dashboard</Link>}<button onClick={logout}><LogOut size={15}/> Sign out</button></div></div> : <Link href="/login" className="button button-small">Sign in</Link>}
          <button className="mobile-toggle" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">{mobileOpen ? <X/> : <Menu/>}</button>
        </div>
      </div>
      {mobileOpen && <div className="mobile-nav"><Link href="/" onClick={()=>setMobileOpen(false)}>Discover</Link><Link href="/#catalog" onClick={()=>setMobileOpen(false)}>Catalog</Link><Link href="/#deals" onClick={()=>setMobileOpen(false)}>Deals</Link><Link href="/chat" onClick={()=>setMobileOpen(false)}><MessageCircle size={16}/> Support</Link><Link href={user ? "/account" : "/login"} onClick={()=>setMobileOpen(false)}>Account</Link><form onSubmit={submitSearch}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products"/><button><Search size={16}/></button></form></div>}
    </header>
  );
}

export function StoreFooter() {
  return <footer className="site-footer"><div className="footer-inner"><div className="brand footer-brand"><span className="brand-mark">N</span><span>NOVA<span className="brand-light"> DIGITAL</span><small>THE DIGITAL MARKETPLACE</small></span></div><p>One destination for subscriptions, software, entertainment and digital essentials.</p><div className="footer-links"><Link href="/#catalog">Explore catalog</Link><Link href="/chat">Customer support</Link><Link href="/account">My account</Link></div><span className="copyright">© {new Date().getFullYear()} Nova Digital. All rights reserved.</span></div></footer>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return <div className="page-intro">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>;
}
