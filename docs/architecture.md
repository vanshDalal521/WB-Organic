# WB Organic Dairy - Architecture

## Overview
WB Organic Dairy is a complete dairy delivery platform with three applications sharing a common backend.

## Monorepo Structure
```
wb-organic-dairy/
├── apps/
│   ├── api/                    # NestJS Backend API
│   ├── customer-mobile/        # React Native Expo Customer App
│   ├── delivery-mobile/        # React Native Expo Delivery Partner App
│   └── admin-web/              # Next.js Admin Panel
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── validation/             # Shared Zod validation schemas
│   ├── utils/                  # Shared utility functions
│   ├── config/                 # Shared configuration
│   ├── api-client/             # Shared API client
│   └── ui/                     # Shared UI components
├── docs/                       # Documentation
├── docker-compose.yml          # Docker configuration
├── package.json                # Root package.json
└── turbo.json                  # Turborepo configuration
```

## Tech Stack
- **Mobile**: React Native + Expo + TypeScript + Expo Router
- **Admin**: Next.js + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Cache**: Redis + BullMQ
- **Storage**: S3-compatible (MinIO for dev)
- **Infrastructure**: Docker + Docker Compose

## Authentication
- JWT access + refresh tokens
- OTP-based login for customers
- Password-based login for admin and delivery partners
- Token rotation on refresh
- Session management

## Database
- PostgreSQL with Prisma ORM
- UUID primary keys
- Decimal types for money
- Ledger-based wallet and bottle tracking
- Idempotency keys for payment operations

## API Design
- RESTful API under `/api/v1/`
- Standard response format: `{ success, message, data, meta }`
- Pagination with page/limit
- Swagger documentation at `/api/docs`

## Security
- bcrypt password hashing
- JWT authentication
- Role-based access control
- Rate limiting
- Input validation
- SQL injection prevention via ORM
- Webhook signature verification

## Business Logic
- Subscription delivery generation via background jobs
- Wallet ledger with atomic transactions
- Bottle tracking with customer and delivery partner ledgers
- Idempotent payment operations
- Coupon validation on backend
- Order creation with stock reservation
