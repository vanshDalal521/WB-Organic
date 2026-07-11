"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  X,
  Loader2,
  Package,
  Plus,
  Trash2,
  Info,
  Tag,
  IndianRupee,
  Star,
  TrendingUp,
  Droplets,
} from "lucide-react";
import { api } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Variant {
  unitValue: string;
  unit: string;
  price: string;
  offerPrice: string;
  sku: string;
  stock: string;
}

interface ProductData {
  id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  offerPrice?: number;
  tax?: number;
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  subscriptionAvailable?: boolean;
  category: { id: string; name: string };
  variants: {
    id: string;
    unitValue: number;
    unit: string;
    price: number;
    offerPrice?: number;
    sku?: string;
    stock?: number;
  }[];
  benefits?: string;
  ingredients?: string;
  storageInstructions?: string;
  shelfLife?: string;
  bottleDeposit?: number;
}

const UNITS = ["ml", "g", "L", "kg"];

const emptyVariant: Variant = {
  unitValue: "",
  unit: "ml",
  price: "",
  offerPrice: "",
  sku: "",
  stock: "",
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    basePrice: "",
    offerPrice: "",
    tax: "",
    isFeatured: false,
    isTrending: false,
    isActive: true,
    subscriptionAvailable: false,
    benefits: "",
    ingredients: "",
    storageInstructions: "",
    shelfLife: "",
    bottleDeposit: "",
  });

  const [variants, setVariants] = useState<Variant[]>([{ ...emptyVariant }]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => {
        setToast(null);
        if (toast.type === "success") router.push(`/products/${id}`);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [toast, router, id]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productRes, categoriesRes] = await Promise.all([
        api.getProduct(id),
        api.getCategories(),
      ]);
      const productData = (productRes.data as any)?.data || productRes.data;
      const catPayload = (categoriesRes.data as any) || {};
      const catList = Array.isArray(catPayload.data) ? catPayload.data : Array.isArray(catPayload) ? catPayload : [];

      setProduct(productData);
      setCategories(catList);

      setFormData({
        name: productData.name || "",
        shortDescription: productData.shortDescription || "",
        description: productData.description || "",
        categoryId: productData.category?.id || "",
        basePrice: String(productData.basePrice || ""),
        offerPrice: productData.offerPrice != null ? String(productData.offerPrice) : "",
        tax: productData.tax != null ? String(productData.tax) : "",
        isFeatured: !!productData.isFeatured,
        isTrending: !!productData.isTrending,
        isActive: !!productData.isActive,
        subscriptionAvailable: !!productData.subscriptionAvailable,
        benefits: productData.benefits || "",
        ingredients: productData.ingredients || "",
        storageInstructions: productData.storageInstructions || "",
        shelfLife: productData.shelfLife || "",
        bottleDeposit: productData.bottleDeposit != null ? String(productData.bottleDeposit) : "",
      });

      if (productData.variants && productData.variants.length > 0) {
        setVariants(
          productData.variants.map((v: any) => ({
            unitValue: String(v.unitValue || ""),
            unit: v.unit || "ml",
            price: String(v.price || ""),
            offerPrice: v.offerPrice != null ? String(v.offerPrice) : "",
            sku: v.sku || "",
            stock: v.stock != null ? String(v.stock) : "",
          }))
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { ...emptyVariant }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        shortDescription: formData.shortDescription || undefined,
        description: formData.description || undefined,
        categoryId: formData.categoryId,
        basePrice: parseFloat(formData.basePrice) || 0,
        offerPrice: formData.offerPrice ? parseFloat(formData.offerPrice) : undefined,
        tax: formData.tax ? parseFloat(formData.tax) : undefined,
        isFeatured: formData.isFeatured,
        isTrending: formData.isTrending,
        isActive: formData.isActive,
        subscriptionAvailable: formData.subscriptionAvailable,
        benefits: formData.benefits || undefined,
        ingredients: formData.ingredients || undefined,
        storageInstructions: formData.storageInstructions || undefined,
        shelfLife: formData.shelfLife || undefined,
        bottleDeposit: formData.bottleDeposit ? parseFloat(formData.bottleDeposit) : undefined,
        variants: variants
          .filter((v) => v.unitValue && v.price)
          .map((v) => ({
            unitValue: parseFloat(v.unitValue) || 0,
            unit: v.unit,
            price: parseFloat(v.price) || 0,
            offerPrice: v.offerPrice ? parseFloat(v.offerPrice) : undefined,
            sku: v.sku || undefined,
            stock: v.stock ? parseInt(v.stock) : undefined,
          })),
      };

      await api.updateProduct(id, payload);
      setToast({ type: "success", message: "Product updated successfully!" });
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to update product" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ))}
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

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.type === "success" ? <Save className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => router.push(`/products/${id}`)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Product
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-[#176B32]" />
          Edit Product
        </h1>
        <p className="text-gray-500 mt-1">Update product information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-[#176B32]" />
            Basic Information
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
                placeholder="e.g. Organic Whole Milk"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Short Description</label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => updateField("shortDescription", e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
                placeholder="Brief description for listings"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors resize-none"
                placeholder="Detailed product description"
              />
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-[#176B32]" />
            Category
          </h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <IndianRupee className="w-5 h-5 text-[#176B32]" />
            Pricing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Base Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => updateField("basePrice", e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Offer Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.offerPrice}
                onChange={(e) => updateField("offerPrice", e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tax (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.tax}
                onChange={(e) => updateField("tax", e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-[#176B32]" />
              Variants
            </h2>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#176B32] bg-[#176B32]/5 border border-[#176B32]/20 rounded-lg hover:bg-[#176B32]/10 transition-colors"
            >
              <Plus size={14} />
              Add Variant
            </button>
          </div>
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variant {index + 1}
                  </span>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Unit Value</label>
                    <input
                      type="number"
                      min="0"
                      value={variant.unitValue}
                      onChange={(e) => updateVariant(index, "unitValue", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] bg-white transition-colors"
                      placeholder="e.g. 500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Unit</label>
                    <select
                      value={variant.unit}
                      onChange={(e) => updateVariant(index, "unit", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] bg-white transition-colors"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, "price", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] bg-white transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Offer Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.offerPrice}
                      onChange={(e) => updateVariant(index, "offerPrice", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] bg-white transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">SKU</label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, "sku", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] bg-white transition-colors"
                      placeholder="SKU"
                    />
                  </div>
                </div>
                <div className="w-32">
                  <label className="text-xs font-medium text-gray-500">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(e) => updateVariant(index, "stock", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] bg-white transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flags */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-[#176B32]" />
            Flags
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { field: "isFeatured", label: "Featured", icon: Star, desc: "Show in featured section" },
              { field: "isTrending", label: "Trending", icon: TrendingUp, desc: "Show in trending section" },
              { field: "isActive", label: "Active", icon: Package, desc: "Product is available for order" },
              { field: "subscriptionAvailable", label: "Subscription Available", icon: Droplets, desc: "Available for recurring orders" },
            ].map(({ field, label, icon: Icon, desc }) => (
              <div
                key={field}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#176B32]/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#176B32]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateField(field, !(formData as any)[field])}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    (formData as any)[field] ? "bg-[#176B32]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      (formData as any)[field] ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-[#176B32]" />
            Product Details
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Benefits</label>
              <input
                type="text"
                value={formData.benefits}
                onChange={(e) => updateField("benefits", e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
                placeholder="e.g. Rich in calcium, No preservatives"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ingredients</label>
              <input
                type="text"
                value={formData.ingredients}
                onChange={(e) => updateField("ingredients", e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
                placeholder="e.g. Organic whole milk"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Storage Instructions</label>
              <input
                type="text"
                value={formData.storageInstructions}
                onChange={(e) => updateField("storageInstructions", e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
                placeholder="e.g. Keep refrigerated at 2-8°C"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Shelf Life</label>
              <input
                type="text"
                value={formData.shelfLife}
                onChange={(e) => updateField("shelfLife", e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
                placeholder="e.g. 7 days from packaging"
              />
            </div>
          </div>
        </div>

        {/* Bottle Deposit */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <IndianRupee className="w-5 h-5 text-[#176B32]" />
            Bottle Deposit
          </h2>
          <div className="space-y-2 max-w-xs">
            <label className="text-sm font-medium text-gray-700">Deposit Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.bottleDeposit}
              onChange={(e) => updateField("bottleDeposit", e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32] transition-colors"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#176B32] rounded-lg hover:bg-[#145a29] transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/products/${id}`)}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
