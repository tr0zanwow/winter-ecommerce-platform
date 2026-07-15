'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartStore';

interface StockMap {
  [sku: string]: number;
}

export default function CartPage() {
  const { cartItems, updateQuantity, clearCart, mounted } = useCart();
  const [stockLevels, setStockLevels] = useState<StockMap>({});
  const [checkingStock, setCheckingStock] = useState<boolean>(true);
  const [stockWarning, setStockWarning] = useState<boolean>(false);

  // Calculate total quantity of items in the cart
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch current live stock counts from GraphQL BFF
  const verifyStockLevels = async () => {
    setCheckingStock(true);
    try {
      const res = await fetch('/winter/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetCatalogStock {
              products {
                sku
                stockCount
              }
            }
          `
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.products) {
          const levels: StockMap = {};
          json.data.products.forEach((p: any) => {
            levels[p.sku] = p.stockCount;
          });
          setStockLevels(levels);

          // Clamping check
          let clamped = false;
          cartItems.forEach((item) => {
            const liveStock = levels[item.sku] !== undefined ? levels[item.sku] : item.stockCount;
            if (item.quantity > liveStock) {
              // Clamp quantity to maximum available
              const diff = liveStock - item.quantity;
              updateQuantity(item.sku, diff);
              clamped = true;
            }
          });

          if (clamped) {
            setStockWarning(true);
          }
        }
      }
    } catch (err) {
      console.error("Failed to query stock counts:", err);
    } finally {
      setCheckingStock(false);
    }
  };

  useEffect(() => {
    if (mounted && cartItems.length > 0) {
      verifyStockLevels();
    } else {
      setCheckingStock(false);
    }
  }, [mounted, cartItems.length]);

  // Financial calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 150.00 ? 0.00 : 15.00;
  const tax = subtotal * 0.10;
  const grandTotal = subtotal + shippingFee + tax;

  const renderHeader = () => (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/10 group-hover:scale-105 transition duration-150">
            W
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-800">
            Winter E-commerce <span className="text-indigo-600 font-normal">Platform</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/orders" className="text-sm font-semibold text-slate-650 hover:text-indigo-600 transition duration-155 flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl hover:bg-slate-100">
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Orders</span>
          </Link>

          <Link href="/cart" className="text-sm font-semibold text-slate-655 hover:text-indigo-650 transition duration-155 flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl hover:bg-slate-100 relative">
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Cart</span>
            {totalCartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-extrabold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {totalCartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
        {renderHeader()}
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-650 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans pb-24">
      <div>
        {renderHeader()}

        <div className="max-w-7xl w-full mx-auto px-6 mt-12 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Your Shopping Cart</h1>
            <p className="text-sm text-slate-500 mt-1">Manage items, review pricing tiers, and complete checkout funnel.</p>
          </div>

          {stockWarning && (
            <div className="bg-amber-50 border border-amber-250 rounded-2xl p-4 text-xs font-semibold text-amber-700 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-amber-550" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Stock levels changed! Some quantities in your cart have been clamped to matching warehouse limits.</span>
              </div>
              <button onClick={() => setStockWarning(false)} className="text-[10px] font-bold text-amber-500 hover:text-amber-700">Dismiss</button>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-6 shadow-sm">
              <svg className="w-16 h-16 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Your Cart is Empty</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Looks like you haven't added any products to your cart yet. Explore our storefront catalog and find something warm.
                </p>
              </div>
              <Link href="/" className="inline-flex py-3 px-6 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl transition duration-150 shadow-sm">
                Shop Core Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Cart Items Ledger */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-mono font-bold">ITEM SPECIFICATION</span>
                    <button onClick={clearCart} className="text-xs text-rose-600 hover:text-rose-700 font-bold transition duration-150">Clear Cart</button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {cartItems.map((item) => {
                      const maxStock = stockLevels[item.sku] !== undefined ? stockLevels[item.sku] : item.stockCount;
                      const hasStockLimit = maxStock <= item.quantity;
                      
                      return (
                        <div key={item.sku} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                          <div className="flex gap-4 items-center">
                            <div className="h-16 w-16 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shrink-0">
                              <img src={item.imageUrl || "https://loremflickr.com/100/100/winter"} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h3>
                              <div className="text-[10px] font-mono text-slate-400 mt-1">SKU: {item.sku}</div>
                              {hasStockLimit && (
                                <span className="inline-block mt-2 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded">
                                  Clamped to Max Stock ({maxStock})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
                            {/* Quantity Toggles */}
                            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-sm">
                              <button 
                                onClick={() => updateQuantity(item.sku, -1)}
                                className="px-3 py-1.5 hover:bg-slate-100 text-slate-500 font-bold text-sm transition"
                              >
                                -
                              </button>
                              <span className="px-4 py-1.5 text-xs font-mono font-bold text-slate-800 bg-white border-x border-slate-200">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => updateQuantity(item.sku, 1)}
                                disabled={item.quantity >= maxStock}
                                className="px-3 py-1.5 hover:bg-slate-100 text-slate-500 font-bold text-sm transition disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>

                            {/* Item total price */}
                            <div className="text-right">
                              <span className="text-sm font-extrabold text-slate-900 font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">${item.price.toFixed(2)} ea</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Checkout Summary Dashboard */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Order Summary</h3>
                
                <div className="space-y-3.5 border-t border-b border-slate-100 py-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cart Subtotal</span>
                    <span className="font-mono text-slate-800 font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Shipping Delivery Tiers</span>
                    <span className="font-mono text-slate-800 font-bold">
                      {shippingFee === 0 ? <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded">FREE</span> : `$${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  {shippingFee > 0 && (
                    <p className="text-[10px] text-slate-450 italic">Add ${(150 - subtotal).toFixed(2)} more for Free Shipping!</p>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sales Tax (10%)</span>
                    <span className="font-mono text-slate-800 font-bold">${tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-800">Grand Total</span>
                  <span className="text-2xl font-black text-indigo-650 font-mono">${grandTotal.toFixed(2)}</span>
                </div>

                <div className="space-y-3">
                  <Link 
                    href="/checkout"
                    className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition duration-150 flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Checkout</span>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>

                  <Link 
                    href="/"
                    className="w-full py-3.5 px-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 text-center font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1 text-xs"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
