export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  errors?: ValidationError[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface LoginRequest {
  phone: string;
  countryCode?: string;
}

export interface OTPVerifyRequest {
  phone: string;
  otp: string;
  countryCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateAddressRequest {
  label: string;
  fullName: string;
  phone: string;
  houseFlat?: string;
  building?: string;
  street?: string;
  landmark?: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  addressType: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}

export interface AddToCartRequest {
  productVariantId: string;
  quantity: number;
  isSubscription?: boolean;
  subscriptionFrequency?: string;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface PlaceOrderRequest {
  addressId: string;
  deliveryDate: string;
  deliverySlotId?: string;
  paymentMethod: string;
  couponCode?: string;
  useWallet?: boolean;
  walletAmount?: number;
  notes?: string;
  items: {
    productVariantId: string;
    quantity: number;
    isSubscription: boolean;
    subscriptionFrequency?: string;
  }[];
}

export interface CreateSubscriptionRequest {
  productVariantId: string;
  quantity: number;
  frequency: string;
  customDays?: number[];
  startDate: string;
  endDate?: string;
  addressId: string;
  deliverySlotId?: string;
  paymentMethod: string;
  notes?: string;
}

export interface RazorpayOrderRequest {
  amount: number;
  currency?: string;
  receipt?: string;
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface AdminCreateOrderRequest {
  customerId: string;
  addressId: string;
  deliveryDate: string;
  deliverySlotId?: string;
  paymentMethod: string;
  notes?: string;
  items: {
    productVariantId: string;
    quantity: number;
  }[];
}

export interface DashboardStats {
  totalRevenue: number;
  revenueToday: number;
  revenueThisMonth: number;
  totalOrders: number;
  ordersToday: number;
  activeSubscriptions: number;
  totalCustomers: number;
  newCustomers: number;
  activeDeliveryPartners: number;
  pendingDeliveries: number;
  failedDeliveries: number;
  walletBalanceLiability: number;
  postpaidOutstanding: number;
  bottleInventory: number;
  bottlesWithCustomers: number;
  bottlesBrokenOrLost: number;
  collectionsSummary: {
    totalCash: number;
    totalPostpaid: number;
    pendingCash: number;
    pendingPostpaid: number;
  };
}
