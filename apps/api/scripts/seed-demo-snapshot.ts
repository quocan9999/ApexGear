import 'dotenv/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { DemoSnapshot, restoreDemoSnapshot } from './demo-snapshot';

export const DEMO_SNAPSHOT_FILE = path.join(__dirname, 'crawler', 'output', 'demo-data.json');
export const DEMO_SNAPSHOT_MARKER = 'demo_snapshot_imported';

export async function seedDemoSnapshot(
  prisma: PrismaClient,
  file = DEMO_SNAPSHOT_FILE,
  restore: typeof restoreDemoSnapshot = restoreDemoSnapshot,
): Promise<boolean> {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}; run npm run snapshot:export first.`);
  const raw = fs.readFileSync(file);
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const marker = await prisma.setting.findUnique({ where: { key: DEMO_SNAPSHOT_MARKER } });
  if (marker?.value === hash) return false;

  const snapshot = JSON.parse(raw.toString('utf8')) as DemoSnapshot;
  await restore(prisma, snapshot);
  await prisma.setting.upsert({
    where: { key: DEMO_SNAPSHOT_MARKER },
    update: { value: hash },
    create: { key: DEMO_SNAPSHOT_MARKER, value: hash },
  });
  return true;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const restored = await seedDemoSnapshot(prisma);
    console.log(restored ? `Restored demo snapshot from ${DEMO_SNAPSHOT_FILE}.` : 'Demo snapshot already imported; skipped restore.');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) main().catch((error) => { console.error(error); process.exit(1); });
