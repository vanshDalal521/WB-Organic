"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Wine,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Search,
  Calendar,
  BarChart3,
  FileText,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface LedgerEntry {
  id: string;
  customer: { fullName?: string; name?: string; phone?: string };
  bottleType: { name: string };
  loadedCount: number;
  issuedCount: number;
  collectedCount: number;
  brokenCount?: number;
  lostCount?: number;
  netBalance?: number;
}

interface Transaction {
  id: string;
  type: string;
  count: number;
  bottleType: { name: string };
  customer: { fullName?: string; name?: string };
  createdAt: string;
  notes?: string;
  description?: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type TabId = "ledger" | "transactions" | "reports";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "ledger", label: "Ledger", icon: ClipboardList },
  { id: "transactions", label: "Transactions", icon: FileText },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

const TX_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  ISSUED: { bg: "bg-orange-100", text: "text-orange-800" },
  COLLECTED: { bg: "bg-purple-100", text: "text-purple-800" },
  BROKEN: { bg: "bg-red-100", text: "text-red-800" },
  LOST: { bg: "bg-gray-100", text: "text-gray-800" },
  ADJUSTED: { bg: "bg-blue-100", text: "text-blue-800" },
  LOAD: { bg: "bg-blue-100", text: "text-blue-800" },
  ISSUE: { bg: "bg-orange-100", text: "text-orange-800" },
  COLLECT: { bg: "bg-purple-100", text: "text-purple-800" },
};

function formatDate(d: string): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(a: number): string {
  return `₹${(a || 0).toLocaleString("en-IN")}`;
}

function getTypeBadge(type: string) {
  const c = TX_TYPE_COLORS[type] || { bg: "bg-gray-100", text: "text-gray-800" };
  const label = type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {label}
    </span>
  );
}

export default function BottlesPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("ledger");

  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerMeta, setLedgerMeta] = useState<Meta | null>(null);
  const [ledgerPage, setLedgerPage] = useState(1);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txMeta, setTxMeta] = useState<Meta | null>(null);
  const [txPage, setTxPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const limit = 10;

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [bottleTypeFilter, setBottleTypeFilter] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const fetchLedger = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (bottleTypeFilter) params.bottleType = bottleTypeFilter;
      if (customerSearch) params.customer = customerSearch;
      const res = await api.getBottleLedger(params);
      const payload = (res.data as any) || {};
      const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setLedger(items);
      const m = payload.meta || res.meta;
      if (m) setLedgerMeta(m as Meta);
    } catch (err) {
      console.error("Failed to fetch bottle ledger:", err);
      setLedger([]);
      setLedgerMeta(null);
    } finally {
      setLoading(false);
    }
  }, [bottleTypeFilter, customerSearch, limit]);

  const fetchTransactions = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (bottleTypeFilter) params.bottleType = bottleTypeFilter;
      if (customerSearch) params.customer = customerSearch;
      const res = await api.getBottleTransactions(params);
      const payload = (res.data as any) || {};
      const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setTransactions(items);
      const m = payload.meta || res.meta;
      if (m) setTxMeta(m as Meta);
    } catch (err) {
      console.error("Failed to fetch bottle transactions:", err);
      setTransactions([]);
      setTxMeta(null);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, bottleTypeFilter, customerSearch, limit]);

  useEffect(() => {
    if (activeTab === "ledger") fetchLedger(ledgerPage);
    else if (activeTab === "transactions") fetchTransactions(txPage);
    else setLoading(false);
  }, [activeTab, ledgerPage, txPage, fetchLedger, fetchTransactions]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setLoading(true);
  };

  const handleApplyFilters = () => {
    setLedgerPage(1);
    setTxPage(1);
    if (activeTab === "ledger") fetchLedger(1);
    else if (activeTab === "transactions") fetchTransactions(1);
    else setLoading(false);
  };

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setBottleTypeFilter("");
    setCustomerSearch("");
    setLedgerPage(1);
    setTxPage(1);
    if (activeTab === "ledger") fetchLedger(1);
    else if (activeTab === "transactions") fetchTransactions(1);
  };

  const ledgerTotalPages = ledgerMeta?.totalPages || 1;
  const txTotalPages = txMeta?.totalPages || 1;

  const totalLoaded = ledger.reduce((s, e) => s + (e.loadedCount || 0), 0);
  const totalIssued = ledger.reduce((s, e) => s + (e.issuedCount || 0), 0);
  const totalCollected = ledger.reduce((s, e) => s + (e.collectedCount || 0), 0);
  const totalBroken = ledger.reduce((s, e) => s + (e.brokenCount || 0), 0);
  const totalLost = ledger.reduce((s, e) => s + (e.lostCount || 0), 0);
  const totalAvailable = totalLoaded - totalIssued + totalCollected - totalBroken - totalLost;

  const reportsByType: Record<string, { loaded: number; issued: number; collected: number; broken: number; lost: number }> = {};
  ledger.forEach((e) => {
    const type = e.bottleType?.name || "Unknown";
    if (!reportsByType[type]) reportsByType[type] = { loaded: 0, issued: 0, collected: 0, broken: 0, lost: 0 };
    reportsByType[type].loaded += e.loadedCount || 0;
    reportsByType[type].issued += e.issuedCount || 0;
    reportsByType[type].collected += e.collectedCount || 0;
    reportsByType[type].broken += e.brokenCount || 0;
    reportsByType[type].lost += e.lostCount || 0;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wine className="w-6 h-6 text-[#176B32]" />
            Bottle Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track bottle inventory, ledger, and transactions</p>
        </div>
        <button onClick={() => { if (activeTab === "ledger") fetchLedger(ledgerPage); else if (activeTab === "transactions") fetchTransactions(txPage); }} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Total Loaded</span>
          </div>
          <p className="text-xl font-bold text-blue-600">{totalLoaded}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <ArrowUpFromLine className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Total Issued</span>
          </div>
          <p className="text-xl font-bold text-orange-600">{totalIssued}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Total Collected</span>
          </div>
          <p className="text-xl font-bold text-purple-600">{totalCollected}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Available</span>
          </div>
          <p className={`text-xl font-bold ${totalAvailable >= 0 ? "text-green-600" : "text-red-600"}`}>{totalAvailable}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Broken</span>
          </div>
          <p className="text-xl font-bold text-red-600">{totalBroken}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Minus className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Lost</span>
          </div>
          <p className="text-xl font-bold text-gray-600">{totalLost}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]" placeholder="From" />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]" placeholder="To" />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()} placeholder="Customer name..." className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] w-48" />
          </div>
          <input type="text" value={bottleTypeFilter} onChange={(e) => setBottleTypeFilter(e.target.value)} placeholder="Bottle type..." className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] w-40" />
          <button onClick={handleApplyFilters} className="px-4 py-2 text-sm font-medium text-white bg-[#176B32] rounded-lg hover:bg-[#145a29] transition-colors">
            Apply
          </button>
          <button onClick={handleClearFilters} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${isActive ? "bg-[#176B32] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "ledger" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#176B32] animate-spin mb-3" />
              <p className="text-gray-500 text-sm">Loading ledger...</p>
            </div>
          ) : ledger.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Wine className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No ledger records found</p>
              <p className="text-gray-400 text-sm mt-1">Bottle ledger entries will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bottle Type</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loaded</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Collected</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ledger.map((entry) => {
                    const net = entry.netBalance ?? ((entry.loadedCount || 0) - (entry.issuedCount || 0) + (entry.collectedCount || 0));
                    return (
                      <tr key={entry.id || (entry as any).id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{entry.customer?.fullName || entry.customer?.name || "N/A"}</span>
                          {entry.customer?.phone && <p className="text-xs text-gray-500">{entry.customer.phone}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{entry.bottleType?.name || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full min-w-[1.5rem]">{entry.loadedCount || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full min-w-[1.5rem]">{entry.issuedCount || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full min-w-[1.5rem]">{entry.collectedCount || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${net > 0 ? "text-green-600" : net < 0 ? "text-red-600" : "text-gray-600"}`}>{net}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && ledger.length > 0 && ledgerMeta && ledgerMeta.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/30">
              <p className="text-sm text-gray-500">
                Page <span className="font-medium text-gray-700">{ledgerMeta.page}</span> of <span className="font-medium text-gray-700">{ledgerMeta.totalPages}</span> ({ledgerMeta.total} entries)
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setLedgerPage((p) => Math.max(1, p - 1))} disabled={ledgerPage <= 1} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                {Array.from({ length: Math.min(5, ledgerTotalPages) }, (_, i) => {
                  let page: number;
                  if (ledgerTotalPages <= 5) page = i + 1;
                  else if (ledgerPage <= 3) page = i + 1;
                  else if (ledgerPage >= ledgerTotalPages - 2) page = ledgerTotalPages - 4 + i;
                  else page = ledgerPage - 2 + i;
                  return (
                    <button key={page} onClick={() => setLedgerPage(page)} className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${ledgerPage === page ? "bg-[#176B32] text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"}`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setLedgerPage((p) => Math.min(ledgerTotalPages, p + 1))} disabled={ledgerPage >= ledgerTotalPages} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#176B32] animate-spin mb-3" />
              <p className="text-gray-500 text-sm">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No transactions found</p>
              <p className="text-gray-400 text-sm mt-1">Bottle transactions will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bottle Type</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id || (tx as any).id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{formatDate(tx.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">{getTypeBadge(tx.type)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{tx.customer?.fullName || tx.customer?.name || "N/A"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{tx.bottleType?.name || "N/A"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{tx.count}</span>
                      </td>
                      <td className="px-6 py-4 max-w-[250px]">
                        <span className="text-sm text-gray-500 truncate block">{tx.notes || tx.description || "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && transactions.length > 0 && txMeta && txMeta.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/30">
              <p className="text-sm text-gray-500">
                Page <span className="font-medium text-gray-700">{txMeta.page}</span> of <span className="font-medium text-gray-700">{txMeta.totalPages}</span> ({txMeta.total} transactions)
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setTxPage((p) => Math.max(1, p - 1))} disabled={txPage <= 1} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                {Array.from({ length: Math.min(5, txTotalPages) }, (_, i) => {
                  let page: number;
                  if (txTotalPages <= 5) page = i + 1;
                  else if (txPage <= 3) page = i + 1;
                  else if (txPage >= txTotalPages - 2) page = txTotalPages - 4 + i;
                  else page = txPage - 2 + i;
                  return (
                    <button key={page} onClick={() => setTxPage(page)} className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${txPage === page ? "bg-[#176B32] text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"}`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))} disabled={txPage >= txTotalPages} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Summary by Bottle Type</h2>
            {Object.keys(reportsByType).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No data available. Load ledger data first.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Bottle Type</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Loaded</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Issued</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Collected</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Broken</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Lost</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(reportsByType).map(([type, data]) => {
                      const net = data.loaded - data.issued + data.collected - data.broken - data.lost;
                      return (
                        <tr key={type} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 text-sm font-medium text-gray-900">{type}</td>
                          <td className="py-3 text-sm text-blue-600 text-right font-medium">{data.loaded}</td>
                          <td className="py-3 text-sm text-orange-600 text-right font-medium">{data.issued}</td>
                          <td className="py-3 text-sm text-purple-600 text-right font-medium">{data.collected}</td>
                          <td className="py-3 text-sm text-red-600 text-right font-medium">{data.broken}</td>
                          <td className="py-3 text-sm text-gray-600 text-right font-medium">{data.lost}</td>
                          <td className="py-3 text-right">
                            <span className={`text-sm font-bold ${net > 0 ? "text-green-600" : net < 0 ? "text-red-600" : "text-gray-600"}`}>{net}</span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50 font-bold">
                      <td className="py-3 text-sm text-gray-900">Total</td>
                      <td className="py-3 text-sm text-blue-600 text-right">{totalLoaded}</td>
                      <td className="py-3 text-sm text-orange-600 text-right">{totalIssued}</td>
                      <td className="py-3 text-sm text-purple-600 text-right">{totalCollected}</td>
                      <td className="py-3 text-sm text-red-600 text-right">{totalBroken}</td>
                      <td className="py-3 text-sm text-gray-600 text-right">{totalLost}</td>
                      <td className="py-3 text-right">
                        <span className={`text-sm font-bold ${totalAvailable >= 0 ? "text-green-600" : "text-red-600"}`}>{totalAvailable}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Collection Rate</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {totalIssued > 0 ? `${Math.round((totalCollected / totalIssued) * 100)}%` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1">{totalCollected} of {totalIssued} issued bottles collected</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Loss Rate</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {totalIssued > 0 ? `${Math.round(((totalBroken + totalLost) / totalIssued) * 100)}%` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1">{totalBroken + totalLost} bottles broken or lost out of {totalIssued} issued</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
