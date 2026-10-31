"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type CartLine = { productId: string; title: string; slug: string; image: string; price: number; currency: string; quantity: number };
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
      const found = current.find((line) => line.productId === item.productId);
      return found ? current.map((line) => line.productId === item.productId ? { ...line, quantity: Math.min(10, line.quantity + 1) } : line) : [...current, { ...item, quantity: 1 }];
    }),
    update: (id: string, quantity: number) => setItems((current) => quantity < 1 ? current.filter((line) => line.productId !== id) : current.map((line) => line.productId === id ? { ...line, quantity: Math.min(10, quantity) } : line)),
    remove: (id: string) => setItems((current) => current.filter((line) => line.productId !== id)),
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
