"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Calendar,
  Truck,
  CreditCard,
  Wallet,
  Megaphone,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  Leaf,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products", href: "/products", icon: Package },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Subscriptions", href: "/subscriptions", icon: Calendar },
  { name: "Deliveries", href: "/deliveries", icon: Truck },
  { name: "Bottles", href: "/bottles", icon: Package },
  { name: "Wallet & Payments", href: "/wallet", icon: Wallet },
  { name: "Marketing", href: "/marketing", icon: Megaphone },
  { name: "Content", href: "/content", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${isOpen ? "w-64" : "w-20"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          bg-sidebar text-sidebar-text transition-all duration-300 ease-in-out
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex-shrink-0">
              <img src="/logo.jpeg" alt="WB Organic" className="w-full h-full object-cover" />
            </div>
            {isOpen && (
              <div>
                <h1 className="font-bold text-lg text-white">WB Organic</h1>
                <p className="text-xs text-sidebar-text/70">Dairy Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive 
                    ? "bg-white text-primary font-medium shadow-sm" 
                    : "text-sidebar-text hover:bg-white/10 hover:text-white"
                  }
                  ${!isOpen ? "justify-center" : ""}
                `}
              >
                <item.icon size={20} />
                {isOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button for desktop */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden lg:flex items-center justify-center p-4 border-t border-white/10 hover:bg-white/10 transition-colors"
        >
          <Menu size={20} className={`transition-transform duration-300 ${isOpen ? "rotate-0" : "rotate-180"}`} />
        </button>
      </aside>
    </>
  );
}