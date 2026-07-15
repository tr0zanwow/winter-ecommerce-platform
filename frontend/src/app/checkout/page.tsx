'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../context/CartStore';

interface CheckoutItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  stockCount: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cartItems, mounted } = useCart();

  // Read query parameters for single-item "Buy Now" flow fallback
  const buyNowSku = searchParams.get('sku');
  const buyNowName = searchParams.get('name') || 'Product Details';
  const buyNowPriceParam = searchParams.get('price');
  const buyNowPrice = buyNowPriceParam ? parseFloat(buyNowPriceParam) : 0.0;
  const buyNowProductId = searchParams.get('productId') || '';
  const buyNowQtyParam = searchParams.get('qty');
  const buyNowQty = buyNowQtyParam ? parseInt(buyNowQtyParam) : 1;

  // Form states
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [formError, setFormError] = useState('');
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);

  useEffect(() => {
    if (buyNowSku) {
      // Buy Now Flow
      setCheckoutItems([
        {
          productId: buyNowProductId,
          sku: buyNowSku,
          name: buyNowName,
          price: buyNowPrice,
          quantity: buyNowQty,
          stockCount: 99
        }
      ]);
    } else {
      // Standard Cart Flow
      setCheckoutItems(cartItems);
    }
  }, [mounted, buyNowSku, buyNowProductId, buyNowName, buyNowPrice, buyNowQty, cartItems]);

  // Calculate pricing metrics
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 150.00 ? 0.00 : 15.00;
  const taxRate = 0.1;
  const tax = subtotal * taxRate;
  const grandTotal = subtotal + shippingFee + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName || !address || !city || !zipCode) {
      setFormError('Please fill out all shipping fields.');
      return;
    }

    if (checkoutItems.length === 0) {
      setFormError('Your checkout ledger has no items.');
      return;
    }

    // Save details to sessionStorage
    const shippingDetails = { fullName, address, city, zipCode };
    sessionStorage.setItem('winter_shipping_details', JSON.stringify(shippingDetails));
    sessionStorage.setItem('winter_checkout_items', JSON.stringify(checkoutItems));

    // Redirect to payments
    router.push('/payment');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
      {/* Left Panel: Shipping Data Intake Form */}
      <section className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Secure Checkout
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-widest">1. SHIPPING ADDRESS INFORMATION</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-xl">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-mono font-bold" htmlFor="fullName">FULL NAME</label>
            <input
              id="fullName"
              type="text"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-mono font-bold" htmlFor="address">STREET ADDRESS</label>
            <input
              id="address"
              type="text"
              placeholder="e.g. 123 Winter Parkway"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-mono font-bold" htmlFor="city">CITY</label>
              <input
                id="city"
                type="text"
                placeholder="e.g. Glacier Peak"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-mono font-bold" htmlFor="zipCode">POSTAL / ZIP CODE</label>
              <input
                id="zipCode"
                type="text"
                placeholder="e.g. 98101"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>SECURE SSL SOCKET CONNECTION ACTIVE</span>
            <span>CUSTOMER ID: CST-9943</span>
          </div>
        </form>
      </section>

      {/* Right Panel: Order Summary Card */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Order Summary</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono uppercase tracking-widest">ITEM CHECKOUT LEDGER</p>
          </div>

          {/* Items checklist */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {checkoutItems.length === 0 ? (
              <p className="text-xs text-slate-450 italic">No items queued for checkout.</p>
            ) : (
              checkoutItems.map((item) => (
                <div key={item.sku} className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-850 line-clamp-1">{item.name}</h3>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">SKU: {item.sku}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="text-[9px] text-slate-450 font-mono border-t border-slate-200/60 pt-1.5 flex justify-between">
                    <span>QUANTITY</span>
                    <span>{item.quantity} UNIT{item.quantity !== 1 ? 'S' : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing breakdown */}
          <div className="space-y-2 text-xs font-mono pt-4 border-t border-slate-150">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Shipping Fee:</span>
              <span>
                {shippingFee === 0 ? <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">FREE</span> : `$${shippingFee.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Estimated Tax (10%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-sm border-t border-slate-200 pt-2.5">
              <span className="font-sans">Grand Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* CTA Trigger */}
        <div className="pt-6 border-t border-slate-150">
          <button
            onClick={handleSubmit}
            className="w-full py-4 px-6 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold rounded-xl shadow transition duration-150 flex items-center justify-center gap-2"
          >
            <span>Proceed to Payment</span>
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <p className="text-[10px] text-center text-slate-450 mt-3 leading-relaxed">
            By clicking "Proceed to Payment" you authorize transaction routing parameters dispatch.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden font-sans pb-24 flex flex-col">
      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-605 transition duration-150">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Cancel and Return
          </Link>
          <div className="text-slate-450 text-xs font-mono">
            GATEWAY PATH: /checkout
          </div>
        </div>
      </header>

      {/* Suspense Wrapper */}
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <span className="text-xs text-slate-450 font-mono">Loading Secure Checkout Ledger...</span>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}
