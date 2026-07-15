// ========== API response types ==========
export interface ApiResponse<T> {
  data: T;
  meta?: PageMeta;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ========== Shared enums ==========
export type Role =
  | 'CUSTOMER'
  | 'CONTENT_MANAGER'
  | 'INVENTORY_MANAGER'
  | 'ORDER_MANAGER'
  | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'COD' | 'SEPAY';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CouponType = 'PERCENTAGE' | 'FIXED';

// ========== Dashboard ==========
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  lowStockCount: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

// ========== Users ==========
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  provider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========== Catalog ==========
export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  publicId: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSpec {
  id: string;
  productId: string;
  group: string | null;
  name: string;
  value: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string | null;
  price: number | null;
  stockTotal: number;
  stockAvailable: number;
  lowStockThreshold: number;
  attributes: Record<string, string> | null;
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  specifications: string | null;
  basePrice: number;
  salePrice: number | null;
  categoryId: string;
  brandId: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isFeatured: boolean;
  isActive: boolean;
  category?: Category;
  brand?: Brand;
  images?: ProductImage[];
  variants?: ProductVariant[];
  specs?: ProductSpec[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  isFeatured?: boolean;
  sortBy?: 'price' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  parent?: Category | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Inventory list responses intentionally omit a derived stockStatus field.
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  stockTotal: number;
  stockAvailable: number;
  lowStockThreshold: number;
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

// ========== Orders ==========
export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productName: string;
  variantInfo: string | null;
  price: number;
  quantity: number;
  createdAt: string;
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
  coupon?: Coupon | null;
  user?: Pick<User, 'id' | 'email' | 'name'>;
}

// ========== Promotions and moderation ==========
export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  description: string | null;
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  user?: Pick<User, 'id' | 'email' | 'name'>;
  product?: Pick<Product, 'id' | 'name' | 'slug'>;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
}
