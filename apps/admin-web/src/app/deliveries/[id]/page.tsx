"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  ArrowLeft,
  Truck,
  User,
  Phone,
  ExternalLink,
  Loader2,
  Calendar,
  MapPin,
  CreditCard,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Image as ImageIcon,
} from "lucide-react";

interface DeliveryItem {
  product: { name: string; id?: string };
  variant?: { name?: string; size?: string };
  quantity: number;
  price?: number;
}

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  notes?: string;
  changedBy?: string;
}

interface DeliveryPartner {
  id?: string;
  name?: string;
  phone?: string;
  user?: { name?: string; phone?: string };
}

interface Delivery {
  id: string;
  orderNumber?: string;
  orderId?: string;
  status: string;
  deliveryDate?: string;
  scheduledDate?: string;
  createdAt?: string;
  address?: string;
  paymentType?: string;
  payment?: { amount?: number; method?: string };
  totalAmount?: number;
  amountToCollect?: number;
  items?: DeliveryItem[];
  customer?: { name?: string; phone?: string; email?: string; id?: string; user?: { name?: string; phone?: string } };
  deliveryPartner?: DeliveryPartner;
  assignedPartner?: DeliveryPartner;
  partnerAssignedAt?: string;
  statusHistory?: StatusHistoryEntry[];
  proof?: string;
  deliveryProof?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  ASSIGNED: { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  OUT_FOR_DELIVERY: { bg: "bg-cyan-100", text: "text-cyan-800", dot: "bg-cyan-500" },
  DELIVERED: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  FAILED: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
};

const VALID_NEXT_STATUSES: Record<string, string[]> = {
  PENDING: ["ASSIGNED", "OUT_FOR_DELIVERY", "CANCELLED"],
  ASSIGNED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: [],
  CANCELLED: [],
};

function formatDate(d: string): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d: string): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(a: number): string {
  return `₹${(a || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getStatusBadge(status: string) {
  const c = STATUS_COLORS[status] || { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" };
  const label = status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
}

export default function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [assigningPartner, setAssigningPartner] = useState(false);

  const fetchDelivery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/delivery/deliveries/${id}`);
      const payload = (res.data as any) || {};
      setDelivery(payload.data || payload);
    } catch (err: any) {
      setError(err.message || "Failed to load delivery");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDeliveryPartners = useCallback(async () => {
    try {
      const res = await api.getDeliveryPartners({ limit: 100, isActive: "true" });
      const payload = (res.data as any) || {};
      const list = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setDeliveryPartners(list);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchDelivery();
    fetchDeliveryPartners();
  }, [fetchDelivery, fetchDeliveryPartners]);

  const handleUpdateStatus = async () => {
    if (!newStatus || !delivery) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/delivery/deliveries/${delivery.id || delivery.id}/status`, { status: newStatus });
      addToast("success", `Delivery status updated to ${newStatus.replace(/_/g, " ").toLowerCase()}`);
      setNewStatus("");
      fetchDelivery();
    } catch (err: any) {
      addToast("error", err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignPartner = async () => {
    if (!selectedPartner || !delivery) return;
    setAssigningPartner(true);
    try {
      await api.patch(`/delivery/deliveries/${delivery.id || delivery.id}/assign`, { partnerId: selectedPartner });
      addToast("success", "Delivery partner assigned");
      setSelectedPartner("");
      fetchDelivery();
    } catch (err: any) {
      addToast("error", err.message || "Failed to assign partner");
    } finally {
      setAssigningPartner(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#176B32] animate-spin mb-3" />
        <p className="text-gray-500 text-sm">Loading delivery details...</p>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link href="/deliveries" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#176B32] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Deliveries
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error || "Delivery not found"}</p>
          <button onClick={fetchDelivery} className="mt-4 px-4 py-2 text-sm font-medium text-[#176B32] bg-[#176B32]/10 rounded-lg hover:bg-[#176B32]/20 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const deliveryId = delivery.id || delivery.id || id;
  const orderId = delivery.orderId;
  const customerName = delivery.customer?.name || delivery.customer?.user?.name || "N/A";
  const customerPhone = delivery.customer?.phone || delivery.customer?.user?.phone || "N/A";
  const partner = delivery.deliveryPartner || delivery.assignedPartner;
  const partnerName = partner?.name || partner?.user?.name || "Not assigned";
  const partnerPhone = partner?.phone || partner?.user?.phone || "";
  const validNextStatuses = VALID_NEXT_STATUSES[delivery.status] || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/deliveries" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#176B32] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Deliveries
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{deliveryId.slice(-8).toUpperCase()}</h1>
              {getStatusBadge(delivery.status)}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {formatDate(delivery.deliveryDate || delivery.scheduledDate || delivery.createdAt || "")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Order & Customer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500">Order</p>
                {orderId ? (
                  <Link href={`/orders/${orderId}`} className="text-sm font-semibold text-[#176B32] hover:underline inline-flex items-center gap-1 mt-1">
                    {delivery.orderNumber || orderId.slice(-8).toUpperCase()}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-gray-900 mt-1">{delivery.orderNumber || "N/A"}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{customerName}</p>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {customerPhone}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Delivery Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm font-medium text-gray-900 flex items-start gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span>{delivery.address || "N/A"}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Type</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{delivery.paymentType || delivery.payment?.method || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount to Collect</p>
                <p className="text-lg font-bold text-[#176B32] mt-1">{formatCurrency(delivery.amountToCollect || delivery.payment?.amount || delivery.totalAmount || 0)}</p>
              </div>
            </div>
          </div>

          {delivery.items && delivery.items.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Products</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Product</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Variant</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Qty</th>
                      {delivery.items.some((it) => it.price) && (
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Price</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {delivery.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-3 text-sm font-medium text-gray-900">{item.product?.name || "Unknown"}</td>
                        <td className="py-3 text-sm text-gray-600">{item.variant?.name || item.variant?.size || "—"}</td>
                        <td className="py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                        {delivery.items?.some((it: DeliveryItem) => it.price) && (
                          <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.price || 0)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Delivery Partner</h2>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#176B32]/10 rounded-lg">
                <Truck className="w-6 h-6 text-[#176B32]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{partnerName}</p>
                {partnerPhone && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {partnerPhone}
                  </span>
                )}
                {delivery.partnerAssignedAt && (
                  <p className="text-xs text-gray-500 mt-1">Assigned on {formatDate(delivery.partnerAssignedAt)}</p>
                )}
              </div>
            </div>
          </div>

          {delivery.statusHistory && delivery.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Status Timeline</h2>
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                {delivery.statusHistory.map((entry, i) => {
                  const c = STATUS_COLORS[entry.status] || { dot: "bg-gray-500" };
                  const label = entry.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
                  const isLast = i === delivery.statusHistory!.length - 1;
                  return (
                    <div key={i} className="relative mb-6 last:mb-0">
                      <div className={`absolute -left-4 top-1 w-4 h-4 rounded-full border-2 border-white ${c.dot}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isLast ? "text-gray-900" : "text-gray-700"}`}>{label}</span>
                          {isLast && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#176B32]/10 text-[#176B32] rounded">Current</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(entry.timestamp)}</p>
                        {entry.notes && <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1">{entry.notes}</p>}
                        {entry.changedBy && <p className="text-xs text-gray-400 mt-0.5">by {entry.changedBy}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(delivery.proof || delivery.deliveryProof) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Delivery Proof</h2>
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Proof image</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {validNextStatuses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Update Status</h2>
              <div className="space-y-3">
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]">
                  <option value="">Select status...</option>
                  {validNextStatuses.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase())}</option>
                  ))}
                </select>
                <button onClick={handleUpdateStatus} disabled={!newStatus || updatingStatus} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#176B32] rounded-lg hover:bg-[#145a29] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Update Status
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Assign Partner</h2>
            <div className="space-y-3">
              <select value={selectedPartner} onChange={(e) => setSelectedPartner(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]">
                <option value="">Select partner...</option>
                {deliveryPartners.map((p: any) => (
                  <option key={p.id || p.id} value={p.id || p.id}>
                    {p.name || p.user?.name || "Unknown"} - {p.phone || p.user?.phone || ""}
                  </option>
                ))}
              </select>
              <button onClick={handleAssignPartner} disabled={!selectedPartner || assigningPartner} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#176B32] bg-[#176B32]/10 border border-[#176B32]/20 rounded-lg hover:bg-[#176B32]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {assigningPartner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Assign Partner
              </button>
            </div>
          </div>

          {delivery.status !== "DELIVERED" && delivery.status !== "FAILED" && delivery.status !== "CANCELLED" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {validNextStatuses.includes("DELIVERED") && (
                  <button
                    onClick={() => { setNewStatus("DELIVERED"); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Delivered
                  </button>
                )}
                {validNextStatuses.includes("FAILED") && (
                  <button
                    onClick={() => { setNewStatus("FAILED"); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Mark as Failed
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
