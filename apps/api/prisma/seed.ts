import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role, CouponType } from '../src/common/enums';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('🌱 Seeding ApexGear database...');

  // 1. Users (6 Roles, password: Test@123456)
  const defaultPassword = await bcrypt.hash('Test@123456', 10);

  const usersToSeed = [
    {
      email: 'customer@apexgear.vn',
      name: 'Khách Hàng Test',
      role: Role.CUSTOMER,
    },
    {
      email: 'content@apexgear.vn',
      name: 'Quản Lý Nội Dung',
      role: Role.CONTENT_MANAGER,
    },
    {
      email: 'inventory@apexgear.vn',
      name: 'Quản Lý Kho Hàng',
      role: Role.INVENTORY_MANAGER,
    },
    {
      email: 'order@apexgear.vn',
      name: 'Quản Lý Đơn Hàng',
      role: Role.ORDER_MANAGER,
    },
    {
      email: 'admin@apexgear.vn',
      name: 'Quản Trị Viên',
      role: Role.ADMIN,
    },
    {
      email: 'superadmin@apexgear.vn',
      name: 'Quản Trị Viên Cấp Cao',
      role: Role.SUPER_ADMIN,
    },
  ];

  for (const user of usersToSeed) {
    const seededUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        password: defaultPassword,
        isActive: true,
      },
      create: {
        email: user.email,
        password: defaultPassword,
        name: user.name,
        role: user.role,
        emailVerifiedAt: new Date(),
        activationStatus: 'ACTIVE',
        isActive: true,
      },
    });
    console.log(`✅ User (${user.role}): ${seededUser.email}`);
  }

  // 2. Categories (4 main categories from Image 6)
  const categories = [
    {
      name: 'Tai nghe',
      slug: 'tai-nghe',
      sortOrder: 0,
      image:
        'https://cdn.hstatic.net/products/200000722513/tai-nghe-gaming-khong-day-logitech-astro-a20-x-1_d664b2ce170540ca91a9507035c4b175_master.jpg',
    },
    {
      name: 'Bàn phím',
      slug: 'ban-phim',
      sortOrder: 0,
      image:
        '//cdn.hstatic.net/products/200000722513/ban-phim-co-razer-huntsman-v3-pro-8khz-1_6fcde85db2794aaa9d2dddfc487cf5ba_master.jpg',
    },
    {
      name: 'Màn hình',
      slug: 'man-hinh',
      sortOrder: 0,
      image:
        '//cdn.hstatic.net/products/200000722513/view_xg2730d-4k_gearvn_b4b2e8f9b6864e8eae230e3685bb5ee2_master.jpg',
    },
    {
      name: 'Chuột',
      slug: 'chuot',
      sortOrder: 0,
      image:
        '//cdn.hstatic.net/products/200000722513/chuot-razer-khong-day-viper-v4-pro-den-1_87e1cc28460d4463bf93f4dad931cb86_master.jpg',
    },
  ];

  for (const catData of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: {
        name: catData.name,
        image: catData.image,
        isActive: true,
      },
      create: {
        name: catData.name,
        slug: catData.slug,
        sortOrder: catData.sortOrder,
        image: catData.image,
        isActive: true,
      },
    });
    console.log(`✅ Category: ${cat.name}`);
  }

  // 3. Brands (9 Brands from Image 5 - excluding Sony & test brand)
  const brands = [
    {
      name: 'HyperX',
      slug: 'hyperx',
      logo: '//row.hyperx.com/cdn/shop/files/hyperxlogo_150x.svg?v=1751339570',
    },
    {
      name: 'Veekos',
      slug: 'veekos',
      logo: 'https://www.veekos.com/wp-content/uploads/2025/03/cropped-veekos-150x38.png',
    },
    {
      name: 'ACER',
      slug: 'acer',
      logo: 'https://inkythuatso.com/uploads/images/2021/11/logo-acer-inkythuatso-2-01-27-15-49-45.jpg',
    },
    {
      name: 'Logitech',
      slug: 'logitech',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Logitech_logo.svg',
    },
    {
      name: 'MSI',
      slug: 'msi',
      logo: 'https://storage-asset.msi.com/global/picture/image/icons/logo.png',
    },
    {
      name: 'AKKO',
      slug: 'akko',
      logo: 'https://akko.vn/wp-content/uploads/2019/09/index_logo2.png',
    },
    {
      name: 'Corsair',
      slug: 'corsair',
      logo: 'https://cwsmgmt.corsair.com/press/CORSAIRLogo2020_stack_K.png',
    },
    {
      name: 'ASUS',
      slug: 'asus',
      logo: 'https://dlcdnimgs.asus.com/images/logo/logo-001.svg',
    },
    {
      name: 'Razer',
      slug: 'razer',
      logo: 'https://assets2.razerzone.com/images/phoenix/razer-ths-logo.svg',
    },
  ];

  for (const b of brands) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {
        name: b.name,
        logo: b.logo,
        isActive: true,
      },
      create: {
        name: b.name,
        slug: b.slug,
        logo: b.logo,
        isActive: true,
      },
    });
    console.log(`✅ Brand: ${b.name}`);
  }

  // 4. Default Settings (Image 2)
  const settings = [
    { key: 'shipping_fee', value: '30000' },
    { key: 'store_name', value: 'ApexGear' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
    console.log(`✅ Setting: ${s.key}=${s.value}`);
  }

  // 5. Coupon (Image 1)
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {
      type: CouponType.PERCENTAGE,
      value: 10,
      minOrderValue: 10000,
      maxDiscount: 50000,
      maxUses: 10,
      usedCount: 0,
      startsAt: new Date('2026-07-24T17:00:00.000Z'),
      expiresAt: new Date('2026-07-31T16:59:00.000Z'),
      isActive: true,
    },
    create: {
      code: 'WELCOME10',
      type: CouponType.PERCENTAGE,
      value: 10,
      minOrderValue: 10000,
      maxDiscount: 50000,
      maxUses: 10,
      usedCount: 0,
      startsAt: new Date('2026-07-24T17:00:00.000Z'),
      expiresAt: new Date('2026-07-31T16:59:00.000Z'),
      isActive: true,
    },
  });
  console.log('✅ Coupon: WELCOME10');

  // 6. Shipping Rules (Image 3/4)
  const defaultRule = await prisma.shippingRule.upsert({
    where: { id: 'ad8e3e1c-7bcc-42b6-b823-a1b36bb73dac' },
    update: {
      name: 'Phí mặc định toàn quốc',
      fee: 30000,
      isDefault: true,
      isActive: true,
      freeShippingThreshold: null,
    },
    create: {
      id: 'ad8e3e1c-7bcc-42b6-b823-a1b36bb73dac',
      name: 'Phí mặc định toàn quốc',
      fee: 30000,
      isDefault: true,
      isActive: true,
      freeShippingThreshold: null,
    },
  });
  console.log(`✅ ShippingRule: ${defaultRule.name}`);

  const hcmRule = await prisma.shippingRule.upsert({
    where: { id: 'bccb4ca0-f200-4701-a2b9-c15c3b8b1637' },
    update: {
      name: 'TP.HCM',
      fee: 20000,
      isDefault: false,
      isActive: true,
      freeShippingThreshold: 500000,
    },
    create: {
      id: 'bccb4ca0-f200-4701-a2b9-c15c3b8b1637',
      name: 'TP.HCM',
      fee: 20000,
      isDefault: false,
      isActive: true,
      freeShippingThreshold: 500000,
    },
  });
  console.log(`✅ ShippingRule: ${hcmRule.name}`);

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
