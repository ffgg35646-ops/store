"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, LockKeyhole, Wallet } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { money } from "@/components/product-card";
import { PageIntro } from "@/components/store-shell";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

export function CheckoutClient() {
  const cart = useCart();
  const { t } = useLanguage();
  const router = useRouter();
  const [user,setUser] = useState<any>(null);
  const [settings,setSettings] = useState<any>(null);
  const [method,setMethod] = useState("manual");
  const [coupon,setCoupon] = useState("");
  const [reference,setReference] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  useEffect(()=>{Promise.all([fetch("/api/auth/me").then(r=>r.json()),fetch("/api/admin/settings").then(r=>r.json())]).then(([u,s])=>{setUser(u.user);setSettings(s.settings);});},[]);
  const currency = cart.items[0]?.currency || settings?.currency || "USD";
  async function submit(e:React.FormEvent) {
    e.preventDefault();setBusy(true);setError("");
    try {
      if(!user) { router.push("/login?next=/checkout"); return; }
      const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:cart.items.map(i=>({productId:i.productId,variant:i.variant||"",quantity:i.quantity})),couponCode:coupon,paymentMethod:method,paymentReference:reference})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"Unable to place the order.");
      if(data.checkoutUrl){window.location.href=data.checkoutUrl;return;}
      cart.clear();router.push(`/orders/${data.orderId}`);
    } catch(err:any){setError(err.message);} finally{setBusy(false);}
  }
  if(!cart.items.length) return <main className="main-content narrow-page"><div className="empty-state"><CheckCircle2/><b>{t("emptyCart")}</b><Link href="/#catalog" className="button button-primary">{t("browseCatalogButton")}</Link></div></main>;
  return <main className="main-content narrow-page"><PageIntro eyebrow={t("secureCheckoutLabel").toUpperCase()} title={t("almostYours")} description={t("choosePayment")}/>
    <form className="checkout-layout" onSubmit={submit}><div className="checkout-main">
      <section className="checkout-panel"><div className="panel-heading"><span className="step-number">01</span><div><h2>{t("customerDetails")}</h2><p>{t("linkedAccount")}</p></div></div>
        {user ? <div className="customer-summary"><span className="avatar-circle">{user.name?.charAt(0)?.toUpperCase()}</span><div><b>{user.name}</b><small>{user.email}</small></div><span className="verified-pill"><CheckCircle2 size={13}/> {t("signedIn")}</span></div> : <Link href="/login?next=/checkout" className="button button-outline">{t("signInContinue")}</Link>}
      </section>
      <section className="checkout-panel"><div className="panel-heading"><span className="step-number">02</span><div><h2>{t("paymentMethod")}</h2><p>{t("secureMethods")}</p></div></div>
        <div className="payment-options">
          <label className={method==="stripe"?"payment-option selected":"payment-option"}><input type="radio" name="method" value="stripe" checked={method==="stripe"} onChange={()=>setMethod("stripe")}/><CreditCard/><span><b>{t("cardPayment")}</b><small>{t("stripePayment")}</small></span><i>{t("recommended")}</i></label>
          <label className={method==="wallet"?"payment-option selected":"payment-option"}><input type="radio" name="method" value="wallet" checked={method==="wallet"} onChange={()=>setMethod("wallet")}/><Wallet/><span><b>{t("storeWallet")}</b><small>Balance: {money(Number(user?.walletBalance||0),currency)}</small></span></label>
          <label className={method==="manual"?"payment-option selected":"payment-option"}><input type="radio" name="method" value="manual" checked={method==="manual"} onChange={()=>setMethod("manual")}/><LockKeyhole/><span><b>{t("manualTransfer")}</b><small>Submit your payment reference for review</small></span></label>
        </div>
        {method==="manual" && <div className="manual-payment-info"><b>{settings?.manualPaymentTitle||"Manual payment instructions"}</b><p>{settings?.manualPaymentInstructions||"Contact the store administrator for payment details."}</p><label className="field"><span>{t("transferReference")}</span><input value={reference} onChange={e=>setReference(e.target.value)} placeholder={t("transactionId")}/></label></div>}
        {method==="stripe" && process.env.NEXT_PUBLIC_STRIPE_ENABLED!=="true" && <p className="inline-hint">Card checkout becomes available after the owner adds Stripe keys in the server environment. You can use wallet or manual transfer meanwhile.</p>}
      </section>
      <section className="checkout-panel"><div className="panel-heading"><span className="step-number">03</span><div><h2>{t("discountCode")}</h2><p>{t("haveCoupon")}</p></div></div><div className="coupon-input"><input value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder={t("enterCoupon")}/><span>{t("validateCoupon")}</span></div></section>
      {error&&<div className="form-error">{error}</div>}
    </div><aside className="summary-card checkout-summary"><span className="eyebrow">{t("yourOrder")}</span>{cart.items.map(i=><div className="checkout-item" key={`${i.productId}::${i.variant||""}`}><div><b>{i.title}</b>{i.variant&&<small className="cart-variant">{t("color")}: {i.variant}</small>}<small>{t("quantity")} {i.quantity}</small></div><b>{money(i.price*i.quantity,i.currency)}</b></div>)}<div className="summary-line"><span>{t("subtotal")}</span><b>{money(cart.total,currency)}</b></div><div className="summary-line"><span>{t("discounts")}</span><span>{t("appliedAtCheckout")}</span></div><div className="summary-total"><span>{t("totalBeforeDiscount")}</span><strong>{money(cart.total,currency)}</strong></div><button disabled={busy||!user||(method==="stripe"&&process.env.NEXT_PUBLIC_STRIPE_ENABLED!=="true")} className="button button-primary button-wide">{busy?t("processing"):t("placeOrder")} <ArrowRight size={17}/></button><p className="secure-note"><LockKeyhole size={13}/> {t("paymentProtected")}</p><Link href="/cart" className="back-link"><ArrowLeft size={15}/> {t("backToCart")}</Link></aside></form>
  </main>;
}
