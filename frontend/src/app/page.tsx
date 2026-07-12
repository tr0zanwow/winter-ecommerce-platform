import React from 'react';

interface HealthResponse {
  status: string;
  message: string;
}

// React Server Component that fetches EKS backend health
async function getServiceHealth(url: string, serviceName: string): Promise<HealthResponse> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 5 }, // Cache validation for 5 seconds
      signal: AbortSignal.timeout(2000), // 2-second connection timeout
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    return {
      status: "OFFLINE",
      message: `Unavailable from outside the EKS cluster mesh (${error.message || 'Timeout'})`
    };
  }
}

export default async function Home() {
  // Query EKS internal service endpoint directly from BFF
  const orderServiceHealth = await getServiceHealth(
    'http://order-service.backend.svc.cluster.local:8080/api/health',
    'Order Service'
  );

  // Mock checking other internal cluster endpoints for dashboard completeness
  const paymentServiceHealth = await getServiceHealth(
    'http://payment-service.backend.svc.cluster.local:8080/api/health',
    'Payment Service'
  );
  const inventoryServiceHealth = await getServiceHealth(
    'http://inventory-service.backend.svc.cluster.local:8080/api/health',
    'Inventory Service'
  );
  const catalogServiceHealth = await getServiceHealth(
    'http://catalog-service.backend.svc.cluster.local:8080/api/health',
    'Catalog Service'
  );

  const services = [
    { name: "Order Service", endpoint: "order-service", data: orderServiceHealth },
    { name: "Payment Service", endpoint: "payment-service", data: paymentServiceHealth },
    { name: "Inventory Service", endpoint: "inventory-service", data: inventoryServiceHealth },
    { name: "Catalog Service", endpoint: "catalog-service", data: catalogServiceHealth },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-slate-900">
      {/* Background Decorative Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-indigo-500/20">
              W
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              Winter E-commerce <span className="text-cyan-400 font-normal">Platform</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">BFF Gateway Online</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-cyan-400 font-semibold tracking-wider text-xs uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            EKS Multi-Service Cloud Skeleton
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-4 bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            Microservices Control Tower
          </h1>
          <p className="mt-4 text-slate-400 text-lg">
            An automated service-mesh health analyzer and Backend-For-Frontend orchestrator. Currently listening to internal service namespaces.
          </p>
        </div>

        {/* EKS Core Status Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const isOnline = service.data.status === "UP";
            const isOffline = service.data.status === "OFFLINE";
            
            return (
              <div 
                key={index} 
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-slate-700/80 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-indigo-500/5 backdrop-blur-sm"
              >
                {/* Visual Status Indicator Light */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none" />
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Namespace: backend
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isOnline 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : isOffline
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? 'bg-emerald-400 animate-ping' : isOffline ? 'bg-amber-400' : 'bg-rose-400'
                    }`} />
                    {service.data.status}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold text-white tracking-tight">
                  {service.name}
                </h3>
                
                <p className="mt-2 text-xs font-mono text-slate-500 overflow-ellipsis overflow-hidden whitespace-nowrap" title={`${service.endpoint}.backend.svc.cluster.local:8080`}>
                  svc: {service.endpoint}.backend.svc.cluster.local
                </p>

                <div className="mt-6 pt-4 border-t border-slate-800/60">
                  <span className="text-xs text-slate-400 block font-semibold mb-1">Response Payload:</span>
                  <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-900 min-h-[60px] flex items-center justify-start">
                    {service.data.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* EKS Internal Topology Info Callout */}
        <div className="mt-12 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 border border-indigo-500/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          </div>
          <div>
            <h4 className="text-white font-semibold text-lg">Virtual Network Topology Context</h4>
            <p className="text-slate-400 text-sm mt-1">
              When deployed to EKS, the Frontend BFF pod utilizes CoreDNS to query internal services by their Kubernetes Service names. Inside local testing environments, the BFF defaults to safe offline error handling and reports failure details with descriptive statuses.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 py-6 text-center text-xs text-slate-500 bg-slate-950/30">
        <p>© 2026 Winter E-commerce Platform. Designed for Project Loom, virtual thread scalability, and AWS EKS cloud deployments.</p>
      </footer>
    </main>
  );
}
