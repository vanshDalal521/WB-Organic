"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Package,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ShoppingCart,
  X,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  IndianRupee,
} from "lucide-react";

interface OrderItem {
  product: { name: string };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  deliveryDate?: string;
  items: OrderItem[];
  customer: {
    name?: string;
    user?: { phone: string; name?: string };
    phone?: string;
  };
}

interface OrderMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface QuickStats {
  totalOrders: number;
  todayOrders: number;
  pending: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Placed", value: "PLACED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PLACED: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  CONFIRMED: { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  PROCESSING: { bg: "bg-indigo-100", text: "text-indigo-800", dot: "bg-indigo-500" },
  OUT_FOR_DELIVERY: { bg: "bg-cyan-100", text: "text-cyan-800", dot: "bg-cyan-500" },
  DELIVERED: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  COD: "bg-orange-100 text-orange-800",
  WALLET: "bg-blue-100 text-blue-800",
  PREPAID: "bg-green-100 text-green-800",
  UPI: "bg-purple-100 text-purple-800",
};

function formatDate(dateString: string): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return `₹${(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getStatusBadge(status: string) {
  const colors = STATUS_COLORS[status] || { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" };
  const label = status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}

function getCustomerName(order: Order): string {
  if (order.customer?.name) return order.customer.name;
  if (order.customer?.user?.name) return order.customer.user.name;
  return "N/A";
}

function getCustomerPhone(order: Order): string {
  if (order.customer?.user?.phone) return order.customer.user.phone;
  if (order.customer?.phone) return order.customer.phone;
  return "N/A";
}

function getOrderItemCount(order: Order): number {
  return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

export default function OrdersPage() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<OrderMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stats, setStats] = useState<QuickStats>({
    totalOrders: 0,
    todayOrders: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const limit = 10;

  const fetchOrders = useCallback(async (page: number, status: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.getOrders(params);
      const payload = (response.data as any) || {};
      const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setOrders(items);
      const m = payload.meta || response.meta;
      if (m) setMeta(m as OrderMeta);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrders([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, limit]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await api.getOrders({ limit: 1000 });
      const payload = (response.data as any) || {};
      const allOrders: Order[] = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      const today = new Date().toISOString().split("T")[0];
      const totalOrders = payload.meta?.total || allOrders.length;
      const todayOrders = allOrders.filter((o: Order) => o.createdAt?.startsWith(today)).length;
      const pending = allOrders.filter((o: Order) =>
        ["PLACED", "CONFIRMED", "PROCESSING"].includes(o.status)
      ).length;
      const delivered = allOrders.filter((o: Order) => o.status === "DELIVERED").length;
      const cancelled = allOrders.filter((o: Order) => o.status === "CANCELLED").length;
      const totalRevenue = allOrders
        .filter((o: Order) => o.status === "DELIVERED")
        .reduce((sum: number, o: Order) => sum + (o.total || 0), 0);

      setStats({ totalOrders, todayOrders, pending, delivered, cancelled, totalRevenue });
    } catch {
      // Stats are non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(currentPage, activeTab);
  }, [currentPage, activeTab, fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleTabChange = (status: string) => {
    setActiveTab(status);
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      fetchOrders(1, activeTab);
    }
  };

  const handleDateFilter = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setActiveTab("");
    setCurrentPage(1);
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const phone = getCustomerPhone(order).toLowerCase();
    const orderNum = (order.orderNumber || "").toLowerCase();
    return phone.includes(query) || orderNum.includes(query);
  });

  const totalPages = meta?.totalPages || 1;
  const hasActiveFilters = searchQuery || startDate || endDate || activeTab;

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, icon: Package, color: "bg-gray-100 text-gray-600" },
    { label: "Today's Orders", value: stats.todayOrders, icon: Clock, color: "bg-blue-100 text-blue-600" },
    { label: "Pending", value: stats.pending, icon: TrendingUp, color: "bg-yellow-100 text-yellow-600" },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle, color: "bg-green-100 text-green-600" },
    { label: "Cancelled", value: stats.cancelled, icon: XCircle, color: "bg-red-100 text-red-600" },
    { label: "Revenue", value: formatCurrency(stats.totalRevenue), icon: IndianRupee, color: "bg-[#176B32]/10 text-[#176B32]" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#176B32]" />
            Orders
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track all customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/orders/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#176B32] rounded-lg hover:bg-[#145a29] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Order
          </Link>
          <button
            onClick={() => {
              fetchOrders(currentPage, activeTab);
              fetchStats();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {statsLoading ? (
                      <span className="inline-block w-12 h-5 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Date Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 hidden md:block" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleDateFilter();
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                handleDateFilter();
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
            />
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-medium text-[#176B32] bg-[#176B32]/10 rounded-lg hover:bg-[#176B32]/20 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#176B32] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#176B32] animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery || startDate || endDate ? "Try adjusting your filters" : "Orders will appear here"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => (window.location.href = `/orders/${order.id}`)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-[#176B32] hover:underline">
                        {(order.orderNumber || `ORD-${order.id.slice(-5).toUpperCase()}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{getCustomerName(order)}</span>
                        <span className="text-xs text-gray-500">{getCustomerPhone(order)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full min-w-[1.5rem]">
                        {getOrderItemCount(order)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${PAYMENT_METHOD_COLORS[order.paymentMethod] || "bg-gray-100 text-gray-800"}`}>
                          {(order.paymentMethod || "N/A").replace(/_/g, " ")}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${PAYMENT_STATUS_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-800"}`}>
                          {(order.paymentStatus || "N/A").replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {order.deliveryDate ? formatDate(order.deliveryDate) : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#176B32] bg-[#176B32]/10 rounded-lg hover:bg-[#176B32]/20 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredOrders.length > 0 && meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/30">
            <p className="text-sm text-gray-500">
              Showing page <span className="font-medium text-gray-700">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-700">{meta.totalPages}</span>
              {" "}({meta.total} orders)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-[#176B32] text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
