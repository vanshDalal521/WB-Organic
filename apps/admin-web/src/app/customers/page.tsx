"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
  Mail,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  UserCheck,
  UserX,
  Pencil,
  IndianRupee,
  ShoppingCart,
  UserPlus,
  TrendingUp,
  Loader2,
  X,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  totalOrders?: number;
  walletBalance?: number;
  totalSpent?: number;
}

interface CustomerStats {
  total: number;
  active: number;
  newThisMonth: number;
  totalRevenue: number;
}

type SortField = "name" | "createdAt" | "totalOrders";
type SortDir = "asc" | "desc";
type FilterStatus = "all" | "active" | "inactive";

const LIMIT = 10;

function formatDate(dateString: string): string {
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

const AVATAR_COLORS = [
  "bg-[#176B32]/20 text-[#176B32]",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

function getAvatarColor(name: string): string {
  const safe = name || "";
  let hash = 0;
  for (let i = 0; i < safe.length; i++) hash = safe.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function CustomersPage() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: LIMIT,
        sort: sortField,
        order: sortDir,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterStatus === "active") params.isActive = "true";
      if (filterStatus === "inactive") params.isActive = "false";

      const res = await api.getCustomers(params);
      const payload = (res.data as any) || {};
      const raw = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      const list: Customer[] = raw.map((c: any) => ({
        id: c.id,
        name: c.fullName || "",
        phone: c.phone,
        email: c.email,
        isActive: c.user?.isActive ?? false,
        createdAt: c.user?.createdAt ?? c.createdAt,
        totalOrders: c.orders?.length ?? 0,
        walletBalance: c.walletBalance ?? 0,
        totalSpent: (c.orders || []).reduce(
          (sum: number, o: any) => sum + Number(o.totalAmount || 0),
          0
        ),
      }));
      setCustomers(list);
      const m = payload.meta || res.meta;
      if (m) {
        setMeta(m);
        setTotalPages(m.totalPages || 1);
      }

      if (page === 1 && !debouncedSearch && filterStatus === "all") {
        const total = m?.total || list.length;
        const active = list.filter((c: Customer) => c.isActive).length;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonth = list.filter((c: Customer) => new Date(c.createdAt) >= monthStart).length;
        const totalRevenue = list.reduce((sum: number, c: Customer) => sum + (c.totalSpent || 0), 0);
        setStats({ total, active, newThisMonth, totalRevenue });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterStatus, sortField, sortDir]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleBlockToggle = async (customerId: string, currentlyActive: boolean) => {
    setActionLoading(customerId);
    try {
      await api.patch(`/admin/customers/${customerId}/toggle-status`);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, isActive: !currentlyActive } : c))
      );
      setOpenDropdown(null);
      showToast("success", currentlyActive ? "Customer blocked" : "Customer unblocked");
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#176B32]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#176B32]" />
    );
  };

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
          {toast.type === "success" ? (
            <UserCheck className="w-4 h-4" />
          ) : (
            <UserX className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#176B32]" />
            Customers
          </h1>
          <p className="text-gray-500">Manage your customer base</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200">
          <span className="font-semibold text-[#176B32]">{meta?.total || 0}</span> total customers
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#176B32]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#176B32]" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Customers</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Active</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.active.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">New This Month</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.newThisMonth.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {(["all", "active", "inactive"] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filterStatus === status
                    ? "bg-[#176B32] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-24 hidden md:block" />
                <div className="h-4 bg-gray-200 rounded w-40 hidden lg:block" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-6 bg-gray-200 rounded-full w-16" />
                <div className="h-4 bg-gray-200 rounded w-24 hidden xl:block" />
                <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No customers found</p>
            <p className="text-sm text-gray-400 mt-1">
              {debouncedSearch
                ? "Try adjusting your search terms"
                : filterStatus !== "all"
                ? `No ${filterStatus} customers`
                : "Customer data will appear here"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      >
                        Name <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                      Phone
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                      <button
                        onClick={() => handleSort("totalOrders")}
                        className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      >
                        Orders <SortIcon field="totalOrders" />
                      </button>
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                      Wallet
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden xl:table-cell">
                      <button
                        onClick={() => handleSort("createdAt")}
                        className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      >
                        Joined <SortIcon field="createdAt" />
                      </button>
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer, index) => (
                    <tr
                      key={customer.id || index}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(
                              customer.name
                            )}`}
                          >
                            {getInitials(customer.name)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {customer.phone}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {customer.email || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                          <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
                          {customer.totalOrders ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm font-semibold text-[#176B32]">
                          {formatCurrency(customer.walletBalance || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              customer.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          {customer.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell">
                        <span className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(customer.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative" ref={openDropdown === customer.id ? dropdownRef : undefined}>
                          <button
                            onClick={() =>
                              setOpenDropdown(openDropdown === customer.id ? null : customer.id)
                            }
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openDropdown === customer.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  router.push(`/customers/${customer.id}`);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  router.push(`/customers/${customer.id}/edit`);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleBlockToggle(customer.id, customer.isActive)}
                                disabled={actionLoading === customer.id}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                                  customer.isActive
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-green-600 hover:bg-green-50"
                                } disabled:opacity-50`}
                              >
                                {actionLoading === customer.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : customer.isActive ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                                {customer.isActive ? "Block" : "Unblock"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page <span className="font-medium text-gray-700">{page}</span> of{" "}
                  <span className="font-medium text-gray-700">{totalPages}</span>
                  {" "}({meta?.total || 0} customers)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                          page === pageNum
                            ? "bg-[#176B32] text-white shadow-sm"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
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
  );
}
