'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartStore';

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

  const { cartItems } = useCart();
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          dot: 'bg-amber-500 animate-pulse'
        };
      case 'PROCESSING':
        return {
          bg: 'bg-cyan-50 border-cyan-200 text-cyan-700',
          dot: 'bg-cyan-500'
        };
      case 'SHIPPED':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
          dot: 'bg-indigo-500'
        };
      case 'DELIVERED':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          dot: 'bg-emerald-500'
        };
      case 'CANCELLED':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          dot: 'bg-rose-500'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-700',
          dot: 'bg-slate-500'
        };
    }
  };

  const statusOptions = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden font-sans pb-24 flex flex-col">
      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition duration-150">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Storefront
          </Link>
          
          <div className="flex items-center gap-4">
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
            <div className="text-slate-400 text-[10px] font-mono uppercase tracking-widest hidden md:block">
              TRACKING PLATFORM
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto px-6 mt-12 relative z-10 space-y-8 flex-1">
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Order Tracking & Management Hub
            </h1>
            <p className="text-xs text-slate-450 font-mono mt-1 uppercase tracking-widest">
              Live Relational RDBMS Ledger Tracking System
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-550"></span>
            </span>
            <span className="text-[10px] font-mono text-slate-600 font-bold">AWS EKS CLUSTER: ACTIVE</span>
          </div>
        </div>

        {/* Action Feedbacks */}
        {actionMessage && (
          <div 
            onClick={() => setActionMessage(null)}
            className={`border rounded-2xl p-4 text-xs font-semibold flex items-center justify-between cursor-pointer animate-fadeIn ${
              actionMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <span>{actionMessage.text}</span>
            <span className="text-[10px] text-slate-405 font-normal">Click to dismiss</span>
          </div>
        )}

        {/* Control Tower: Search Bar & Sort Filters */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xl">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by Order ID (e.g. ORD-000001), Customer Name, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200"
              />
            </div>
            
            <div className="text-[11px] font-mono text-slate-400 font-bold">
              Fetched {orders.length} order records in subset view.
            </div>
          </div>

          {/* Life Cycle State Pills */}
          <div className="border-t border-slate-100 pt-5">
            <label className="text-[10px] text-slate-400 font-mono tracking-wider block mb-3 uppercase font-bold">
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 ${
                    selectedStatus === status
                      ? 'bg-indigo-50 border-indigo-250 text-indigo-700 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-850'
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
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-650 animate-spin" />
            <span className="text-xs text-slate-405 font-mono">Querying RDS database...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-350 rounded-3xl p-16 text-center space-y-4 shadow-sm">
            <svg className="w-12 h-12 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18" />
            </svg>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-700">No Order Records Match</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No orders could be located in PostgreSQL matching status "{selectedStatus}" or search token. Try updating your filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {orders.map((order) => {
              const statusStyle = getStatusConfig(order.status);
              
              let address = { fullName: 'N/A', address: 'N/A', city: 'N/A', zipCode: 'N/A' };
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

              const isPending = order.status.toUpperCase() === 'PENDING';

              return (
                <div 
                  key={order.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 transition-all duration-200 flex flex-col justify-between space-y-6 shadow-sm relative overflow-hidden group"
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-extrabold text-slate-800 font-mono tracking-tight">
                          {order.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          CID: {order.customerId}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-450 block font-mono">
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
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <span className="text-[9px] text-slate-405 font-mono tracking-wider block uppercase font-bold">
                      Purchased Items ({order.itemsCount} Unit{order.itemsCount !== 1 ? 's' : ''})
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-600">
                          <span className="line-clamp-1">{item.name} <span className="text-slate-400 font-mono text-[10px]">x{item.quantity}</span></span>
                          <span className="font-mono text-slate-700 font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Box */}
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-1 text-slate-600 text-xs">
                    <span className="text-[9px] text-slate-400 font-mono tracking-wider block uppercase mb-1 font-bold">
                      Shipping Details
                    </span>
                    <div className="font-bold text-slate-850">{address.fullName}</div>
                    <div className="text-[11px] leading-relaxed text-slate-500">
                      {address.address}, {address.city}, {address.zipCode}
                    </div>
                  </div>

                  {/* Pricing and Action Footer */}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                    <div>
                      <span className="text-[9px] text-slate-400 font-mono tracking-wider block uppercase font-bold">
                        Grand Total
                      </span>
                      <span className="text-lg font-black text-slate-900 font-mono">
                        ${order.grandTotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      disabled={!isPending}
                      onClick={() => handleCancelOrder(order.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                        isPending
                          ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 shadow-sm'
                          : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {!isPending && (
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <div className="flex justify-center items-center gap-4 pt-6 border-t border-slate-200">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 ${
                page === 0
                  ? 'border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              Previous Page
            </button>
            <span className="text-xs font-mono text-slate-500 font-bold">
              Page {page + 1}
            </span>
            <button
              disabled={orders.length < 10}
              onClick={() => setPage(p => p + 1)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 ${
                orders.length < 10
                  ? 'border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-650'
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
