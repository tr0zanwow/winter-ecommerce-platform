'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerId: string;
  status: string;
  subtotal: number;
  tax: number;
  shippingFee: number;
  grandTotal: number;
  itemsCount: number;
  shippingAddress: string; // JSON String
  itemsJson: string; // JSON String
  createdAt: string;
}

export default function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Debounce search query to reduce server hits
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(0); // reset page when search changes
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let query = '';
      let variables = {};

      // If it looks like a direct order ID search
      if (debouncedSearchQuery.trim().toUpperCase().startsWith('ORD-')) {
        query = `
          query GetOrder($id: ID!) {
            order(id: $id) {
              id
              customerId
              status
              subtotal
              tax
              shippingFee
              grandTotal
              itemsCount
              shippingAddress
              itemsJson
              createdAt
            }
          }
        `;
        variables = { id: debouncedSearchQuery.trim().toUpperCase() };
      } else {
        query = `
          query GetOrders($status: String, $page: Int, $size: Int) {
            orders(status: $status, page: $page, size: $size) {
              id
              customerId
              status
              subtotal
              tax
              shippingFee
              grandTotal
              itemsCount
              shippingAddress
              itemsJson
              createdAt
            }
          }
        `;
        variables = {
          status: selectedStatus === 'ALL' ? null : selectedStatus,
          page,
          size: 10
        };
      }

      const res = await fetch('/winter/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
      });

      const { data } = await res.json();
      let list: Order[] = [];

      if (data) {
        if (data.order) {
          list = [data.order];
        } else if (data.orders) {
          list = data.orders;
        }
      }

      // Client-side secondary keyword filter for non-ID queries (searching names, items, cities, etc.)
      if (debouncedSearchQuery.trim() && !debouncedSearchQuery.trim().toUpperCase().startsWith('ORD-')) {
        const term = debouncedSearchQuery.toLowerCase().trim();
        list = list.filter(order => {
          let address = { fullName: '', city: '' };
          try {
            if (order.shippingAddress) {
              address = JSON.parse(order.shippingAddress);
            }
          } catch (e) {}

          let items: OrderItem[] = [];
          try {
            if (order.itemsJson) {
              items = JSON.parse(order.itemsJson);
            }
          } catch (e) {}

          const matchName = address.fullName.toLowerCase().includes(term);
          const matchCity = address.city.toLowerCase().includes(term);
          const matchItems = items.some(item => 
            item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term)
          );

          return matchName || matchCity || matchItems;
        });
      }

      setOrders(list);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setActionMessage({ type: 'error', text: 'Error contacting the order hub service.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedStatus, debouncedSearchQuery, page]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to request cancellation for order ${orderId}?`)) {
      return;
    }

    try {
      const res = await fetch('/winter/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation CancelOrder($id: ID!) {
              cancelOrder(id: $id) {
                success
                message
                order {
                  id
                  status
                }
              }
            }
          `,
          variables: { id: orderId }
        })
      });

      const { data } = await res.json();
      if (data && data.cancelOrder) {
        if (data.cancelOrder.success) {
          setActionMessage({ type: 'success', text: `Order ${orderId} successfully cancelled.` });
          loadOrders(); // instant reload of grid
        } else {
          setActionMessage({ type: 'error', text: data.cancelOrder.message || 'Failed to cancel order.' });
        }
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      setActionMessage({ type: 'error', text: 'Error executing cancellation mutation.' });
    }
  };

  // Helper to get visual tag styles for OrderStatus
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400 animate-pulse'
        };
      case 'PROCESSING':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          dot: 'bg-cyan-400'
        };
      case 'SHIPPED':
        return {
          bg: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
          dot: 'bg-violet-400'
        };
      case 'DELIVERED':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400'
        };
      case 'CANCELLED':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-500'
        };
      default:
        return {
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
          dot: 'bg-slate-400'
        };
    }
  };

  const statusOptions = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 relative overflow-hidden font-sans pb-24 flex flex-col">
      {/* Decorative grids & glows */}
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
            Back to Storefront
          </Link>
          <div className="text-slate-500 text-xs font-mono">
            TRACKING PLATFORM: /winter/orders
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto px-6 mt-12 relative z-10 space-y-8 flex-1">
        
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
              Order Tracking & Management Hub
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">
              Live Relational RDBMS Ledger Tracking System
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-2 flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">AWS EKS CLUSTER: ACTIVE</span>
          </div>
        </div>

        {/* Action Feedbacks */}
        {actionMessage && (
          <div 
            onClick={() => setActionMessage(null)}
            className={`border rounded-2xl p-4 text-xs font-semibold flex items-center justify-between cursor-pointer animate-fadeIn ${
              actionMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <span>{actionMessage.text}</span>
            <span className="text-[10px] text-slate-500 font-normal">Click to dismiss</span>
          </div>
        )}

        {/* Control Tower: Search Bar & Sort Filters */}
        <section className="bg-slate-950/50 border border-slate-900 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xl">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by Order ID (e.g. ORD-000001), Customer Name, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/30 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-600 transition-all duration-200"
              />
            </div>
            
            {/* Metadata Info */}
            <div className="text-[11px] font-mono text-slate-500">
              Fetched {orders.length} order records in subset view.
            </div>
          </div>

          {/* Flipkart-Style Status Filter Pills */}
          <div className="border-t border-slate-900 pt-5">
            <label className="text-[10px] text-slate-500 font-mono tracking-wider block mb-3 uppercase">
              Filter by Lifecycle State
            </label>
            <div className="flex flex-wrap gap-2.5">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status);
                    setPage(0);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition duration-150 ${
                    selectedStatus === status
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-950/20'
                      : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Matrix View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-cyan-500/10 border-t-cyan-500 animate-spin" />
            <span className="text-xs text-slate-500 font-mono">Querying RDS database...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-slate-950/20 border border-dashed border-slate-900 rounded-3xl p-16 text-center space-y-4">
            <svg className="w-12 h-12 text-slate-700 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18" />
            </svg>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-350">No Order Records Match</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No orders could be located in Postgres matching status "{selectedStatus}" or search token. Try updating your filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {orders.map((order) => {
              const statusStyle = getStatusConfig(order.status);
              
              // Deserialize address
              let address = { fullName: 'N/A', address: 'N/A', city: 'N/A', zipCode: 'N/A' };
              try {
                if (order.shippingAddress) {
                  address = JSON.parse(order.shippingAddress);
                }
              } catch (e) {}

              // Deserialize items
              let items: OrderItem[] = [];
              try {
                if (order.itemsJson) {
                  items = JSON.parse(order.itemsJson);
                }
              } catch (e) {}

              const isPending = order.status.toUpperCase() === 'PENDING';

              return (
                <div 
                  key={order.id}
                  className="bg-slate-950/40 border border-slate-900 hover:border-slate-800/80 rounded-3xl p-6 backdrop-blur-md transition-all duration-200 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group"
                >
                  {/* Subtle top light effect */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent opacity-60" />

                  {/* Header Row */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-extrabold text-white font-mono tracking-tight">
                          {order.id}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">
                          CID: {order.customerId}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date N/A'}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${statusStyle.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      <span>{order.status}</span>
                    </div>
                  </div>

                  {/* Items Display */}
                  <div className="space-y-2 border-t border-slate-900/60 pt-4">
                    <span className="text-[9px] text-slate-500 font-mono tracking-wider block uppercase">
                      Purchased Items ({order.itemsCount} Unit{order.itemsCount !== 1 ? 's' : ''})
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-400">
                          <span className="line-clamp-1">{item.name} <span className="text-slate-600 font-mono text-[10px]">x{item.quantity}</span></span>
                          <span className="font-mono text-slate-300 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Box */}
                  <div className="bg-slate-900/10 border border-slate-900/80 p-4 rounded-2xl space-y-1 text-slate-400 text-xs">
                    <span className="text-[9px] text-slate-500 font-mono tracking-wider block uppercase mb-1">
                      Shipping Details
                    </span>
                    <div className="font-semibold text-slate-200">{address.fullName}</div>
                    <div className="text-[11px] leading-relaxed text-slate-400">
                      {address.address}, {address.city}, {address.zipCode}
                    </div>
                  </div>

                  {/* Pricing and Action Footer */}
                  <div className="flex justify-between items-center border-t border-slate-900/60 pt-4 mt-auto">
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono tracking-wider block uppercase">
                        Grand Total
                      </span>
                      <span className="text-lg font-black text-white font-mono">
                        ${order.grandTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* State Guarded Action Button */}
                    <button
                      disabled={!isPending}
                      onClick={() => handleCancelOrder(order.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                        isPending
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500'
                          : 'bg-slate-900/30 border border-slate-900/60 text-slate-600 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {!isPending && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                      <span>{isPending ? 'Cancel Order' : 'Locked'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && orders.length > 0 && !debouncedSearchQuery.trim().toUpperCase().startsWith('ORD-') && (
          <div className="flex justify-center items-center gap-4 pt-6 border-t border-slate-900">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition duration-150 ${
                page === 0
                  ? 'border-slate-900 text-slate-650 cursor-not-allowed opacity-55'
                  : 'bg-slate-900/30 border-slate-800 hover:bg-slate-900 text-slate-350 hover:text-white'
              }`}
            >
              Previous Page
            </button>
            <span className="text-xs font-mono text-slate-500">
              Page {page + 1}
            </span>
            <button
              disabled={orders.length < 10}
              onClick={() => setPage(p => p + 1)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition duration-150 ${
                orders.length < 10
                  ? 'border-slate-900 text-slate-650 cursor-not-allowed opacity-55'
                  : 'bg-slate-900/30 border-slate-800 hover:bg-slate-900 text-slate-350 hover:text-white'
              }`}
            >
              Next Page
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
