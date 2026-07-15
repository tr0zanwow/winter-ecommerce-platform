'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from './context/CartStore';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [graphqlError, setGraphqlError] = useState<string | null>(null);
  const [addedFeedback, setAddedFeedback] = useState<Record<string, boolean>>({});

  const { cartItems, addToCart } = useCart();
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const fetchCatalog = async () => {
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
                query GetCatalog {
                  products {
                    id
                    name
                    slug
                    sku
                    price
                    stockCount
                    imageUrl
                    attributes
                  }
                }
              `
            })
          });
          if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.products) {
              setProducts(json.data.products);
              fetched = true;
              break;
            } else if (json.errors) {
              throw new Error(json.errors[0]?.message || 'GraphQL Query returned errors');
            }
          }
        } catch (err: any) {
          lastError = err;
        }
      }
      if (!fetched) {
        throw lastError || new Error("All BFF pathways unreachable");
      }
    } catch (err: any) {
      setGraphqlError(err.message || 'Unknown Exception');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || '',
      quantity: 1,
      stockCount: product.stockCount
    });
    setAddedFeedback(prev => ({ ...prev, [product.sku]: true }));
    setTimeout(() => {
      setAddedFeedback(prev => ({ ...prev, [product.sku]: false }));
    }, 1500);
  };

  // Common Header component for consistent light theme design
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

  // Common Footer component
  const renderFooter = () => (
    <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
      <p>© 2026 Winter E-commerce Platform. Designed for scalability and AWS EKS cloud deployments.</p>
    </footer>
  );

  // ERROR VIEW: Render if GraphQL service/DB connectivity is missing
  if (graphqlError) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans relative selection:bg-rose-500 selection:text-white">
        {renderHeader()}

        <div className="max-w-3xl w-full mx-auto px-6 py-16 flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative mb-8 h-40 w-40 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-rose-500/5 blur-xl animate-pulse" />
            <svg className="w-24 h-24 text-rose-550 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          <span className="text-rose-600 font-semibold tracking-wider text-xs uppercase bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Gateway Error 503
          </span>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4 text-slate-900">
            Mesh Gateway Connectivity Interrupted
          </h1>
          
          <p className="mt-4 text-slate-600 text-base max-w-xl">
            The storefront failed to establish database or cluster mesh connections to populate our product catalog data streams.
          </p>

          <div className="w-full mt-10 bg-white border border-slate-200 rounded-2xl p-6 text-left font-mono shadow-sm">
            <h3 className="text-slate-700 font-semibold text-xs uppercase tracking-wider mb-3">Diagnostic Trace</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex text-xs">
                <span className="text-slate-500 w-24 shrink-0">BFF Route:</span>
                <span className="text-slate-700">/api/graphql (Apollo Gateway)</span>
              </div>
              <div className="flex text-xs">
                <span className="text-slate-500 w-24 shrink-0">Status:</span>
                <span className="text-rose-600 font-bold">DISCONNECTED</span>
              </div>
              <div className="flex text-xs">
                <span className="text-slate-500 w-24 shrink-0">Exception:</span>
                <span className="text-rose-600 overflow-x-auto whitespace-pre-wrap">{graphqlError}</span>
              </div>
            </div>
          </div>
        </div>

        {renderFooter()}
      </main>
    );
  }

  // HEALTHY VIEW: Render normal product catalog
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans relative selection:bg-indigo-500 selection:text-white">
      {renderHeader()}

      <div className="max-w-7xl w-full mx-auto px-6 py-12 flex-1 flex flex-col">
        {/* Main Section: Hero & Catalog Grid */}
        <section className="w-full flex flex-col">
          <div className="mb-12">
            <span className="text-indigo-650 font-bold tracking-wider text-xs uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              WINTER CORE ECOSYSTEM
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4 text-slate-900">
              Retail Product Storefront
            </h1>
            <p className="mt-3 text-slate-650 text-sm max-w-2xl">
              Browsing active catalog products served from our distributed NoSQL database and processed instantly through zero-trust event queues.
            </p>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
              <span className="text-xs text-slate-500 font-mono">Loading product streams...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-3xl p-12 text-center bg-white shadow-sm min-h-[300px]">
              <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-slate-800 font-bold text-lg">No Products Found</h3>
              <p className="text-slate-500 text-xs mt-1">
                The catalog is empty. Seed products in the database to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white border border-slate-200 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all duration-200 shadow-sm group overflow-hidden"
                >
                  {/* Image Component */}
                  <Link href={`/products/${product.slug}`} className="w-full aspect-[4/3] bg-white flex items-center justify-center border-b border-slate-200 overflow-hidden relative block">
                    <img 
                      src={product.imageUrl || "https://m.media-amazon.com/images/I/615UyJ5OJGL._SL1254_.jpg"} 
                      alt={product.name}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-800 border border-slate-200 uppercase tracking-wider shadow-sm">
                      {product.sku.split('-')[1] || 'APPAREL'}
                    </div>
                  </Link>

                  {/* Information Layout Block */}
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div className="flex-1 flex flex-col">
                      {/* SKU indicator */}
                      <div className="text-[10px] font-mono text-slate-400 tracking-wider mb-2">
                        SKU: {product.sku}
                      </div>

                      {/* Product Title */}
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="text-base font-bold text-slate-800 line-clamp-2 min-h-[3rem] hover:text-indigo-600 transition-colors duration-200">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Retail Pricing Badge */}
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-slate-900">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">USD</span>
                      </div>

                      {/* Real-time Inventory Counter */}
                      <div className="mt-3 flex items-center">
                        {product.stockCount > 30 ? (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            In Stock: {product.stockCount} available
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                            Only {product.stockCount} left in stock!
                          </span>
                        )}
                      </div>

                      {/* Compact Attributes Preview */}
                      {product.attributes && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {product.attributes.material && (
                            <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 font-medium whitespace-nowrap">
                              <span className="text-slate-400 font-normal">Material:</span> {product.attributes.material}
                            </span>
                          )}
                          {product.attributes.warmthLevel && (
                            <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 font-medium whitespace-nowrap">
                              <span className="text-slate-400 font-normal">Warmth:</span> {product.attributes.warmthLevel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cart/Checkout Dual Action Buttons */}
                    <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.stockCount <= 0}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 border flex items-center justify-center gap-1 ${
                          product.stockCount <= 0
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : addedFeedback[product.sku]
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-350'
                        }`}
                      >
                        {addedFeedback[product.sku] ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Added!</span>
                          </>
                        ) : (
                          <span>Add to Cart</span>
                        )}
                      </button>

                      <Link
                        href={`/checkout?sku=${product.sku}&qty=1`}
                        onClick={(e) => product.stockCount <= 0 && e.preventDefault()}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold text-center transition-all duration-150 flex items-center justify-center ${
                          product.stockCount <= 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow'
                        }`}
                      >
                        Buy Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {renderFooter()}
    </main>
  );
}
