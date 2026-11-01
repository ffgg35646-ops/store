"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, Clock3, Minus, Plus, ShieldCheck, ShoppingCart, Sparkles, Zap } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { money } from "@/components/product-card";
import { PageIntro } from "@/components/store-shell";
import { useLanguage } from "@/components/language-provider";
import { localizeCustomerCopy } from "@/components/customer-localization";

export function ProductDetailClient({slug}:{slug:string}) {
  const { t, language } = useLanguage();
  const [product,setProduct]=useState<any>(null);
  const [quantity,setQuantity]=useState(1);
  const [selectedImage,setSelectedImage]=useState("");
  const [selectedColor,setSelectedColor]=useState("");
  const [loading,setLoading]=useState(true);
  const cart=useCart();
  useEffect(()=>{fetch(`/api/products?slug=${encodeURIComponent(slug)}&lang=${language}`).then(r=>r.json()).then(d=>{const item=d.products?.[0]||null;setProduct(item);setSelectedColor(item?.colors?.[0]?.name||"");}).finally(()=>setLoading(false));},[slug,language]);
  if(loading)return <main className="main-content narrow-page"><div className="loading-block"/></main>;
  if(!product)return <main className="main-content narrow-page"><div className="empty-state"><ShoppingCart/><b>{t("productNotFound")}</b><Link href="/#catalog" className="button button-primary">{t("backToCatalog")}</Link></div></main>;
  const basePrice=Number(product.basePrice??product.price);
  const old=Number(product.compareAtPrice||0)>Number(product.price)?Number(product.compareAtPrice):basePrice;
  return <main className="main-content narrow-page"><Link href="/#catalog" className="back-link"><ArrowLeft size={15}/> {t("backToCatalog")}</Link><div className="product-detail-layout"><div className="product-detail-visual">{(selectedImage||product.image)?<img src={selectedImage||product.image} alt={product.title}/>:<div className="image-placeholder"><Sparkles size={40}/></div>}{product.isFeatured&&<span className="featured-tag"><Sparkles size={13}/> {t("featuredPick")}</span>}{Array.isArray(product.gallery)&&product.gallery.length>0&&<div className="product-gallery-thumbs">{[product.image,...product.gallery].filter(Boolean).map((image:string,index:number)=><button type="button" key={image+index} className={(selectedImage||product.image)===image?"active":""} onClick={()=>setSelectedImage(image)}><img src={image} alt={product.title+" view "+(index+1)}/></button>)}</div>}</div><div className="product-detail-info"><span className="eyebrow">{product.categoryId?.name||t("digitalProduct")}</span><h1>{product.title}</h1><p className="product-long-desc">{product.shortDescription}</p><div className="detail-price"><strong>{money(Number(product.price),product.currency)}</strong>{old>product.price&&<><del>{money(old,product.currency)}</del><span className="discount-badge">{Math.round((old-product.price)/old*100)}% {localizeCustomerCopy("OFF",language)}</span></>}{product.personalDiscountPercent>0&&<span className="personal-discount-pill">{t("memberDiscount")}: {product.personalDiscountPercent}%</span>}</div>{Array.isArray(product.colors)&&product.colors.length>0&&<div className="product-color-options"><b>{t("chooseColor")}</b><div>{product.colors.map((color:any)=><button type="button" key={color.name} title={color.name} aria-label={color.name} className={selectedColor===color.name?"selected":""} onClick={()=>setSelectedColor(color.name)}><span style={{backgroundColor:color.hex}}/><small>{color.name}</small></button>)}</div></div>}<div className="detail-delivery"><span><Zap size={16}/> {product.deliveryMode==="automatic"?t("automaticDelivery"):t("manualDelivery")}</span><span><ShieldCheck size={16}/> {t("secureCheckoutLabel")}</span><span><CheckCircle2 size={16}/> {t("supportIncluded")}</span></div>{product.description&&<div className="product-description"><h3>{t("productDetails")}</h3><p>{product.description}</p></div>}{product.deliveryInstructions&&<div className="product-description"><h3>{t("howItWorks")}</h3><p>{product.deliveryInstructions}</p></div>}<div className="buy-row"><div className="quantity-control"><button onClick={()=>setQuantity(Math.max(1,quantity-1))}><Minus size={14}/></button><b>{quantity}</b><button onClick={()=>setQuantity(Math.min(10,quantity+1))}><Plus size={14}/></button></div><button className="button button-primary" onClick={()=>void cart.add({productId:product._id,title:product.title,slug:product.slug,image:product.image,price:Number(product.price),currency:product.currency||"USD",variant:selectedColor},quantity)}><ShoppingCart size={17}/> {t("addToCart")}</button></div><p className="detail-assurance"><Check size={14}/> {t("protectedPurchase")}</p></div></div></main>;
}
