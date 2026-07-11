import { z } from 'zod';

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  countryCode: z.string().default('+91'),
});

export const otpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/),
  countryCode: z.string().default('+91'),
});

export const profileRegistrationSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  phone: z.string().min(10),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  referralCode: z.string().optional(),
  addressId: z.string().uuid().optional(),
});

export const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50),
  fullName: z.string().min(2, 'Full name is required').max(100),
  phone: z
    .string()
    .min(10, 'Phone number is required')
    .max(15)
    .regex(/^\d+$/),
  houseFlat: z.string().max(100).optional(),
  building: z.string().max(100).optional(),
  street: z.string().max(200).optional(),
  landmark: z.string().max(100).optional(),
  area: z.string().min(1, 'Area is required').max(100),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  postalCode: z
    .string()
    .min(4, 'Postal code must be at least 4 digits')
    .max(10)
    .regex(/^\d+$/, 'Postal code must contain only digits'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  addressType: z.enum(['HOME', 'WORK', 'OTHER']),
  isDefault: z.boolean().optional().default(false),
});

export const addToCartSchema = z.object({
  productVariantId: z.string().uuid('Invalid product variant'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100),
  isSubscription: z.boolean().optional().default(false),
  subscriptionFrequency: z
    .enum(['DAILY', 'ALTERNATE_DAYS', 'WEEKLY', 'MONTHLY', 'CUSTOM'])
    .optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(100),
});

export const placeOrderSchema = z.object({
  addressId: z.string().uuid('Invalid address'),
  deliveryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid delivery date',
  }),
  deliverySlotId: z.string().uuid().optional(),
  paymentMethod: z.enum([
    'WALLET',
    'RAZORPAY',
    'UPI',
    'CARD',
    'NET_BANKING',
    'CASH',
    'PARTIAL_WALLET_ONLINE',
    'POSTPAID',
  ]),
  couponCode: z.string().optional(),
  useWallet: z.boolean().optional().default(false),
  walletAmount: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        productVariantId: z.string().uuid(),
        quantity: z.number().int().min(1),
        isSubscription: z.boolean().default(false),
        subscriptionFrequency: z
          .enum(['DAILY', 'ALTERNATE_DAYS', 'WEEKLY', 'MONTHLY', 'CUSTOM'])
          .optional(),
      }),
    )
    .min(1, 'At least one item is required'),
});

export const createSubscriptionSchema = z.object({
  productVariantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  frequency: z.enum(['DAILY', 'ALTERNATE_DAYS', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
  customDays: z.array(z.number().int().min(0).max(6)).optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val))),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)))
    .optional(),
  addressId: z.string().uuid(),
  deliverySlotId: z.string().uuid().optional(),
  paymentMethod: z.enum(['WALLET', 'RAZORPAY', 'POSTPAID']),
  notes: z.string().max(500).optional(),
});

export const supportTicketSchema = z.object({
  category: z.enum([
    'ORDER_ISSUE',
    'DELIVERY_ISSUE',
    'PAYMENT_ISSUE',
    'PRODUCT_QUALITY',
    'SUBSCRIPTION_ISSUE',
    'BOTTLE_ISSUE',
    'ACCOUNT_ISSUE',
    'OTHER',
  ]),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(2000),
  orderId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(500).optional(),
  benefits: z.string().max(1000).optional(),
  ingredients: z.string().max(1000).optional(),
  nutritionalInfo: z.string().max(1000).optional(),
  storageInstructions: z.string().max(500).optional(),
  shelfLife: z.string().max(100).optional(),
  categoryId: z.string().uuid(),
  badges: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional().default(false),
  isTrending: z.boolean().optional().default(false),
  variants: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        unit: z.string().min(1).max(50),
        volume: z.number().positive(),
        sku: z.string().min(1).max(100),
        price: z.number().positive(),
        discountPrice: z.number().positive().optional(),
        taxRate: z.number().min(0).max(100).default(5),
        bottleTypeId: z.string().uuid().optional(),
        bottleDeposit: z.number().min(0).optional(),
        stock: z.number().int().min(0).default(0),
      }),
    )
    .min(1, 'At least one variant is required'),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  description: z.string().max(500).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  maxDiscount: z.number().positive().optional(),
  minOrderValue: z.number().min(0).default(0),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().optional(),
  applicableProducts: z.array(z.string().uuid()).optional(),
  applicableCategories: z.array(z.string().uuid()).optional(),
  startAt: z.string().refine((val) => !isNaN(Date.parse(val))),
  endAt: z.string().refine((val) => !isNaN(Date.parse(val))),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
