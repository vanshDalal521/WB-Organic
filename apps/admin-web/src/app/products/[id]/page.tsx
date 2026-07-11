"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Pencil,
  Loader2,
  Star,
  TrendingUp,
  Droplets,
  Info,
  Tag,
  IndianRupee,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { api } from "@/lib/api";

interface ProductImage {
  url: string;
  alt?: string;
}

interface ProductVariant {
  id: string;
  price: number;
  offerPrice?: number;
  unit: string;
  unitValue: number;
  sku?: string;
  stock?: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  offerPrice?: number;
  tax?: number;
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  subscriptionAvailable?: boolean;
  category: { id: string; name: string; slug: string };
  variants: ProductVariant[];
  images: ProductImage[];
  benefits?: string;
  ingredients?: string;
  storageInstructions?: string;
  shelfLife?: string;
  bottleDeposit?: number;
  createdAt: string;
  updatedAt: string;
}

function formatCurrency(amount: number): string {
  return `₹${(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProduct(id);
      const data = (res.data as any)?.data || res.data;
      setProduct(data as Product);
    } catch (err: any) {
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleToggleStatus = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      await api.toggleProduct(product.id);
      setProduct((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev));
      setToast({
        type: "success",
        message: product.isActive ? "Product deactivated" : "Product activated",
      });
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to toggle status" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => router.push("/products")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error || "Product not found"}
        </div>
      </div>
    );
  }

  const imageUrl = product.images?.length > 0 ? product.images[0]?.url : null;

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
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => router.push("/products")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-16 h-16 rounded-xl object-cover border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#176B32]/10 text-[#176B32]">
                {product.category?.name || "Uncategorized"}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-green-500" : "bg-red-500"}`} />
                {product.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {product.shortDescription && (
              <p className="text-sm text-gray-500 mt-1">{product.shortDescription}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/products/${product.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                product.isActive
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                  : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
              }`}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : product.isActive ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {product.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {product.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-[#176B32]" />
                Description
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <IndianRupee className="w-5 h-5 text-[#176B32]" />
              Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1">Base Price</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(product.basePrice)}</p>
              </div>
              {product.offerPrice != null && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">Offer Price</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(product.offerPrice)}</p>
                </div>
              )}
              {product.tax != null && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">Tax</p>
                  <p className="text-lg font-bold text-gray-900">{product.tax}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-[#176B32]" />
              Product Details
            </h2>
            <div className="space-y-4">
              {[
                { label: "Benefits", value: product.benefits },
                { label: "Ingredients", value: product.ingredients },
                { label: "Storage Instructions", value: product.storageInstructions },
                { label: "Shelf Life", value: product.shelfLife },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                    <span className="text-sm font-medium text-gray-500 sm:w-40 flex-shrink-0">{label}</span>
                    <span className="text-sm text-gray-700">{value}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Flags & Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-[#176B32]" />
              Flags & Metadata
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Featured",
                  value: product.isFeatured,
                  icon: Star,
                  activeColor: "bg-yellow-100 text-yellow-700",
                  inactiveColor: "bg-gray-100 text-gray-500",
                },
                {
                  label: "Trending",
                  value: product.isTrending,
                  icon: TrendingUp,
                  activeColor: "bg-orange-100 text-orange-700",
                  inactiveColor: "bg-gray-100 text-gray-500",
                },
                {
                  label: "Subscription",
                  value: !!product.subscriptionAvailable,
                  icon: Droplets,
                  activeColor: "bg-blue-100 text-blue-700",
                  inactiveColor: "bg-gray-100 text-gray-500",
                },
                {
                  label: "Active",
                  value: product.isActive,
                  icon: CheckCircle,
                  activeColor: "bg-green-100 text-green-700",
                  inactiveColor: "bg-red-100 text-red-500",
                },
              ].map(({ label, value, icon: Icon, activeColor, inactiveColor }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 p-3 rounded-lg ${value ? activeColor : inactiveColor}`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium">{label}</span>
                  {value && <CheckCircle size={14} className="ml-auto" />}
                </div>
              ))}
            </div>
            {product.bottleDeposit != null && product.bottleDeposit > 0 && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg inline-flex items-center gap-2">
                <IndianRupee size={14} className="text-purple-600" />
                <span className="text-sm font-medium text-purple-700">
                  Bottle Deposit: {formatCurrency(product.bottleDeposit)}
                </span>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={12} />
                Created: {formatDate(product.createdAt)}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={12} />
                Updated: {formatDate(product.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Variants */}
        <div className="space-y-6">
          {/* Images */}
          {product.images && product.images.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Images</h2>
              <div className="grid grid-cols-2 gap-2">
                {product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.url}
                    alt={img.alt || product.name}
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Variants Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Variants ({product.variants?.length || 0})
              </h2>
            </div>
            {product.variants && product.variants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Offer
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        SKU
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {product.variants.map((variant) => (
                      <tr key={variant.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">
                            {variant.unitValue}{variant.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(variant.price)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {variant.offerPrice ? (
                            <span className="text-sm font-semibold text-green-600">{formatCurrency(variant.offerPrice)}</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs font-mono text-gray-500">{variant.sku || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          {variant.stock != null ? (
                            <span className={`text-sm font-medium ${variant.stock > 0 ? "text-gray-900" : "text-red-500"}`}>
                              {variant.stock}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No variants configured</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
