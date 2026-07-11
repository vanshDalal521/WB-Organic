"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  TrendingUp,
  Eye,
  Pencil,
  Trash2,
  X,
  Image as ImageIcon,
  Filter,
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
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductStats {
  total: number;
  active: number;
  featured: number;
  categories: number;
}

type FilterStatus = "all" | "active" | "inactive";

const LIMIT = 10;

function formatCurrency(amount: number): string {
  return `₹${(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.getCategories();
      const payload = (res.data as any) || {};
      setCategories(Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (filterStatus === "active") params.isActive = "true";
      if (filterStatus === "inactive") params.isActive = "false";

      const res = await api.getProducts(params);
      const payload = (res.data as any) || {};
      const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setProducts(items);
      const m = payload.meta || res.meta;
      if (m) setMeta(m);

      if (page === 1 && !debouncedSearch && !selectedCategory && filterStatus === "all") {
        const total = m?.total || items.length;
        const active = items.filter((p: Product) => p.isActive).length;
        const featured = items.filter((p: Product) => p.isFeatured).length;
        const catSet = new Set(items.map((p: Product) => p.category?.id).filter(Boolean));
        setStats({
          total,
          active,
          featured,
          categories: catSet.size || categories.length,
        });
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory, filterStatus, categories.length]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggle = async (id: string, field: "isActive" | "isFeatured" | "isTrending") => {
    setActionLoading(`${id}-${field}`);
    try {
      await api.toggleProduct(id);
      await fetchProducts();
      setToast({ type: "success", message: `${field === "isActive" ? "Status" : field === "isFeatured" ? "Featured" : "Trending"} updated` });
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to update" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteModal.id}`);
      setDeleteModal(null);
      setToast({ type: "success", message: "Product deleted successfully" });
      await fetchProducts();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to delete product" });
    } finally {
      setDeleting(false);
    }
  };

  const getImageUrl = (product: Product): string | null => {
    if (product.images?.length > 0 && product.images[0]?.url) {
      return product.images[0].url;
    }
    return null;
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
            <Package className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#176B32]" />
            Products
          </h1>
          <p className="text-gray-500">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/products/categories"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#176B32] bg-[#176B32]/5 border border-[#176B32]/20 rounded-lg hover:bg-[#176B32]/10 transition-colors"
          >
            <Filter size={16} />
            Categories
          </Link>
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 bg-[#176B32] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#145a29] transition-colors"
          >
            <Plus size={18} />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#176B32]/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-[#176B32]" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Products</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Active</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.active.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Featured</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.featured.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Categories</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.categories.toLocaleString("en-IN")}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {/* Category Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedCategory(""); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedCategory === ""
                ? "bg-[#176B32] text-white border-[#176B32]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#176B32] hover:text-[#176B32]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === cat.id
                  ? "bg-[#176B32] text-white border-[#176B32]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#176B32] hover:text-[#176B32]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-gray-200" />
                <div className="h-4 bg-gray-200 rounded w-40" />
                <div className="h-4 bg-gray-200 rounded w-24 hidden md:block" />
                <div className="h-4 bg-gray-200 rounded w-20 hidden lg:block" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-6 bg-gray-200 rounded-full w-12" />
                <div className="h-6 bg-gray-200 rounded-full w-12" />
                <div className="h-6 bg-gray-200 rounded-full w-12" />
                <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-sm text-gray-400 mt-1">
              {debouncedSearch || selectedCategory || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by adding your first product."}
            </p>
            {!debouncedSearch && !selectedCategory && filterStatus === "all" && (
              <Link
                href="/products/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-white bg-[#176B32] rounded-lg hover:bg-[#145a29] transition-colors"
              >
                <Plus size={16} />
                Add Product
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                      Product
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                      Category
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                      Price
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                      Variants
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                      Active
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden xl:table-cell">
                      Featured
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden xl:table-cell">
                      Trending
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const imageUrl = getImageUrl(product);
                    const basePrice = product.basePrice || product.variants?.[0]?.price || 0;
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center ${imageUrl ? "hidden" : ""}`}>
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900 block">{product.name}</span>
                              <span className="text-xs text-gray-400 truncate block max-w-[200px]">
                                {product.shortDescription || product.description?.slice(0, 50) || ""}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#176B32]/10 text-[#176B32]">
                            {product.category?.name || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div>
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(basePrice)}</span>
                            {product.offerPrice && product.offerPrice < basePrice && (
                              <span className="text-xs text-green-600 ml-1">
                                (Offer: {formatCurrency(product.offerPrice)})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="text-sm text-gray-600">
                            {product.variants?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggle(product.id, "isActive")}
                            disabled={actionLoading === `${product.id}-isActive`}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                              product.isActive ? "bg-[#176B32]" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                product.isActive ? "translate-x-[18px]" : "translate-x-[3px]"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 hidden xl:table-cell" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggle(product.id, "isFeatured")}
                            disabled={actionLoading === `${product.id}-isFeatured`}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                              product.isFeatured
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {actionLoading === `${product.id}-isFeatured` ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Star size={12} fill={product.isFeatured ? "currentColor" : "none"} />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 hidden xl:table-cell" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggle(product.id, "isTrending")}
                            disabled={actionLoading === `${product.id}-isTrending`}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                              product.isTrending
                                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {actionLoading === `${product.id}-isTrending` ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <TrendingUp size={12} />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => router.push(`/products/${product.id}`)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#176B32] hover:bg-[#176B32]/5 transition-colors"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => router.push(`/products/${product.id}/edit`)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteModal(product)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page <span className="font-medium text-gray-700">{page}</span> of{" "}
                  <span className="font-medium text-gray-700">{meta.totalPages}</span>
                  {" "}({meta.total} products)
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

                  {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (meta.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= meta.totalPages - 2) {
                      pageNum = meta.totalPages - 4 + i;
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
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page >= meta.totalPages}
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

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-md w-full mx-4 animate-slide-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium">{deleteModal.name}</span>? This will permanently remove the product and all its data.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={16} />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
