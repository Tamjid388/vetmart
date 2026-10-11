import bcrypt from 'bcryptjs';
import { prisma } from '../src/app/shared/prisma.js';
import config from '../src/app/config/index.js';
import { seedProducts } from './seed-products.js';
import { seedParties } from './seed-parties.js';

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'staff';
};

// Dev seed accounts. To add more, append a row to seedUsers.
// Re-running the seed never touches existing rows (update: {}).
const seedUsers: SeedUser[] = [
  { email: 'admin@vetmart.com', password: 'Admin123!', name: 'BagherHat Admin', role: 'admin' },
  { email: 'admin2@gmail.com', password: 'Admin123!', name: 'BagherHat Admin 2', role: 'admin' },
  { email: 'staff@vetmart.com', password: 'Staff123!', name: 'BagherHat Staff', role: 'staff' },
];

const main = async (): Promise<void> => {
  for (const seedUser of seedUsers) {
    const hashedPassword = await bcrypt.hash(seedUser.password, config.BCRYPT_SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {},
      create: {
        email: seedUser.email,
        password: hashedPassword,
        name: seedUser.name,
        role: seedUser.role,
      },
    });
    console.log(`Seeded ${user.role}: ${user.email}`);
  }

  // ERP categories — Category carries productType so Medicine vs Feed menus stay separate.
  const medicineCategory = await prisma.category.upsert({
    where: { productType_name: { productType: 'MEDICINE', name: 'Uncategorized' } },
    update: {},
    create: { productType: 'MEDICINE', name: 'Uncategorized' },
  });
  const feedCategory = await prisma.category.upsert({
    where: { productType_name: { productType: 'FEED', name: 'Uncategorized' } },
    update: {},
    create: { productType: 'FEED', name: 'Uncategorized' },
  });
  console.log(`Seeded categories: ${medicineCategory.name} / ${feedCategory.name}`);

  // Seed expanded product catalog from dedicated seed file.
  await seedProducts();

  // Seed customer + supplier party masters from dedicated seed file.
  await seedParties();
};

main()
  .catch((err: unknown) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
