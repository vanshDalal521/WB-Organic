"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Package,
  MapPin,
  CreditCard,
  ClipboardCheck,
  Loader2,
  Phone,
  Calendar,
  Clock,
  X,
  ShoppingCart,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  addresses?: Address[];
}

interface ProductVariant {
  id: string;
  name?: string;
  size?: string;
  price: number;
  stock?: number;
}

interface Product {
  id: string;
  name: string;
  image?: string;
  variants: ProductVariant[];
}

interface Address {
  id?: string;
  type?: string;
  label?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  fullAddress?: string;
}

interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

const STEPS = [
  { label: "Customer", icon: User },
  { label: "Products", icon: Package },
  { label: "Delivery", icon: MapPin },
  { label: "Payment", icon: CreditCard },
  { label: "Review", icon: ClipboardCheck },
];

const PAYMENT_METHODS = [
  { label: "Cash on Delivery", value: "COD" },
  { label: "Wallet", value: "WALLET" },
  { label: "Prepaid", value: "PREPAID" },
];

const DELIVERY_SLOTS = [
  "07:00 AM - 09:00 AM",
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "01:00 PM - 03:00 PM",
  "03:00 PM - 05:00 PM",
  "05:00 PM - 07:00 PM",
];

function formatCurrency(amount: number): string {
  return `₹${(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function NewOrderPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 - Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Step 2 - Products
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Step 3 - Delivery
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("");

  // Step 4 - Payment
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Search customers
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const res = await api.getCustomers({ search: customerSearch, limit: 20 });
        const payload = (res.data as any) || {};
        const list = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
        setCustomerResults(list);
      } catch {
        setCustomerResults([]);
      } finally {
        setSearchingCustomers(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Search products
  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await api.getProducts({ search: productSearch, limit: 20 });
        const payload = (res.data as any) || {};
        const list = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
        setProductResults(list);
      } catch {
        setProductResults([]);
      } finally {
        setSearchingProducts(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setCustomerResults([]);
    if (customer.addresses?.length) {
      setSelectedAddress(customer.addresses[0]);
    }
  };

  const addToCart = (product: Product, variant: ProductVariant) => {
    const existing = cart.find((item) => item.variant.id === variant.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.variant.id === variant.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, variant, quantity: 1 }]);
    }
    addToast("success", `${product.name} added to order`);
  };

  const updateCartQuantity = (variantId: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.variant.id !== variantId) return item;
      const newQty = item.quantity + delta;
      return newQty > 0 ? { ...item, quantity: newQty } : item;
    }).filter((item) => item.quantity > 0));
  };

  const removeFromCart = (variantId: string) => {
    setCart(cart.filter((item) => item.variant.id !== variantId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const deliveryCharge = cartSubtotal >= 500 ? 0 : 30;
  const grandTotal = cartSubtotal + deliveryCharge;

  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedCustomer;
      case 1: return cart.length > 0;
      case 2: return !!selectedAddress && !!deliveryDate && !!deliverySlot;
      case 3: return !!paymentMethod;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return;
    setSubmitting(true);
    try {
      const orderData = {
        customerId: selectedCustomer.id,
        items: cart.map((item) => ({
          productId: item.product.id,
          variantId: item.variant.id,
          quantity: item.quantity,
          price: item.variant.price,
        })),
        address: selectedAddress,
        deliveryDate,
        deliverySlot,
        paymentMethod,
        subtotal: cartSubtotal,
        deliveryCharge,
        total: grandTotal,
      };
      await api.post("/admin/orders", orderData);
      addToast("success", "Order created successfully!");
      router.push("/orders");
    } catch (err: any) {
      addToast("error", err.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Link */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#176B32] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-[#176B32]" />
          Create New Order
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manually create an order for a customer</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isComplete = i < step;
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isComplete
                        ? "bg-[#176B32] text-white"
                        : isActive
                        ? "bg-[#176B32] text-white ring-4 ring-[#176B32]/20"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isActive ? "text-[#176B32]" : isComplete ? "text-gray-700" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 mt-[-20px] ${isComplete ? "bg-[#176B32]" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
        {/* Step 0 - Select Customer */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Customer</h2>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-4 bg-[#176B32]/5 border border-[#176B32]/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#176B32]/10 rounded-lg">
                    <User className="w-5 h-5 text-[#176B32]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by phone number or name..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]"
                    autoFocus
                  />
                </div>
                {searchingCustomers && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </div>
                )}
                {customerResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {c.phone}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!searchingCustomers && customerSearch && customerResults.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No customers found</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 1 - Add Products */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Add Products</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]"
                autoFocus
              />
            </div>

            {searchingProducts && (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </div>
            )}

            {productResults.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {productResults.map((product) => (
                  <div key={product.id} className="p-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">{product.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants?.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => addToCart(product, variant)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#176B32] bg-[#176B32]/10 border border-[#176B32]/20 rounded-lg hover:bg-[#176B32]/20 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          {variant.name || variant.size || "Default"} - {formatCurrency(variant.price)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cart */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Items ({cart.length})</h3>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.variant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.variant.name || item.variant.size || "Default"} &middot; {formatCurrency(item.variant.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.variant.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.variant.id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.variant.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-sm font-semibold text-gray-900">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 - Delivery */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Delivery Details</h2>

            {/* Address Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
              {selectedCustomer?.addresses && selectedCustomer.addresses.length > 0 ? (
                <div className="space-y-2">
                  {selectedCustomer.addresses.map((addr, i) => (
                    <button
                      key={addr.id || i}
                      onClick={() => setSelectedAddress(addr)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedAddress?.id === addr.id
                          ? "border-[#176B32] bg-[#176B32]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {addr.type && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {addr.type}
                          </span>
                        )}
                        {addr.label && <span className="text-sm font-medium text-gray-900">{addr.label}</span>}
                      </div>
                      <p className="text-sm text-gray-600">
                        {addr.fullAddress ||
                          [addr.street, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">No saved addresses. Please select a customer with addresses or add one first.</p>
              )}
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                min={minDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B32]/20 focus:border-[#176B32]"
              />
            </div>

            {/* Delivery Slot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {DELIVERY_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setDeliverySlot(slot)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                      deliverySlot === slot
                        ? "border-[#176B32] bg-[#176B32]/5 text-[#176B32]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 - Payment */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                    paymentMethod === method.value
                      ? "border-[#176B32] bg-[#176B32]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${paymentMethod === method.value ? "bg-[#176B32]/10" : "bg-gray-100"}`}>
                    <CreditCard className={`w-5 h-5 ${paymentMethod === method.value ? "text-[#176B32]" : "text-gray-500"}`} />
                  </div>
                  <span className={`text-sm font-medium ${paymentMethod === method.value ? "text-[#176B32]" : "text-gray-700"}`}>
                    {method.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal ({cart.length} items)</span>
                <span className="text-gray-700">{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Charge</span>
                <span className={deliveryCharge === 0 ? "text-green-600" : "text-gray-700"}>
                  {deliveryCharge === 0 ? "FREE" : formatCurrency(deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Grand Total</span>
                <span className="text-[#176B32]">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 - Review */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Review Order</h2>

            {/* Customer */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer</h3>
              <p className="text-sm font-medium text-gray-900">{selectedCustomer?.name}</p>
              <p className="text-xs text-gray-500">{selectedCustomer?.phone}</p>
            </div>

            {/* Items */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items</h3>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.variant.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.product.name} ({item.variant.name || item.variant.size || "Default"}) x {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">{formatCurrency(item.variant.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Delivery</h3>
              {selectedAddress && (
                <p className="text-sm text-gray-700">
                  {selectedAddress.fullAddress ||
                    [selectedAddress.street, selectedAddress.area, selectedAddress.city, selectedAddress.state, selectedAddress.pincode].filter(Boolean).join(", ")}
                </p>
              )}
              <div className="flex gap-4 mt-2">
                {deliveryDate && <p className="text-xs text-gray-500"><Calendar className="w-3 h-3 inline mr-1" />{formatDate(deliveryDate)}</p>}
                {deliverySlot && <p className="text-xs text-gray-500"><Clock className="w-3 h-3 inline mr-1" />{deliverySlot}</p>}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment</h3>
              <p className="text-sm text-gray-700">Method: <span className="font-medium">{paymentMethod.replace(/_/g, " ")}</span></p>
            </div>

            {/* Total */}
            <div className="bg-[#176B32]/5 border border-[#176B32]/20 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-700">{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Delivery</span>
                <span className={deliveryCharge === 0 ? "text-green-600" : "text-gray-700"}>
                  {deliveryCharge === 0 ? "FREE" : formatCurrency(deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-[#176B32]/20 pt-2 mt-2">
                <span className="text-gray-900">Grand Total</span>
                <span className="text-[#176B32]">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#176B32] rounded-lg hover:bg-[#145a29] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !canProceed()}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#176B32] rounded-lg hover:bg-[#145a29] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Confirm & Create Order
          </button>
        )}
      </div>
    </div>
  );
}
