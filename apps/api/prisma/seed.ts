import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean database
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;

  // Create Roles FIRST (needed for admin profiles)
  const roles = [
    { name: UserRole.SUPER_ADMIN, displayName: 'Super Admin', permissions: ['*'] },
    { name: UserRole.OPERATIONS_MANAGER, displayName: 'Operations Manager', permissions: ['customer.view', 'customer.edit', 'order.cancel', 'subscription.manage', 'delivery.assign'] },
    { name: UserRole.PRODUCT_MANAGER, displayName: 'Product Manager', permissions: ['product.create', 'product.edit'] },
    { name: UserRole.DELIVERY_MANAGER, displayName: 'Delivery Manager', permissions: ['delivery.assign'] },
    { name: UserRole.FINANCE_MANAGER, displayName: 'Finance Manager', permissions: ['payment.refund', 'report.export'] },
    { name: UserRole.CUSTOMER_SUPPORT, displayName: 'Customer Support', permissions: ['customer.view', 'order.cancel'] },
    { name: UserRole.MARKETING_MANAGER, displayName: 'Marketing Manager', permissions: ['product.create', 'product.edit'] },
    { name: UserRole.REPORT_VIEWER, displayName: 'Report Viewer', permissions: ['report.export'] },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        displayName: role.displayName,
        permissions: role.permissions,
      },
    });
  }
  console.log('✅ Roles created');

  // Create Super Admin
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
  const superAdminRole = await prisma.role.findUnique({ where: { name: UserRole.SUPER_ADMIN } });
  const opsAdminRole = await prisma.role.findUnique({ where: { name: UserRole.OPERATIONS_MANAGER } });

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@wborganicdairy.com',
      phone: '9999999999',
      passwordHash: adminPasswordHash,
      isEmailVerified: true,
      isPhoneVerified: true,
      role: UserRole.SUPER_ADMIN,
      adminProfile: {
        create: {
          fullName: 'Super Admin',
          email: 'admin@wborganicdairy.com',
          roleId: superAdminRole!.id,
          isActive: true,
        },
      },
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // Create Operations Admin
  const opsAdmin = await prisma.user.create({
    data: {
      email: 'ops@wborganicdairy.com',
      phone: '8888888888',
      passwordHash: adminPasswordHash,
      isEmailVerified: true,
      isPhoneVerified: true,
      role: UserRole.OPERATIONS_MANAGER,
      adminProfile: {
        create: {
          fullName: 'Operations Manager',
          email: 'ops@wborganicdairy.com',
          roleId: opsAdminRole!.id,
          isActive: true,
        },
      },
    },
  });
  console.log('✅ Operations Admin created:', opsAdmin.email);

  // Create Service Areas
  const serviceArea1 = await prisma.serviceArea.create({
    data: {
      name: 'Noida',
      postalCodes: ['201301', '201302', '201303', '201304', '201305'],
      city: 'Noida',
      isActive: true,
      deliveryCharge: 20,
      minimumOrder: 200,
      holidays: [],
    },
  });

  await prisma.serviceArea.create({
    data: {
      name: 'Gurgaon',
      postalCodes: ['122001', '122002', '122003', '122004', '122005'],
      city: 'Gurgaon',
      isActive: true,
      deliveryCharge: 20,
      minimumOrder: 200,
      holidays: [],
    },
  });
  console.log('✅ Service areas created');

  // Create Delivery Slots
  await Promise.all([
    prisma.deliverySlot.create({
      data: { name: 'Morning (6:00 AM - 8:00 AM)', startTime: '06:00', endTime: '08:00', isActive: true },
    }),
    prisma.deliverySlot.create({
      data: { name: 'Afternoon (12:00 PM - 2:00 PM)', startTime: '12:00', endTime: '14:00', isActive: true },
    }),
    prisma.deliverySlot.create({
      data: { name: 'Evening (5:00 PM - 7:00 PM)', startTime: '17:00', endTime: '19:00', isActive: true },
    }),
  ]);
  console.log('✅ Delivery slots created');

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Cow Milk', slug: 'cow-milk', sortOrder: 1, isActive: true } }),
    prisma.category.create({ data: { name: 'Buffalo Milk', slug: 'buffalo-milk', sortOrder: 2, isActive: true } }),
    prisma.category.create({ data: { name: 'A2 Milk', slug: 'a2-milk', sortOrder: 3, isActive: true } }),
    prisma.category.create({ data: { name: 'Curd', slug: 'curd', sortOrder: 4, isActive: true } }),
    prisma.category.create({ data: { name: 'Paneer', slug: 'paneer', sortOrder: 5, isActive: true } }),
    prisma.category.create({ data: { name: 'Butter', slug: 'butter', sortOrder: 6, isActive: true } }),
    prisma.category.create({ data: { name: 'Ghee', slug: 'ghee', sortOrder: 7, isActive: true } }),
    prisma.category.create({ data: { name: 'Buttermilk', slug: 'buttermilk', sortOrder: 8, isActive: true } }),
    prisma.category.create({ data: { name: 'Dairy Combos', slug: 'dairy-combos', sortOrder: 9, isActive: true } }),
    prisma.category.create({ data: { name: 'Organic Products', slug: 'organic-products', sortOrder: 10, isActive: true } }),
  ]);
  console.log('✅ Categories created');

  // Create Bottle Types
  const bottleTypes = await Promise.all([
    prisma.bottleType.create({
      data: { name: 'Glass Bottle 500ml', volume: 500, depositAmount: 50, isActive: true },
    }),
    prisma.bottleType.create({
      data: { name: 'Glass Bottle 1L', volume: 1000, depositAmount: 100, isActive: true },
    }),
    prisma.bottleType.create({
      data: { name: 'Plastic Bottle 500ml', volume: 500, depositAmount: 25, isActive: true },
    }),
  ]);
  console.log('✅ Bottle types created');

  // Create Products
  await Promise.all([
    prisma.product.create({
      data: {
        name: 'A2 Cow Milk',
        slug: 'a2-cow-milk',
        description: 'Farm fresh A2 cow milk from our happy cows. Pure, natural, and nutritious.',
        shortDescription: 'Farm Fresh & Pure',
        benefits: 'Rich in protein, calcium, and essential nutrients',
        ingredients: '100% Pure A2 Cow Milk',
        storageInstructions: 'Refrigerate at 2-4°C. Use within 3 days of delivery.',
        shelfLife: '3 days from delivery',
        categoryId: categories[2].id,
        badges: ['ORGANIC', 'FARM_FRESH', 'A2', 'BEST_SELLER'],
        isFeatured: true,
        isTrending: true,
        isMostPurchased: true,
        isActive: true,
        variants: {
          create: [
            {
              name: '500ml',
              unit: 'ml',
              volume: 500,
              sku: 'A2-COW-500',
              price: 60,
              taxRate: 0,
              bottleTypeId: bottleTypes[0].id,
              bottleDeposit: 50,
              stock: 1000,
              isActive: true,
            },
            {
              name: '1 Liter',
              unit: 'L',
              volume: 1000,
              sku: 'A2-COW-1000',
              price: 100,
              discountPrice: 90,
              taxRate: 0,
              bottleTypeId: bottleTypes[1].id,
              bottleDeposit: 100,
              stock: 500,
              isActive: true,
            },
          ],
        },
        images: {
          create: [
            {
              url: '/images/products/a2-cow-milk.jpg',
              altText: 'A2 Cow Milk',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Buffalo Milk',
        slug: 'buffalo-milk',
        description: 'Rich and creamy buffalo milk, perfect for making tea, coffee, and desserts.',
        shortDescription: 'Rich & Creamy',
        benefits: 'High in fat and protein, ideal for tea and desserts',
        ingredients: '100% Pure Buffalo Milk',
        storageInstructions: 'Refrigerate at 2-4°C. Use within 2 days of delivery.',
        shelfLife: '2 days from delivery',
        categoryId: categories[1].id,
        badges: ['FARM_FRESH', 'BEST_SELLER'],
        isFeatured: true,
        isTrending: true,
        isActive: true,
        variants: {
          create: [
            {
              name: '500ml',
              unit: 'ml',
              volume: 500,
              sku: 'BUF-500',
              price: 50,
              taxRate: 0,
              bottleTypeId: bottleTypes[0].id,
              bottleDeposit: 50,
              stock: 800,
              isActive: true,
            },
            {
              name: '1 Liter',
              unit: 'L',
              volume: 1000,
              sku: 'BUF-1000',
              price: 90,
              taxRate: 0,
              bottleTypeId: bottleTypes[1].id,
              bottleDeposit: 100,
              stock: 400,
              isActive: true,
            },
          ],
        },
        images: {
          create: [
            {
              url: '/images/products/buffalo-milk.jpg',
              altText: 'Buffalo Milk',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cow Milk',
        slug: 'cow-milk',
        description: 'Fresh and pure cow milk from our farm. Light and easy to digest.',
        shortDescription: 'Light & Healthy',
        benefits: 'Low fat, easy to digest, rich in calcium',
        ingredients: '100% Pure Cow Milk',
        storageInstructions: 'Refrigerate at 2-4°C. Use within 3 days of delivery.',
        shelfLife: '3 days from delivery',
        categoryId: categories[0].id,
        badges: ['FARM_FRESH'],
        isFeatured: true,
        isActive: true,
        variants: {
          create: [
            {
              name: '500ml',
              unit: 'ml',
              volume: 500,
              sku: 'COW-500',
              price: 35,
              taxRate: 0,
              bottleTypeId: bottleTypes[0].id,
              bottleDeposit: 50,
              stock: 1000,
              isActive: true,
            },
            {
              name: '1 Liter',
              unit: 'L',
              volume: 1000,
              sku: 'COW-1000',
              price: 60,
              taxRate: 0,
              bottleTypeId: bottleTypes[1].id,
              bottleDeposit: 100,
              stock: 500,
              isActive: true,
            },
          ],
        },
        images: {
          create: [
            {
              url: '/images/products/cow-milk.jpg',
              altText: 'Cow Milk',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Buffalo Ghee',
        slug: 'buffalo-ghee',
        description: 'Traditional slow-cooked buffalo ghee. Pure, aromatic, and full of flavor.',
        shortDescription: 'Traditional & Pure',
        benefits: 'Rich in healthy fats, boosts immunity, aids digestion',
        ingredients: '100% Pure Buffalo Ghee',
        storageInstructions: 'Store in a cool, dry place. No refrigeration needed.',
        shelfLife: '6 months from manufacturing',
        categoryId: categories[6].id,
        badges: ['ORGANIC', 'BEST_SELLER'],
        isFeatured: true,
        isTrending: true,
        isActive: true,
        variants: {
          create: [
            {
              name: '250ml',
              unit: 'ml',
              volume: 250,
              sku: 'GHEE-250',
              price: 350,
              taxRate: 5,
              stock: 200,
              isActive: true,
            },
            {
              name: '500ml',
              unit: 'ml',
              volume: 500,
              sku: 'GHEE-500',
              price: 650,
              taxRate: 5,
              stock: 100,
              isActive: true,
            },
          ],
        },
        images: {
          create: [
            {
              url: '/images/products/buffalo-ghee.jpg',
              altText: 'Buffalo Ghee',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Fresh Paneer',
        slug: 'fresh-paneer',
        description: 'Soft and fresh paneer made daily from pure milk. No preservatives.',
        shortDescription: 'Soft & Fresh',
        benefits: 'High protein, fresh, no preservatives',
        ingredients: 'Milk, Lemon Juice',
        storageInstructions: 'Refrigerate immediately. Use within 2 days.',
        shelfLife: '2 days from delivery',
        categoryId: categories[4].id,
        badges: ['FARM_FRESH', 'NO_PRESERVATIVES'],
        isFeatured: true,
        isActive: true,
        variants: {
          create: [
            {
              name: '200g',
              unit: 'g',
              volume: 200,
              sku: 'PANEER-200',
              price: 80,
              taxRate: 5,
              stock: 300,
              isActive: true,
            },
            {
              name: '500g',
              unit: 'g',
              volume: 500,
              sku: 'PANEER-500',
              price: 180,
              taxRate: 5,
              stock: 150,
              isActive: true,
            },
          ],
        },
        images: {
          create: [
            {
              url: '/images/products/fresh-paneer.jpg',
              altText: 'Fresh Paneer',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
        },
      },
    }),
  ]);
  console.log('✅ Products created');

  // Create Banners
  await Promise.all([
    prisma.banner.create({
      data: {
        title: 'Fresh Milk, Trusted by Thousands of Families',
        subtitle: 'Pure & Farm Fresh',
        imageUrl: '/images/banners/fresh-milk-banner.jpg',
        ctaLabel: 'Watch Farm Story',
        ctaDestination: 'farm-story',
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        priority: 1,
        isActive: true,
      },
    }),
    prisma.banner.create({
      data: {
        title: 'Get 20% Off on First Order',
        subtitle: 'Use code FIRST20',
        imageUrl: '/images/banners/first-order-banner.jpg',
        ctaLabel: 'Shop Now',
        ctaDestination: 'products',
        startAt: new Date(),
        endAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        priority: 2,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Banners created');

  // Create Farm Stories
  await Promise.all([
    prisma.farmStory.create({
      data: {
        title: 'Our Farm',
        description: 'Take a look at our farm and see how we raise our happy cows.',
        mediaType: 'VIDEO',
        mediaUrl: '/videos/farm-tour.mp4',
        thumbnailUrl: '/images/farm-story/farm-tour-thumb.jpg',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.farmStory.create({
      data: {
        title: 'How We Process Milk',
        description: 'From farm to your doorstep, see our careful processing journey.',
        mediaType: 'VIDEO',
        mediaUrl: '/videos/milk-processing.mp4',
        thumbnailUrl: '/images/farm-story/processing-thumb.jpg',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.farmStory.create({
      data: {
        title: 'Glass Bottle Cleaning',
        description: '100% hygiene with our advanced bottle cleaning process.',
        mediaType: 'VIDEO',
        mediaUrl: '/videos/bottle-cleaning.mp4',
        thumbnailUrl: '/images/farm-story/cleaning-thumb.jpg',
        sortOrder: 3,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Farm stories created');

  // Create Coupons
  await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'FIRST20',
        description: '20% off on first order',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscount: 100,
        minOrderValue: 200,
        usageLimit: 1000,
        perCustomerLimit: 1,
        startAt: new Date(),
        endAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'WELCOME50',
        description: 'Flat ₹50 off on orders above ₹500',
        discountType: 'FIXED',
        discountValue: 50,
        minOrderValue: 500,
        usageLimit: 500,
        perCustomerLimit: 1,
        startAt: new Date(),
        endAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Coupons created');

  // Create Delivery Partner
  const dpPasswordHash = await bcrypt.hash(process.env.DELIVERY_PASSWORD || 'delivery123', 12);
  await prisma.user.create({
    data: {
      phone: '7777777777',
      passwordHash: dpPasswordHash,
      isPhoneVerified: true,
      role: UserRole.DELIVERY_MANAGER,
      deliveryProfile: {
        create: {
          fullName: 'Rajesh Kumar',
          phone: '7777777777',
          employeeId: 'DP001',
          serviceAreaId: serviceArea1.id,
          isActive: true,
        },
      },
    },
  });
  console.log('✅ Delivery partner created');

  // Create Test Customer
  const customerPhone = '9876543210';
  const customerUser = await prisma.user.create({
    data: {
      phone: customerPhone,
      isPhoneVerified: true,
      customerProfile: {
        create: {
          fullName: 'Rahul Sharma',
          phone: customerPhone,
          email: 'rahul@example.com',
          referralCode: 'WBRAHUL01',
          isProfileComplete: true,
          addresses: {
            create: {
              label: 'Home',
              fullName: 'Rahul Sharma',
              phone: customerPhone,
              houseFlat: '45B',
              building: 'Sunshine Apartments',
              street: 'MG Road',
              landmark: 'Near City Park',
              area: 'Sector 62',
              city: 'Noida',
              state: 'Uttar Pradesh',
              postalCode: '201301',
              latitude: 28.6139,
              longitude: 77.209,
              addressType: 'HOME',
              isDefault: true,
            },
          },
        },
      },
    },
    include: { customerProfile: true },
  });

  // Create wallet for customer
  await prisma.wallet.create({
    data: {
      customerId: customerUser.customerProfile!.id,
      balance: 550,
      promotionalBalance: 0,
    },
  });
  console.log('✅ Test customer created');

  // Create App Settings
  const settings = [
    { key: 'business.name', value: 'WB Organic Dairy', category: 'business' },
    { key: 'business.tagline', value: 'Pure by Nature, Healthy by Choice', category: 'business' },
    { key: 'business.currency', value: 'INR', category: 'business' },
    { key: 'business.timezone', value: 'Asia/Kolkata', category: 'business' },
    { key: 'business.invoicePrefix', value: 'WBOD', category: 'business' },
    { key: 'delivery.defaultCharge', value: 20, category: 'delivery' },
    { key: 'delivery.freeThreshold', value: 500, category: 'delivery' },
    { key: 'wallet.minRecharge', value: 100, category: 'wallet' },
    { key: 'wallet.maxRecharge', value: 10000, category: 'wallet' },
    { key: 'referral.rewardAmount', value: 50, category: 'referral' },
    { key: 'otp.expiryMinutes', value: 5, category: 'otp' },
    { key: 'otp.maxAttempts', value: 5, category: 'otp' },
    { key: 'otp.resendDelaySeconds', value: 30, category: 'otp' },
    { key: 'postpaid.defaultCreditLimit', value: 2000, category: 'postpaid' },
  ];

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
        category: setting.category,
      },
    });
  }
  console.log('✅ App settings created');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
