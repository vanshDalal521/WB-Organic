"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Users,
  Truck,
  DollarSign,
  Package,
  Printer,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

const REPORT_TABS = [
  { id: "sales", label: "Sales", icon: DollarSign },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "customers", label: "Customers", icon: Users },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "products", label: "Products", icon: Package },
  { id: "revenue", label: "Revenue", icon: BarChart3 },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  success: "bg-green-100 text-green-800",
};

function formatCurrency(amount: number): string {
  return `₹${(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function ReportsPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("sales");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getReports(activeTab, { startDate, endDate });
      const payload = (res.data as any) || {};
      setReportData(payload.data !== undefined ? payload.data : payload);
    } catch (err: any) {
      setError(err.message || "Failed to load report");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Analyze your business performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => addToast("info", "Export feature coming soon")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Date Range & Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mt-4 overflow-x-auto">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchReport}
            className="ml-auto text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Sales Tab */}
          {activeTab === "sales" && reportData && (
            <SalesTab data={reportData} />
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && reportData && (
            <OrdersTab data={reportData} />
          )}

          {/* Customers Tab */}
          {activeTab === "customers" && reportData && (
            <CustomersTab data={reportData} />
          )}

          {/* Delivery Tab */}
          {activeTab === "delivery" && reportData && (
            <DeliveryTab data={reportData} />
          )}

          {/* Products Tab */}
          {activeTab === "products" && reportData && (
            <ProductsTab data={reportData} />
          )}

          {/* Revenue Tab */}
          {activeTab === "revenue" && reportData && (
            <RevenueTab data={reportData} />
          )}

          {!reportData && !error && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No data available for this period.</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting the date range.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = "primary",
  subtext,
}: {
  label: string;
  value: string;
  icon: any;
  color?: string;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2 bg-${color}/10 rounded-lg`}>
          <Icon className={`w-4 h-4 text-${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtext && (
        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
      )}
    </div>
  );
}

function EmptyState({ message = "No detailed breakdown available for this period." }: { message?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">{message}</p>
      <p className="text-gray-400 text-xs mt-1">
        Try adjusting the date range or check back later.
      </p>
    </div>
  );
}

function SalesTab({ data }: { data: any }) {
  const dailyRevenue = data.dailyRevenue || data.revenueByDay || data.breakdown || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(data.totalRevenue ?? 0)}
          icon={DollarSign}
          color="primary"
          subtext={
            data.revenueGrowth != null
              ? `${data.revenueGrowth >= 0 ? "+" : ""}${data.revenueGrowth.toFixed(1)}% vs last period`
              : undefined
          }
        />
        <StatCard
          label="Total Orders"
          value={(data.totalOrders ?? 0).toLocaleString()}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(data.averageOrderValue ?? data.aov ?? 0)}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          label="Total Refunds"
          value={formatCurrency(data.totalRefunds ?? 0)}
          icon={ArrowDownLeft}
          color="red"
        />
      </div>

      {Array.isArray(dailyRevenue) && dailyRevenue.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Revenue by Day</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dailyRevenue.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.date || item.label || item.name || `Day ${idx + 1}`}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900">
                      {formatCurrency(item.revenue ?? item.amount ?? item.value ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">
                      {item.orders ?? item.count ?? item.quantity ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function OrdersTab({ data }: { data: any }) {
  const statusBreakdown =
    data.statusBreakdown || data.byStatus || data.ordersByStatus || [];
  const paymentBreakdown =
    data.paymentBreakdown || data.byPaymentMethod || data.paymentMethods || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={(data.totalOrders ?? 0).toLocaleString()}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          label="Completed"
          value={(data.completedOrders ?? 0).toLocaleString()}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Cancelled"
          value={(data.cancelledOrders ?? 0).toLocaleString()}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          label="Pending"
          value={(data.pendingOrders ?? 0).toLocaleString()}
          icon={BarChart3}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders by Status */}
        {Array.isArray(statusBreakdown) && statusBreakdown.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Orders by Status</h2>
            </div>
            <div className="p-6 space-y-3">
              {statusBreakdown.map((item: any, idx: number) => {
                const status = (item.status || item.name || item.label || "").toLowerCase();
                const count = item.count ?? item.value ?? 0;
                const total = data.totalOrders ?? 1;
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
                        {status || `Status ${idx + 1}`}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {count.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState message="No order status data available." />
        )}

        {/* Payment Method Breakdown */}
        {Array.isArray(paymentBreakdown) && paymentBreakdown.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">By Payment Method</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {paymentBreakdown.map((item: any, idx: number) => (
                <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item.method || item.name || item.label || `Method ${idx + 1}`}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {item.count ?? item.orders ?? 0} orders
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.amount ?? item.revenue ?? 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState message="No payment method data available." />
        )}
      </div>
    </div>
  );
}

function CustomersTab({ data }: { data: any }) {
  const topSpenders =
    data.topSpenders || data.topCustomers || data.top10Spenders || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="New Customers"
          value={(data.newCustomers ?? 0).toLocaleString()}
          icon={Users}
          color="primary"
          subtext={
            data.customerGrowth != null
              ? `${data.customerGrowth >= 0 ? "+" : ""}${data.customerGrowth.toFixed(1)}% vs last period`
              : undefined
          }
        />
        <StatCard
          label="Total Customers"
          value={(data.totalCustomers ?? 0).toLocaleString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Active Customers"
          value={(data.activeCustomers ?? 0).toLocaleString()}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Retention Rate"
          value={`${(data.retentionRate ?? 0).toFixed(1)}%`}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {Array.isArray(topSpenders) && topSpenders.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Top 10 Spenders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topSpenders.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {item.name || item.customerName || item.email || `Customer ${idx + 1}`}
                      </p>
                      {item.phone && (
                        <p className="text-xs text-gray-500">{item.phone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-primary">
                      {formatCurrency(item.totalSpent ?? item.amount ?? item.total ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">
                      {item.orderCount ?? item.orders ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState message="No customer spending data available." />
      )}
    </div>
  );
}

function DeliveryTab({ data }: { data: any }) {
  const totalDeliveries = data.totalDeliveries ?? 0;
  const successful = data.successfulDeliveries ?? data.successDeliveries ?? 0;
  const failed = data.failedDeliveries ?? 0;
  const successRate =
    totalDeliveries > 0
      ? ((successful / totalDeliveries) * 100).toFixed(1)
      : (data.successRate ?? 0).toFixed?.(1) ?? "0";
  const failedReasons = data.failedReasons || data.failureReasons || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Deliveries"
          value={totalDeliveries.toLocaleString()}
          icon={Truck}
          color="primary"
        />
        <StatCard
          label="Successful"
          value={successful.toLocaleString()}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Failed"
          value={failed.toLocaleString()}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          icon={BarChart3}
          color="blue"
        />
      </div>

      {Array.isArray(failedReasons) && failedReasons.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Failed Delivery Reasons</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {failedReasons.map((item: any, idx: number) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50">
                <span className="text-sm font-medium text-gray-700">
                  {item.reason || item.name || item.label || `Reason ${idx + 1}`}
                </span>
                <span className="text-sm font-semibold text-red-600">
                  {item.count ?? item.value ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState message="No failed delivery reason data available." />
      )}
    </div>
  );
}

function ProductsTab({ data }: { data: any }) {
  const products =
    data.products || data.productPerformance || data.breakdown || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Products Sold"
          value={(data.totalProducts ?? data.totalUnitsSold ?? 0).toLocaleString()}
          icon={Package}
          color="primary"
        />
        <StatCard
          label="Total Product Revenue"
          value={formatCurrency(data.totalRevenue ?? data.totalProductRevenue ?? 0)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          label="Avg Products/Order"
          value={(data.avgProductsPerOrder ?? 0).toFixed(1)}
          icon={BarChart3}
          color="blue"
        />
      </div>

      {Array.isArray(products) && products.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Product Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.name || item.productName || item.title || `Product ${idx + 1}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">
                      {(item.orders ?? item.orderCount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">
                      {(item.unitsSold ?? item.units ?? item.quantity ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-primary">
                      {formatCurrency(item.revenue ?? item.totalRevenue ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState message="No product performance data available." />
      )}
    </div>
  );
}

function RevenueTab({ data }: { data: any }) {
  const walletActivity = data.walletActivity || data.wallet || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Order Revenue"
          value={formatCurrency(data.orderRevenue ?? data.totalRevenue ?? 0)}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          label="Wallet Recharges"
          value={formatCurrency(walletActivity.totalRecharges ?? walletActivity.recharges ?? 0)}
          icon={ArrowUpRight}
          color="green"
        />
        <StatCard
          label="Wallet Payments"
          value={formatCurrency(walletActivity.totalPayments ?? walletActivity.payments ?? 0)}
          icon={ArrowDownLeft}
          color="blue"
        />
        <StatCard
          label="Wallet Refunds"
          value={formatCurrency(walletActivity.totalRefunds ?? walletActivity.refunds ?? 0)}
          icon={TrendingDown}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Wallet Activity Summary</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { label: "Total Recharges", value: walletActivity.totalRecharges ?? walletActivity.recharges ?? 0, color: "text-green-600" },
            { label: "Total Payments", value: walletActivity.totalPayments ?? walletActivity.payments ?? 0, color: "text-blue-600" },
            { label: "Total Refunds", value: walletActivity.totalRefunds ?? walletActivity.refunds ?? 0, color: "text-purple-600" },
            { label: "Total Referrals", value: walletActivity.totalReferrals ?? walletActivity.referrals ?? 0, color: "text-orange-600" },
            { label: "Net Wallet Flow", value: walletActivity.netFlow ?? walletActivity.net ?? 0, color: "text-primary" },
          ].map((item) => (
            <div key={item.label} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className={`text-sm font-semibold ${item.color}`}>
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {data.revenueByDay && Array.isArray(data.revenueByDay) && data.revenueByDay.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Revenue by Day</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order Revenue
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Wallet Revenue
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.revenueByDay.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.date || item.label || `Day ${idx + 1}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">
                      {formatCurrency(item.orderRevenue ?? item.orders ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">
                      {formatCurrency(item.walletRevenue ?? item.wallet ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-primary">
                      {formatCurrency(item.total ?? item.revenue ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
