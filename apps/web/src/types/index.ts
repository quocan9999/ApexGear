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
  shortDescription: string | null;
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
  key: string;
  value: string;
  group: string | null;
  displayOrder: number;
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
  sort?: string;
  order?: 'asc' | 'desc';
}
