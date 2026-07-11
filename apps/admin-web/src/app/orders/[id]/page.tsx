"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
  ChevronDown,
  AlertTriangle,
  X,
  Download,
  FileText,
  RotateCcw,
} from "lucide-react";

interface OrderItem {
  product: { name: string; id?: string };
  variant?: { name?: string; size?: string };
  quantity: number;
  price: number;
  total?: number;
}

interface StatusHistory {
  status: string;
  timestamp: string;
  notes?: string;
  changedBy?: string;
}

interface Payment {
  id?: string;
  method: string;
  status: string;
  transactionId?: string;
  amount: number;
  createdAt?: string;
}

interface Address {
  type?: string;
  label?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  fullAddress?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  total: number;
  subtotal: number;
  deliveryCharge?: number;
  discount?: number;
  walletDeduction?: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryDate?: string;
  deliverySlot?: string;
  createdAt: string;
  items: OrderItem[];
  customer: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    user?: { name?: string; phone?: string; email?: string };
  };
  address?: Address;
  delivery?: {
    partner?: { name?: string; phone?: string };
    status?: string;
    proof?: string;
  };
  payment?: Payment;
  payments?: Payment[];
  statusHistory?: StatusHistory[];
  invoiceNumber?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PLACED: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  CONFIRMED: { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  PROCESSING: { bg: "bg-indigo-100", text: "text-indigo-800", dot: "bg-indigo-500" },
  OUT_FOR_DELIVERY: { bg: "bg-cyan-100", text: "text-cyan-800", dot: "bg-cyan-500" },
  DELIVERED: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
};

const VALID_NEXT_STATUSES: Record<string, string[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
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

function formatDateTime(dateString: string): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return `₹${(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delivery partner
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [assigningPartner, setAssigningPartner] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Refund modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getOrder(id);
      const data = (response.data as any) || response;
      setOrder(data.data || data);
    } catch (err: any) {
      setError(err.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDeliveryPartners = useCallback(async () => {
    try {
      const response = await api.getDeliveryPartners({ limit: 100, isActive: "true" });
      const payload = (response.data as any) || {};
      const list = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setDeliveryPartners(list);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchOrder();
    fetchDeliveryPartners();
  }, [fetchOrder, fetchDeliveryPartners]);

  const handleUpdateStatus = async () => {
    if (!newStatus || !order) return;
    setUpdatingStatus(true);
    try {
      await api.updateOrderStatus(order.id, newStatus, statusNotes || undefined);
      addToast("success", `Order status updated to ${newStatus.replace(/_/g, " ").toLowerCase()}`);
      setNewStatus("");
      setStatusNotes("");
      fetchOrder();
    } catch (err: any) {
      addToast("error", err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await api.updateOrderStatus(order.id, "CANCELLED", cancelReason || undefined);
      addToast("success", "Order has been cancelled");
      setShowCancelModal(false);
      setCancelReason("");
      fetchOrder();
    } catch (err: any) {
      addToast("error", err.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    setRefunding(true);
    try {
      await api.updateOrderStatus(order.id, "CANCELLED", `Refund: ${refundReason} (Amount: ${refundAmount})`);
      addToast("success", `Refund of ${formatCurrency(Number(refundAmount))} processed`);
      setShowRefundModal(false);
      setRefundAmount("");
      setRefundReason("");
      fetchOrder();
    } catch (err: any) {
      addToast("error", err.message || "Failed to process refund");
    } finally {
      setRefunding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#176B32] animate-spin mb-3" />
        <p className="text-gray-500 text-sm">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#176B32] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error || "Order not found"}</p>
          <button
            onClick={fetchOrder}
            className="mt-4 px-4 py-2 text-sm font-medium text-[#176B32] bg-[#176B32]/10 rounded-lg hover:bg-[#176B32]/20 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const validNextStatuses = VALID_NEXT_STATUSES[order.status] || [];
  const payment = order.payment || order.payments?.[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Link */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#176B32] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {order.orderNumber || `ORD-${order.id.slice(-5).toUpperCase()}`}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Created on {formatDateTime(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {order.invoiceNumber && (
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Invoice
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Order Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Order Number</p>
                <p className="text-sm font-medium text-gray-900 font-mono">{order.orderNumber || `ORD-${order.id.slice(-5).toUpperCase()}`}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm font-medium text-gray-900">{(order.type || "ONE_TIME").replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Delivery Date</p>
                <p className="text-sm font-medium text-gray-900">{order.deliveryDate ? formatDate(order.deliveryDate) : "—"}</p>
              </div>
              {order.deliverySlot && (
                <div>
                  <p className="text-xs text-gray-500">Delivery Slot</p>
                  <p className="text-sm font-medium text-gray-900">{order.deliverySlot}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Customer</h2>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#176B32]/10 rounded-lg">
                <User className="w-6 h-6 text-[#176B32]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{order.customer?.name || order.customer?.user?.name || "N/A"}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {order.customer?.phone || order.customer?.user?.phone || "N/A"}
                  </span>
                  {(order.customer?.email || order.customer?.user?.email) && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {order.customer?.email || order.customer?.user?.email}
                    </span>
                  )}
                </div>
                {order.customer?.id && (
                  <Link
                    href={`/customers/${order.customer.id}`}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-[#176B32] hover:underline"
                  >
                    View Customer
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Product</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Variant</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Qty</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Unit Price</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="py-3 text-sm font-medium text-gray-900">{item.product?.name || "Unknown Product"}</td>
                      <td className="py-3 text-sm text-gray-600">
                        {item.variant?.name || item.variant?.size || "—"}
                      </td>
                      <td className="py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                      <td className="py-3 text-sm text-gray-600 text-right">{formatCurrency(item.price)}</td>
                      <td className="py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.total || item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pricing Summary */}
            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">{formatCurrency(order.subtotal || 0)}</span>
              </div>
              {order.deliveryCharge != null && order.deliveryCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Charge</span>
                  <span className="text-gray-700">{formatCurrency(order.deliveryCharge)}</span>
                </div>
              )}
              {order.discount != null && order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.walletDeduction != null && order.walletDeduction > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Wallet Deduction</span>
                  <span className="text-blue-600">-{formatCurrency(order.walletDeduction)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Grand Total</span>
                <span className="text-[#176B32]">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Address */}
          {order.address && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Delivery Address</h2>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gray-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  {order.address.type && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                      {order.address.type}
                    </span>
                  )}
                  {order.address.label && (
                    <p className="text-sm font-medium text-gray-900">{order.address.label}</p>
                  )}
                  <p className="text-sm text-gray-700 mt-1">
                    {order.address.fullAddress ||
                      [order.address.street, order.address.area, order.address.city, order.address.state, order.address.pincode]
                        .filter(Boolean)
                        .join(", ")}
                  </p>
                  {order.address.landmark && (
                    <p className="text-xs text-gray-500 mt-1">Landmark: {order.address.landmark}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Delivery</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Assigned Partner</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.delivery?.partner?.name || "Not assigned"}
                </p>
                {order.delivery?.partner?.phone && (
                  <p className="text-xs text-gray-500">{order.delivery.partner.phone}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Delivery Status</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.delivery?.status ? order.delivery.status.replace(/_/g, " ") : "—"}
                </p>
              </div>
              {order.delivery?.proof && (
                <div>
                  <p className="text-xs text-gray-500">Proof</p>
                  <a
                    href={order.delivery.proof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#176B32] hover:underline inline-flex items-center gap-1"
                  >
                    View Proof
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Status Timeline</h2>
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                {order.statusHistory.map((entry, index) => {
                  const colors = STATUS_COLORS[entry.status] || { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" };
                  const label = entry.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
                  const isLast = index === order.statusHistory!.length - 1;
                  return (
                    <div key={index} className="relative mb-6 last:mb-0">
                      <div className={`absolute -left-4 top-1 w-4 h-4 rounded-full border-2 border-white ${colors.dot}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isLast ? "text-gray-900" : "text-gray-700"}`}>
                            {label}
                          </span>
                          {isLast && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#176B32]/10 text-[#176B32] rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(entry.timestamp)}</p>
                        {entry.notes && (
                          <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1">{entry.notes}</p>
                        )}
                        {entry.changedBy && (
                          <p className="text-xs text-gray-400 mt-0.5">by {entry.changedBy}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions & Payment */}
        <div className="space-y-6">
          {/* Payment Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Payment</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Method</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_METHOD_COLORS[payment?.method || order.paymentMethod] || "bg-gray-100 text-gray-800"}`}>
                  {(payment?.method || order.paymentMethod || "N/A").replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[payment?.status || order.paymentStatus] || "bg-gray-100 text-gray-800"}`}>
                  {(payment?.status || order.paymentStatus || "N/A").replace(/_/g, " ")}
                </span>
              </div>
              {(payment?.transactionId) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Transaction ID</span>
                  <span className="text-sm font-mono text-gray-700">{payment.transactionId}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                  <span className="text-lg font-bold text-[#176B32]">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Change Status */}
          {validNextStatuses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Change Status</h2>
              <div className="space-y-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]"
                >
                  <option value="">Select new status...</option>
                  {validNextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add notes (optional)"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] resize-none"
                />
                <button
                  onClick={handleUpdateStatus}
                  disabled={!newStatus || updatingStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#176B32] rounded-lg hover:bg-[#145a29] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  Update Status
                </button>
              </div>
            </div>
          )}

          {/* Assign Delivery Partner */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Delivery Partner</h2>
            <div className="space-y-3">
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]"
              >
                <option value="">Select partner...</option>
                {deliveryPartners.map((partner: any) => (
                  <option key={partner.id || partner.id} value={partner.id || partner.id}>
                    {partner.name || partner.user?.name || "Unknown"} - {partner.phone || partner.user?.phone || ""}
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedPartner || assigningPartner}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#176B32] bg-[#176B32]/10 border border-[#176B32]/20 rounded-lg hover:bg-[#176B32]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {assigningPartner ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}
                Save Assignment
              </button>
            </div>
          </div>

          {/* Invoice */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Invoice</h2>
            <div className="space-y-3">
              {order.invoiceNumber ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Invoice Number</p>
                    <p className="text-sm font-medium text-gray-900 font-mono">{order.invoiceNumber}</p>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#176B32] bg-[#176B32]/10 rounded-lg hover:bg-[#176B32]/20 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">No invoice generated</p>
              )}
            </div>
          </div>

          {/* Destructive Actions */}
          {(validNextStatuses.includes("CANCELLED") || (payment?.status === "PAID" || order.paymentStatus === "PAID")) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Actions</h2>
              <div className="space-y-3">
                {validNextStatuses.includes("CANCELLED") && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel Order
                  </button>
                )}
                {(payment?.status === "PAID" || order.paymentStatus === "PAID") && order.status !== "CANCELLED" && (
                  <button
                    onClick={() => {
                      setRefundAmount(String(order.total));
                      setShowRefundModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Process Refund
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cancel Order</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none mb-4"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <RotateCcw className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Process Refund</h3>
            </div>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    max={order.total}
                    min="0"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter refund reason..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundAmount("");
                  setRefundReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundAmount || Number(refundAmount) <= 0 || refunding}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {refunding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
