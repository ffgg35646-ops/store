"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type CartLine = { productId: string; title: string; slug: string; image: string; price: number; currency: string; variant?: string; quantity: number };
function lineKey(line: Pick<CartLine, "productId" | "variant">) { return `${line.productId}::${line.variant || ""}`; }
type CartContextValue = { items: CartLine[]; add: (item: Omit<CartLine, "quantity">) => void; update: (id: string, quantity: number) => void; remove: (id: string) => void; clear: () => void; count: number; total: number };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem("nova-cart"); if (saved) setItems(JSON.parse(saved)); } catch { localStorage.removeItem("nova-cart"); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("nova-cart", JSON.stringify(items)); }, [items, ready]);
  const value = useMemo(() => ({
    items,
    add: (item: Omit<CartLine, "quantity">) => setItems((current) => {
      const normalized = { ...item, variant: item.variant || "" };
      const found = current.find((line) => lineKey(line) === lineKey(normalized));
      return found ? current.map((line) => lineKey(line) === lineKey(normalized) ? { ...line, quantity: Math.min(10, line.quantity + 1) } : line) : [...current, { ...normalized, quantity: 1 }];
    }),
    update: (id: string, quantity: number) => setItems((current) => quantity < 1 ? current.filter((line) => lineKey(line) !== id) : current.map((line) => lineKey(line) === id ? { ...line, quantity: Math.min(10, quantity) } : line)),
    remove: (id: string) => setItems((current) => current.filter((line) => lineKey(line) !== id)),
    clear: () => setItems([]),
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
