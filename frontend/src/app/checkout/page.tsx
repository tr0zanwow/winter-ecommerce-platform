'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read query parameters
  const sku = searchParams.get('sku') || 'N/A';
  const name = searchParams.get('name') || 'Product Details';
  const priceParam = searchParams.get('price');
  const price = priceParam ? parseFloat(priceParam) : 0.0;
  const productId = searchParams.get('productId') || '';

  // Form states
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [formError, setFormError] = useState('');

  // Calculate pricing metrics
  const shippingFee = 15.0;
  const taxRate = 0.1;
  const subtotal = price;
  const tax = subtotal * taxRate;
  const grandTotal = subtotal + shippingFee + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName || !address || !city || !zipCode) {
      setFormError('Please fill out all shipping fields.');
      return;
    }

    // Save shipping details to sessionStorage for the complete funnel execution
    const shippingDetails = { fullName, address, city, zipCode };
    sessionStorage.setItem('winter_shipping_details', JSON.stringify(shippingDetails));

    // Route session forward to /payment with details
    const targetUrl = `/payment?sku=${sku}&productId=${productId}&price=${price}&name=${encodeURIComponent(name)}`;
    router.push(targetUrl);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
      
      {/* Left Panel: Shipping Data Intake Form (2 cols wide on large screens) */}
      <section className="lg:col-span-2 bg-slate-950/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-md shadow-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Secure Checkout
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">1. SHIPPING ADDRESS INFORMATION</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-mono" htmlFor="fullName">FULL NAME</label>
            <input
              id="fullName"
              type="text"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-900/30 border border-slate-800/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-mono" htmlFor="address">STREET ADDRESS</label>
            <input
              id="address"
              type="text"
              placeholder="e.g. 123 Winter Parkway"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-900/30 border border-slate-800/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono" htmlFor="city">CITY</label>
              <input
                id="city"
                type="text"
                placeholder="e.g. Glacier Peak"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900/30 border border-slate-800/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono" htmlFor="zipCode">POSTAL / ZIP CODE</label>
              <input
                id="zipCode"
                type="text"
                placeholder="e.g. 98101"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full bg-slate-900/30 border border-slate-800/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-all duration-200"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex justify-between items-center text-xs text-slate-500">
            <span>SECURE SSL SOCKET CONNECTION ACTIVE</span>
            <span>CUSTOMER ID: CST-9943</span>
          </div>
        </form>
      </section>

      {/* Right Panel: Order Summary Card (1 col wide) */}
      <section className="bg-slate-950/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Order Summary</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">ITEM CHECKOUT LEDGER</p>
          </div>

          <div className="bg-slate-900/20 border border-slate-900/60 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white line-clamp-2">{name}</h3>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">SKU: {sku}</span>
              </div>
              <span className="text-sm font-bold text-slate-100 font-mono">${price.toFixed(2)}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono border-t border-slate-900/80 pt-2 flex justify-between">
              <span>QUANTITY</span>
              <span>1 UNIT</span>
            </div>
          </div>

          {/* Structural Pricing lines */}
          <div className="space-y-2 text-xs font-mono pt-4 border-t border-slate-900">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Shipping Fee:</span>
              <span>${shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated Tax (10%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-sm border-t border-slate-900 pt-2.5">
              <span className="font-sans">Grand Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* CTA Trigger */}
        <div className="pt-6 border-t border-slate-900">
          <button
            onClick={handleSubmit}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold rounded-xl shadow-lg hover:shadow-orange-500/10 hover:translate-y-[-1px] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Proceed to Payment</span>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <p className="text-[10px] text-center text-slate-500 mt-3 leading-relaxed">
            By clicking "Proceed to Payment" you authorize transaction routing parameters dispatch.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 relative overflow-hidden font-sans pb-24">
      {/* Decorative Grid and Blurs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#121824_1px,transparent_1px),linear-gradient(to_bottom,#121824_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.25]" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition duration-150">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Cancel and Return
          </Link>
          <div className="text-slate-500 text-xs font-mono">
            GATEWAY PATH: /checkout
          </div>
        </div>
      </header>

      {/* Suspense Wrapper to conform with Next.js static generation constraints */}
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[50vh] relative z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            <span className="text-xs text-slate-400 font-mono">Loading Secure Checkout Ledger...</span>
          </div>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}
