'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stockCount: number;
}

interface CartState {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (sku: string, delta: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartItems: [],
      addToCart: (item) =>
        set((state) => {
          const existing = state.cartItems.find((i) => i.sku === item.sku);
          if (existing) {
            const newQty = Math.min(existing.quantity + item.quantity, existing.stockCount);
            return {
              cartItems: state.cartItems.map((i) =>
                i.sku === item.sku ? { ...i, quantity: newQty } : i
              ),
            };
          }
          return { cartItems: [...state.cartItems, { ...item, quantity: Math.min(item.quantity, item.stockCount) }] };
        }),
      updateQuantity: (sku, delta) =>
        set((state) => ({
          cartItems: state.cartItems
            .map((i) => {
              if (i.sku === sku) {
                const newQty = Math.min(i.quantity + delta, i.stockCount);
                return { ...i, quantity: newQty };
              }
              return i;
            })
            .filter((i) => i.quantity >= 1),
        })),
      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: 'winter_cart_store',
    }
  )
);

// Custom hook to cleanly prevent Next.js SSR hydration mismatches
export function useCart() {
  const store = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    cartItems: mounted ? store.cartItems : [],
    addToCart: store.addToCart,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    mounted,
  };
}
