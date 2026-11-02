"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BadgePercent, Bell, Boxes, ChevronLeft, Gift, LayoutDashboard, LogOut, MessageCircle, Package, Settings, ShoppingCart, Users, Warehouse, X } from "lucide-react";

const nav = [
  {href:"/admin",label:"نظرة عامة",icon:LayoutDashboard},
  {href:"/admin/products",label:"المنتجات",icon:Package},
  {href:"/admin/categories",label:"الأقسام",icon:Boxes},
  {href:"/admin/inventory",label:"المخزون الرقمي",icon:Warehouse},
  {href:"/admin/orders",label:"الطلبات",icon:ShoppingCart},
  {href:"/admin/users",label:"العملاء",icon:Users},
  {href:"/admin/coupons",label:"الخصومات والكوبونات",icon:BadgePercent},
  {href:"/admin/rewards",label:"مكافآت العملاء",icon:Gift},
  {href:"/admin/notifications",label:"إشعارات العملاء",icon:Bell},
  {href:"/admin/messages",label:"رسائل الدعم",icon:MessageCircle},
  {href:"/admin/settings",label:"إعدادات المتجر",icon:Settings}
];

export function AdminShell({children}:{children:React.ReactNode}) {
  const pathname=usePathname(),router=useRouter();
  const [user,setUser]=useState<any>(null);
  const [open,setOpen]=useState(false);
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [supportMessages,setSupportMessages]=useState<any[]>([]);
  const [supportUnread,setSupportUnread]=useState(0);

  async function loadSupportNotifications(){
    try{
      const response=await fetch("/api/admin/notifications",{cache:"no-store"});
      if(!response.ok)return;
      const data=await response.json();
      setSupportMessages(data.supportMessages||[]);
      setSupportUnread(Number(data.unreadSupportCount||0));
    }catch{/* Keep the admin workspace usable if polling briefly fails. */}
  }

  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(d=>setUser(d.user)).catch(()=>{});
    loadSupportNotifications();
    const timer=window.setInterval(loadSupportNotifications,12000);
    return()=>window.clearInterval(timer);
  },[]);

  async function logout(){await fetch("/api/auth/logout",{method:"POST"});router.push("/admin-login");}

  return <div className="admin-layout" dir="rtl">
    <aside className={open?"admin-sidebar open":"admin-sidebar"} dir="rtl">
      <Link href="/admin" className="admin-brand"><span className="brand-mark">N</span><span>NOVA <small>لوحة التحكم</small></span></Link>
      <div className="admin-nav-label">إدارة المتجر</div>
      <nav>{nav.map(item=>{const Icon=item.icon;return <Link key={item.href} href={item.href} onClick={()=>setOpen(false)} className={(item.href==="/admin"?pathname==="/admin":pathname.startsWith(item.href))?"active":""}><Icon size={17}/>{item.label}</Link>;})}</nav>
      <div className="admin-side-bottom">
        <div className="admin-user-mini"><span className="admin-avatar">{user?.name?.charAt(0)||"م"}</span><span><b>{user?.name||"مدير المتجر"}</b><small>مسؤول المتجر</small></span></div>
        <button onClick={logout}><LogOut size={16}/> تسجيل الخروج</button>
        <Link href="/"><ChevronLeft size={16}/> العودة إلى المتجر</Link>
      </div>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar">
        <div className="admin-top-title"><button className="mobile-toggle admin-menu-toggle" onClick={()=>setOpen(!open)} aria-label="القائمة"><Activity/></button><div><span className="eyebrow">NOVA DIGITAL / الإدارة</span><b>{nav.find(n=>n.href===pathname)?.label||"لوحة التحكم"}</b></div></div>
        <div className="admin-top-actions">
          <span className="admin-status-dot"/><span className="admin-system-label">جميع الأنظمة تعمل</span>
          <Link href="/" target="_blank">عرض المتجر ↗</Link>
          <div className="admin-bell-wrap">
            <button type="button" className={supportUnread?"admin-bell has-unread":"admin-bell"} onClick={()=>setNotificationsOpen(v=>!v)} aria-label="إشعارات رسائل الدعم" aria-expanded={notificationsOpen}>
              <Bell size={19}/>{supportUnread>0&&<span className="admin-bell-count">{supportUnread>99?"99+":supportUnread}</span>}
            </button>
            {notificationsOpen&&<div className="admin-bell-panel" dir="rtl">
              <div className="admin-bell-heading"><div><b>رسائل دعم جديدة</b><small>{supportUnread} رسالة غير مقروءة</small></div><button type="button" onClick={()=>setNotificationsOpen(false)} aria-label="إغلاق"><X size={16}/></button></div>
              <div className="admin-bell-list">
                {supportMessages.map((item:any)=><Link href={`/admin/messages?conversation=${encodeURIComponent(item._id)}`} key={item._id} onClick={()=>setNotificationsOpen(false)} className="admin-bell-item">
                  <span className="admin-bell-avatar">{item.userId?.name?.charAt(0)||"ع"}</span>
                  <span className="admin-bell-copy"><b>{item.userId?.name||"عميل"}</b><span>{item.lastMessage||item.subject||"رسالة دعم جديدة"}</span><small>{item.lastMessageAt?new Date(item.lastMessageAt).toLocaleString("ar-EG"):""}</small></span>
                  <i>{item.adminUnread}</i>
                </Link>)}
                {!supportMessages.length&&<div className="admin-bell-empty"><Bell size={20}/><span>لا توجد رسائل دعم جديدة</span></div>}
              </div>
              <Link href="/admin/messages" className="admin-bell-footer" onClick={()=>setNotificationsOpen(false)}>فتح صندوق رسائل الدعم</Link>
            </div>}
          </div>
        </div>
      </header>
      <div className="admin-content">{children}</div>
    </div>
  </div>;
}
