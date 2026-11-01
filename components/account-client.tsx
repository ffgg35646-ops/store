"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ChevronRight, CircleUserRound, Gift, Package, Wallet } from "lucide-react";
import { NotificationSetup } from "@/components/notification-setup";
import { money } from "@/components/product-card";
import { PageIntro } from "@/components/store-shell";
import { useLanguage } from "@/components/language-provider";
import { localizeNotification, localizeWalletNote, localizeCustomerError } from "@/components/customer-localization";

export function AccountClient({ initialTab="overview" }: {initialTab?:string}) {
  const { t, language } = useLanguage();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const [user,setUser]=useState<any>(null);
  const [orders,setOrders]=useState<any[]>([]);
  const [notes,setNotes]=useState<any[]>([]);
  const [wallet,setWallet]=useState<any>(null);
  const [tab,setTab]=useState(initialTab);
  const [loading,setLoading]=useState(true);
  const [profileName,setProfileName]=useState("");
  const [currentPassword,setCurrentPassword]=useState("");
  const [newPassword,setNewPassword]=useState("");
  const [profileBusy,setProfileBusy]=useState(false);
  const [profileMessage,setProfileMessage]=useState("");
  async function load() {
    const [u,o,n,w]=await Promise.all([fetch("/api/auth/me").then(r=>r.json()),fetch("/api/orders").then(r=>r.json()),fetch("/api/notifications").then(r=>r.json()),fetch("/api/wallet").then(r=>r.json())]);
    setUser(u.user);setProfileName(current=>current||u.user?.name||"");setOrders(o.orders||[]);setNotes(n.notifications||[]);setWallet(w);setLoading(false);
  }
  useEffect(()=>{load();const timer=setInterval(load,30000);return()=>clearInterval(timer);},[]);
  async function markRead(id:string){await fetch(`/api/notifications/${id}`,{method:"PATCH"});setNotes(n=>n.map(x=>x._id===id?{...x,isRead:true}:x));}
  async function saveProfile(e:React.FormEvent){
    e.preventDefault();setProfileBusy(true);setProfileMessage("");
    try{
      const response=await fetch("/api/account/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:profileName,currentPassword,newPassword})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not update profile.");
      setUser((old:any)=>({...old,...data.user}));setCurrentPassword("");setNewPassword("");setProfileMessage(t("profileUpdated"));
    }catch(error:any){setProfileMessage(localizeCustomerError(error.message||"Could not update profile.",language,t));}
    finally{setProfileBusy(false);}
  }
  if(loading)return <main className="main-content narrow-page"><div className="loading-block"/></main>;
  if(!user)return <main className="main-content narrow-page"><div className="empty-state"><CircleUserRound/><b>{t("signInToView")}</b><Link href="/login" className="button button-primary">{t("signIn")}</Link></div></main>;
  return <main className="main-content narrow-page"><PageIntro eyebrow={t("accountEyebrow")} title={`${t("helloPrefix")}، ${user.name?.split(" ")[0]}`} description={t("accountDescription")}/>
    <div className="account-hero"><div className="account-avatar">{user.name?.charAt(0)?.toUpperCase()}</div><div className="account-identity"><h2>{user.name}</h2><p>{user.email}</p><span className="verified-pill">{t("activeMember")}</span></div><div className="account-metrics"><div><small>{t("walletBalance")}</small><b>{money(Number(user.walletBalance||0),wallet?.account?.currency||"USD")}</b></div><div><small>{t("rewardPoints")}</small><b>{user.points||0} {t("pointsShort")}</b></div></div></div>
    <div className="account-tabs">{[["overview","overview"],["profile","profileSecurity"],["orders","myOrdersTab"],["wallet","walletTab"],["notifications","notificationsTab"]].map(([key,label])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}>{t(label)}{key==="notifications"&&notes.some(n=>!n.isRead)?<i className="tab-dot"/>:null}</button>)}</div>
    {tab==="overview"&&<div className="account-grid"><button onClick={()=>setTab("orders")} className="account-tile"><Package/><b>{t("myOrdersTab")}</b><small>{t("ordersCount").replace("{count}", String(orders.length))}</small><ChevronRight/></button><button onClick={()=>setTab("wallet")} className="account-tile"><Wallet/><b>{t("walletTab")}</b><small>{money(Number(user.walletBalance||0))} {t("available")}</small><ChevronRight/></button><button onClick={()=>setTab("notifications")} className="account-tile"><Bell/><b>{t("notificationsTab")}</b><small>{t("unreadUpdates").replace("{count}", String(notes.filter(n=>!n.isRead).length))}</small><ChevronRight/></button><Link href="/chat" className="account-tile"><Gift/><b>{t("supportRewards")}</b><small>{t("talkToTeam")}</small><ChevronRight/></Link></div>}
    {tab==="profile"&&<div className="data-card"><div className="data-card-heading"><h2>{t("profileSecurity")}</h2><span>{t("accountSettings")}</span></div><form className="form-stack account-profile-form" onSubmit={saveProfile}><label className="field"><span>{t("fullName")}</span><input required minLength={2} maxLength={80} value={profileName} onChange={e=>setProfileName(e.target.value)}/></label><label className="field"><span>{t("emailAddress")}</span><input value={user.email||""} disabled/><small>{t("emailReadOnly")}</small></label><hr/><h3>{t("changePassword")}</h3><label className="field"><span>{t("currentPassword")}</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></label><label className="field"><span>{t("newPassword")}</span><input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder={t("leaveBlankPassword")}/></label>{profileMessage&&<div className={profileMessage===t("profileUpdated")?"admin-alert success":"form-error"}>{profileMessage}</div>}<button className="button button-primary" disabled={profileBusy}>{profileBusy?t("saving"):t("saveAccountSettings")}</button></form></div>}
    {tab==="orders"&&<div className="data-card"><div className="data-card-heading"><h2>{t("orderHistory")}</h2><span>{t("totalCount").replace("{count}", String(orders.length))}</span></div>{orders.length?orders.map(o=><Link href={`/orders/${o._id}`} className="list-row" key={o._id}><div className="order-icon"><Package size={18}/></div><div className="list-main"><b>{o.orderNumber}</b><small>{new Date(o.createdAt).toLocaleDateString(locale)} · {t("itemCount").replace("{count}", String(o.items?.length || 0))}</small></div><span className={`status-pill status-${o.status}`}>{t(({awaiting_payment:"orderStatusAwaiting",processing:"orderStatusProcessing",delivered:"orderStatusDelivered",shipped:"orderStatusShipped",completed:"orderStatusCompleted",cancelled:"orderStatusCancelled",refunded:"orderStatusRefunded"} as Record<string,string>)[o.status] || o.status)}</span><strong>{money(o.total,o.currency)}</strong><ChevronRight size={16}/></Link>):<div className="empty-state compact"><Package/><b>{t("noOrders")}</b><Link href="/#catalog">{t("exploreCatalog")}</Link></div>}</div>}
    {tab==="wallet"&&<div className="data-card"><div className="data-card-heading"><h2>{t("walletActivity")}</h2><strong className="wallet-balance">{money(Number(user.walletBalance||0))}</strong></div>{wallet?.transactions?.length?wallet.transactions.map((tx:any)=><div className="list-row" key={tx._id}><div className="order-icon"><Wallet size={17}/></div><div className="list-main"><b>{tx.note?localizeWalletNote(tx.note,language):t(({credit:"walletCredit",debit:"walletDebit",refund:"walletRefund",reward:"walletReward",adjustment:"walletAdjustment"} as Record<string,string>)[tx.type] || tx.type)}</b><small>{new Date(tx.createdAt).toLocaleString(locale)} · {tx.reference||t("accountTransaction")}</small></div><strong className={tx.amount>0?"positive":"negative"}>{tx.amount>0?"+":""}{money(tx.amount)}</strong></div>):<div className="empty-state compact"><Wallet/><b>{t("noWalletActivity")}</b></div>}</div>}
    {tab==="notifications"&&<><NotificationSetup/><div className="data-card"><div className="data-card-heading"><h2>{t("notificationsTab")}</h2><span>{t("unreadCount").replace("{count}", String(notes.filter(n=>!n.isRead).length))}</span></div>{notes.length?notes.map(n=><div className={n.isRead?"notification-row":"notification-row unread"} key={n._id}><div className="notification-symbol"><Bell size={16}/></div><div className="list-main"><b>{localizeNotification(n.title,n.body,language).title}</b><p>{localizeNotification(n.title,n.body,language).body}</p><small>{new Date(n.createdAt).toLocaleString(locale)}</small></div><div className="notification-actions">{!n.isRead&&<button onClick={()=>markRead(n._id)} title={t("markAsRead")}><CheckCheck size={16}/></button>}<Link href={n.href||"/account"} aria-label={t("open")}><ChevronRight size={17}/></Link></div></div>):<div className="empty-state compact"><Bell/><b>{t("allCaughtUp")}</b></div>}</div></>}
  </main>;
}
