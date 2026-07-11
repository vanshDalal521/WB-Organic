"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  ShoppingCart,
  IndianRupee,
  Wallet,
  Repeat,
  Wine,
  Gift,
  Users,
  UserCheck,
  UserX,
  Pencil,
  Loader2,
  Package,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star,
  CreditCard,
  Truck,
} from "lucide-react";
import { api } from "@/lib/api";

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  type: string;
  landmark?: string;
  lat?: number;
  lng?: number;
}

interface OrderItem {
  product: { name: string; images?: string[] };
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
  items: OrderItem[];
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface Subscription {
  id: string;
  status: string;
  frequency: string;
  startDate: string;
  nextDeliveryDate: string;
  totalAmount: number;
  items: { product: { name: string }; quantity: number }[];
}

interface BottleTransaction {
  id: string;
  type: string;
  count: number;
  bottleType: { name: string };
  createdAt: string;
  description?: string;
}

interface ReferredUser {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth?: string;
  isActive: boolean;
  createdAt: string;
  addresses?: Address[];
  orders?: Order[];
  wallet?: { balance: number; transactions?: WalletTransaction[] };
  subscriptions?: Subscription[];
  bottleLedger?: { loadedCount: number; issuedCount: number; collectedCount: number };
  bottleTransactions?: BottleTransaction[];
  referralCode?: string;
  totalReferrals?: number;
  referredUsers?: ReferredUser[];
  totalOrders?: number;
  totalSpent?: number;
}

type TabId = "overview" | "orders" | "addresses" | "wallet" | "subscriptions" | "bottles" | "referral";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: Star },
  { id: "orders", label: "Orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "subscriptions", label: "Subscriptions", icon: Repeat },
  { id: "bottles", label: "Bottle Ledger", icon: Wine },
  { id: "referral", label: "Referral", icon: Gift },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PLACED: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  CONFIRMED: { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  PROCESSING: { bg: "bg-indigo-100", text: "text-indigo-800", dot: "bg-indigo-500" },
  OUT_FOR_DELIVERY: { bg: "bg-cyan-100", text: "text-cyan-800", dot: "bg-cyan-500" },
  DELIVERED: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  ACTIVE: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  PAUSED: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
};

const WALLET_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  RECHARGE: { bg: "bg-green-100", text: "text-green-800" },
  ORDER_PAYMENT: { bg: "bg-blue-100", text: "text-blue-800" },
  REFUND: { bg: "bg-purple-100", text: "text-purple-800" },
  REFERRAL: { bg: "bg-orange-100", text: "text-orange-800" },
};

const CREDIT_TYPES = ["RECHARGE", "REFUND", "REFERRAL"];

const BOTTLE_TX_COLORS: Record<string, { bg: string; text: string }> = {
  LOAD: { bg: "bg-blue-100", text: "text-blue-800" },
  ISSUE: { bg: "bg-orange-100", text: "text-orange-800" },
  COLLECT: { bg: "bg-purple-100", text: "text-purple-800" },
};

const AVATAR_COLORS = [
  "bg-[#176B32]/20 text-[#176B32]",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

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

function getInitials(name: string): string {
  const safe = name || "";
  return safe
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

function getAvatarColor(name: string): string {
  const safe = name || "";
  let hash = 0;
  for (let i = 0; i < safe.length; i++) hash = safe.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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

function getWalletTypeBadge(type: string) {
  const colors = WALLET_TYPE_COLORS[type] || { bg: "bg-gray-100", text: "text-gray-800" };
  const label = type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  );
}

function getBottleTxBadge(type: string) {
  const colors = BOTTLE_TX_COLORS[type] || { bg: "bg-gray-100", text: "text-gray-800" };
  const label = type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [ordersPage, setOrdersPage] = useState(1);
  const [walletPage, setWalletPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCustomer(id);
      const raw = (res.data as any)?.data || res.data;
      const normalized = {
        ...raw,
        name: raw.fullName || raw.name || "",
        isActive: raw.user?.isActive ?? raw.isActive ?? false,
        phone: raw.user?.phone ?? raw.phone,
        email: raw.user?.email ?? raw.email,
        createdAt: raw.user?.createdAt ?? raw.createdAt,
      };
      setCustomer(normalized as CustomerProfile);
    } catch (err: any) {
      setError(err.message || "Failed to load customer");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleBlockToggle = async () => {
    if (!customer) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/customers/${customer.id}/toggle-status`);
      setCustomer((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev));
      setToast({
        type: "success",
        message: customer.isActive ? "Customer blocked" : "Customer unblocked",
      });
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Action failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const ordersPerPage = 10;
  const walletTxPerPage = 10;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => router.push("/customers")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error || "Customer not found"}
        </div>
      </div>
    );
  }

  const allOrders = customer.orders || [];
  const paginatedOrders = allOrders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);
  const ordersTotalPages = Math.max(1, Math.ceil(allOrders.length / ordersPerPage));

  const walletTx = customer.wallet?.transactions || [];
  const paginatedWalletTx = walletTx.slice((walletPage - 1) * walletTxPerPage, walletPage * walletTxPerPage);
  const walletTxTotalPages = Math.max(1, Math.ceil(walletTx.length / walletTxPerPage));

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.type === "success" ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => router.push("/customers")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${getAvatarColor(
              customer.name
            )}`}
          >
            {getInitials(customer.name)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  customer.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${customer.isActive ? "bg-green-500" : "bg-red-500"}`} />
                {customer.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {customer.phone}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {customer.email}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Joined {formatDate(customer.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/customers/${customer.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleBlockToggle}
              disabled={actionLoading}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                customer.isActive
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                  : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
              }`}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : customer.isActive ? (
                <UserX className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              {customer.isActive ? "Block" : "Unblock"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#176B32] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#176B32]/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-[#176B32]" />
                </div>
                <span className="text-sm font-medium text-gray-500">Total Orders</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{customer.totalOrders || allOrders.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Total Spent</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(customer.totalSpent || 0)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Wallet Balance</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(customer.wallet?.balance || 0)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Repeat className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Subscriptions</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{customer.subscriptions?.length || 0}</p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            </div>
            {allOrders.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-[#176B32]">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {order.items?.reduce((s, i) => s + i.quantity, 0) || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {allOrders.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No orders found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Order #
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
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-[#176B32]">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {order.items?.reduce((s, i) => s + i.quantity, 0) || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-700 capitalize">
                              {order.paymentMethod?.replace(/_/g, " ") || "N/A"}
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                order.paymentStatus === "PAID"
                                  ? "text-green-600"
                                  : order.paymentStatus === "PENDING"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {order.paymentStatus?.replace(/_/g, " ") || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {ordersTotalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Page <span className="font-medium text-gray-700">{ordersPage}</span> of{" "}
                    <span className="font-medium text-gray-700">{ordersTotalPages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                      disabled={ordersPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <button
                      onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
                      disabled={ordersPage === ordersTotalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "addresses" && (
        <div className="space-y-4">
          {(!customer.addresses || customer.addresses.length === 0) ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No addresses saved</p>
            </div>
          ) : (
            customer.addresses.map((addr) => (
              <div key={addr.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#176B32]/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#176B32]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {addr.label || addr.type}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {addr.type}
                        </span>
                        {addr.isDefault && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#176B32]/10 text-[#176B32]">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{addr.street}</p>
                      {addr.landmark && <p className="text-sm text-gray-500">Landmark: {addr.landmark}</p>}
                      <p className="text-sm text-gray-500">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-[#176B32]/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-[#176B32]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Wallet Balance</p>
                <p className="text-3xl font-bold text-[#176B32]">{formatCurrency(customer.wallet?.balance || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            </div>
            {paginatedWalletTx.length === 0 ? (
              <div className="py-12 text-center">
                <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No transactions</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedWalletTx.map((tx) => {
                        const isCredit = CREDIT_TYPES.includes(tx.type);
                        return (
                          <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">{getWalletTypeBadge(tx.type)}</td>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-semibold ${isCredit ? "text-green-600" : "text-red-600"}`}>
                                {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 max-w-[300px]">
                              <span className="text-sm text-gray-500 truncate block">{tx.description || "—"}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-500">{formatDate(tx.createdAt)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {walletTxTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Page <span className="font-medium text-gray-700">{walletPage}</span> of{" "}
                      <span className="font-medium text-gray-700">{walletTxTotalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWalletPage((p) => Math.max(1, p - 1))}
                        disabled={walletPage === 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <button
                        onClick={() => setWalletPage((p) => Math.min(walletTxTotalPages, p + 1))}
                        disabled={walletPage === walletTxTotalPages}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          {(!customer.subscriptions || customer.subscriptions.length === 0) ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <Repeat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No subscriptions</p>
            </div>
          ) : (
            customer.subscriptions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(sub.status)}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {sub.frequency?.charAt(0) + sub.frequency?.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Start: {formatDate(sub.startDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        Next: {formatDate(sub.nextDeliveryDate)}
                      </span>
                      <span className="font-semibold text-gray-900">{formatCurrency(sub.totalAmount)}</span>
                    </div>
                    {sub.items && sub.items.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {sub.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {item.product?.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "bottles" && (
        <div className="space-y-6">
          {/* Bottle Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Wine className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Loaded</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{customer.bottleLedger?.loadedCount || 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Wine className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Issued</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{customer.bottleLedger?.issuedCount || 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Wine className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Collected</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{customer.bottleLedger?.collectedCount || 0}</p>
            </div>
          </div>

          {/* Bottle Transactions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Bottle Transactions</h2>
            </div>
            {(!customer.bottleTransactions || customer.bottleTransactions.length === 0) ? (
              <div className="py-12 text-center">
                <Wine className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No bottle transactions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Bottle Type
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customer.bottleTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">{getBottleTxBadge(tx.type)}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{tx.bottleType?.name || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{tx.count}</span>
                        </td>
                        <td className="px-6 py-4 max-w-[250px]">
                          <span className="text-sm text-gray-500 truncate block">{tx.description || "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">{formatDate(tx.createdAt)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "referral" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#176B32]/10 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-[#176B32]" />
                </div>
                <span className="text-sm font-medium text-gray-500">Referral Code</span>
              </div>
              <p className="text-2xl font-bold text-[#176B32] font-mono">{customer.referralCode || "N/A"}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Total Referrals</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{customer.totalReferrals || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Referred Users</h2>
            </div>
            {(!customer.referredUsers || customer.referredUsers.length === 0) ? (
              <div className="py-12 text-center">
                <Gift className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No referred users</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customer.referredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{user.name || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {user.phone}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
