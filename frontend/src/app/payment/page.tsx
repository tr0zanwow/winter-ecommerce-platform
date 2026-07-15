'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentContent() {
  const searchParams = useSearchParams();

  // Read item details from query parameters
  const sku = searchParams.get('sku') || 'N/A';
  const name = searchParams.get('name') || 'Product';
  const priceParam = searchParams.get('price');
  const price = priceParam ? parseFloat(priceParam) : 0.0;
  const productId = searchParams.get('productId') || '';

  // States: 'processing' | 'success' | 'error'
  const [txState, setTxState] = useState<'processing' | 'success' | 'error'>('processing');
  const [orderId, setOrderId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let active = true;

    const performTransaction = async () => {
      // Simulate 2.5 seconds banking auth delay
      await new Promise((resolve) => setTimeout(resolve, 2500));

      if (!active) return;

      try {
        let shippingAddress = null;
        try {
          const stored = sessionStorage.getItem('winter_shipping_details');
          if (stored) {
            shippingAddress = JSON.parse(stored);
          }
        } catch (e) {
          console.error('Failed to parse shipping details', e);
        }

        const payload = {
          customerId: 'CST-9943',
          items: [
            {
              productId: productId || undefined,
              sku: sku,
              quantity: 1,
              price: price,
            },
          ],
          shippingAddress: shippingAddress,
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
  }, [sku, price, productId]);

  if (txState === 'processing') {
    return (
      <div className="max-w-md w-full mx-auto mt-20 relative z-10 bg-slate-950/60 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl text-center space-y-8 shadow-2xl">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin flex items-center justify-center relative">
            <svg className="w-8 h-8 text-cyan-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-white animate-pulse">
            Processing Secure Payment
          </h2>
          <p className="text-xs text-slate-400 font-mono leading-relaxed max-w-sm mx-auto">
            Contacting Secure Winter Bank Vault... Authorizing Transaction Charge.
          </p>
        </div>

        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 text-[10px] font-mono text-slate-500 text-left space-y-1">
          <div>VAULT TARGET: SECURE_WINTER_GATEWAY_V1</div>
          <div>ESTABLISHING OIDC TRUST HANDSHAKE...</div>
          <div>TRANSACTION SUM: ${price.toFixed(2)} USD</div>
        </div>
      </div>
    );
  }

  if (txState === 'error') {
    return (
      <div className="max-w-md w-full mx-auto mt-20 relative z-10 bg-slate-950/60 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl text-center space-y-8 shadow-2xl">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white">Payment Authorized Failed</h2>
          <p className="text-xs text-rose-400 leading-relaxed font-mono mt-1">
            Error: {errorMessage}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-900 flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 transition duration-150"
          >
            Cancel and Return
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto mt-20 relative z-10 bg-slate-950/60 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl text-center space-y-8 shadow-2xl">
      
      {/* Green Checkmark Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 relative">
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
        <h2 className="text-2xl font-black tracking-tight text-white">Payment Authorized</h2>
        <p className="text-xs text-emerald-400 font-mono tracking-wider uppercase font-semibold">
          ORDER RECORDED AS PENDING_PROCESSING
        </p>
      </div>

      {/* Order Invoice Block */}
      <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-2xl text-left space-y-3 font-mono text-[10px] text-slate-400">
        <div className="flex justify-between items-center text-xs border-b border-slate-900/80 pb-2 mb-1">
          <span className="font-bold text-white">Transaction Invoice</span>
          <span className="text-slate-500">SUCCESS</span>
        </div>
        <div className="flex justify-between">
          <span>ORDER REFERENCE:</span>
          <span className="text-slate-200 font-semibold">{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span>BILLING ACCOUNT:</span>
          <span>CST-9943</span>
        </div>
        <div className="flex justify-between">
          <span>PRODUCT SKU:</span>
          <span>{sku}</span>
        </div>
        <div className="flex justify-between border-t border-slate-900/80 pt-2 text-slate-300">
          <span>TOTAL CHARGED:</span>
          <span className="font-bold text-white">${price.toFixed(2)} USD</span>
        </div>
      </div>

      {/* Section C: Live Network Event Dispatcher Alert */}
      <div className="bg-cyan-950/20 border border-cyan-500/10 text-cyan-400/90 text-[10px] p-4 rounded-2xl text-left space-y-1.5 leading-relaxed font-mono">
        <div className="font-bold text-white flex items-center gap-1.5 text-xs font-sans mb-1">
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Async Event Backbone Alert
        </div>
        Asynchronous SNS/SQS event notifications have successfully fanned out directly to the active inventory long-poll worker daemons on EKS to update stock levels.
      </div>

      <div className="pt-4 border-t border-slate-900 flex flex-col gap-3">
        <Link
          href="/"
          className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition duration-200 block text-center"
        >
          Return to Storefront Home
        </Link>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 relative overflow-hidden font-sans pb-24 flex flex-col">
      {/* Decorative Grid & Blurs */}
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
            Abort and Return
          </Link>
          <div className="text-slate-500 text-xs font-mono">
            GATEWAY PATH: /payment
          </div>
        </div>
      </header>

      {/* Suspense wrapper for Next.js searchParams use */}
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[50vh] relative z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            <span className="text-xs text-slate-400 font-mono">Loading Payment Gateway Coordinates...</span>
          </div>
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </main>
  );
}
