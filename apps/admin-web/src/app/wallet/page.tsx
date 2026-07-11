"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Download,
  Filter,
  X,
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
  description: string;
  orderId?: string;
  order?: { id?: string; orderNumber?: string };
  customer?: { name?: string; phone?: string; email?: string };
  customerName?: string;
  customerPhone?: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const TYPE_TABS = [
  { label: "All Transactions", value: "" },
  { label: "Recharges", value: "RECHARGE" },
  { label: "Order Payments", value: "ORDER_PAYMENT" },
  { label: "Refunds", value: "REFUND" },
  { label: "Referrals", value: "REFERRAL" },
];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  RECHARGE: { bg: "bg-green-100", text: "text-green-800" },
  ORDER_PAYMENT: { bg: "bg-blue-100", text: "text-blue-800" },
  REFUND: { bg: "bg-purple-100", text: "text-purple-800" },
  REFERRAL: { bg: "bg-orange-100", text: "text-orange-800" },
};

const CREDIT_TYPES = ["RECHARGE", "REFUND", "REFERRAL"];

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

function isCredit(type: string): boolean {
  return CREDIT_TYPES.includes(type);
}

function getTxId(tx: Transaction): string {
  return tx.id || tx.id || "";
}

function getCustomerName(tx: Transaction): string {
  if (tx.customer?.name) return tx.customer.name;
  if (tx.customerName) return tx.customerName;
  return "—";
}

function getCustomerPhone(tx: Transaction): string {
  if (tx.customer?.phone) return tx.customer.phone;
  if (tx.customerPhone) return tx.customerPhone;
  return "";
}

function getOrderNumber(tx: Transaction): string {
  if (tx.order?.orderNumber) return tx.order.orderNumber;
  if (tx.order?.id) return tx.order.id.slice(0, 8);
  if (tx.orderId) return tx.orderId.slice(0, 8);
  return "";
}

export default function WalletPage() {
  const { addToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const limit = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchTransactions = useCallback(async (page: number, type: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (type) params.type = type;
      if (debouncedSearch) params.search = debouncedSearch;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.getWalletTransactions(params);
      const payload = (response.data as any) || {};
      const items = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      setTransactions(items);
      const m = payload.meta || response.meta;
      if (m) setMeta(m as Meta);
    } catch (err) {
      console.error("Failed to fetch wallet transactions:", err);
      setTransactions([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, startDate, endDate, limit]);

  useEffect(() => {
    fetchTransactions(currentPage, activeTab);
  }, [currentPage, activeTab, fetchTransactions]);

  const handleTabChange = (type: string) => {
    setActiveTab(type);
    setCurrentPage(1);
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchTransactions(1, activeTab);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const totalPages = meta?.totalPages || 1;

  const totalCredits = transactions
    .filter((t) => isCredit(t.type))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalDebits = transactions
    .filter((t) => !isCredit(t.type))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netBalance = totalCredits - totalDebits;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            Wallet & Payments
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View all wallet transactions and payment history
            {meta && (
              <span className="ml-2 font-medium text-primary">
                {meta.total} total
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => fetchTransactions(currentPage, activeTab)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Credits</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalCredits)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Debits</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalDebits)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-gray-500">Net Balance</span>
          </div>
          <p
            className={`text-2xl font-bold ${
              netBalance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
              showFilters
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-gray-700 bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(startDate || endDate) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              onClick={handleFilterApply}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-700 transition-colors"
            >
              Apply Filters
            </button>
            {(startDate || endDate || searchQuery) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Type Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TYPE_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Wallet className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No transactions found</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab || debouncedSearch || startDate || endDate
                ? "No transactions match the current filters"
                : "Transactions will appear here"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
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
                    Order
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => {
                  const txId = getTxId(tx);
                  const credit = isCredit(tx.type);
                  const colors =
                    TYPE_COLORS[tx.type] || {
                      bg: "bg-gray-100",
                      text: "text-gray-800",
                    };
                  const label = tx.type
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  const orderNum = getOrderNumber(tx);

                  return (
                    <tr
                      key={txId}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-600">
                          {txId.length > 12
                            ? `${txId.slice(0, 8)}...${txId.slice(-4)}`
                            : txId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getCustomerName(tx)}
                          </p>
                          {getCustomerPhone(tx) && (
                            <p className="text-xs text-gray-500">
                              {getCustomerPhone(tx)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-semibold ${
                            credit ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {credit ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[250px]">
                        <span className="text-sm text-gray-500 truncate block">
                          {tx.description || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {orderNum ? (
                          <span className="text-sm text-primary font-medium">
                            #{orderNum}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {formatDate(tx.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && transactions.length > 0 && meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/30">
            <p className="text-sm text-gray-500">
              Showing page{" "}
              <span className="font-medium text-gray-700">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-700">{meta.totalPages}</span>{" "}
              ({meta.total} transactions)
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
                        ? "bg-primary text-white shadow-sm"
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
