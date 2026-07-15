/**
 * One-off: clean the `description` HTML of existing apexgear products in place.
 *
 * The 2-tier transform previously copied GearVN `body_html` verbatim, so the live
 * products carry the store's auto-generated header (Hãng sản xuất / Tình trạng /
 * Bảo hành), policy blurbs, a literal `##` separator, an embedded duplicate spec
 * table, and gearvn.com cross-sell links. `cleanDescriptionHtml` strips all of that
 * and is idempotent, so this can be re-run safely. Images/specs/variants untouched.
 *
 *   npx ts-node scripts/crawler/clean-descriptions.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { cleanDescriptionHtml } from './transformers';

async function run() {
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({
      select: { id: true, slug: true, description: true },
    });
    console.log(`Scanning ${products.length} product(s)…`);

    let changed = 0;
    let cleared = 0;
    for (const p of products) {
      const cleaned = cleanDescriptionHtml(p.description);
      if (cleaned === p.description) continue;
      await prisma.product.update({ where: { id: p.id }, data: { description: cleaned } });
      changed++;
      if (cleaned === null) cleared++;
    }

    console.log(`Done. Updated ${changed} product(s) (${cleared} had no content after cleaning).`);
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
