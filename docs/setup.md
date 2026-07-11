# WB Organic Dairy - Setup Guide

## Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm or yarn

## Quick Start

### 1. Clone and install
```bash
git clone <repo-url>
cd wb-organic-dairy
npm install
```

### 2. Start infrastructure
```bash
docker-compose up -d
```
This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO (S3) on port 9000/9001
- MailHog on port 1025/8025

### 3. Setup environment
```bash
cp .env.example apps/api/.env
```

### 4. Setup database
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

### 5. Start development servers

Backend API:
```bash
npm run dev:api
```

Admin Panel:
```bash
npm run dev:admin
```

Customer Mobile App:
```bash
npm run dev:customer
```

Delivery Mobile App:
```bash
npm run dev:delivery
```

## Test Accounts

### Admin
- Email: admin@wborganicdairy.com
- Password: admin123

### Delivery Partner
- Phone: 7777777777
- Password: delivery123

### Customer
- Phone: 9876543210
- OTP: 123456 (development only)

## API Documentation
Visit http://localhost:3000/api/docs for Swagger documentation.

## Environment Variables
See `.env.example` for all required environment variables.

## Useful Commands
```bash
# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio
npm run db:reset        # Reset database

# Development
npm run dev             # Start API + Admin
npm run build           # Build all
npm run test            # Run tests
npm run lint            # Run linting

# Docker
docker-compose up -d    # Start services
docker-compose down     # Stop services
docker-compose logs -f  # View logs
```
