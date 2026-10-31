"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Boxes, Flame, Headphones, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { ProductCard } from "@/components/product-card";

export function Storefront({ initialQuery = "", initialCategory = "" }: { initialQuery?: string; initialCategory?: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/products").then(r=>r.json()),
      fetch("/api/categories").then(r=>r.json()),
      fetch("/api/admin/settings").then(r=>r.json())
    ]).then(([p,c,s]) => { if (active) { setProducts(p.products || []); setCategories(c.categories || []); setAnnouncement(s.settings?.announcement || ""); } })
      .catch(()=>{}).finally(()=>{ if(active) setLoading(false); });
    return ()=>{active=false;};
  }, []);
  const visible = products.filter(p => (!query || (p.title + " " + p.shortDescription).toLowerCase().includes(query.toLowerCase())) && (!category || String(p.categoryId?._id || p.categoryId) === category));
  const featured = visible.filter(p=>p.isFeatured);
  const top = featured.length ? featured : visible.slice(0,4);
  const categoryCounts = categories.map(c => ({...c, count: products.filter(p=>String(p.categoryId?._id || p.categoryId)===String(c._id)).length}));
  return (
    <>
      {announcement && <div className="announcement"><Sparkles size={14}/>{announcement}</div>}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge"><span className="live-dot"/> THE DIGITAL GOODS DESTINATION</div>
          <h1>Everything digital.<br/><em>One better place.</em></h1>
          <p>Discover premium subscriptions, entertainment, software and digital essentials — curated for the way you live online.</p>
          <div className="hero-actions"><a href="#catalog" className="button button-primary">Explore the catalog <ArrowUpRight size={17}/></a><Link href="/chat" className="button button-ghost">Talk to our team</Link></div>
          <div className="hero-proof"><span><ShieldCheck size={15}/> Secure checkout</span><span><Zap size={15}/> Fast delivery</span><span><Headphones size={15}/> Human support</span></div>
        </div>
        <div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="hero-panel"><div className="panel-top"><span>YOUR DIGITAL WORLD</span><Sparkles size={16}/></div><div className="hero-tiles"><div className="hero-tile tile-large"><span className="tile-icon">✦</span><strong>Premium</strong><small>Subscriptions</small></div><div className="hero-tile tile-stream"><span>▶</span><strong>Stream</strong><small>Without limits</small></div><div className="hero-tile tile-game"><span>⌘</span><strong>Play</strong><small>More possibilities</small></div><div className="hero-tile tile-ai"><span>✧</span><strong>Create</strong><small>Work smarter</small></div></div><div className="panel-bottom"><span>Curated digital essentials</span><span className="pulse-bars"><i/><i/><i/><i/><i/></span></div></div></div>
        <div className="hero-grid-pattern"/>
      </section>
      <section className="trust-strip"><div><ShieldCheck/><span><b>Protected payments</b><small>Safe checkout options</small></span></div><div><Zap/><span><b>Quick delivery</b><small>Digital-first fulfillment</small></span></div><div><Headphones/><span><b>Real support</b><small>We're here to help</small></span></div><div><Sparkles/><span><b>Member rewards</b><small>Offers made for you</small></span></div></section>
      <main className="main-content">
        <section className="section-block" id="categories"><div className="section-heading"><div><span className="eyebrow">BROWSE YOUR WAY</span><h2>Explore categories</h2></div><span className="heading-note">Find exactly what you need</span></div>
          {categoryCounts.length ? <div className="category-grid">{categoryCounts.map((c:any)=><Link href={`/?category=${c._id}#catalog`} key={c._id} className="category-card">{c.image ? <img src={c.image} alt=""/> : <div className="category-placeholder"><Boxes size={24}/></div>}<div><b>{c.name}</b><small>{c.count} products</small></div><ArrowUpRight size={17}/></Link>)}</div> : <div className="empty-state compact"><Boxes/><b>Categories are on the way</b><span>Our team is preparing the catalog.</span></div>}
        </section>
        <section className="section-block" id="deals"><div className="section-heading"><div><span className="eyebrow">HAND-PICKED FOR YOU</span><h2><Flame className="title-icon"/> Featured picks</h2></div><span className="heading-note">Popular choices, all in one place</span></div>
          {loading ? <div className="loading-grid">{[1,2,3,4].map(i=><div className="skeleton-card" key={i}/>)}</div> : top.length ? <div className="product-grid">{top.slice(0,4).map(p=><ProductCard key={p._id} product={p}/>)}</div> : <div className="empty-state"><Sparkles/><b>New discoveries are coming</b><span>Check back soon for our first featured products.</span></div>}
        </section>
        <section className="catalog-section" id="catalog"><div className="section-heading"><div><span className="eyebrow">THE FULL COLLECTION</span><h2>Browse the catalog</h2><p>Explore everything available in the store.</p></div><div className="catalog-search"><input placeholder="Filter products..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
          {loading ? <div className="loading-grid">{[1,2,3,4].map(i=><div className="skeleton-card" key={i}/>)}</div> : visible.length ? <div className="product-grid">{visible.map(p=><ProductCard key={p._id} product={p}/>)}</div> : <div className="empty-state"><Boxes/><b>No products found</b><span>Try another search or browse a category.</span></div>}
        </section>
        <section className="support-banner"><div className="support-symbol"><Headphones size={27}/></div><div><span className="eyebrow">NEED A HAND?</span><h2>Not sure what fits? Let's talk.</h2><p>Our support team can help with products, orders and delivery.</p></div><Link href="/chat" className="button button-primary">Chat with support <ArrowRight size={16}/></Link></section>
      </main>
    </>
  );
}
