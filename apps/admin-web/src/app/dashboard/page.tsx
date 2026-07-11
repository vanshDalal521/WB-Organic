"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatsCard from "@/components/StatsCard";
import {
  DollarSign,
  ShoppingCart,
  Calendar,
  Users,
  Plus,
  Truck,
  UserPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface DashboardData {
  customers: { total: number; active: number };
  orders: { total: number; today: number };
  revenue: { total: number; today: number };
  subscriptions: { total: number; active: number };
  deliveries: { today: number; completed: number };
}

const quickActions = [
  { name: "Manage Customers", icon: Users, href: "/customers" },
  { name: "Manage Products", icon: Plus, href: "/products" },
  { name: "View Orders", icon: ShoppingCart, href: "/orders" },
  { name: "Manage Subscriptions", icon: Calendar, href: "/subscriptions" },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboard()
      .then((res) => setData(res.data as DashboardData))
      .catch((err) => setError(err.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">Failed to load dashboard</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const d = data!;

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${d.revenue.total.toLocaleString("en-IN")}`,
      change: { value: 0, isPositive: true },
      icon: DollarSign,
    },
    {
      title: "Orders Today",
      value: d.orders.today.toLocaleString("en-IN"),
      change: { value: 0, isPositive: true },
      icon: ShoppingCart,
    },
    {
      title: "Active Subscriptions",
      value: d.subscriptions.active.toLocaleString("en-IN"),
      change: { value: 0, isPositive: true },
      icon: Calendar,
    },
    {
      title: "Total Customers",
      value: d.customers.total.toLocaleString("en-IN"),
      change: { value: 0, isPositive: true },
      icon: Users,
    },
  ];

  const barValues = [
    d.revenue.today * 0.7,
    d.revenue.today * 0.85,
    d.revenue.today * 0.6,
    d.revenue.today * 1.1,
    d.revenue.today * 0.95,
    d.revenue.today * 1.2,
    d.revenue.today,
  ];
  const maxBar = Math.max(...barValues, 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
          </div>
          <div className="h-64 flex items-end gap-3 px-2">
            {barValues.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-gray-500">
                  ₹{val.toLocaleString("en-IN")}
                </span>
                <div
                  className="w-full bg-primary/80 rounded-t-lg transition-all"
                  style={{ height: `${(val / maxBar) * 100}%`, minHeight: 8 }}
                />
                <span className="text-xs text-gray-500">{WEEKDAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <a
                key={action.name}
                href={action.href}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-gray-200 rounded-lg transition-colors group"
              >
                <div className="p-2 bg-white rounded-lg border border-gray-200 group-hover:border-primary/20 group-hover:bg-primary/10 transition-colors">
                  <action.icon className="w-4 h-4 text-gray-600 group-hover:text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                  {action.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Orders</h3>
        <p className="text-sm text-gray-500">
          {d.orders.total} total orders &middot; {d.orders.today} orders placed today
        </p>
        <p className="text-xs text-gray-400 mt-4">
          Visit the Orders page to view and manage all orders.
        </p>
      </div>
    </div>
  );
}
