"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  ArrowLeft,
  Repeat,
  User,
  Phone,
  ExternalLink,
  Loader2,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Pause,
  Play,
  SkipForward,
  X,
  AlertTriangle,
  Package,
  Truck,
} from "lucide-react";

interface SubscriptionItem {
  product: { name: string; id?: string };
  variant?: { name?: string; size?: string };
  quantity: number;
  price: number;
  total?: number;
}

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  notes?: string;
  changedBy?: string;
}

interface UpcomingDelivery {
  id: string;
  date: string;
  status: string;
  items?: { product: { name: string }; quantity: number }[];
}

interface Subscription {
  id: string;
  status: string;
  frequency: string;
  startDate: string;
  nextDeliveryDate: string;
  totalAmount: number;
  paymentMethod?: string;
  items: SubscriptionItem[];
  customer?: { name?: string; phone?: string; email?: string; id?: string; user?: { name?: string; phone?: string } };
  user?: { phone?: string; name?: string; email?: string };
  address?: { fullAddress?: string; street?: string; area?: string; city?: string; pincode?: string };
  deliverySlot?: string;
  statusHistory?: StatusHistoryEntry[];
  upcomingDeliveries?: UpcomingDelivery[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  PAUSED: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
};

const FREQUENCY_COLORS: Record<string, { bg: string; text: string }> = {
  DAILY: { bg: "bg-blue-100", text: "text-blue-800" },
  WEEKLY: { bg: "bg-purple-100", text: "text-purple-800" },
  CUSTOM: { bg: "bg-orange-100", text: "text-orange-800" },
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
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function getFrequencyBadge(f: string) {
  const c = FREQUENCY_COLORS[f] || { bg: "bg-gray-100", text: "text-gray-800" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {f.charAt(0) + f.slice(1).toLowerCase()}
    </span>
  );
}

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [pausing, setPausing] = useState(false);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resuming, setResuming] = useState(false);

  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipDate, setSkipDate] = useState("");
  const [skipping, setSkipping] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/subscriptions/${id}`);
      const payload = (res.data as any) || {};
      setSubscription(payload.data || payload);
    } catch (err: any) {
      setError(err.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handlePause = async () => {
    setPausing(true);
    try {
      await api.patch(`/subscriptions/${id}/pause`, { reason: pauseReason });
      addToast("success", "Subscription paused");
      setShowPauseModal(false);
      setPauseReason("");
      fetchSubscription();
    } catch (err: any) {
      addToast("error", err.message || "Failed to pause");
    } finally {
      setPausing(false);
    }
  };

  const handleResume = async () => {
    setResuming(true);
    try {
      await api.patch(`/subscriptions/${id}/resume`);
      addToast("success", "Subscription resumed");
      setShowResumeModal(false);
      fetchSubscription();
    } catch (err: any) {
      addToast("error", err.message || "Failed to resume");
    } finally {
      setResuming(false);
    }
  };

  const handleSkip = async () => {
    if (!skipDate) return;
    setSkipping(true);
    try {
      await api.patch(`/subscriptions/${id}/skip`, { deliveryDate: skipDate });
      addToast("success", "Next delivery skipped");
      setShowSkipModal(false);
      setSkipDate("");
      fetchSubscription();
    } catch (err: any) {
      addToast("error", err.message || "Failed to skip delivery");
    } finally {
      setSkipping(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.patch(`/subscriptions/${id}/cancel`, { reason: cancelReason });
      addToast("success", "Subscription cancelled");
      setShowCancelModal(false);
      setCancelReason("");
      fetchSubscription();
    } catch (err: any) {
      addToast("error", err.message || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#176B32] animate-spin mb-3" />
        <p className="text-gray-500 text-sm">Loading subscription details...</p>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link href="/subscriptions" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#176B32] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Subscriptions
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error || "Subscription not found"}</p>
          <button onClick={fetchSubscription} className="mt-4 px-4 py-2 text-sm font-medium text-[#176B32] bg-[#176B32]/10 rounded-lg hover:bg-[#176B32]/20 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const subId = subscription.id || (subscription as any).id || id;
  const customerName = subscription.customer?.name || subscription.user?.name || "N/A";
  const customerPhone = subscription.customer?.phone || subscription.user?.phone || "N/A";
  const customerId = subscription.customer?.id;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/subscriptions" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#176B32] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Subscriptions
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{subId.slice(-8).toUpperCase()}</h1>
              {getStatusBadge(subscription.status)}
              {getFrequencyBadge(subscription.frequency)}
            </div>
            <p className="text-gray-500 text-sm mt-1">Subscription Details</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {subscription.status === "ACTIVE" && (
              <>
                <button onClick={() => setShowPauseModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
                <button onClick={() => setShowSkipModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <SkipForward className="w-4 h-4" />
                  Skip Next
                </button>
                <button onClick={() => setShowCancelModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
            {subscription.status === "PAUSED" && (
              <button onClick={() => setShowResumeModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Customer</h2>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#176B32]/10 rounded-lg">
                <User className="w-6 h-6 text-[#176B32]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{customerName}</p>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {customerPhone}
                </span>
                {customerId && (
                  <Link href={`/customers/${customerId}`} className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-[#176B32] hover:underline">
                    View Customer
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Subscription Info</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(subscription.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Next Delivery</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5 mt-1">
                  <Truck className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(subscription.nextDeliveryDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5 mt-1">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                  {subscription.paymentMethod || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-lg font-bold text-[#176B32] mt-1">{formatCurrency(subscription.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Product</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Variant</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Qty</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscription.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 text-sm font-medium text-gray-900">{item.product?.name || "Unknown"}</td>
                      <td className="py-3 text-sm text-gray-600">{item.variant?.name || item.variant?.size || "—"}</td>
                      <td className="py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                      <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Delivery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Delivery Slot</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {subscription.deliverySlot || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {subscription.address?.fullAddress ||
                    [subscription.address?.street, subscription.address?.area, subscription.address?.city, subscription.address?.pincode]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {subscription.statusHistory && subscription.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Status History</h2>
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                {subscription.statusHistory.map((entry, i) => {
                  const c = STATUS_COLORS[entry.status] || { dot: "bg-gray-500" };
                  const label = entry.status.charAt(0) + entry.status.slice(1).toLowerCase();
                  const isLast = i === subscription.statusHistory!.length - 1;
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
        </div>

        <div className="space-y-6">
          {subscription.upcomingDeliveries && subscription.upcomingDeliveries.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Upcoming Deliveries</h2>
              <div className="space-y-3">
                {subscription.upcomingDeliveries.map((del) => (
                  <div key={del.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(del.date)}
                      </span>
                      {getStatusBadge(del.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {subscription.status === "ACTIVE" && (
                <>
                  <button onClick={() => setShowPauseModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                    <Pause className="w-4 h-4" />
                    Pause Subscription
                  </button>
                  <button onClick={() => setShowSkipModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                    <SkipForward className="w-4 h-4" />
                    Skip Next Delivery
                  </button>
                </>
              )}
              {subscription.status === "PAUSED" && (
                <button onClick={() => setShowResumeModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  <Play className="w-4 h-4" />
                  Resume Subscription
                </button>
              )}
              {subscription.status !== "CANCELLED" && (
                <button onClick={() => setShowCancelModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                  <X className="w-4 h-4" />
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg"><Pause className="w-5 h-5 text-yellow-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900">Pause Subscription</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">This will pause all upcoming deliveries until resumed.</p>
            <textarea value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} placeholder="Reason for pausing (optional)..." rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 resize-none mb-4" />
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => { setShowPauseModal(false); setPauseReason(""); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
              <button onClick={handlePause} disabled={pausing} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors">
                {pausing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg"><Play className="w-5 h-5 text-green-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900">Resume Subscription</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to resume this subscription? Upcoming deliveries will be reactivated.</p>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setShowResumeModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleResume} disabled={resuming} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                {resuming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg"><SkipForward className="w-5 h-5 text-blue-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900">Skip Next Delivery</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Select the delivery date you want to skip.</p>
            <input type="date" value={skipDate} onChange={(e) => setSkipDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-4" />
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => { setShowSkipModal(false); setSkipDate(""); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSkip} disabled={!skipDate || skipping} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {skipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" />}
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone. All future deliveries will be cancelled.</p>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation..." rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none mb-4" />
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => { setShowCancelModal(false); setCancelReason(""); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
              <button onClick={handleCancel} disabled={cancelling} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
