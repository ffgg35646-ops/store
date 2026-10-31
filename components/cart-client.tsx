"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { money } from "@/components/product-card";
import { PageIntro } from "@/components/store-shell";

export function CartClient() {
  const cart = useCart();
  return <main className="main-content narrow-page"><PageIntro eyebrow="YOUR BAG" title="Shopping cart" description="Review your digital essentials before checkout."/>
    {!cart.items.length ? <div className="empty-state cart-empty"><ShoppingBag size={34}/><b>Your cart is waiting</b><span>Add a few digital favorites and they will appear here.</span><Link href="/#catalog" className="button button-primary">Explore catalog <ArrowRight size={16}/></Link></div> :
    <div className="cart-layout"><div className="cart-list">{cart.items.map(item=><div className="cart-row" key={item.productId}><div className="cart-thumb">{item.image ? <img src={item.image} alt=""/> : <ShoppingBag/>}</div><div className="cart-info"><Link href={`/product/${item.slug}`}>{item.title}</Link><span>{money(item.price,item.currency)}</span><div className="quantity-control"><button onClick={()=>cart.update(item.productId,item.quantity-1)}><Minus size={13}/></button><b>{item.quantity}</b><button onClick={()=>cart.update(item.productId,item.quantity+1)}><Plus size={13}/></button></div></div><div className="cart-line-total"><b>{money(item.price*item.quantity,item.currency)}</b><button className="text-button danger-text" onClick={()=>cart.remove(item.productId)}><Trash2 size={15}/> Remove</button></div></div>)}</div>
      <aside className="summary-card"><span className="eyebrow">ORDER SUMMARY</span><div className="summary-line"><span>Subtotal ({cart.count} items)</span><b>{money(cart.total,cart.items[0]?.currency)}</b></div><div className="summary-line"><span>Discounts</span><span>Applied at checkout</span></div><div className="summary-total"><span>Total</span><strong>{money(cart.total,cart.items[0]?.currency)}</strong></div><Link href="/checkout" className="button button-primary button-wide">Continue to checkout <ArrowRight size={17}/></Link><Link href="/#catalog" className="back-link"><ArrowLeft size={15}/> Continue shopping</Link><p className="secure-note">Secure checkout · Digital delivery</p></aside></div>}
  </main>;
}
