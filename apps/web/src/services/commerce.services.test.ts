import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { cartService } from './cart.service';
import { ordersService } from './orders.service';
import { addressesService } from './addresses.service';
import { provincesService } from './provinces.service';
import { paymentsService } from './payments.service';
import { couponsService } from './coupons.service';

vi.mock('./api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('cartService', () => {
  it('gets the cart and unwraps data.data', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { id: 'k1', userId: 'u1', items: [] } } });
    const cart = await cartService.get();
    expect(mockApi.get).toHaveBeenCalledWith('/cart');
    expect(cart.id).toBe('k1');
  });

  it('adds an item with variantId + quantity', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 'k1', userId: 'u1', items: [] } } });
    await cartService.addItem('v1', 2);
    expect(mockApi.post).toHaveBeenCalledWith('/cart/items', { variantId: 'v1', quantity: 2 });
  });

  it('updates and removes an item by id', async () => {
    mockApi.patch.mockResolvedValue({ data: { data: { id: 'k1', userId: 'u1', items: [] } } });
    mockApi.delete.mockResolvedValue({ data: { data: { id: 'k1', userId: 'u1', items: [] } } });
    await cartService.updateItem('ci1', 5);
    expect(mockApi.patch).toHaveBeenCalledWith('/cart/items/ci1', { quantity: 5 });
    await cartService.removeItem('ci1');
    expect(mockApi.delete).toHaveBeenCalledWith('/cart/items/ci1');
  });

  it('merges guest items', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 'k1', userId: 'u1', items: [] } } });
    await cartService.merge([{ variantId: 'v1', quantity: 1 }]);
    expect(mockApi.post).toHaveBeenCalledWith('/cart/merge', { items: [{ variantId: 'v1', quantity: 1 }] });
  });
});

describe('ordersService', () => {
  it('creates an order', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { id: 'o1' } } });
    await ordersService.create({ paymentMethod: 'COD', addressId: 'a1' });
    expect(mockApi.post).toHaveBeenCalledWith('/orders', { paymentMethod: 'COD', addressId: 'a1' });
  });

  it('lists orders returning the full envelope with meta', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [{ id: 'o1' }], meta: { total: 1 } } });
    const res = await ordersService.getAll({ status: 'PENDING' });
    expect(mockApi.get).toHaveBeenCalledWith('/orders', { params: { status: 'PENDING' } });
    expect(res.data).toHaveLength(1);
    expect(res.meta?.total).toBe(1);
  });

  it('gets and cancels by id', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { id: 'o1' } } });
    mockApi.patch.mockResolvedValue({ data: { data: { id: 'o1', status: 'CANCELLED' } } });
    await ordersService.getById('o1');
    expect(mockApi.get).toHaveBeenCalledWith('/orders/o1');
    const cancelled = await ordersService.cancel('o1');
    expect(mockApi.patch).toHaveBeenCalledWith('/orders/o1/cancel');
    expect(cancelled.status).toBe('CANCELLED');
  });
});

describe('addressesService', () => {
  it('lists, creates, updates, sets default, removes', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [{ id: 'a1' }] } });
    mockApi.post.mockResolvedValue({ data: { data: { id: 'a1' } } });
    mockApi.patch.mockResolvedValue({ data: { data: { id: 'a1' } } });
    mockApi.delete.mockResolvedValue({ data: { data: { message: 'ok' } } });
    expect(await addressesService.getAll()).toHaveLength(1);
    await addressesService.create({
      name: 'A', phone: '0900000000', provinceCode: '79', provinceName: 'HCM',
      districtCode: '760', districtName: 'Q1', wardCode: '1', wardName: 'W', detail: 'd',
    });
    expect(mockApi.post).toHaveBeenCalledWith('/addresses', expect.objectContaining({ name: 'A' }));
    await addressesService.update('a1', { detail: 'new' });
    expect(mockApi.patch).toHaveBeenCalledWith('/addresses/a1', { detail: 'new' });
    await addressesService.setDefault('a1');
    expect(mockApi.patch).toHaveBeenCalledWith('/addresses/a1/default');
    await addressesService.remove('a1');
    expect(mockApi.delete).toHaveBeenCalledWith('/addresses/a1');
  });
});

describe('provincesService', () => {
  it('loads provinces, districts, wards', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [{ code: '79', name: 'HCM' }] } });
    await provincesService.getProvinces();
    expect(mockApi.get).toHaveBeenCalledWith('/provinces');
    await provincesService.getDistricts('79');
    expect(mockApi.get).toHaveBeenCalledWith('/provinces/79/districts');
    await provincesService.getWards('760');
    expect(mockApi.get).toHaveBeenCalledWith('/districts/760/wards');
  });
});

describe('paymentsService', () => {
  it('gets SePay QR for an order', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { bankAccount: '0123', amount: 1, content: 'AG', orderNumber: 'AG-1', expiresAt: 'x' } } });
    const qr = await paymentsService.getSepayQr('o1');
    expect(mockApi.get).toHaveBeenCalledWith('/payments/sepay/qr/o1');
    expect(qr.bankAccount).toBe('0123');
  });
});

describe('couponsService', () => {
  it('validates a coupon with code + subtotal', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { valid: true, discount: 50000, couponId: 'c1', code: 'X', type: 'FIXED' } } });
    const res = await couponsService.validate('X', 500000);
    expect(mockApi.post).toHaveBeenCalledWith('/coupons/validate', { code: 'X', subtotal: 500000 });
    expect(res.valid).toBe(true);
    expect(res.discount).toBe(50000);
  });
});
