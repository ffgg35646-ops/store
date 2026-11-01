"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useLanguage } from "@/components/language-provider";

export function money(value: number, currency = "USD") {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value); }
  catch { return `${value.toFixed(2)} ${currency}`; }
}

export function ProductCard({ product }: { product: any }) {
  const cart = useCart();
  const { t } = useLanguage();
  const basePrice = Number(product.basePrice ?? product.price);
  const oldPrice = Number(product.compareAtPrice || 0) > Number(product.price) ? Number(product.compareAtPrice) : basePrice;
  const sale = oldPrice > Number(product.price);
  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} className="product-image-wrap">
        {product.image ? <img src={product.image} alt={product.title} className="product-image" /> : <div className="image-placeholder"><ShoppingCart size={30}/></div>}
        {sale && <span className="sale-tag">{t("specialPrice")}</span>}
        {product.isFeatured && <span className="featured-tag"><BadgeCheck size={12}/> {t("featured")}</span>}
      </Link>
      <div className="product-card-body">
        <div className="product-kicker">{product.categoryId?.name || t("digitalGoods")}</div>
        <Link href={`/product/${product.slug}`} className="product-title">{product.title}</Link>
        <p className="product-desc">{product.shortDescription || t("instantAccess")}</p>
        <div className="product-bottom">
          <div><strong className="product-price">{money(Number(product.price), product.currency)}</strong>{sale && <del className="product-old-price">{money(oldPrice, product.currency)}</del>}{product.personalDiscountPercent>0&&<small className="personal-discount-pill">-{product.personalDiscountPercent}% member price</small>}</div>
          <button className="icon-button add-cart" aria-label={t("addToCart")} onClick={() => void cart.add({ productId: product._id, title: product.title, slug: product.slug, image: product.image, price: Number(product.price), currency: product.currency || "USD", variant: product.colors?.[0]?.name || "" })}><ShoppingCart size={17}/></button>
        </div>
      </div>
    </article>
  );
}
