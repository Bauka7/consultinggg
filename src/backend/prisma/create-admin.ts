/**
 * Create (or reset) a platform_admin account.
 *
 * Platform admins cannot be created via the public API by design — use this script.
 *
 * Usage:
 *   npx ts-node prisma/create-admin.ts <email> <password> [name]
 *   ADMIN_EMAIL=a@b.com ADMIN_PASSWORD=Secret123 npx ts-node prisma/create-admin.ts
 *
 * In Docker:
 *   docker compose exec api npx ts-node prisma/create-admin.ts a@b.com Secret123 "Имя"
 */
import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const name = process.env.ADMIN_NAME || process.argv[4] || 'Platform Admin';

  if (!email || !password) {
    console.error('Usage: ts-node prisma/create-admin.ts <email> <password> [name]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.platform_admin, status: UserStatus.active, name },
    create: { email, passwordHash, role: Role.platform_admin, name, status: UserStatus.active },
  });

  console.log(`✓ Platform admin ready: ${user.email}  (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error('Failed to create admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
