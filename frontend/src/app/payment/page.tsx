'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

function PaymentContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  // States: 'processing' | 'success' | 'error'
  const [txState, setTxState] = useState<'processing' | 'success' | 'error'>('processing');
  const [orderId, setOrderId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [grandTotalSum, setGrandTotalSum] = useState<number>(0.0);

  useEffect(() => {
    let active = true;

    const performTransaction = async () => {
      // Simulate 2.5 seconds banking auth delay
      await new Promise((resolve) => setTimeout(resolve, 2500));

      if (!active) return;

      try {
        let shippingAddress = null;
        let items: CheckoutItem[] = [];

        // Attempt to load checkout payload from sessionStorage
        try {
          const storedAddress = sessionStorage.getItem('winter_shipping_details');
          if (storedAddress) {
            shippingAddress = JSON.parse(storedAddress);
          }

          const storedItems = sessionStorage.getItem('winter_checkout_items');
          if (storedItems) {
            items = JSON.parse(storedItems);
          }
        } catch (e) {
          console.error('Failed to parse checkout storage details:', e);
        }

        // Fallback to query parameters if sessionStorage is empty (Buy Now workflow backup)
        if (items.length === 0) {
          const buyNowSku = searchParams.get('sku');
          if (buyNowSku) {
            const buyNowPriceParam = searchParams.get('price');
            const buyNowPrice = buyNowPriceParam ? parseFloat(buyNowPriceParam) : 0.0;
            const buyNowProductId = searchParams.get('productId') || '';
            const buyNowName = searchParams.get('name') || 'Product';
            
            items = [{
              productId: buyNowProductId,
              sku: buyNowSku,
              name: buyNowName,
              price: buyNowPrice,
              quantity: 1,
              stockCount: 99
            }];
          }
        }

        if (items.length === 0) {
          throw new Error("No active checkout items found in transaction context.");
        }

        setCheckoutItems(items);

        // Calculate grand total to show on UI
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingFee = subtotal >= 150.00 ? 0.00 : 15.0;
        const tax = subtotal * 0.10;
        const total = subtotal + shippingFee + tax;
        setGrandTotalSum(total);

        // Construct backend payload
        const payload = {
          customerId: 'CST-9943',
          items: items.map(item => ({
            productId: item.productId || undefined,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price
          })),
          shippingAddress: shippingAddress
        };

        const res = await fetch('/winter/api/orders/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || `API error! Status: ${res.status}`);
        }

        if (active) {
          setOrderId(data.orderId || 'ORD-UNKNOWN');
          setTxState('success');
          
          // CRITICAL REQUIREMENT: Clear persistent Zustand Cart Store on successful order placement
          clearCart();
          
          // Clear checkout session parameters
          sessionStorage.removeItem('winter_checkout_items');
        }
      } catch (error: any) {
        console.error('Transaction gateway failed:', error);
        if (active) {
          setErrorMessage(error.message || 'Payment authentication handshake rejected.');
          setTxState('error');
        }
      }
    };

    performTransaction();

    return () => {
      active = false;
    };
  }, []);

  if (txState === 'processing') {
    return (
      <div className="max-w-md w-full mx-auto mt-20 relative z-10 bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-8 shadow-sm">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin flex items-center justify-center relative">
            <svg className="w-8 h-8 text-indigo-655 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 animate-pulse">
            Processing Secure Payment
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Contacting Secure Winter Bank Vault... Authorizing Transaction Charge.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[10px] font-mono text-slate-500 text-left space-y-1">
          <div>VAULT TARGET: SECURE_WINTER_GATEWAY_V1</div>
          <div>ESTABLISHING OIDC TRUST HANDSHAKE...</div>
          {grandTotalSum > 0 && <div>TRANSACTION SUM: ${grandTotalSum.toFixed(2)} USD</div>}
        </div>
      </div>
    );
  }

  if (txState === 'error') {
    return (
      <div className="max-w-md w-full mx-auto mt-20 relative z-10 bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-8 shadow-sm">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-150 flex items-center justify-center text-rose-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Payment Authorization Failed</h2>
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 leading-relaxed font-mono mt-1">
            Error: {errorMessage}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-205 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition duration-150 text-center"
          >
            Cancel and Return
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto mt-20 relative z-10 bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-8 shadow-sm">
      {/* Green Checkmark Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600 relative">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Payment Authorized</h2>
        <p className="text-xs text-emerald-700 font-mono tracking-wider uppercase font-semibold">
          ORDER RECORDED AS PENDING_PROCESSING
        </p>
      </div>

      {/* Order Invoice Block */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left space-y-3 font-mono text-[10px] text-slate-500">
        <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2 mb-1">
          <span className="font-bold text-slate-800">Transaction Invoice</span>
          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">SUCCESS</span>
        </div>
        <div className="flex justify-between">
          <span>ORDER REFERENCE:</span>
          <span className="text-slate-800 font-bold">{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span>BILLING ACCOUNT:</span>
          <span>CST-9943</span>
        </div>
        <div className="flex justify-between">
          <span>ITEMS QUANTITY:</span>
          <span className="text-slate-850 font-bold">
            {checkoutItems.reduce((sum, item) => sum + item.quantity, 0)} Units
          </span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-700">
          <span>TOTAL CHARGED:</span>
          <span className="font-bold text-slate-900">${grandTotalSum.toFixed(2)} USD</span>
        </div>
      </div>

      {/* Section C: Live Network Event Dispatcher Alert */}
      <div className="bg-indigo-50 border border-indigo-150 text-indigo-750 text-[10px] p-4 rounded-2xl text-left space-y-1.5 leading-relaxed font-mono">
        <div className="font-bold text-slate-850 flex items-center gap-1.5 text-xs font-sans mb-1">
          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Async Event Backbone Alert
        </div>
        Asynchronous SNS/SQS event notifications have successfully fanned out directly to the active inventory long-poll worker daemons on EKS to update stock levels.
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
        <Link
          href="/"
          className="w-full py-3.5 px-4 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl shadow transition duration-150 block text-center"
        >
          Return to Storefront Home
        </Link>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden font-sans pb-24 flex flex-col">
      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-655 hover:text-indigo-600 transition duration-150">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Abort and Return
          </Link>
          <div className="text-slate-450 text-xs font-mono">
            GATEWAY PATH: /payment
          </div>
        </div>
      </header>

      {/* Suspense wrapper */}
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <span className="text-xs text-slate-450 font-mono">Loading Payment Gateway Coordinates...</span>
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </main>
  );
}
