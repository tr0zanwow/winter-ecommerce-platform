import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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

// Inline connectivity/not-found error layout mimicking page.tsx premium aesthetics
function ErrorStateView({ title, message, slug }: { title: string; message: string; slug?: string }) {
  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative Grid Overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.15]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8 bg-slate-950/60 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 relative">
            <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
          {slug && (
            <div className="mt-2 text-xs bg-slate-900/80 text-rose-400 border border-rose-500/10 py-1.5 px-3 rounded-lg inline-block font-mono">
              Parameter Query Slug: {slug}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-900 flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg transition duration-200 block text-center"
          >
            Return to Core Catalog
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Construct Apollo GraphQL endpoint target path
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = process.env.VERCEL_URL || 'localhost:3000';
  const url = `${protocol}://${host}/api/graphql`;

  let product: ProductDetails | null = null;
  let connectionError = false;
  let diagnosticMessage = '';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
              attributes
            }
          }
        `,
        variables: { slug }
      }),
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(3000), // 3-second network request limit
    });

    if (!res.ok) {
      throw new Error(`HTTP Error Status: ${res.status}`);
    }

    const payload = await res.json();
    if (payload.errors && payload.errors.length > 0) {
      throw new Error(payload.errors[0].message);
    }
    
    product = payload.data?.product || null;
  } catch (error: any) {
    connectionError = true;
    diagnosticMessage = error.message || 'Unknown network error';
  }

  // 1. Connectivity Lost state
  if (connectionError) {
    return (
      <ErrorStateView
        title="Mesh Gateway Connectivity Interrupted"
        message={`The storefront was unable to fetch individual item details. Core GraphQL service is currently offline or unreachable. Error: ${diagnosticMessage}`}
        slug={slug}
      />
    );
  }

  // 2. Product Not Found state
  if (!product) {
    return (
      <ErrorStateView
        title="Product Profile Unresolved"
        message="The requested SKU details slug cannot be matched with an active entry inside our NoSQL database. Verify routing parameters."
        slug={slug}
      />
    );
  }

  // Determine stock color indicators
  const isOutOfStock = product.stockCount <= 0;
  const isLowStock = product.stockCount > 0 && product.stockCount <= 5;

  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 relative overflow-hidden font-sans pb-24">
      {/* Decorative Background Mesh elements */}
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
            Back to Core catalog
          </Link>
          <div className="text-slate-500 text-xs font-mono">
            GATEWAY PATH: /products/{product.slug}
          </div>
        </div>
      </header>

      {/* Main Luxury Split Panel Layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Column: Dark Luxury Placeholder Image */}
        <section className="bg-slate-900/30 border border-slate-800/80 rounded-3xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[540px] flex flex-col justify-between p-8 relative group shadow-2xl backdrop-blur-sm">
          {/* Subtle patterns */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
          
          <div className="self-end bg-slate-950/40 border border-slate-800/40 px-3 py-1.5 rounded-lg backdrop-blur-md">
            <span className="text-[10px] text-slate-400 font-mono">ASSET STATE: PLACEHOLDER_VECTOR</span>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 py-12 relative z-10">
            <span className="text-8xl font-black text-slate-800/40 select-none font-mono">W</span>
            <p className="text-xs text-slate-500 mt-4 tracking-wider uppercase font-semibold">Image Asset Vector Pending</p>
          </div>

          <div className="relative z-10 flex justify-between items-center text-xs text-slate-400 border-t border-slate-900/60 pt-4">
            <span>MODEL SCALE: 1.0</span>
            <span>FORMAT: NO_SQL_SPECS</span>
          </div>
        </section>

        {/* Right Column: Metadata & Core Details */}
        <section className="flex flex-col justify-between bg-slate-950/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
          <div className="space-y-6">
            
            {/* Catalog Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                WINTER CORE CATALOG
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isOutOfStock
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : isLowStock
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isOutOfStock ? 'bg-rose-400' : isLowStock ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${product.stockCount})` : 'Active / In Stock'}
              </span>
            </div>

            {/* Title, SKU and Price */}
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span>SKU NUMBER:</span>
                <span className="text-slate-400 font-semibold">{product.sku}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-900">
              <p className="text-sm text-slate-500 font-mono">ACQUISITION PRICE</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 font-mono">USD</span>
              </div>
            </div>

            {/* Unstructured attributes specs grid */}
            {product.attributes && Object.keys(product.attributes).length > 0 ? (
              <div className="pt-6 border-t border-slate-900 space-y-4">
                <div>
                  <h3 className="text-xs text-slate-500 uppercase tracking-widest font-bold">Product Specifications</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Parsed from distributed NoSQL payload document</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(product.attributes).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center bg-slate-900/20 border border-slate-900/60 p-3 rounded-xl">
                      <span className="text-xs text-slate-500 capitalize">{key}:</span>
                      <span className="text-xs text-slate-200 font-mono font-semibold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-6 border-t border-slate-900 text-center py-6 bg-slate-900/10 rounded-2xl border border-dashed border-slate-900">
                <span className="text-xs text-slate-500 font-mono">No supplementary specifications attributes logged</span>
              </div>
            )}
          </div>

          {/* Checkout CTA */}
          <div className="mt-8 pt-6 border-t border-slate-900">
            <Link
              href={`/checkout?sku=${product.sku}&name=${encodeURIComponent(product.name)}&price=${product.price}&productId=${product.id}`}
              className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <svg className="w-5 h-5 text-white transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Add to Cart & Proceed to Checkout</span>
            </Link>
          </div>

        </section>
      </div>
    </main>
  );
}
