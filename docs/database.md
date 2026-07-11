# WB Organic Dairy - Database Design

## Overview
PostgreSQL database with Prisma ORM using UUID identifiers and decimal types for financial data.

## Core Entities

### User & Auth
- **User** - Base user model with phone/email authentication
- **Session** - JWT refresh token management
- **OTPRequest** - OTP verification tracking
- **Device** - Device registration

### User Profiles
- **CustomerProfile** - Customer details and referral codes
- **DeliveryPartnerProfile** - Delivery partner details
- **AdminProfile** - Admin user details with role

### Location
- **Address** - Customer delivery addresses with GPS coordinates
- **ServiceArea** - Serviceable areas with postal codes
- **DeliverySlot** - Available delivery time slots

### Product Catalog
- **Category** - Product categories
- **Product** - Main product information
- **ProductVariant** - Product variants (sizes, volumes)
- **ProductImage** - Product images
- **Favourite** - Customer product favourites

### Orders & Payments
- **Cart** / **CartItem** - Shopping cart
- **Order** / **OrderItem** - Order records
- **OrderStatusHistory** - Order status tracking
- **Payment** - Payment records
- **Refund** - Refund records
- **Coupon** / **CouponUsage** - Coupon management

### Subscriptions
- **Subscription** - Subscription records
- **SubscriptionItem** - Subscription items
- **SubscriptionDelivery** - Generated delivery instances
- **SubscriptionStatusHistory** - Status tracking

### Delivery
- **Route** - Delivery routes
- **RouteStop** - Individual stops on routes
- **Delivery** - Delivery records
- **DeliveryAttempt** - Failed delivery attempts
- **Attendance** - Delivery partner attendance

### Wallet
- **Wallet** - Customer wallet balances
- **WalletTransaction** - Immutable wallet ledger
- **PostpaidAccount** - Postpaid billing accounts
- **PostpaidStatement** - Postpaid statements

### Bottles
- **BottleType** - Bottle types and deposits
- **BottleTransaction** - Bottle movements
- **CustomerBottleLedger** - Customer bottle balances
- **DeliveryPartnerBottleLedger** - Partner bottle balances

### Content & Marketing
- **Banner** - Home page banners
- **FarmStory** - Farm story content
- **Notification** / **NotificationRecipient** - Notifications
- **Referral** - Referral tracking
- **Advertisement** - Advertisement management

### Support
- **SupportTicket** - Support tickets
- **SupportMessage** - Ticket messages

### System
- **Role** - Admin roles
- **AppSetting** - System settings
- **AuditLog** - Admin audit trail
- **BackgroundJobLog** - Job execution tracking
