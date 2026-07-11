"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Settings,
  Save,
  Truck,
  CreditCard,
  Bell,
  Shield,
  Headphones,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Store,
  Clock,
  ChevronRight,
} from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: any;
  category: string;
  description?: string;
  type?: string;
}

interface AuditLog {
  id: string;
  timestamp?: string;
  createdAt?: string;
  action: string;
  entity?: string;
  entityType?: string;
  entityId?: string;
  entity_id?: string;
  admin?: { name?: string; email?: string } | string;
  adminName?: string;
  details?: any;
}

const CATEGORIES = [
  { id: "general", label: "General", icon: Store },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "support", label: "Support", icon: Headphones },
] as const;

const CATEGORY_SETTINGS: Record<
  string,
  {
    key: string;
    label: string;
    description: string;
    type: "toggle" | "text" | "number" | "masked";
    defaultValue?: any;
  }[]
> = {
  general: [
    {
      key: "app_version",
      label: "App Version",
      description: "Current version of the application shown to users",
      type: "text",
      defaultValue: "1.0.0",
    },
    {
      key: "maintenance_mode",
      label: "Maintenance Mode",
      description: "Enable to show maintenance screen to all users",
      type: "toggle",
      defaultValue: false,
    },
    {
      key: "min_order_amount",
      label: "Minimum Order Amount",
      description: "Minimum amount required to place an order (in INR)",
      type: "number",
      defaultValue: 50,
    },
  ],
  delivery: [
    {
      key: "delivery_charge",
      label: "Delivery Charge",
      description: "Standard delivery fee added to each order (in INR)",
      type: "number",
      defaultValue: 0,
    },
    {
      key: "free_delivery_above",
      label: "Free Delivery Above",
      description: "Orders above this amount get free delivery (in INR)",
      type: "number",
      defaultValue: 500,
    },
  ],
  payment: [
    {
      key: "razorpay_key",
      label: "Razorpay Key",
      description: "Razorpay API key for payment processing",
      type: "masked",
    },
    {
      key: "payment_timeout",
      label: "Payment Timeout",
      description: "Time in minutes before an unpaid order is auto-cancelled",
      type: "number",
      defaultValue: 15,
    },
  ],
  notifications: [
    {
      key: "sms_enabled",
      label: "SMS Notifications",
      description: "Send order updates and alerts via SMS",
      type: "toggle",
      defaultValue: true,
    },
    {
      key: "email_enabled",
      label: "Email Notifications",
      description: "Send order receipts and updates via email",
      type: "toggle",
      defaultValue: true,
    },
    {
      key: "push_enabled",
      label: "Push Notifications",
      description: "Send push notifications to mobile app users",
      type: "toggle",
      defaultValue: true,
    },
  ],
  security: [
    {
      key: "session_timeout",
      label: "Session Timeout",
      description: "Admin session timeout in minutes",
      type: "number",
      defaultValue: 60,
    },
    {
      key: "max_login_attempts",
      label: "Max Login Attempts",
      description: "Maximum failed login attempts before account lockout",
      type: "number",
      defaultValue: 5,
    },
  ],
  support: [
    {
      key: "support_phone",
      label: "Support Phone",
      description: "Customer support phone number shown in the app",
      type: "text",
      defaultValue: "",
    },
    {
      key: "support_email",
      label: "Support Email",
      description: "Customer support email address",
      type: "text",
      defaultValue: "",
    },
  ],
};

function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(ts: string): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAdminName(log: AuditLog): string {
  if (typeof log.admin === "object" && log.admin?.name) return log.admin.name;
  if (typeof log.admin === "object" && log.admin?.email) return log.admin.email;
  if (typeof log.admin === "string") return log.admin;
  if (log.adminName) return log.adminName;
  return "System";
}

function getEntity(log: AuditLog): string {
  return log.entity || log.entityType || "—";
}

function getEntityId(log: AuditLog): string {
  const id = log.entityId || log.entity_id || "";
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 8)}...` : id;
}

export default function SettingsPage() {
  const { addToast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>("general");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditMeta, setAuditMeta] = useState<{
    total: number;
    page: number;
    totalPages: number;
  } | null>(null);
  const [auditPage, setAuditPage] = useState(1);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminSettings({ category: activeCategory });
      const payload = (res.data as any) || {};
      const items = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      setSettings(items);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  const fetchAuditLogs = useCallback(async (page: number) => {
    try {
      setAuditLoading(true);
      const res = await api.getAuditLogs({ page, limit: 10 });
      const payload = (res.data as any) || {};
      const items = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      setAuditLogs(items);
      const m = payload.meta || res.meta;
      if (m) {
        setAuditMeta({
          total: m.total || 0,
          page: m.page || 1,
          totalPages: m.totalPages || 1,
        });
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchAuditLogs(auditPage);
  }, [auditPage, fetchAuditLogs]);

  useEffect(() => {
    const map: Record<string, any> = {};
    const categoryDefs = CATEGORY_SETTINGS[activeCategory] || [];

    categoryDefs.forEach((def) => {
      const apiSetting = settings.find((s) => s.key === def.key);
      map[def.key] =
        apiSetting !== undefined ? apiSetting.value : def.defaultValue;
    });

    settings.forEach((s) => {
      if (!(s.key in map)) {
        map[s.key] = s.value;
      }
    });

    setEditingValues(map);
  }, [settings, activeCategory]);

  const handleSave = async (key: string) => {
    try {
      setSavingKey(key);
      const value = editingValues[key];
      await api.updateSetting(key, value, activeCategory);
      setSaveSuccess(key);
      addToast("success", `${formatKey(key)} saved successfully`);
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (err: any) {
      addToast("error", err.message || "Failed to save setting");
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggle = (key: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const categoryDefs = CATEGORY_SETTINGS[activeCategory] || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your store configuration and preferences.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Categories */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <span className="font-semibold text-gray-900">Categories</span>
              </div>
            </div>
            <div className="p-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {CATEGORIES.find((c) => c.id === activeCategory)?.label} Settings
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Configure {activeCategory} options for your store.
              </p>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Loading settings...</p>
              </div>
            ) : categoryDefs.length === 0 && settings.length === 0 ? (
              <div className="p-12 text-center">
                <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No settings found for this category.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {categoryDefs.map((def) => {
                  const apiSetting = settings.find((s) => s.key === def.key);
                  const value = editingValues[def.key] ?? def.defaultValue;
                  const isSaving = savingKey === def.key;
                  const justSaved = saveSuccess === def.key;
                  const isBoolean = def.type === "toggle";
                  const isMasked = def.type === "masked";

                  return (
                    <div
                      key={def.key}
                      className="p-6 flex items-center gap-6 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {def.label}
                          </p>
                          {isBoolean && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded uppercase">
                              Toggle
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {def.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                          {def.key}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {isBoolean ? (
                          <button
                            onClick={() => handleToggle(def.key)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
                              value ? "bg-primary" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                value ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        ) : (
                          <input
                            type={isMasked ? "password" : def.type === "number" ? "number" : "text"}
                            value={value ?? ""}
                            onChange={(e) =>
                              setEditingValues((prev) => ({
                                ...prev,
                                [def.key]: def.type === "number" ? Number(e.target.value) : e.target.value,
                              }))
                            }
                            className="w-64 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder={
                              def.type === "number"
                                ? "0"
                                : isMasked
                                ? "Enter value..."
                                : "Enter value..."
                            }
                          />
                        )}

                        <button
                          onClick={() => handleSave(def.key)}
                          disabled={isSaving || value === (apiSetting?.value ?? def.defaultValue)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            justSaved
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : value !== (apiSetting?.value ?? def.defaultValue)
                              ? "bg-primary text-white hover:bg-primary-700"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : justSaved ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          {justSaved ? "Saved" : "Save"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {settings
                  .filter(
                    (s) => !categoryDefs.some((d) => d.key === s.key)
                  )
                  .map((setting) => {
                    const isBoolean =
                      typeof setting.value === "boolean";
                    const isSaving = savingKey === setting.key;
                    const justSaved = saveSuccess === setting.key;
                    const value = editingValues[setting.key];

                    return (
                      <div
                        key={setting.id}
                        className="p-6 flex items-center gap-6 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {formatKey(setting.key)}
                            </p>
                            {isBoolean && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded uppercase">
                                Toggle
                              </span>
                            )}
                          </div>
                          {setting.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {setting.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1 font-mono">
                            {setting.key}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {isBoolean ? (
                            <button
                              onClick={() => handleToggle(setting.key)}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
                                value ? "bg-primary" : "bg-gray-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  value ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          ) : (
                            <input
                              type={
                                setting.key.includes("password") ||
                                setting.key.includes("secret") ||
                                setting.key.includes("key")
                                  ? "password"
                                  : "text"
                              }
                              value={value ?? ""}
                              onChange={(e) =>
                                setEditingValues((prev) => ({
                                  ...prev,
                                  [setting.key]: e.target.value,
                                }))
                              }
                              className="w-64 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                              placeholder="Enter value..."
                            />
                          )}

                          <button
                            onClick={() => handleSave(setting.key)}
                            disabled={
                              isSaving || value === setting.value
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              justSaved
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : value !== setting.value
                                ? "bg-primary text-white hover:bg-primary-700"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {isSaving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : justSaved ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            {justSaved ? "Saved" : "Save"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Audit Logs</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Recent admin actions and configuration changes.
          </p>
        </div>

        {auditLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No audit logs found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Entity ID
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr
                      key={log.id || log.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatTimestamp(log.timestamp || log.createdAt || "")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {getAdminName(log)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getEntity(log)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-gray-500">
                          {getEntityId(log)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {auditMeta && auditMeta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/30">
                <p className="text-sm text-gray-500">
                  Page{" "}
                  <span className="font-medium text-gray-700">
                    {auditMeta.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700">
                    {auditMeta.totalPages}
                  </span>{" "}
                  ({auditMeta.total} logs)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    disabled={auditPage <= 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setAuditPage((p) => Math.min(auditMeta.totalPages, p + 1))
                    }
                    disabled={auditPage >= auditMeta.totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
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
