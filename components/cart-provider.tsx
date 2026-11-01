"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LockKeyhole, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

type CartLine = { productId: string; title: string; slug: string; image: string; price: number; currency: string; variant?: string; quantity: number };
function lineKey(line: Pick<CartLine, "productId" | "variant">) { return `${line.productId}::${line.variant || ""}`; }
type CartContextValue = {
  items: CartLine[];
  add: (item: Omit<CartLine, "quantity">, quantity?: number) => Promise<void>;
  update: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  total: number;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authReturnTo, setAuthReturnTo] = useState("/");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { user: null })
      .then((data) => {
        if (!active) return;
        if (data.user?.role !== "customer") {
          localStorage.removeItem("nova-cart");
          setItems([]);
          return;
        }
        try {
          const saved = localStorage.getItem("nova-cart");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setItems(parsed);
          }
        } catch {
          localStorage.removeItem("nova-cart");
        }
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem("nova-cart");
          setItems([]);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("nova-cart", JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo(() => ({
    items,
    add: async (item: Omit<CartLine, "quantity">, quantity = 1) => {
      let user: any = null;
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          user = data.user;
        }
      } catch {
        user = null;
      }
      if (user?.role === "admin") {
        window.location.assign("/admin");
        return;
      }
      if (user?.role !== "customer") {
        setAuthReturnTo(window.location.pathname + window.location.search || "/");
        setAuthPromptOpen(true);
        return;
      }
      const normalized = { ...item, variant: item.variant || "" };
      const amount = Math.max(1, Math.min(10, Math.floor(Number(quantity) || 1)));
      setItems((current) => {
        const found = current.find((line) => lineKey(line) === lineKey(normalized));
        return found
          ? current.map((line) => lineKey(line) === lineKey(normalized) ? { ...line, quantity: Math.min(10, line.quantity + amount) } : line)
          : [...current, { ...normalized, quantity: amount }];
      });
    },
    update: (id: string, quantity: number) => setItems((current) => quantity < 1 ? current.filter((line) => lineKey(line) !== id) : current.map((line) => lineKey(line) === id ? { ...line, quantity: Math.min(10, quantity) } : line)),
    remove: (id: string) => setItems((current) => current.filter((line) => lineKey(line) !== id)),
    clear: () => setItems([]),
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }), [items]);

  const loginHref = `/login?next=${encodeURIComponent(authReturnTo)}`;
  const registerHref = `/register?next=${encodeURIComponent(authReturnTo)}`;
  return (
    <CartContext.Provider value={value}>
      {children}
      {authPromptOpen && (
        <div className="modal-backdrop auth-required-backdrop" role="presentation" onClick={() => setAuthPromptOpen(false)}>
          <section className="auth-required-modal" role="dialog" aria-modal="true" aria-labelledby="auth-required-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="auth-required-close" aria-label={t("closeDialog")} onClick={() => setAuthPromptOpen(false)}><X size={18}/></button>
            <span className="auth-required-icon"><LockKeyhole size={25}/></span>
            <h2 id="auth-required-title">{t("loginRequiredTitle")}</h2>
            <p>{t("loginRequiredDescription")}</p>
            <div className="auth-required-actions">
              <Link href={registerHref} onClick={() => setAuthPromptOpen(false)} className="button button-primary button-wide">{t("registerToContinue")}</Link>
              <Link href={loginHref} onClick={() => setAuthPromptOpen(false)} className="button button-outline button-wide">{t("loginToContinue")}</Link>
            </div>
          </section>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
