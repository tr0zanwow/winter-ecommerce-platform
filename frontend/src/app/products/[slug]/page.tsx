'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartStore';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ProductDetails {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stockCount: number;
  isActive: boolean;
  imageUrl?: string;
  attributes?: Record<string, any>;
}

// Inline connectivity/not-found error layout mimicking premium light theme aesthetics
function ErrorStateView({ title, message, slug }: { title: string; message: string; slug?: string }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-lg">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 relative">
            <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
          <p className="text-sm text-slate-650 leading-relaxed">{message}</p>
          {slug && (
            <div className="mt-2 text-xs bg-slate-50 text-rose-600 border border-rose-100 py-1.5 px-3 rounded-lg inline-block font-mono">
              Parameter Query Slug: {slug}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Link
            href="/"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition duration-150 block text-center"
          >
            Return to Core Catalog
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ProductDetailsPage({ params }: PageProps) {
  const { slug } = use(params);

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [diagnosticMessage, setDiagnosticMessage] = useState<string>('');
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

  const { cartItems, addToCart } = useCart();
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const urls = [
        '/winter/api/graphql',
        'http://127.0.0.1:3000/winter/api/graphql'
      ];
      let fetched = false;
      let lastError = null;

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                query GetProductDetails($slug: String!) {
                  product(slug: $slug) {
                    id
                    name
                    slug
                    sku
                    price
                    stockCount
                    isActive
                    imageUrl
                    attributes
                  }
                }
              `,
              variables: { slug }
            })
          });

          if (res.ok) {
            const payload = await res.json();
            if (payload.errors && payload.errors.length > 0) {
              throw new Error(payload.errors[0].message);
            }
            if (payload.data?.product) {
              setProduct(payload.data.product);
              fetched = true;
              break;
            }
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!fetched) {
        throw lastError || new Error("All BFF network pathways unreachable.");
      }
    } catch (error: any) {
      setConnectionError(true);
      setDiagnosticMessage(error.message || 'Unknown network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || '',
      quantity: 1,
      stockCount: product.stockCount
    });
    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
    }, 1500);
  };

  // Header component aligned to light theme
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
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-extrabold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-scaleIn">
                {totalCartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );

  if (connectionError) {
    return (
      <ErrorStateView
        title="Mesh Gateway Connectivity Interrupted"
        message={`The storefront was unable to fetch individual item details. Core GraphQL service is currently offline or unreachable. Error: ${diagnosticMessage}`}
        slug={slug}
      />
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
        {renderHeader()}
        <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
          <span className="text-xs text-slate-500 font-mono">Loading product profile...</span>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <ErrorStateView
        title="Product Profile Unresolved"
        message="The requested SKU details slug cannot be matched with an active entry inside our database. Verify routing parameters."
        slug={slug}
      />
    );
  }

  const isOutOfStock = product.stockCount <= 0;
  const isLowStock = product.stockCount > 0 && product.stockCount <= 5;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden font-sans pb-24">
      {renderHeader()}

      <div className="relative z-10 max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Product Image */}
        <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[540px] flex flex-col justify-center relative group shadow-sm">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
            />
          ) : (
            <div className="p-8 h-full flex flex-col justify-between">
              <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
              <div className="self-end bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg relative z-10">
                <span className="text-[10px] text-slate-550 font-mono font-bold">ASSET STATE: PLACEHOLDER_VECTOR</span>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 py-12 relative z-10">
                <span className="text-8xl font-black text-slate-200 select-none font-mono">W</span>
                <p className="text-xs text-slate-500 mt-4 tracking-wider uppercase font-semibold">Image Asset Vector Pending</p>
              </div>
              <div className="relative z-10 flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-4">
                <span>MODEL SCALE: 1.0</span>
                <span>FORMAT: NO_SQL_SPECS</span>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Metadata & Core Details */}
        <section className="flex flex-col justify-between bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="space-y-6">
            {/* Catalog Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold tracking-wider text-indigo-650 uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                WINTER CORE CATALOG
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                isOutOfStock
                  ? 'bg-rose-50 text-rose-600 border-rose-150'
                  : isLowStock
                  ? 'bg-amber-50 text-amber-600 border-amber-150'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-150'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${product.stockCount})` : 'Active / In Stock'}
              </span>
            </div>

            {/* Title, SKU and Price */}
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-450">
                <span>SKU NUMBER:</span>
                <span className="text-slate-700 font-bold">{product.sku}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">ACQUISITION PRICE</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 font-mono">USD</span>
              </div>
            </div>

            {/* Specifications Grid */}
            {product.attributes && Object.keys(product.attributes).length > 0 ? (
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div>
                  <h3 className="text-xs text-slate-755 uppercase tracking-widest font-bold">Product Specifications</h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">Garment details and thermal attributes</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(product.attributes).map(([key, val]) => {
                    const formattedKey = {
                      material: 'Material Composition',
                      fit: 'Product Fit',
                      warmthLevel: 'Warmth Level',
                      care: 'Care Instructions'
                    }[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    
                    return (
                      <div key={key} className="flex justify-between items-center bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                        <span className="text-xs text-slate-500">{formattedKey}:</span>
                        <span className="text-xs text-slate-800 font-mono font-bold">{String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="pt-6 border-t border-slate-100 text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="text-xs text-slate-400 font-mono">No supplementary specifications logged</span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-4 px-6 rounded-xl font-bold transition duration-150 flex items-center justify-center gap-2 border ${
                isOutOfStock
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : addedFeedback
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-350 shadow-sm'
              }`}
            >
              {addedFeedback ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <Link
              href={`/checkout?sku=${product.sku}&qty=1`}
              onClick={(e) => isOutOfStock && e.preventDefault()}
              className={`w-full py-4 px-6 text-center font-bold rounded-xl transition duration-150 flex items-center justify-center gap-2 ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow hover:shadow-md'
              }`}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Buy Now</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
