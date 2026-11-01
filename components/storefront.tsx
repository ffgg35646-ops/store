"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Boxes, Flame, Headphones, ShieldCheck, Sparkles, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useLanguage } from "@/components/language-provider";

export function Storefront({ initialQuery = "", initialCategory = "" }: { initialQuery?: string; initialCategory?: string }) {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<any[]>(() => { try { return JSON.parse(sessionStorage.getItem("nova-products-cache") || "[]"); } catch { return []; } });
  const [categories, setCategories] = useState<any[]>(() => { try { return JSON.parse(sessionStorage.getItem("nova-categories-cache") || "[]"); } catch { return []; } });
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [slideIndex,setSlideIndex] = useState(0);
  const [heroImageIndex,setHeroImageIndex] = useState(0);
  const heroImages = [
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1100&q=85",
    "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1100&q=85",
    "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=1100&q=85",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1100&q=85",
    "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=1100&q=85",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1100&q=85",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1100&q=85",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1100&q=85",
    "https://images.unsplash.com/photo-1523729752-3b8b9b2c4e3f?auto=format&fit=crop&w=1100&q=85",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1100&q=85"
  ];
  const slides = [
    {badge:t("digitalDestination"),first:t("exploreDigital"),second:t("oneBetter"),description:t("digitalDescription")},
    {badge:t("exclusiveOffers"),first:t("betterAccess"),second:t("smarterPrices"),description:t("offersDescription")},
    {badge:t("fastDelivery"),first:t("nextFavourite"),second:t("clickAway"),description:t("deliveryDescription")}
  ];
  useEffect(()=>{const timer=setInterval(()=>setSlideIndex(index=>(index+1)%slides.length),6500);return()=>clearInterval(timer);},[]);
  useEffect(()=>{const timer=setInterval(()=>setHeroImageIndex(index=>(index+1)%heroImages.length),4500);return()=>clearInterval(timer);},[]);
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/products?lang=${language}`).then(r=>r.json()),
      fetch(`/api/categories?lang=${language}`).then(r=>r.json()),
      fetch("/api/admin/settings").then(r=>r.json())
    ]).then(([p,c,s]) => { if (active) { setProducts(p.products || []); setCategories(c.categories || []); try { sessionStorage.setItem("nova-products-cache", JSON.stringify(p.products || [])); sessionStorage.setItem("nova-categories-cache", JSON.stringify(c.categories || [])); } catch {} setAnnouncement(s.settings?.announcement || ""); } })
      .catch(()=>{}).finally(()=>{ if(active) setLoading(false); });
    return ()=>{active=false;};
  }, [language]);
  const visible = products.filter(p => (!query || (p.title + " " + p.shortDescription).toLowerCase().includes(query.toLowerCase())) && (!category || String(p.categoryId?._id || p.categoryId) === category));
  const featured = visible.filter(p=>p.isFeatured);
  const top = featured.length ? featured : visible.slice(0,4);
  const categoryCounts = categories.map(c => ({...c, count: products.filter(p=>String(p.categoryId?._id || p.categoryId)===String(c._id)).length}));
  return (
    <>
      {announcement && <div className="announcement"><Sparkles size={14}/>{announcement}</div>}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge"><span className="live-dot"/> {slides[slideIndex].badge}</div>
          <h1 key={slideIndex}>{slides[slideIndex].first}<br/><em>{slides[slideIndex].second}</em></h1>
          <p>{slides[slideIndex].description}</p>
          <div className="hero-slider-controls" aria-label="Featured slides"><button type="button" onClick={()=>setSlideIndex(index=>(index+slides.length-1)%slides.length)} aria-label="Previous slide"><ChevronLeft size={16}/></button>{slides.map((slide,index)=><button type="button" key={slide.badge} className={index===slideIndex?"active":""} onClick={()=>setSlideIndex(index)} aria-label={`Go to slide ${index+1}`}/>) }<button type="button" onClick={()=>setSlideIndex(index=>(index+1)%slides.length)} aria-label="Next slide"><ChevronRight size={16}/></button></div>
          <div className="hero-actions"><a href="#catalog" className="button button-primary">{t("exploreCatalog")} <ArrowUpRight size={17}/></a><Link href="/chat" className="button button-ghost">{t("chatSupport")}</Link></div>
          <div className="hero-proof"><span><ShieldCheck size={15}/> Secure checkout</span><span><Zap size={15}/> Fast delivery</span><span><Headphones size={15}/> Human support</span></div>
        </div>
        <div className="hero-art"><div className="hero-image-carousel"><img key={heroImageIndex} className="hero-carousel-image" src={heroImages[heroImageIndex]} alt="Digital products and technology"/><div className="hero-image-shade"/><div className="hero-image-caption"><span className="hero-image-count">{String(heroImageIndex+1).padStart(2,"0")} / 10</span><strong>{t("curatedEssentials")}</strong><small>{t("marketplace")}</small></div><div className="hero-image-controls"><button type="button" aria-label="Previous image" onClick={()=>setHeroImageIndex(index=>(index+heroImages.length-1)%heroImages.length)}>‹</button><button type="button" aria-label="Next image" onClick={()=>setHeroImageIndex(index=>(index+1)%heroImages.length)}>›</button></div><div className="hero-image-dots">{heroImages.map((_,index)=><button type="button" key={index} aria-label={"Show image "+(index+1)} className={index===heroImageIndex?"active":""} onClick={()=>setHeroImageIndex(index)}/>)}</div></div></div>
        <div className="hero-grid-pattern"/>
      </section>
      <section className="trust-strip"><div><ShieldCheck/><span><b>{t("protectedPayments")}</b><small>{t("safeCheckout")}</small></span></div><div><Zap/><span><b>{t("quickDelivery")}</b><small>{t("digitalFulfillment")}</small></span></div><div><Headphones/><span><b>{t("realSupport")}</b><small>{t("hereToHelp")}</small></span></div><div><Sparkles/><span><b>{t("memberRewards")}</b><small>{t("offersMade")}</small></span></div></section>
      <main className="main-content">
        <section className="section-block" id="categories"><div className="section-heading"><div><span className="eyebrow">{t("browseYourWay")}</span><h2>{t("exploreCategories")}</h2></div><span className="heading-note">{t("findExactly")}</span></div>
          {categoryCounts.length ? <div className="category-grid">{categoryCounts.map((c:any)=><Link href={`/?category=${c._id}#catalog`} key={c._id} className="category-card">{c.image ? <img src={c.image} alt=""/> : <div className="category-placeholder"><Boxes size={24}/></div>}<div><b>{c.name}</b><small>{c.count} {t("products")}</small></div><ArrowUpRight size={17}/></Link>)}</div> : <div className="empty-state compact"><Boxes/><b>{t("categoriesComing")}</b><span>{t("preparingCatalog")}</span></div>}
        </section>
        <section className="section-block" id="deals"><div className="section-heading"><div><span className="eyebrow">{t("handPicked")}</span><h2><Flame className="title-icon"/> {t("featuredPicks")}</h2></div><span className="heading-note">{t("popularChoices")}</span></div>
          {loading ? <div className="loading-grid">{[1,2,3,4].map(i=><div className="skeleton-card" key={i}/>)}</div> : top.length ? <div className="product-grid">{top.slice(0,4).map(p=><ProductCard key={p._id} product={p}/>)}</div> : <div className="empty-state"><Sparkles/><b>{t("newDiscoveries")}</b><span>{t("firstFeatured")}</span></div>}
        </section>
        <section className="catalog-section" id="catalog"><div className="section-heading"><div><span className="eyebrow">{t("fullCollection")}</span><h2>{t("browseCatalog")}</h2><p>{t("exploreEverything")}</p></div><div className="catalog-search"><input placeholder={t("filterCatalog")} value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
          {loading ? <div className="loading-grid">{[1,2,3,4].map(i=><div className="skeleton-card" key={i}/>)}</div> : visible.length ? <div className="product-grid">{visible.map(p=><ProductCard key={p._id} product={p}/>)}</div> : <div className="empty-state"><Boxes/><b>{t("noProducts")}</b><span>{t("tryAnotherSearch")}</span></div>}
        </section>
        <section className="support-banner"><div className="support-symbol"><Headphones size={27}/></div><div><span className="eyebrow">{t("needHand")}</span><h2>{t("notSureFits")}</h2><p>{t("supportDescription")}</p></div><Link href="/chat" className="button button-primary">{t("chatSupport")} <ArrowRight size={16}/></Link></section>
      </main>
    </>
  );
}
