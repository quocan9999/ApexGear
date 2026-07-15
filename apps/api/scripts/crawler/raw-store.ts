/**
 * Thin wrapper over the `gearvn_raw` Prisma client (tier 2 datasource).
 *
 * The raw client is generated on demand into `generated/raw-client` via
 * `npm run db:raw:generate`, so we load it with a runtime require — this keeps
 * the legacy file-based crawler (which never touches the raw DB) compiling even
 * before the raw client exists.
 */
import { RawCapture, RawProductRow } from './types';

/* eslint-disable @typescript-eslint/no-var-requires */
function loadRawClient(): any {
  try {
    // Resolved at runtime; path is relative to compiled/ts-node module location.
    const mod = require('../../generated/raw-client');
    return mod.PrismaClient;
  } catch (e) {
    throw new Error(
      'Raw Prisma client not found. Set RAW_DATABASE_URL in apps/api/.env, then run ' +
        '`npm run db:raw:generate` and `npm run db:raw:push`.\n  cause: ' +
        (e as Error).message,
    );
  }
}

export class RawStore {
  private prisma: any;

  constructor() {
    const PrismaClient = loadRawClient();
    this.prisma = new PrismaClient();
  }

  /** Start a crawl run; returns its id. */
  async startRun(mode: 'test' | 'full'): Promise<string> {
    const run = await this.prisma.rawCrawlRun.create({
      data: { mode, status: 'running' },
    });
    return run.id;
  }

  /** Persist one scraped product verbatim under a run. */
  async saveProduct(runId: string, cap: RawCapture): Promise<void> {
    await this.prisma.rawProduct.create({
      data: {
        runId,
        categoryKey: cap.categoryKey,
        brandSlug: cap.brandSlug,
        brandName: cap.brandName,
        sourceUrl: cap.sourceUrl,
        handle: cap.handle,
        title: cap.title,
        haravanJson: cap.haravanJson,
        specsJson: cap.specsJson,
        descriptionHtml: cap.descriptionHtml,
        imageUrlsJson: cap.imageUrlsJson,
      },
    });
  }

  async finishRun(
    runId: string,
    status: 'completed' | 'failed',
    totalProducts: number,
    notes?: string,
  ): Promise<void> {
    await this.prisma.rawCrawlRun.update({
      where: { id: runId },
      data: { status, totalProducts, notes: notes ?? null, finishedAt: new Date() },
    });
  }

  /** Most recent completed run id, or null if none. */
  async latestCompletedRunId(): Promise<string | null> {
    const run = await this.prisma.rawCrawlRun.findFirst({
      where: { status: 'completed' },
      orderBy: { finishedAt: 'desc' },
    });
    return run?.id ?? null;
  }

  /** All raw products for a run. */
  async productsForRun(runId: string): Promise<RawProductRow[]> {
    return this.prisma.rawProduct.findMany({
      where: { runId },
      orderBy: { crawledAt: 'asc' },
    });
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
