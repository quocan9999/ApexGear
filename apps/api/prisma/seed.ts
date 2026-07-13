import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role } from '../src/common/enums';

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

  // 1. Admin user
  const adminPassword = await bcrypt.hash('Admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apexgear.vn' },
    update: {},
    create: {
      email: 'admin@apexgear.vn',
      password: adminPassword,
      name: 'ApexGear Admin',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // 2. Parent categories
  const parentNames = ['Tai nghe', 'Màn hình', 'Chuột', 'Bàn phím'];
  const parents: Record<string, string> = {};

  for (const [i, name] of parentNames.entries()) {
    const slug = slugify(name);
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        sortOrder: i,
        isActive: true,
      },
    });
    parents[name] = cat.id;
    console.log(`✅ Category: ${name}`);
  }

  // 3. Sub-categories
  const subCategories: Record<string, string[]> = {
    'Tai nghe': ['Over-ear', 'In-ear', 'Gaming Headset'],
    'Màn hình': ['Gaming Monitor', 'Office Monitor', 'Ultrawide'],
    'Chuột': ['Gaming Mouse', 'Wireless Mouse', 'Ergonomic Mouse'],
    'Bàn phím': ['Mechanical', 'Wireless Keyboard', '60%'],
  };

  for (const [parentName, children] of Object.entries(subCategories)) {
    const parentId = parents[parentName];
    for (const [i, name] of children.entries()) {
      const slug = slugify(name);
      await prisma.category.upsert({
        where: { slug },
        update: {},
        create: {
          name,
          slug,
          parentId,
          sortOrder: i,
          isActive: true,
        },
      });
      console.log(`  ↳ ${name}`);
    }
  }

  // 4. Brands
  const brands = [
    'Sony',
    'Logitech',
    'Razer',
    'Dell',
    'Samsung',
    'SteelSeries',
    'Corsair',
    'HyperX',
  ];

  for (const name of brands) {
    const slug = slugify(name);
    await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        isActive: true,
      },
    });
    console.log(`✅ Brand: ${name}`);
  }

  // 5. Default settings
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
