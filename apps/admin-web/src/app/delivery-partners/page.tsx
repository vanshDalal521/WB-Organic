"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Phone,
  Mail,
  MapPin,
  X,
  Truck,
  CheckCircle,
} from "lucide-react";

interface DeliveryPartner {
  id?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  employeeId?: string;
  serviceArea?: string;
  isActive?: boolean;
  user?: { name?: string; phone?: string; email?: string };
  assignedDate?: string;
  createdAt?: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const EMPTY_FORM = { fullName: "", phone: "", email: "", employeeId: "", serviceArea: "", password: "" };

function formatDate(d: string): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DeliveryPartnersPage() {
  const { addToast } = useToast();
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchPartners = useCallback(async (page: number, searchQuery: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (searchQuery) params.search = searchQuery;
      const res = await api.getDeliveryPartners(params);
      const payload = (res.data as any) || {};
      const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setPartners(items);
      const m = payload.meta || res.meta;
      if (m) setMeta(m as Meta);
    } catch (err) {
      console.error("Failed to fetch delivery partners:", err);
      setPartners([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPartners(currentPage, search);
  }, [currentPage, fetchPartners]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPartners(1, search);
  };

  const handleOpenCreate = () => {
    setEditingPartner(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (partner: DeliveryPartner) => {
    setEditingPartner(partner);
    setForm({
      fullName: partner.name || partner.fullName || partner.user?.name || "",
      phone: partner.phone || partner.user?.phone || "",
      email: partner.email || partner.user?.email || "",
      employeeId: partner.employeeId || "",
      serviceArea: partner.serviceArea || "",
      password: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPartner(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.phone) {
      addToast("error", "Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      if (editingPartner) {
        const updateData: Record<string, unknown> = {
          name: form.fullName,
          phone: form.phone,
          email: form.email,
          employeeId: form.employeeId,
          serviceArea: form.serviceArea,
        };
        if (form.password) updateData.password = form.password;
        await api.updateDeliveryPartner(editingPartner.id || editingPartner.id || "", updateData);
        addToast("success", "Partner updated successfully");
      } else {
        await api.createDeliveryPartner({
          name: form.fullName,
          phone: form.phone,
          email: form.email,
          employeeId: form.employeeId,
          serviceArea: form.serviceArea,
          password: form.password,
        });
        addToast("success", "Partner created successfully");
      }
      handleCloseModal();
      fetchPartners(currentPage, search);
    } catch (err: any) {
      addToast("error", err.message || "Failed to save partner");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (partner: DeliveryPartner) => {
    const pid = partner.id || partner.id || "";
    setTogglingId(pid);
    try {
      await api.toggleDeliveryPartner(pid);
      addToast("success", partner.isActive ? "Partner deactivated" : "Partner activated");
      fetchPartners(currentPage, search);
    } catch (err: any) {
      addToast("error", err.message || "Failed to toggle status");
    } finally {
      setTogglingId(null);
    }
  };

  const totalPages = meta?.totalPages || 1;
  const activeCount = partners.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#176B32]" />
            Delivery Partners
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your delivery partner fleet</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchPartners(currentPage, search)} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#176B32] rounded-lg hover:bg-[#145a29] transition-colors">
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#176B32]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#176B32]" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Partners</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{meta?.total || partners.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">On Route Today</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">—</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name, phone, email..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
            />
          </div>
          <button onClick={handleSearch} className="px-4 py-2 text-sm font-medium text-white bg-[#176B32] rounded-lg hover:bg-[#145a29] transition-colors">
            Search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#176B32] animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading delivery partners...</p>
          </div>
        ) : partners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No delivery partners found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first delivery partner to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Area</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partners.map((partner) => {
                  const pid = partner.id || partner.id || "";
                  const name = partner.name || partner.fullName || partner.user?.name || "N/A";
                  return (
                    <tr key={pid} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#176B32]/10 flex items-center justify-center text-xs font-bold text-[#176B32]">
                            {name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {partner.phone || partner.user?.phone || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {partner.email || partner.user?.email || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-700">{partner.employeeId || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {partner.serviceArea || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${partner.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${partner.isActive ? "bg-green-500" : "bg-red-500"}`} />
                          {partner.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenEdit(partner)} className="p-1.5 text-gray-500 hover:text-[#176B32] hover:bg-[#176B32]/10 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggle(partner)} disabled={togglingId === pid} className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50" title="Toggle Status">
                            {togglingId === pid ? <Loader2 className="w-4 h-4 animate-spin" /> : partner.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && partners.length > 0 && meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/30">
            <p className="text-sm text-gray-500">
              Showing page <span className="font-medium text-gray-700">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-700">{meta.totalPages}</span>
              {" "}({meta.total} partners)
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${currentPage === page ? "bg-[#176B32] text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"}`}>
                    {page}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{editingPartner ? "Edit Delivery Partner" : "Add Delivery Partner"}</h3>
              <button onClick={handleCloseModal} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]" placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]" placeholder="Enter phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]" placeholder="Enter email address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input type="text" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]" placeholder="Enter employee ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Area</label>
                <input type="text" value={form.serviceArea} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]" placeholder="Enter service area" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingPartner ? "(leave blank to keep current)" : "*"}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]" placeholder={editingPartner ? "Leave blank to keep current" : "Enter password"} />
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#176B32] rounded-lg hover:bg-[#145a29] disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {editingPartner ? "Update Partner" : "Create Partner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
