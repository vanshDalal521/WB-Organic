import {
  UserRole,
  OrderStatus,
  OrderType,
  SubscriptionFrequency,
  SubscriptionStatus,
  PaymentStatus,
  PaymentMethod,
  WalletTransactionType,
  BottleTransactionType,
  DeliveryStatus,
  DeliveryFailureReason,
  AddressType,
  ProductBadge,
  NotificationType,
  TicketStatus,
  TicketCategory,
  AttendanceStatus,
  RouteStatus,
} from './enums';

export interface User {
  id: string;
  phone: string;
  email?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isActive: boolean;
  role?: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  profilePhotoUrl?: string;
  referralCode: string;
  referredBy?: string;
  defaultAddressId?: string;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryPartnerProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  employeeId: string;
  serviceAreaId?: string;
  isActive: boolean;
  profilePhotoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  roleId: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description?: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
}

export interface Address {
  id: string;
  customerId: string;
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
  addressType: AddressType;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceArea {
  id: string;
  name: string;
  postalCodes: string[];
  city: string;
  isActive: boolean;
  deliveryCharge: number;
  minimumOrder: number;
  holidays: Date[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliverySlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  serviceAreaId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  benefits?: string;
  ingredients?: string;
  nutritionalInfo?: string;
  storageInstructions?: string;
  shelfLife?: string;
  categoryId: string;
  category?: Category;
  variants: ProductVariant[];
  images: ProductImage[];
  badges: ProductBadge[];
  isFeatured: boolean;
  isTrending: boolean;
  isMostPurchased: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  unit: string;
  volume: number;
  sku: string;
  price: number;
  discountPrice?: number;
  taxRate: number;
  bottleTypeId?: string;
  bottleDeposit?: number;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
}

export interface CartItem {
  id: string;
  customerId: string;
  productVariantId: string;
  productVariant?: ProductVariant;
  quantity: number;
  isSubscription: boolean;
  subscriptionFrequency?: SubscriptionFrequency;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: CustomerProfile;
  orderType: OrderType;
  status: OrderStatus;
  addressId: string;
  address?: Address;
  deliveryDate: Date;
  deliverySlotId?: string;
  deliverySlot?: DeliverySlot;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCharge: number;
  bottleDeposit: number;
  walletDeduction: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  couponCode?: string;
  notes?: string;
  deliveryPartnerId?: string;
  statusHistory: OrderStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productVariantId: string;
  productVariant?: ProductVariant;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  notes?: string;
  changedBy?: string;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  customerId: string;
  customer?: CustomerProfile;
  status: SubscriptionStatus;
  frequency: SubscriptionFrequency;
  customDays?: number[];
  startDate: Date;
  endDate?: Date;
  addressId: string;
  address?: Address;
  deliverySlotId?: string;
  deliverySlot?: DeliverySlot;
  paymentMethod: PaymentMethod;
  items: SubscriptionItem[];
  nextDeliveryDate?: Date;
  totalAmount: number;
  statusHistory: SubscriptionStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  productVariantId: string;
  productVariant?: ProductVariant;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
}

export interface SubscriptionDelivery {
  id: string;
  subscriptionId: string;
  deliveryDate: Date;
  status: DeliveryStatus;
  orderId?: string;
  order?: Order;
  isSkipped: boolean;
  skipReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionStatusHistory {
  id: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  notes?: string;
  changedBy?: string;
  createdAt: Date;
}

export interface Route {
  id: string;
  name: string;
  deliveryPartnerId: string;
  deliveryPartner?: DeliveryPartnerProfile;
  serviceAreaId: string;
  date: Date;
  status: RouteStatus;
  stops: RouteStop[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteStop {
  id: string;
  routeId: string;
  orderId: string;
  order?: Order;
  customerId: string;
  customer?: CustomerProfile;
  addressId: string;
  address?: Address;
  sequence: number;
  status: DeliveryStatus;
  arrivedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Delivery {
  id: string;
  orderId: string;
  order?: Order;
  deliveryPartnerId: string;
  deliveryPartner?: DeliveryPartnerProfile;
  status: DeliveryStatus;
  bottlesIssued: number;
  bottlesCollected: number;
  cashCollected: number;
  postpaidCollected: number;
  proofType?: string;
  proofUrl?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  failedReason?: DeliveryFailureReason;
  attempts: DeliveryAttempt[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryAttempt {
  id: string;
  deliveryId: string;
  status: DeliveryStatus;
  reason?: DeliveryFailureReason;
  notes?: string;
  proofUrl?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
}

export interface Attendance {
  id: string;
  deliveryPartnerId: string;
  date: Date;
  status: AttendanceStatus;
  checkInTime: Date;
  checkOutTime?: Date;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  selfieUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  orderId?: string;
  subscriptionId?: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  orderId?: string;
  customerId: string;
  amount: number;
  reason?: string;
  status: PaymentStatus;
  razorpayRefundId?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  customerId: string;
  balance: number;
  promotionalBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: PaymentStatus;
  description?: string;
  referenceId?: string;
  idempotencyKey: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface PostpaidAccount {
  id: string;
  customerId: string;
  creditLimit: number;
  outstanding: number;
  billingCycle: string;
  dueDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostpaidStatement {
  id: string;
  accountId: string;
  orderId: string;
  amount: number;
  type: 'CHARGE' | 'PAYMENT';
  description: string;
  createdAt: Date;
}

export interface Collection {
  id: string;
  deliveryPartnerId: string;
  orderId: string;
  customerId: string;
  amount: number;
  type: 'CASH' | 'POSTPAID';
  status: 'PENDING' | 'COLLECTED' | 'SETTLED';
  collectedAt?: Date;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BottleType {
  id: string;
  name: string;
  volume: number;
  depositAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BottleTransaction {
  id: string;
  customerId: string;
  deliveryPartnerId?: string;
  orderId?: string;
  deliveryId?: string;
  bottleTypeId: string;
  type: BottleTransactionType;
  quantity: number;
  reason?: string;
  proofUrl?: string;
  adminNotes?: string;
  createdAt: Date;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaDestination?: string;
  startAt: Date;
  endAt: Date;
  priority: number;
  isActive: boolean;
  targetAudience?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarmStory {
  id: string;
  title: string;
  description?: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  thumbnailUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  imageUrl?: string;
  createdAt: Date;
}

export interface NotificationRecipient {
  id: string;
  notificationId: string;
  customerId: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customer?: CustomerProfile;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  orderId?: string;
  subscriptionId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  messages: SupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  message: string;
  attachmentUrl?: string;
  createdAt: Date;
}

export interface Referral {
  id: string;
  referrerId: string;
  referrer?: CustomerProfile;
  referredId: string;
  referred?: CustomerProfile;
  referralCode: string;
  signupRewardStatus: 'PENDING' | 'CREDITED' | 'EXPIRED';
  firstOrderRewardStatus: 'PENDING' | 'CREDITED' | 'EXPIRED';
  signupRewardAmount: number;
  firstOrderRewardAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

export interface BackgroundJobLog {
  id: string;
  jobType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  payload?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}
