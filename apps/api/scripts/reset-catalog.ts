/**
 * Reset the `apexgear` catalog + transactional data, KEEPING users/addresses/
 * settings. Deletes in FK-safe order because the schema uses onDelete: NoAction
 * on many relations (SQL Server blocks parent deletes while children reference).
 *
 *   npm run db:reset:catalog          # asks for confirmation
 *   npm run db:reset:catalog -- --yes # skip the prompt (non-interactive)
 *
 * User explicitly authorized this and has a backup. Users, addresses, password
 * reset tokens and settings are preserved so login still works after reset.
 */
import 'dotenv/config';
import * as readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Child → parent order. Each entry is a Prisma model delegate name.
const DELETE_ORDER = [
  'orderItem',
  'order',
  'cartItem',
  'cart',
  'review',
  'variantOption',
  'productVariant',
  'productOptionValue',
  'productOptionType',
  'productImage',
  'productSpec',
  'product',
  'coupon',
  'brand',
  'category',
] as const;

async function confirm(): Promise<boolean> {
  if (process.argv.includes('--yes')) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((res) =>
    rl.question('This deletes ALL catalog + transactional records (keeps users). Type "yes" to proceed: ', res),
  );
  rl.close();
  return answer.trim().toLowerCase() === 'yes';
}

async function counts(models: readonly string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const m of models) out[m] = await (prisma as any)[m].count();
  return out;
}

async function run() {
  console.log('\n=== Reset apexgear catalog + transactions (keeping users) ===');
  const before = await counts(DELETE_ORDER);
  console.log('Before:', before);

  if (!(await confirm())) {
    console.log('Aborted — nothing deleted.');
    return;
  }

  // Single transaction: all-or-nothing.
  await prisma.$transaction(
    DELETE_ORDER.map((m) => (prisma as any)[m].deleteMany({})),
  );

  const after = await counts(DELETE_ORDER);
  console.log('After: ', after);
  const usersKept = await prisma.user.count();
  const settingsKept = await prisma.setting.count();
  console.log(`\n✅ Reset complete. Kept ${usersKept} user(s), ${settingsKept} setting(s).`);
}

run()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
