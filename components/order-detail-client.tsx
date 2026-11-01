"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Copy, PackageCheck } from "lucide-react";
import { money } from "@/components/product-card";
import { PageIntro } from "@/components/store-shell";

export function OrderDetailClient({ id }: {id:string}) {
  const [order,setOrder]=useState<any>(null);
  const [error,setError]=useState("");
  useEffect(()=>{fetch(`/api/orders/${id}`).then(r=>r.json()).then(d=>{if(!d.order)throw new Error(d.error||"Order not found");setOrder(d.order);}).catch(e=>setError(e.message));},[id]);
  if(error)return <main className="main-content narrow-page"><div className="empty-state"><PackageCheck/><b>{error}</b><Link href="/account" className="button button-primary">Back to account</Link></div></main>;
  if(!order)return <main className="main-content narrow-page"><div className="loading-block"/></main>;
  const delivered=order.items?.every((item:any)=>item.deliveredData?.length>=item.quantity);
  return <main className="main-content narrow-page"><Link href="/account?tab=orders" className="back-link"><ArrowLeft size={15}/> Back to orders</Link><PageIntro eyebrow="ORDER DETAILS" title={order.orderNumber} description={`Placed on ${new Date(order.createdAt).toLocaleString()}`}/>
    <div className="order-status-card"><div className="order-status-icon">{delivered?<CheckCircle2/>:<Clock3/>}</div><div><span className="eyebrow">CURRENT STATUS</span><h2>{order.status?.replace("_"," ")}</h2><p>{order.paymentStatus==="paid"?"Payment confirmed.": "Awaiting payment confirmation."} {order.status==="shipped"?"Your order has been shipped.":order.status==="completed"?"Your order has been completed successfully.":delivered?"Your digital details are ready below.":"We will notify you when the order is updated."}</p></div><span className={`status-pill status-${order.status}`}>{order.paymentStatus}</span></div>
    <div className="data-card"><div className="data-card-heading"><h2>Items & delivery</h2><span>{order.items.length} item(s)</span></div>{order.items.map((item:any,index:number)=><div className="delivered-item" key={index}><div className="cart-thumb">{item.image?<img src={item.image} alt=""/>:<PackageCheck/>}</div><div className="list-main"><b>{item.title}</b><small>Quantity {item.quantity} · {money(item.unitPrice,order.currency)} each</small>{item.deliveredData?.length? <div className="delivery-codes">{item.deliveredData.map((value:string,i:number)=><div className="delivery-code" key={i}><code>{value}</code><button onClick={()=>navigator.clipboard.writeText(value)} title="Copy"><Copy size={14}/></button></div>)}</div>:<span className="delivery-pending">Delivery information will appear here when ready.</span>}{item.deliveryNote&&<p className="muted-note">{item.deliveryNote}</p>}</div><b>{money(item.unitPrice*item.quantity,order.currency)}</b></div>)}</div>
    <div className="summary-card order-total-card"><div className="summary-line"><span>Subtotal</span><b>{money(order.subtotal,order.currency)}</b></div><div className="summary-line"><span>Discount {order.couponCode&&`(${order.couponCode})`}</span><b className="positive">−{money(order.discount,order.currency)}</b></div><div className="summary-total"><span>Total paid</span><strong>{money(order.total,order.currency)}</strong></div><div className="summary-line"><span>Payment method</span><b>{order.paymentMethod}</b></div></div>
  </main>;
}
