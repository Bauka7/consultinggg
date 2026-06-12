import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Upsert platform settings
  await prisma.platformSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      trialOrders: 5,
      warnThreshold: 3.5,
      blockThreshold: 3.0,
      autoApprove: false,
      autoAssign: true,
      assignRule: 'load',
    },
  });
  console.log('Platform settings seeded.');

  // Seed categories
  const categories = [
    { id: 'cat_electronics', name: 'Электроника', slug: 'electronics', icon: '⚡', hue: 210, blurb: 'Бытовая и промышленная электроника' },
    { id: 'cat_textiles', name: 'Текстиль и одежда', slug: 'textiles', icon: '👗', hue: 320, blurb: 'Одежда, ткани и швейное производство' },
    { id: 'cat_furniture', name: 'Мебель и товары для дома', slug: 'furniture', icon: '🪑', hue: 30, blurb: 'Мебель и товары для дома' },
    { id: 'cat_machinery', name: 'Оборудование и станки', slug: 'machinery', icon: '⚙️', hue: 180, blurb: 'Промышленное оборудование и станки' },
    { id: 'cat_plastics', name: 'Пластик и резина', slug: 'plastics', icon: '🧴', hue: 90, blurb: 'Изделия из пластика и резины' },
    { id: 'cat_metals', name: 'Металл и фурнитура', slug: 'metals', icon: '🔩', hue: 240, blurb: 'Металлообработка и фурнитура' },
    { id: 'cat_toys', name: 'Игрушки и игры', slug: 'toys', icon: '🎮', hue: 60, blurb: 'Игрушки, игры и развлечения' },
    { id: 'cat_food', name: 'Продукты и напитки', slug: 'food', icon: '🍜', hue: 15, blurb: 'Продукты питания и напитки' },
    { id: 'cat_cosmetics', name: 'Косметика и красота', slug: 'cosmetics', icon: '💄', hue: 350, blurb: 'Косметика и средства по уходу' },
    { id: 'cat_packaging', name: 'Упаковка', slug: 'packaging', icon: '📦', hue: 45, blurb: 'Упаковочные материалы и решения' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, slug: cat.slug, icon: cat.icon, hue: cat.hue, blurb: cat.blurb },
      create: cat,
    });
  }
  console.log(`${categories.length} categories seeded.`);

  // Seed platform admin user
  const adminEmail = 'admin@tradewind.app';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123!', 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: Role.platform_admin,
        name: 'Platform Admin',
        status: UserStatus.active,
      },
    });
    console.log(`Admin user created: ${admin.email}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Seed a demo consultant user
  const consultantEmail = 'consultant@tradewind.app';
  const existingConsultant = await prisma.user.findUnique({ where: { email: consultantEmail } });

  if (!existingConsultant) {
    const passwordHash = await bcrypt.hash('Consult@123!', 12);
    const consultantUser = await prisma.user.create({
      data: {
        email: consultantEmail,
        passwordHash,
        role: Role.consultant,
        name: 'Demo Consultant',
        phone: '+1234567890',
        city: 'Guangzhou',
        country: 'China',
        status: UserStatus.active,
      },
    });

    await prisma.consultantProfile.create({
      data: {
        userId: consultantUser.id,
        type: 'general',
        title: 'General Trade Consultant',
        bio: 'Experienced general consultant with extensive factory network in China.',
        years: 5,
        languages: ['en', 'ru', 'zh'],
        trial: false,
        verified: true,
        dealsClosed: 20,
        rating: 4.5,
        reviewsCount: 8,
        categories: {
          create: [
            { categoryId: 'cat_electronics' },
            { categoryId: 'cat_textiles' },
          ],
        },
      },
    });
    console.log(`Demo consultant created: ${consultantEmail}`);
  } else {
    console.log(`Demo consultant already exists: ${consultantEmail}`);
  }

  // Seed a demo client user
  const clientEmail = 'client@tradewind.app';
  const existingClient = await prisma.user.findUnique({ where: { email: clientEmail } });

  if (!existingClient) {
    const passwordHash = await bcrypt.hash('Client@123!', 12);
    await prisma.user.create({
      data: {
        email: clientEmail,
        passwordHash,
        role: Role.client,
        name: 'Demo Client',
        phone: '+9876543210',
        city: 'Moscow',
        country: 'Russia',
        status: UserStatus.active,
      },
    });
    console.log(`Demo client created: ${clientEmail}`);
  } else {
    console.log(`Demo client already exists: ${clientEmail}`);
  }

  // Seed a demo factory_admin user + their factory
  const factoryEmail = 'factory@tradewind.app';
  let factoryAdmin = await prisma.user.findUnique({ where: { email: factoryEmail } });

  if (!factoryAdmin) {
    const passwordHash = await bcrypt.hash('Factory@123!', 12);
    factoryAdmin = await prisma.user.create({
      data: {
        email: factoryEmail,
        passwordHash,
        role: Role.factory_admin,
        name: 'Demo Factory Admin',
        phone: '+8620000000',
        city: 'Shenzhen',
        country: 'China',
        status: UserStatus.active,
      },
    });
    console.log(`Demo factory admin created: ${factoryEmail}`);
  }

  // Create the factory owned by the factory_admin (idempotent by owner)
  let factory = await prisma.factory.findUnique({ where: { ownerUserId: factoryAdmin.id } });
  if (!factory) {
    factory = await prisma.factory.create({
      data: {
        name: 'Shenzhen Apex Electronics',
        nameCn: '深圳顶点电子',
        ownerUserId: factoryAdmin.id,
        city: 'Shenzhen',
        province: 'Guangdong',
        about: 'OEM/ODM electronics manufacturer — displays, IoT modules, consumer gadgets.',
        staff: '200-500',
        area: '18 000 м²',
        leadTime: '30-45 дней',
        established: 2009,
        verified: true,
        photoUrls: [],
        categories: { create: [{ categoryId: 'cat_electronics' }] },
        products: {
          create: [
            { name: 'LED Display Panel 55" 4K', sku: 'LED-55-4K', priceLo: 180, priceHi: 240, moq: 50, leadTime: '35 дней', active: true },
            { name: 'Smart IoT Hub Gen3', sku: 'IOT-HUB-G3', priceLo: 22, priceHi: 31, moq: 500, leadTime: '30 дней', active: true },
            { name: 'Wireless Earbuds TWS Pro', sku: 'TWS-PRO', priceLo: 9, priceHi: 14, moq: 1000, leadTime: '40 дней', active: false },
          ],
        },
        certs: {
          create: [
            { name: 'ISO 9001', org: 'SGS', status: 'active', validTill: 'Dec 2026' },
            { name: 'CE', org: 'TÜV', status: 'active', validTill: 'Aug 2026' },
            { name: 'RoHS', org: 'Intertek', status: 'pending' },
          ],
        },
      },
    });
    // bump category factory count
    await prisma.category.update({ where: { id: 'cat_electronics' }, data: { factoryCount: { increment: 1 } } });
    console.log(`Demo factory created: ${factory.name}`);

    // Link the demo consultant to this factory
    const cProfile = await prisma.consultantProfile.findFirst({ where: { user: { email: consultantEmail } } });
    if (cProfile) {
      await prisma.consultantFactoryLink.upsert({
        where: { consultantId_factoryId: { consultantId: cProfile.id, factoryId: factory.id } },
        update: {},
        create: { consultantId: cProfile.id, factoryId: factory.id },
      });
      console.log('Linked demo consultant to demo factory.');
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
