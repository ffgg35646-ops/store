"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ChevronRight, CircleUserRound, Gift, Package, Wallet } from "lucide-react";
import { NotificationSetup } from "@/components/notification-setup";
import { money } from "@/components/product-card";
import { PageIntro } from "@/components/store-shell";

export function AccountClient({ initialTab="overview" }: {initialTab?:string}) {
  const [user,setUser]=useState<any>(null);
  const [orders,setOrders]=useState<any[]>([]);
  const [notes,setNotes]=useState<any[]>([]);
  const [wallet,setWallet]=useState<any>(null);
  const [tab,setTab]=useState(initialTab);
  const [loading,setLoading]=useState(true);
  async function load() {
    const [u,o,n,w]=await Promise.all([fetch("/api/auth/me").then(r=>r.json()),fetch("/api/orders").then(r=>r.json()),fetch("/api/notifications").then(r=>r.json()),fetch("/api/wallet").then(r=>r.json())]);
    setUser(u.user);setOrders(o.orders||[]);setNotes(n.notifications||[]);setWallet(w);setLoading(false);
  }
  useEffect(()=>{load();const timer=setInterval(load,30000);return()=>clearInterval(timer);},[]);
  async function markRead(id:string){await fetch(`/api/notifications/${id}`,{method:"PATCH"});setNotes(n=>n.map(x=>x._id===id?{...x,isRead:true}:x));}
  if(loading)return <main className="main-content narrow-page"><div className="loading-block"/></main>;
  if(!user)return <main className="main-content narrow-page"><div className="empty-state"><CircleUserRound/><b>Sign in to view your account</b><Link href="/login" className="button button-primary">Sign in</Link></div></main>;
  return <main className="main-content narrow-page"><PageIntro eyebrow="YOUR SPACE" title={`Hello, ${user.name?.split(" ")[0]}`} description="Manage your purchases, rewards, balance and account updates."/>
    <div className="account-hero"><div className="account-avatar">{user.name?.charAt(0)?.toUpperCase()}</div><div className="account-identity"><h2>{user.name}</h2><p>{user.email}</p><span className="verified-pill">Active member</span></div><div className="account-metrics"><div><small>WALLET BALANCE</small><b>{money(Number(user.walletBalance||0),wallet?.account?.currency||"USD")}</b></div><div><small>REWARD POINTS</small><b>{user.points||0} pts</b></div></div></div>
    <div className="account-tabs">{[["overview","Overview"],["orders","My orders"],["wallet","Wallet"],["notifications","Notifications"]].map(([key,label])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}>{label}{key==="notifications"&&notes.some(n=>!n.isRead)?<i className="tab-dot"/>:null}</button>)}</div>
    {tab==="overview"&&<div className="account-grid"><button onClick={()=>setTab("orders")} className="account-tile"><Package/><b>My orders</b><small>{orders.length} orders</small><ChevronRight/></button><button onClick={()=>setTab("wallet")} className="account-tile"><Wallet/><b>Wallet</b><small>{money(Number(user.walletBalance||0))} available</small><ChevronRight/></button><button onClick={()=>setTab("notifications")} className="account-tile"><Bell/><b>Notifications</b><small>{notes.filter(n=>!n.isRead).length} unread updates</small><ChevronRight/></button><Link href="/chat" className="account-tile"><Gift/><b>Support & rewards</b><small>Talk to our team</small><ChevronRight/></Link></div>}
    {tab==="orders"&&<div className="data-card"><div className="data-card-heading"><h2>Order history</h2><span>{orders.length} total</span></div>{orders.length?orders.map(o=><Link href={`/orders/${o._id}`} className="list-row" key={o._id}><div className="order-icon"><Package size={18}/></div><div className="list-main"><b>{o.orderNumber}</b><small>{new Date(o.createdAt).toLocaleDateString()} · {o.items?.length} item(s)</small></div><span className={`status-pill status-${o.status}`}>{o.status?.replace("_"," ")}</span><strong>{money(o.total,o.currency)}</strong><ChevronRight size={16}/></Link>):<div className="empty-state compact"><Package/><b>No orders yet</b><Link href="/#catalog">Explore the catalog</Link></div>}</div>}
    {tab==="wallet"&&<div className="data-card"><div className="data-card-heading"><h2>Wallet activity</h2><strong className="wallet-balance">{money(Number(user.walletBalance||0))}</strong></div>{wallet?.transactions?.length?wallet.transactions.map((t:any)=><div className="list-row" key={t._id}><div className="order-icon"><Wallet size={17}/></div><div className="list-main"><b>{t.note||t.type}</b><small>{new Date(t.createdAt).toLocaleString()} · {t.reference||"Account transaction"}</small></div><strong className={t.amount>0?"positive":"negative"}>{t.amount>0?"+":""}{money(t.amount)}</strong></div>):<div className="empty-state compact"><Wallet/><b>No wallet activity yet</b></div>}</div>}
    {tab==="notifications"&&<><NotificationSetup/><div className="data-card"><div className="data-card-heading"><h2>Notifications</h2><span>{notes.filter(n=>!n.isRead).length} unread</span></div>{notes.length?notes.map(n=><div className={n.isRead?"notification-row":"notification-row unread"} key={n._id}><div className="notification-symbol"><Bell size={16}/></div><div className="list-main"><b>{n.title}</b><p>{n.body}</p><small>{new Date(n.createdAt).toLocaleString()}</small></div><div className="notification-actions">{!n.isRead&&<button onClick={()=>markRead(n._id)} title="Mark as read"><CheckCheck size={16}/></button>}<Link href={n.href||"/account"} aria-label="Open"><ChevronRight size={17}/></Link></div></div>):<div className="empty-state compact"><Bell/><b>You&apos;re all caught up</b></div>}</div></>}
  </main>;
}
