"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Copy, PackageCheck } from "lucide-react";
import { money } from "@/components/product-card";
import { PageIntro } from "@/components/store-shell";
import { useLanguage } from "@/components/language-provider";
import { localizeCustomerCopy, localizeCustomerError, localizeOrderStatus, localizePaymentMethod } from "@/components/customer-localization";

export function OrderDetailClient({ id }: {id:string}) {
  const { language, t } = useLanguage();
  const [order,setOrder]=useState<any>(null);
  const [error,setError]=useState("");
  useEffect(()=>{fetch(`/api/orders/${id}`).then(r=>r.json()).then(d=>{if(!d.order)throw new Error(localizeCustomerError(d.error||"Order not found",language,t));setOrder(d.order);}).catch(e=>setError(e.message));},[id]);
  if(error)return <main className="main-content narrow-page"><div className="empty-state"><PackageCheck/><b>{error}</b><Link href="/orders" className="button button-primary">Back to account</Link></div></main>;
  if(!order)return <main className="main-content narrow-page"><div className="loading-block"/></main>;
  const delivered=order.items?.every((item:any)=>item.deliveredData?.length>=item.quantity);
  return <main className="main-content narrow-page"><Link href="/orders" className="back-link"><ArrowLeft size={15}/> {localizeCustomerCopy("Back to orders",language)}</Link><PageIntro eyebrow={localizeCustomerCopy("ORDER DETAILS",language)} title={order.orderNumber} description={`Placed on ${new Date(order.createdAt).toLocaleString()}`}/>
    <div className="order-status-card"><div className="order-status-icon">{delivered?<CheckCircle2/>:<Clock3/>}</div><div><span className="eyebrow">{localizeCustomerCopy("CURRENT STATUS",language)}</span><h2>{localizeOrderStatus(order.status,language)}</h2><p>{localizeCustomerCopy(order.paymentStatus==="paid"?"Payment confirmed.":"Awaiting payment confirmation.",language)} {localizeCustomerCopy(order.status==="shipped"?"Your order has been shipped.":order.status==="completed"?"Your order has been completed successfully.":delivered?"Your digital details are ready below.":"We will notify you when the order is updated.",language)}</p></div><span className={`status-pill status-${order.status}`}>{order.paymentStatus}</span></div>
    <div className="data-card"><div className="data-card-heading"><h2>{localizeCustomerCopy("Items & delivery",language)}</h2><span>{order.items.length} item(s)</span></div>{order.items.map((item:any,index:number)=><div className="delivered-item" key={index}><div className="cart-thumb">{item.image?<img src={item.image} alt=""/>:<PackageCheck/>}</div><div className="list-main"><b>{item.title}</b><small>Quantity {item.quantity} · {money(item.unitPrice,order.currency)} each</small>{item.deliveredData?.length? <div className="delivery-codes">{item.deliveredData.map((value:string,i:number)=><div className="delivery-code" key={i}><code>{value}</code><button onClick={()=>navigator.clipboard.writeText(value)} title="Copy"><Copy size={14}/></button></div>)}</div>:<span className="delivery-pending">{localizeCustomerCopy("Delivery information will appear here when ready.",language)}</span>}{item.deliveryNote&&<p className="muted-note">{item.deliveryNote}</p>}</div><b>{money(item.unitPrice*item.quantity,order.currency)}</b></div>)}</div>
    <div className="summary-card order-total-card"><div className="summary-line"><span>{localizeCustomerCopy("Subtotal",language)}</span><b>{money(order.subtotal,order.currency)}</b></div><div className="summary-line"><span>{localizeCustomerCopy("Discount",language)} {order.couponCode&&`(${order.couponCode})`}</span><b className="positive">−{money(order.discount,order.currency)}</b></div><div className="summary-total"><span>{localizeCustomerCopy("Total paid",language)}</span><strong>{money(order.total,order.currency)}</strong></div><div className="summary-line"><span>{localizeCustomerCopy("Payment method",language)}</span><b>{localizePaymentMethod(order.paymentMethod,language)}</b></div></div>
  </main>;
}
