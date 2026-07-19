/**
 * Shared Prisma mock factory for unit tests.
 * Each call returns a fresh mock so suites stay isolated.
 */
export type PrismaMock = ReturnType<typeof createPrismaMock>;

function modelMock() {
  return {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    upsert: jest.fn(),
  };
}

export function createPrismaMock() {
  const prisma: Record<string, unknown> = {
    user: modelMock(),
    passwordResetToken: modelMock(),
    category: modelMock(),
    brand: modelMock(),
    product: modelMock(),
    productVariant: modelMock(),
    productImage: modelMock(),
    cart: modelMock(),
    cartItem: modelMock(),
    address: modelMock(),
    coupon: modelMock(),
    order: modelMock(),
    orderItem: modelMock(),
    review: modelMock(),
    setting: modelMock(),
    $transaction: jest.fn(),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn(),
  };

  // Interactive transaction: pass the same mock as tx
  (prisma.$transaction as jest.Mock).mockImplementation(
    async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: typeof prisma) => Promise<unknown>)(prisma);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg;
    },
  );

  return prisma as {
    user: ReturnType<typeof modelMock>;
    passwordResetToken: ReturnType<typeof modelMock>;
    category: ReturnType<typeof modelMock>;
    brand: ReturnType<typeof modelMock>;
    product: ReturnType<typeof modelMock>;
    productVariant: ReturnType<typeof modelMock>;
    productImage: ReturnType<typeof modelMock>;
    cart: ReturnType<typeof modelMock>;
    cartItem: ReturnType<typeof modelMock>;
    address: ReturnType<typeof modelMock>;
    coupon: ReturnType<typeof modelMock>;
    order: ReturnType<typeof modelMock>;
    orderItem: ReturnType<typeof modelMock>;
    review: ReturnType<typeof modelMock>;
    setting: ReturnType<typeof modelMock>;
    $transaction: jest.Mock;
    $connect: jest.Mock;
    $disconnect: jest.Mock;
    $queryRaw: jest.Mock;
  };
}
