import type { CouponType, OrderStatus, PaymentMethod, PaymentStatus } from '@apexgear/shared';

// ========== API Response Types ==========
export interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ========== Auth ==========
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

// ========== Products ==========
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  salePrice: number | null;
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string;
  brandId: string | null;
  category?: Category;
  brand?: Brand;
  images?: ProductImage[];
  variants?: ProductVariant[];
  specs?: ProductSpec[];
  _count?: { reviews: number };
  averageRating?: number;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductVariant {
  id: string;
  name: string | null;
  sku: string;
  price: number | null;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  isDefault: boolean;
  attributes: Record<string, string> | null;
  displayOrder: number;
}

export interface ProductSpec {
  id: string;
  name: string;
  value: string;
  group: string | null;
  sortOrder: number;
}

// ========== Categories ==========
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

// ========== Brands ==========
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
}

// ========== Reviews ==========
export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

// ========== Query Params ==========
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  sortBy?: 'price' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// ========== Commerce Enums ==========
export type { CouponType, OrderStatus, PaymentMethod, PaymentStatus };

// ========== Cart (backend) ==========
export interface BackendCartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  createdAt: string;
  variant: ProductVariant & {
    stockAvailable?: number;
    product: Pick<Product, 'id' | 'name' | 'slug' | 'basePrice' | 'salePrice'> & {
      images?: ProductImage[];
    };
  };
}

export interface Cart {
  id: string;
  userId: string;
  items: BackendCartItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ========== Addresses ==========
export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  detail: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressPayload {
  name: string;
  phone: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  detail: string;
  isDefault?: boolean;
}

// ========== VN location lookup ==========
export interface Province { code: string; name: string; }
export interface Ward { code: string; name: string; }

// ========== Orders ==========
export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productName: string;
  variantInfo: string | null;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingWard: string;
  shippingProvince: string;
  couponId: string | null;
  sepayRef: string | null;
  note: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CreateOrderPayload {
  paymentMethod: PaymentMethod;
  addressId: string;
  couponCode?: string;
  note?: string;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

// ========== Coupons ==========
export interface CouponValidation {
  valid: boolean;
  discount?: number;
  couponId?: string;
  code?: string;
  type?: CouponType;
  message?: string;
}

// ========== Payments ==========
export interface SepayQr {
  bankAccount: string;
  bankId?: string;
  amount: number;
  content: string;
  orderNumber: string;
  expiresAt: string;
}
