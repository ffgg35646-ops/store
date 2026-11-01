"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BadgePercent, Bell, Boxes, ChevronLeft, Gift, LayoutDashboard, LogOut, Menu, MessageCircle, Package, Settings, ShoppingCart, Users, Warehouse, X } from "lucide-react";

const nav = [
  {href:"/admin",label:"Overview",icon:LayoutDashboard},
  {href:"/admin/products",label:"Products",icon:Package},
  {href:"/admin/categories",label:"Categories",icon:Boxes},
  {href:"/admin/inventory",label:"Digital inventory",icon:Warehouse},
  {href:"/admin/orders",label:"Orders",icon:ShoppingCart},
  {href:"/admin/users",label:"Customers",icon:Users},
  {href:"/admin/coupons",label:"Discounts & coupons",icon:BadgePercent},
  {href:"/admin/rewards",label:"Rewards",icon:Gift},
  {href:"/admin/notifications",label:"Notifications",icon:Bell},
  {href:"/admin/messages",label:"Messages",icon:MessageCircle},
  {href:"/admin/settings",label:"Store settings",icon:Settings}
];

export function AdminShell({children}:{children:React.ReactNode}) {
  const pathname=usePathname(),router=useRouter();
  const [user,setUser]=useState<any>(null);
  const [open,setOpen]=useState(false);
  useEffect(()=>{fetch("/api/auth/me").then(r=>r.json()).then(d=>setUser(d.user));},[]);
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});router.push("/admin-login");}
  return <div className="admin-layout">
    <aside className={open?"admin-sidebar open":"admin-sidebar"}><Link href="/admin" className="admin-brand"><span className="brand-mark">N</span><span>NOVA <small>CONTROL CENTER</small></span></Link>
      <div className="admin-nav-label">STORE MANAGEMENT</div><nav>{nav.map(item=>{const Icon=item.icon;return <Link key={item.href} href={item.href} onClick={()=>setOpen(false)} className={(item.href==="/admin"?pathname==="/admin":pathname.startsWith(item.href))?"active":""}><Icon size={17}/>{item.label}</Link>;})}</nav>
      <div className="admin-side-bottom"><div className="admin-user-mini"><span className="admin-avatar">{user?.name?.charAt(0)||"A"}</span><span><b>{user?.name||"Administrator"}</b><small>Store administrator</small></span></div><button onClick={logout}><LogOut size={16}/> Sign out</button><Link href="/"><ChevronLeft size={16}/> Back to store</Link></div>
    </aside>
    <div className="admin-main"><header className="admin-topbar"><button className="mobile-toggle admin-menu-toggle" onClick={()=>setOpen(!open)} aria-label={open?"Close menu":"Open menu"} aria-expanded={open}>{open?<X size={18}/>:<Menu size={18}/>}</button><div><span className="eyebrow">NOVA DIGITAL / STORE ADMIN</span><b>{nav.find(n=>n.href===pathname)?.label||"Control center"}</b></div><div className="admin-top-actions"><span className="admin-status-dot"/> All systems operational<Link href="/" target="_blank">View store ↗</Link></div></header><div className="admin-content">{children}</div></div>
  </div>;
}
