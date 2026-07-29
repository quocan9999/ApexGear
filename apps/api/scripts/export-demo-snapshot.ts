import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { collectDemoSnapshot } from './demo-snapshot';

const file = path.join(__dirname, 'crawler', 'output', 'demo-data.json');

async function main() {
  const prisma = new PrismaClient();
  try {
    const snapshot = await collectDemoSnapshot(prisma);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(`Exported demo snapshot to ${file}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
