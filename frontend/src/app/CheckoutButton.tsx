'use client';

import React, { useState } from 'react';

interface CheckoutButtonProps {
  sku: string;
  price: number;
}

export default function CheckoutButton({ sku, price }: CheckoutButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleCheckout = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/winter/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: 'CST-9943',
          items: [{ sku, quantity: 1, price }],
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `HTTP error! status: ${res.status}`);
      }

      setStatus('success');
      setMessage(data.message || `Checkout processed: Status is ${data.status || 'PENDING_PROCESSING'}`);
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error: any) {
      console.error('Checkout simulation failed:', error);
      setStatus('error');
      setMessage(error.message || 'Connection to checkout service timed out.');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleCheckout}
        disabled={status === 'loading'}
        className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all duration-300 ${
          status === 'loading'
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            : status === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5'
            : status === 'error'
            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/5'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/25 hover:translate-y-[-1px]'
        }`}
      >
        {status === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </span>
        ) : status === 'success' ? (
          '✓ Order Placed'
        ) : status === 'error' ? (
          '✕ Execution Failed'
        ) : (
          'Simulate Checkout'
        )}
      </button>
      {message && (
        <div className={`mt-2 p-2 rounded-lg text-[10px] font-mono leading-relaxed border ${
          status === 'success'
            ? 'bg-emerald-950/40 text-emerald-400/90 border-emerald-500/10'
            : 'bg-rose-950/40 text-rose-400/90 border-rose-500/10'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
