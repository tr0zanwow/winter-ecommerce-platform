import React from 'react';
import Link from 'next/link';
import CheckoutButton from './CheckoutButton';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch dynamic products catalog data from Apollo GraphQL BFF gateway
  let products: any[] = [];
  let graphqlError: string | null = null;
  const urls = [
    'http://127.0.0.1:3000/api/graphql',
    'https://projects.pranilrathod.dev/winter/api/graphql',
    'https://projects.pranilrathod.dev/api/graphql'
  ];

  try {
    let fetched = false;
    let lastError = null;

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
                  attributes
                }
              }
            `
          }),
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(3000),
        });
        
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.products) {
            products = json.data.products;
            fetched = true;
            break;
          } else if (json.errors) {
            throw new Error(json.errors[0]?.message || 'GraphQL Query returned errors');
          }
        } else {
          throw new Error(`BFF HTTP ${res.status}`);
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!fetched) {
      throw lastError || new Error("All BFF network pathways unreachable.");
    }
  } catch (err: any) {
    graphqlError = err.message || "Unknown Connectivity Exception";
  }

  // Common Header component for consistent design
  const renderHeader = () => (
    <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-indigo-500/20">
            W
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">
            Winter E-commerce <span className="text-cyan-400 font-normal">Platform</span>
          </span>
        </div>
      </div>
    </header>
  );

  // Common Footer component
  const renderFooter = () => (
    <footer className="border-t border-slate-900/60 py-6 text-center text-xs text-slate-500 bg-slate-950/30">
      <p>© 2026 Winter E-commerce Platform. Designed for scalability and AWS EKS cloud deployments.</p>
    </footer>
  );

  // ERROR VIEW: Render if GraphQL service/DB connectivity is missing
  if (graphqlError) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative selection:bg-rose-500 selection:text-slate-950">
        {/* Background Decorative Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
        </div>

        {renderHeader()}

        <div className="max-w-3xl w-full mx-auto px-6 py-16 flex-1 flex flex-col items-center justify-center text-center">
          {/* Neon Disconnection SVG Graphics */}
          <div className="relative mb-8 h-40 w-40 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-xl animate-pulse" />
            <svg className="w-24 h-24 text-rose-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          <span className="text-rose-500 font-semibold tracking-wider text-xs uppercase bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
            Gateway Error 503
          </span>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4 text-white">
            Mesh Gateway Connectivity Interrupted
          </h1>
          
          <p className="mt-4 text-slate-400 text-base max-w-xl">
            The storefront failed to establish database or cluster mesh connections to populate our product catalog data streams.
          </p>

          <div className="w-full mt-10 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-left font-mono backdrop-blur-sm">
            <h3 className="text-slate-300 font-semibold text-xs uppercase tracking-wider mb-3">Diagnostic Trace</h3>
            <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-4 space-y-2">
              <div className="flex text-xs">
                <span className="text-slate-500 w-24 shrink-0">BFF Route:</span>
                <span className="text-slate-300">/api/graphql (Apollo Gateway)</span>
              </div>
              <div className="flex text-xs">
                <span className="text-slate-500 w-24 shrink-0">Status:</span>
                <span className="text-rose-400 font-bold">DISCONNECTED</span>
              </div>
              <div className="flex text-xs">
                <span className="text-slate-500 w-24 shrink-0">Exception:</span>
                <span className="text-rose-400 overflow-x-auto whitespace-pre-wrap">{graphqlError}</span>
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
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative selection:bg-cyan-500 selection:text-slate-900">
      {/* Background Decorative Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {renderHeader()}

      <div className="max-w-7xl w-full mx-auto px-6 py-12 flex-1 flex flex-col">
        {/* Main Section: Hero & Catalog Grid */}
        <section className="w-full flex flex-col">
          <div className="mb-12">
            <span className="text-cyan-400 font-semibold tracking-wider text-xs uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              WINTER CORE ECOSYSTEM
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Retail Product Storefront
            </h1>
            <p className="mt-3 text-slate-400 text-sm max-w-2xl">
              Browsing active catalog products served from our distributed NoSQL database and processed instantly through zero-trust event queues.
            </p>
          </div>

          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl p-12 text-center bg-slate-900/10 backdrop-blur-sm min-h-[300px]">
              <svg className="w-12 h-12 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-white font-bold text-lg">No Products Found</h3>
              <p className="text-slate-500 text-xs mt-1">
                The catalog is empty. Seed products in the database to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const isOutOfStock = product.stockCount <= 0;
                const isLowStock = product.stockCount > 0 && product.stockCount <= 10;
                
                return (
                  <div 
                    key={product.id} 
                    className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-slate-700/80 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-indigo-500/5 backdrop-blur-sm"
                  >
                    <div>
                      {/* Badge / Status Header */}
                      <div className="flex justify-between items-start gap-2 mb-4">
                        <span className="text-[10px] font-mono text-slate-500 tracking-wider">
                          SKU: {product.sku}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isOutOfStock 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : isLowStock
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : `${product.stockCount} Available`}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                        <Link href={`/products/${product.slug}`} className="hover:text-cyan-400 transition-colors">
                          {product.name}
                        </Link>
                      </h3>
                      
                      {/* Price Badge */}
                      <div className="mt-3 flex items-baseline">
                        <span className="text-2xl font-extrabold text-white">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-500 ml-1.5">USD</span>
                      </div>

                      {/* Attributes NoSQL Mixed Fields Loop */}
                      {product.attributes && Object.keys(product.attributes).length > 0 && (
                        <div className="mt-6 space-y-1.5 pt-4 border-t border-slate-800/50">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-2">Specifications</span>
                          {Object.entries(product.attributes).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-slate-800/20">
                              <span className="text-slate-500 capitalize">{key}:</span>
                              <span className="text-slate-300 font-semibold">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Simulation Action Button */}
                    <div className="mt-6">
                      <CheckoutButton sku={product.sku} price={product.price} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {renderFooter()}
    </main>
  );
}
