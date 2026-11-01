"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Boxes, Headphones, ShieldCheck, Sparkles, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useLanguage } from "@/components/language-provider";
import { localizeCustomerCopy } from "@/components/customer-localization";

export function Storefront({ initialQuery = "", initialCategory = "" }: { initialQuery?: string; initialCategory?: string }) {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [hasLoaded, setHasLoaded] = useState(false);
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
    try { const cachedProducts = JSON.parse(sessionStorage.getItem(`nova-products-cache-${language}`) || "[]"); const cachedCategories = JSON.parse(sessionStorage.getItem(`nova-categories-cache-${language}`) || "[]"); if (cachedProducts.length) { setProducts(cachedProducts); setHasLoaded(true); } if (cachedCategories.length) setCategories(cachedCategories); } catch {}
    Promise.all([
      fetch(`/api/products?lang=${language}`).then(r=>r.json()),
      fetch(`/api/categories?lang=${language}`).then(r=>r.json()),
      fetch("/api/admin/settings").then(r=>r.json())
    ]).then(([p,c,s]) => { if (active) { setProducts(p.products || []); setCategories(c.categories || []); setHasLoaded(true); try { sessionStorage.setItem(`nova-products-cache-${language}`, JSON.stringify(p.products || [])); sessionStorage.setItem(`nova-categories-cache-${language}`, JSON.stringify(c.categories || [])); } catch {} setAnnouncement(s.settings?.announcement || ""); } })
      .catch(()=>{});
    return ()=>{active=false;};
  }, [language]);
  const visible = products.filter(p => (!query || (p.title + " " + p.shortDescription).toLowerCase().includes(query.toLowerCase())) && (!category || String(p.categoryId?._id || p.categoryId) === category));
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
          <div className="hero-proof"><span><ShieldCheck size={15}/> {localizeCustomerCopy("Secure checkout",language)}</span><span><Zap size={15}/> {localizeCustomerCopy("Fast delivery",language)}</span><span><Headphones size={15}/> {localizeCustomerCopy("Human support",language)}</span></div>
        </div>
        <div className="hero-art"><div className="hero-image-carousel"><img key={heroImageIndex} className="hero-carousel-image" src={heroImages[heroImageIndex]} alt="Digital products and technology"/><div className="hero-image-shade"/><div className="hero-image-caption"><span className="hero-image-count">{String(heroImageIndex+1).padStart(2,"0")} / 10</span><strong>{t("curatedEssentials")}</strong><small>{t("marketplace")}</small></div><div className="hero-image-controls"><button type="button" aria-label="Previous image" onClick={()=>setHeroImageIndex(index=>(index+heroImages.length-1)%heroImages.length)}>‹</button><button type="button" aria-label="Next image" onClick={()=>setHeroImageIndex(index=>(index+1)%heroImages.length)}>›</button></div><div className="hero-image-dots">{heroImages.map((_,index)=><button type="button" key={index} aria-label={"Show image "+(index+1)} className={index===heroImageIndex?"active":""} onClick={()=>setHeroImageIndex(index)}/>)}</div></div></div>
        <div className="hero-grid-pattern"/>
      </section>
      <section className="trust-strip"><div><ShieldCheck/><span><b>{t("protectedPayments")}</b><small>{t("safeCheckout")}</small></span></div><div><Zap/><span><b>{t("quickDelivery")}</b><small>{t("digitalFulfillment")}</small></span></div><div><Headphones/><span><b>{t("realSupport")}</b><small>{t("hereToHelp")}</small></span></div><div><Sparkles/><span><b>{t("memberRewards")}</b><small>{t("offersMade")}</small></span></div></section>
      <main className="main-content">
        <section className="section-block" id="categories"><div className="section-heading"><div><span className="eyebrow">{t("browseYourWay")}</span><h2>{t("exploreCategories")}</h2></div><span className="heading-note">{t("findExactly")}</span></div>
          {categoryCounts.length ? <div className="category-grid">{categoryCounts.map((c:any)=><Link href={`/?category=${c._id}#catalog`} key={c._id} className="category-card">{c.image ? <img src={c.image} alt=""/> : <div className="category-placeholder"><Boxes size={24}/></div>}<div><b>{c.name}</b><small>{c.count} {t("products")}</small></div><ArrowUpRight size={17}/></Link>)}</div> : <div className="empty-state compact"><Boxes/><b>{t("categoriesComing")}</b><span>{t("preparingCatalog")}</span></div>}
        </section>
        {query || category ? (
          <section className="catalog-section" id="catalog">
            <div className="section-heading">
              <div><span className="eyebrow">{t("fullCollection")}</span><h2>{t("browseCatalog")}</h2><p>{t("exploreEverything")}</p></div>
              <div className="catalog-search"><input placeholder={t("filterCatalog")} value={query} onChange={e=>setQuery(e.target.value)}/></div>
            </div>
            {visible.length ? <div className="product-grid">{visible.map(p=><ProductCard key={p._id} product={p}/>)}</div> : hasLoaded ? <div className="empty-state"><Boxes/><b>{t("noProducts")}</b><span>{t("tryAnotherSearch")}</span></div> : null}
          </section>
        ) : (
          <section className="category-stream" id="catalog">
            <div className="category-stream-top">
              <div><span className="eyebrow">{t("fullCollection")}</span><h2>{t("browseCatalog")}</h2><p>{t("exploreEverything")}</p></div>
              <div className="catalog-search"><input placeholder={t("filterCatalog")} value={query} onChange={e=>setQuery(e.target.value)}/></div>
            </div>
            {categoryCounts.map((c:any) => {
              const items = products.filter(p=>String(p.categoryId?._id || p.categoryId)===String(c._id));
              return items.length ? <CategoryProductRail key={c._id} category={c} products={items} /> : null;
            })}
            {hasLoaded && !categoryCounts.some((c:any)=>products.some(p=>String(p.categoryId?._id || p.categoryId)===String(c._id))) ? <div className="empty-state"><Boxes/><b>{t("noProducts")}</b></div> : null}
          </section>
        )}
        <section className="support-banner"><div className="support-symbol"><Headphones size={27}/></div><div><span className="eyebrow">{t("needHand")}</span><h2>{t("notSureFits")}</h2><p>{t("supportDescription")}</p></div><Link href="/chat" className="button button-primary">{t("chatSupport")} <ArrowRight size={16}/></Link></section>
      </main>
    </>
  );
}


function CategoryProductRail({ category, products }: { category: any; products: any[] }) {
  const { language } = useLanguage();
  const trackRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(products.length / 4));

  useEffect(() => {
    if (expanded || paused || pageCount < 2) return;
    const timer = window.setInterval(() => setPage(current => (current + 1) % pageCount), 5000);
    return () => window.clearInterval(timer);
  }, [expanded, paused, pageCount]);

  useEffect(() => {
    if (expanded || !trackRef.current) return;
    const track = trackRef.current;
    const firstPage = track.querySelector<HTMLElement>(".category-rail-page");
    if (!firstPage) return;
    track.scrollTo({ left: firstPage.getBoundingClientRect().width * page, behavior: "smooth" });
  }, [page, expanded]);

  const goTo = (next: number) => setPage((next + pageCount) % pageCount);
  return (
    <section className="category-stream-section">
      <div className="category-stream-heading">
        <div className="category-stream-title">
          <span className="category-stream-mark"><Boxes size={19}/></span>
          <div><h3>{category.name}</h3><small>{products.length} {language === "ar" ? "منتج" : "products"}</small></div>
        </div>
        <div className="category-stream-actions">
          {pageCount > 1 && <div className="category-rail-dots" aria-label="Product pages">{Array.from({length:pageCount},(_,i)=><button type="button" key={i} className={i===page?"active":""} onClick={()=>goTo(i)} aria-label={`Page ${i+1}`}/>)}</div>}
          <button type="button" className="category-more-button" onClick={()=>setExpanded(value=>!value)}>{expanded ? (language === "ar" ? "عرض أقل" : "Show less") : (language === "ar" ? "عرض المزيد" : "View more")} <ArrowUpRight size={14}/></button>
        </div>
      </div>
      {expanded ? <div className="category-expanded-grid">{products.map(product=><ProductCard key={product._id} product={product}/>)}</div> :
        <div className="category-rail-viewport" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
          <div className="category-rail-track" ref={trackRef}>
            {Array.from({length:pageCount},(_,index)=><div className="category-rail-page" key={index}>{products.slice(index*4,(index+1)*4).map(product=><ProductCard key={product._id} product={product}/>)}</div>)}
          </div>
          {pageCount>1 && <><button type="button" className="category-rail-arrow prev" onClick={()=>goTo(page-1)} aria-label="Previous products"><ChevronRight size={17}/></button><button type="button" className="category-rail-arrow next" onClick={()=>goTo(page+1)} aria-label="Next products"><ChevronLeft size={17}/></button></>}
        </div>}
    </section>
  );
}
