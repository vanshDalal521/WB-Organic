"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Repeat,
} from "lucide-react";

interface SubscriptionItem {
  product: { name: string };
  quantity: number;
}

interface Subscription {
  id: string;
  status: string;
  frequency: string;
  startDate: string;
  nextDeliveryDate: string;
  totalAmount: number;
  items: SubscriptionItem[];
  user: { phone: string };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Paused", value: "PAUSED" },
  { label: "Cancelled", value: "CANCELLED" },
];

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

function formatDate(dateString: string): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getStatusBadge(status: string) {
  const colors = STATUS_COLORS[status] || { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function getFrequencyBadge(frequency: string) {
  const colors = FREQUENCY_COLORS[frequency] || { bg: "bg-gray-100", text: "text-gray-800" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {frequency.charAt(0) + frequency.slice(1).toLowerCase()}
    </span>
  );
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const fetchSubscriptions = useCallback(async (page: number, status: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (status) params.status = status;

      const response = await api.getSubscriptions(params);
      const payload = (response.data as any) || {};
      const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setSubscriptions(items);
      const m = payload.meta || response.meta;
      if (m) setMeta(m as Meta);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
      setSubscriptions([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSubscriptions(currentPage, activeTab);
  }, [currentPage, activeTab, fetchSubscriptions]);

  const handleTabChange = (status: string) => {
    setActiveTab(status);
    setCurrentPage(1);
  };

  const totalPages = meta?.totalPages || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Repeat className="w-6 h-6 text-[#176B32]" />
            Subscriptions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage recurring customer subscriptions</p>
        </div>
        <button
          onClick={() => fetchSubscriptions(currentPage, activeTab)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1">
        <div className="flex items-center gap-1 overflow-x-auto">
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

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#176B32] animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading subscriptions...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Repeat className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No subscriptions found</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab ? "No subscriptions match the current filter" : "Subscriptions will appear here"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Next Delivery
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{sub.user?.phone || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4">{getFrequencyBadge(sub.frequency)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full min-w-[1.5rem]">
                        {sub.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(sub.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(sub.nextDeliveryDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{formatDate(sub.startDate)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && subscriptions.length > 0 && meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/30">
            <p className="text-sm text-gray-500">
              Showing page <span className="font-medium text-gray-700">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-700">{meta.totalPages}</span>
              {" "}({meta.total} subscriptions)
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
