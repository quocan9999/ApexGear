# ApexGear — B2C E-Commerce Platform Design Spec

> **Date:** 2026-07-14
> **Status:** Approved
> **Brand:** ApexGear
> **Domain:** Tech gear & gaming e-commerce (Tai nghe, Màn hình, Chuột, Bàn phím)

---

## 1. Project Overview

### 1.1 Mục tiêu

Xây dựng website **B2C E-commerce** bán thiết bị công nghệ & gaming, brand name **ApexGear**. Dự án phục vụ portfolio ứng tuyển **Backend Intern / Full Stack Intern**, thể hiện:

- Tư duy thiết kế API
- Thiết kế database tốt
- RESTful API chuẩn
- Frontend React hoàn chỉnh

### 1.2 Tech Stack

| Layer | Technology |
|---|---|
| **API** | NestJS, TypeScript, Prisma ORM, SQL Server |
| **Auth** | JWT, Passport, bcrypt, Google OAuth |
| **Docs** | Swagger (OpenAPI) |
| **Validation** | class-validator, class-transformer |
| **Web (Customer)** | React, Vite, TypeScript, Tailwind CSS, React Router, Axios, Zustand, react-i18next, Motion |
| **Admin Dashboard** | React, Vite, TypeScript, Tailwind CSS, React Router, Axios, Zustand, react-i18next |
| **Image Storage** | Cloudinary |
| **Email** | Nodemailer + Gmail SMTP (free) |
| **Payment** | SePay (QR chuyển khoản) + COD |
| **Address API** | provinces.open-api.vn (dữ liệu sau sáp nhập) |
| **Data Seeding** | Playwright (crawl GearVN.com) |

### 1.3 Frontend Design Skill

Sử dụng **taste-skill** (design-taste-frontend) để đảm bảo UI chất lượng cao, anti-slop.

**Design Read:** "B2C e-commerce storefront for tech-savvy Vietnamese gamers, with a modern minimalist / tech-clean language, leaning toward Tailwind v4 + React + Vite + Inter + Motion for micro-interactions."

**Dials:**
- `DESIGN_VARIANCE: 6` — Clean, organized e-commerce
- `MOTION_INTENSITY: 5` — Subtle hover effects, cart animations, page transitions
- `VISUAL_DENSITY: 5` — E-commerce product density, still breathable

### 1.4 i18n

- Sử dụng `react-i18next`
- Chỉ support tiếng Việt (`vi`) hiện tại
- Structure sẵn cho tiếng Anh (`en`) sau này
- Messages file dùng chung: `packages/shared/src/i18n/vi.json`

---

## 2. Architecture

### 2.1 Monorepo Structure (npm workspaces)

```
ApexGear/
├── apps/
│   ├── api/                          # NestJS Backend
│   │   ├── src/
│   │   │   ├── common/               # Guards, filters, interceptors, decorators
│   │   │   │   ├── guards/           # JwtAuthGuard, RolesGuard
│   │   │   │   ├── filters/          # GlobalExceptionFilter
│   │   │   │   ├── interceptors/     # TransformInterceptor
│   │   │   │   ├── decorators/       # @Roles(), @CurrentUser()
│   │   │   │   └── pipes/            # ValidationPipe config
│   │   │   ├── config/               # Environment config, validation
│   │   │   ├── prisma/               # PrismaService, PrismaModule
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # JWT + Google OAuth + Forgot Password
│   │   │   │   ├── users/            # User CRUD, profile
│   │   │   │   ├── products/         # Products CRUD, search, filter
│   │   │   │   ├── brands/           # Brand management
│   │   │   │   ├── categories/       # Category management (2-level)
│   │   │   │   ├── carts/            # Shopping cart
│   │   │   │   ├── orders/           # Order management
│   │   │   │   ├── payments/         # SePay integration, COD, webhook
│   │   │   │   ├── addresses/        # User addresses (VN provinces API)
│   │   │   │   ├── reviews/          # Product reviews (with moderation)
│   │   │   │   ├── coupons/          # Coupon management
│   │   │   │   ├── upload/           # Cloudinary image upload
│   │   │   │   ├── dashboard/        # Admin dashboard stats
│   │   │   │   └── settings/         # App settings (shipping fee, etc.)
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   ├── web/                          # Customer Frontend
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Button, Input, Card, Modal, Skeleton...
│   │   │   │   ├── layout/           # Header, Footer, MobileNav
│   │   │   │   └── product/          # ProductCard, ProductGrid, ProductSlider
│   │   │   ├── hooks/                # useCart, useAuth, useDebounce, useProvinces...
│   │   │   ├── i18n/                 # i18n setup (import messages from @apexgear/shared)
│   │   │   ├── layouts/              # MainLayout, AuthLayout
│   │   │   ├── pages/                # Route pages
│   │   │   ├── routes/               # React Router config
│   │   │   ├── services/             # API service layer (Axios instances)
│   │   │   ├── stores/               # Zustand: cartStore, authStore
│   │   │   ├── types/                # Frontend-specific types
│   │   │   └── utils/                # formatPrice, slugify, cn()...
│   │   └── package.json
│   │
│   └── admin/                        # Admin Dashboard
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/               # Shared admin UI
│       │   │   ├── layout/           # AdminSidebar, AdminHeader
│       │   │   ├── forms/            # ProductForm, CouponForm...
│       │   │   └── tables/           # DataTable, Pagination
│       │   ├── hooks/
│       │   ├── i18n/
│       │   ├── layouts/              # AdminLayout
│       │   ├── pages/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── stores/
│       │   ├── types/
│       │   └── utils/
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared package (@apexgear/shared)
│       ├── src/
│       │   ├── types/                # Shared DTO types, enums
│       │   ├── constants/            # ORDER_STATUS, ROLES, PAYMENT_METHODS...
│       │   ├── i18n/
│       │   │   └── vi.json           # Vietnamese messages
│       │   └── utils/                # Shared utilities
│       └── package.json
│
├── scripts/
│   └── crawler/                      # Playwright crawler for GearVN.com
│       ├── index.ts
│       ├── gearvn.crawler.ts
│       ├── categories.ts
│       ├── transformers.ts
│       ├── uploader.ts               # Upload to Cloudinary
│       └── output/                   # JSON output files
│
├── docs/
├── DESIGN.md                         # Design system tokens
├── package.json                      # Root workspace config
├── .env.example
└── .gitignore
```

### 2.2 Request Flow

```
HTTP Request
    ↓
Guards (JWT Auth, Role-based)
    ↓
Controller (routing, validation)
    ↓
Service (business logic)
    ↓
Repository (nếu cần custom queries)
    ↓
PrismaService
    ↓
SQL Server
```

### 2.3 Design Patterns

1. **Dependency Injection** — NestJS native DI
2. **Service Layer Pattern** — Business logic tách biệt khỏi controller
3. **Repository Pattern** — Custom queries khi cần, PrismaService cho truy vấn chuẩn
4. **DTO Pattern** — Request validation với class-validator + class-transformer
5. **Guard Pattern** — JWT Auth + Role-based Authorization
6. **Exception Filter** — Global error handling, Prisma error mapping
7. **ClassSerializerInterceptor** — Auto-exclude sensitive fields (@Exclude())

---

## 3. Database Schema

### 3.1 Entity Relationship Overview

```
User ──< Address
User ──1 Cart ──< CartItem >── ProductVariant
User ──< Order ──< OrderItem >── ProductVariant
User ──< Review >── Product
User ──< PasswordResetToken

Category (self-ref 2-level) ──< Product
Brand ──< Product

Product ──< ProductImage
Product ──< ProductSpec
Product ──< ProductOptionType ──< ProductOptionValue
Product ──< ProductVariant ──< VariantOption >── ProductOptionValue
Product ──< Review

Order >── Coupon (optional)
```

### 3.2 Full Prisma Schema

```prisma
// ==================== AUTH & USERS ====================

model User {
  id                    String        @id @default(uuid())
  email                 String        @unique(map: "unique_active_email")
  password              String?       // null if Google OAuth only
  name                  String        @db.NVarChar(100)
  phone                 String?       @db.VarChar(15)
  avatar                String?       @db.VarChar(500) // Cloudinary URL (apexgear/avatars/)
  role                  Role          @default(CUSTOMER)
  provider              AuthProvider  @default(LOCAL)
  googleId              String?       @unique
  isActive              Boolean       @default(true)
  failedLoginAttempts   Int           @default(0)
  lockedUntil           DateTime?
  tokenVersion          Int           @default(0)  // For token revocation (future)
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
  deletedAt             DateTime?     // Soft delete

  addresses     Address[]
  orders        Order[]
  cart          Cart?
  reviews       Review[]
  resetTokens   PasswordResetToken[]

  @@index([email, deletedAt])
  @@index([role])
}

// Note: email unique constraint ignores soft-deleted records via filtered index
// SQL Server: CREATE UNIQUE INDEX unique_active_email ON users(email) WHERE deleted_at IS NULL

enum Role {
  CUSTOMER
  CONTENT_MANAGER
  INVENTORY_MANAGER
  ORDER_MANAGER
  ADMIN
}

enum AuthProvider {
  LOCAL
  GOOGLE
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  token     String    @unique
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}

// ==================== CATEGORIES (2-level) ====================

model Category {
  id          String      @id @default(uuid())
  name        String      @db.NVarChar(255)
  slug        String      @unique(map: "unique_active_category_slug")
  description String?     @db.NVarChar(Max)
  image       String?     @db.VarChar(500) // Cloudinary URL
  parentId    String?     // null = top-level category
  parent      Category?   @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[]  @relation("CategoryTree")
  sortOrder   Int         @default(0)
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  deletedAt   DateTime?

  products    Product[]

  @@index([slug, deletedAt])
}

// Note: slug unique constraint ignores soft-deleted records
// SQL Server: CREATE UNIQUE INDEX unique_active_category_slug ON categories(slug) WHERE deleted_at IS NULL

// ==================== BRANDS ====================

model Brand {
  id          String    @id @default(uuid())
  name        String    @unique(map: "unique_active_brand_name") @db.NVarChar(255)
  slug        String    @unique(map: "unique_active_brand_slug")
  description String?   @db.NVarChar(Max)
  logo        String?   @db.VarChar(500) // Cloudinary URL (apexgear/brands/)
  website     String?   @db.VarChar(500)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  products    Product[]

  @@index([name, deletedAt])
  @@index([slug, deletedAt])
}

// Note: name & slug unique constraints ignore soft-deleted records
// SQL Server:
//   CREATE UNIQUE INDEX unique_active_brand_name ON brands(name) WHERE deleted_at IS NULL
//   CREATE UNIQUE INDEX unique_active_brand_slug ON brands(slug) WHERE deleted_at IS NULL

// ==================== PRODUCTS ====================

model Product {
  id                String    @id @default(uuid())
  name              String    @db.NVarChar(500)
  slug              String    @unique(map: "unique_active_product_slug")  // Auto-generated from name
  shortDescription  String?   @db.NVarChar(500)
  description       String?   @db.NVarChar(Max) // Rich text/HTML
  specifications    Json?     // Flexible JSON specs per product type
  basePrice         Decimal   @db.Decimal(18, 2) // VND
  salePrice         Decimal?  @db.Decimal(18, 2) // null = no sale
  categoryId        String
  category          Category  @relation(fields: [categoryId], references: [id])
  brandId           String
  brand             Brand     @relation(fields: [brandId], references: [id])
  metaTitle         String?   @db.NVarChar(255)  // SEO
  metaDescription   String?   @db.NVarChar(500)  // SEO
  isFeatured        Boolean   @default(false)
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?

  images      ProductImage[]
  specs       ProductSpec[]
  variants    ProductVariant[]
  optionTypes ProductOptionType[]
  reviews     Review[]

  @@index([categoryId])
  @@index([brandId])
  @@index([slug, deletedAt])
  @@index([isActive, isFeatured])
}

// Note: slug unique constraint ignores soft-deleted records
// SQL Server: CREATE UNIQUE INDEX unique_active_product_slug ON products(slug) WHERE deleted_at IS NULL

// ==================== PRODUCT IMAGES ====================

model ProductImage {
  id        String    @id @default(uuid())
  productId String
  product   Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String    @db.VarChar(500)  // Cloudinary URL
  publicId  String    @db.VarChar(255)  // Cloudinary public_id (for deletion)
  alt       String?   @db.NVarChar(500)
  isPrimary Boolean   @default(false)
  sortOrder Int       @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([productId])
  @@index([isPrimary])
}

// Note: isPrimary=true marks the main image (thumbnail, listing)
// All other images are gallery images for the product detail slider
// Description images are embedded inline in the rich text HTML (not in this table)

// ==================== PRODUCT SPECS ====================

model ProductSpec {
  id        String  @id @default(uuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  group     String? @db.NVarChar(255) // "Thông số chung", "Kết nối", "Pin & Sạc"...
  name      String  @db.NVarChar(255) // "Trọng lượng", "Driver", "Kết nối"...
  value     String  @db.NVarChar(500) // "250g", "50mm", "Bluetooth 5.3"...
  sortOrder Int     @default(0)

  @@index([productId])
}

// ==================== VARIANTS (Shopify-style) ====================
//
// Mọi product luôn có ít nhất 1 variant (default).
// Stock & SKU quản lý ở level variant, KHÔNG ở product.
// Product không có variant thực tế → 1 default variant, options rỗng.

model ProductOptionType {
  id        String @id @default(uuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  name      String  @db.NVarChar(100) // "Màu sắc", "Kích thước", "Phiên bản"
  sortOrder Int     @default(0)

  values    ProductOptionValue[]

  @@unique([productId, name])
}

model ProductOptionValue {
  id           String             @id @default(uuid())
  optionTypeId String
  optionType   ProductOptionType  @relation(fields: [optionTypeId], references: [id], onDelete: Cascade)
  value        String             @db.NVarChar(100) // "Đen", "Trắng", "24 inch", "27 inch"
  sortOrder    Int                @default(0)

  variantOptions VariantOption[]

  @@unique([optionTypeId, value])
}

model ProductVariant {
  id                  String    @id @default(uuid())
  productId           String
  product             Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku                 String    @unique(map: "unique_active_sku")
  name                String    @db.NVarChar(255) // "Black", "White", "2023 Edition"
  price               Decimal?  @db.Decimal(18, 2) // null = fallback to product.basePrice
  stockTotal          Int       @default(0)  // Tổng stock (bao gồm reserved)
  stockAvailable      Int       @default(0)  // Stock khả dụng (total - reserved by pending orders)
  lowStockThreshold   Int       @default(5)  // Cảnh báo khi stockAvailable <= threshold
  attributes          Json?     // Flexible: {"color": "Black", "size": "24 inch"}
  isDefault           Boolean   @default(false)    // Exactly 1 default per product
  isActive            Boolean   @default(true)
  displayOrder        Int       @default(0)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  options    VariantOption[]
  cartItems  CartItem[]
  orderItems OrderItem[]

  @@index([productId])
  @@index([sku, deletedAt])
  @@index([isActive])
}

model VariantOption {
  id            String             @id @default(uuid())
  variantId     String
  variant       ProductVariant     @relation(fields: [variantId], references: [id], onDelete: Cascade)
  optionValueId String
  optionValue   ProductOptionValue @relation(fields: [optionValueId], references: [id])

  @@unique([variantId, optionValueId])
}

// ==================== REVIEWS ====================

model Review {
  id        String       @id @default(uuid())
  productId String
  product   Product      @relation(fields: [productId], references: [id])
  userId    String
  user      User         @relation(fields: [userId], references: [id])
  rating    Int          // 1-5
  comment   String?      @db.NVarChar(Max)
  status    ReviewStatus @default(PENDING)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@unique([productId, userId]) // 1 review per user per product
  @@index([productId])
  @@index([status])
}

enum ReviewStatus {
  PENDING   // Chờ admin/content manager duyệt
  APPROVED  // Đã duyệt → hiển thị trên trang sản phẩm
  REJECTED  // Bị từ chối → không hiển thị
}

// ==================== CART ====================

model Cart {
  id        String    @id @default(uuid())
  userId    String    @unique
  user      User      @relation(fields: [userId], references: [id])
  updatedAt DateTime  @updatedAt

  items     CartItem[]
}

model CartItem {
  id        String         @id @default(uuid())
  cartId    String
  cart      Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  quantity  Int            @default(1) // Max = variant.stockAvailable
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@unique([cartId, variantId])
}

// ==================== ORDERS ====================

model Order {
  id              String        @id @default(uuid())
  orderNumber     String        @unique // Format: AG-YYYYMMDD-XXXX
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  status          OrderStatus   @default(PENDING)
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus @default(UNPAID)

  // Money
  subtotal        Decimal       @db.Decimal(18, 2)
  shippingFee     Decimal       @db.Decimal(18, 2)
  discount        Decimal       @db.Decimal(18, 2) @default(0)
  total           Decimal       @db.Decimal(18, 2)

  // Shipping address (snapshot — denormalized)
  shippingName     String       @db.NVarChar(100)
  shippingPhone    String       @db.VarChar(15)
  shippingAddress  String       @db.NVarChar(500) // Detail address (street, house number)
  shippingWard     String       @db.NVarChar(100)
  shippingDistrict String       @db.NVarChar(100)
  shippingProvince String       @db.NVarChar(100)

  // References
  couponId        String?
  coupon          Coupon?       @relation(fields: [couponId], references: [id])
  sepayRef        String?       @unique // SePay reference code for matching
  note            String?       @db.NVarChar(500)

  // Timestamps
  paidAt          DateTime?
  confirmedAt     DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  completedAt     DateTime?
  cancelledAt     DateTime?
  cancelReason    String?       @db.NVarChar(500)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  items           OrderItem[]

  @@index([userId])
  @@index([status])
  @@index([orderNumber])
  @@index([createdAt])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPING
  DELIVERED
  COMPLETED
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  COD
  SEPAY
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
}

model OrderItem {
  id          String         @id @default(uuid())
  orderId     String
  order       Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variantId   String
  variant     ProductVariant @relation(fields: [variantId], references: [id])

  // Snapshot at order time (immutable after creation)
  productName String         @db.NVarChar(500)
  variantInfo String?        @db.NVarChar(255) // "Đen, 24 inch" — human-readable
  price       Decimal        @db.Decimal(18, 2) // Price at order time
  quantity    Int

  createdAt   DateTime       @default(now())

  @@index([orderId])
}

// ==================== ADDRESSES ====================

model Address {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  name         String   @db.NVarChar(100) // Receiver name
  phone        String   @db.VarChar(15)
  provinceCode String   @db.VarChar(10)
  provinceName String   @db.NVarChar(100)
  districtCode String   @db.VarChar(10)
  districtName String   @db.NVarChar(100)
  wardCode     String   @db.VarChar(10)
  wardName     String   @db.NVarChar(100)
  detail       String   @db.NVarChar(500) // Street, house number
  isDefault    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
}

// ==================== COUPONS ====================

model Coupon {
  id            String     @id @default(uuid())
  code          String     @unique @db.VarChar(50) // Uppercase, e.g. "SALE10"
  type          CouponType
  description   String?    @db.NVarChar(500)
  value         Decimal    @db.Decimal(18, 2) // Percentage (e.g. 10) or fixed VND
  minOrderValue Decimal?   @db.Decimal(18, 2) // Minimum order to apply
  maxDiscount   Decimal?   @db.Decimal(18, 2) // Cap for percentage coupons
  maxUses       Int?       // null = unlimited
  usedCount     Int        @default(0)
  startsAt      DateTime?
  expiresAt     DateTime?
  isActive      Boolean    @default(true)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  orders        Order[]

  @@index([code])
  @@index([isActive, expiresAt])
}

enum CouponType {
  PERCENTAGE  // Giảm theo %
  FIXED       // Giảm số tiền cố định (VND)
}

// ==================== SETTINGS ====================

model Setting {
  id    String @id @default(uuid())
  key   String @unique @db.VarChar(100) // "shipping_fee", "store_name", etc.
  value String @db.NVarChar(Max)
}
```

---

## 4. Business Rules

### 4.1 Role Permissions Matrix

| Resource / Action | CUSTOMER | CONTENT_MANAGER | INVENTORY_MANAGER | ORDER_MANAGER | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| **Products — View** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Products — Create/Edit/Delete** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Inventory — View** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Inventory — Adjust Stock** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Orders — View All (Read-only)** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Orders — Update Status** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Users — Manage All** | ❌ | ❌ | ❌ | ❌ | ✅ |

### 4.2 Authentication & Security

#### Authentication Flow

```
1. POST /api/auth/login
   → Validate credentials
   → Check account lockout (failedLoginAttempts >= 5 → locked 15 min)
   → Generate JWT
   → Set httpOnly cookie
   → Return user data (NO token in body)

2. Subsequent requests
   → Cookie tự động gửi
   → JWT Guard validate
   → RolesGuard check permissions
```

#### JWT Configuration

- **Storage:** httpOnly cookie (XSS protection)
- **Expiration:** 7 days
- **Payload:** `{ sub: userId, email, role, iat, exp }`
- **Cookie Options:**
  ```typescript
  {
    httpOnly: true,
    secure: true,      // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
  ```

#### CORS Configuration (CRITICAL)

```typescript
app.enableCors({
  origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL], // NOT '*'
  credentials: true,                // REQUIRED for cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
```

#### Registration

- Email + Password (hashed with bcrypt, saltRounds=10)
- Google OAuth: Google login → create/link user → set cookie

#### Forgot Password

- Email input → generate token (UUID, expires 1 hour) → send reset email via Nodemailer
- User clicks link → reset password → invalidate token
- Email verification: chưa cần hiện tại. TODO: implement sau.

#### Login Security

- **Rate limiting:** 5 attempts / 15 minutes per IP (`@nestjs/throttler`)
- **Account lockout:** 5 failed attempts → lock 15 minutes (`failedLoginAttempts`, `lockedUntil` fields)
- **Response includes:** `remaining_attempts` và `retry_after` khi applicable
- **Status Codes:**
  - `401 Unauthorized` — Credentials sai, includes `remaining_attempts`
  - `423 Locked` — Account locked, includes `retry_after`
  - `429 Too Many Requests` — Rate limit exceeded

#### Password Security

- bcrypt với salt rounds = 10
- Min 8 chars, requires uppercase, lowercase, number
- Never return `password` in responses (use `@Exclude()` decorator)

#### Public Variant Security

- Public endpoints (`GET /api/products/:slug`) chỉ trả `stockStatus` enum (`"in_stock"` | `"low_stock"` | `"out_of_stock"`)
- KHÔNG trả `stockTotal`, `stockAvailable` (chỉ staff thấy qua `/api/inventory`)

### 4.3 Cart Logic

**Guest (không đăng nhập):**
- Cart lưu `localStorage` với key `apexgear_cart`
- Format: `{ items: [{ variantId, quantity }], updatedAt: timestamp }`
- TTL: 3 ngày — nếu `updatedAt` > 3 ngày → xóa cart
- Không check stock real-time (check khi checkout)

**Logged in:**
- Cart lưu database (model `Cart` + `CartItem`)
- Persist across devices
- Check stock khi add/update quantity → reject nếu vượt stock

**Merge khi đăng nhập:**
- User có items trong localStorage → gọi `POST /api/cart/merge`
- Merge logic: với mỗi item trong localStorage:
  - Nếu variantId chưa có trong DB cart → add
  - Nếu variantId đã có → dùng quantity lớn hơn
- Sau merge → xóa localStorage cart

### 4.4 Order Flow

```
User đặt hàng
      │
      ├─── Payment = SEPAY ────────────┐
      │                                │
      ▼                                ▼
  PENDING                         Hiển thị QR code
  (stock đã trừ)                  Countdown 10 phút
      │                                │
      │                    ┌───────────┤
      │                    ▼           ▼
      │              Webhook OK    Timeout 10 min
      │              paymentStatus   │
      │              = PAID          ▼
      │                    │     Auto CANCELLED
      │                    │     (hoàn stock)
      │                    ▼
      ├─── Payment = COD ──┤
      │                    │
      ▼                    ▼
  Admin xác nhận ───► CONFIRMED
                          │
                          ▼
                      SHIPPING
                          │
                          ▼
                      DELIVERED
                          │
                    ┌─────┴─────┐
                    ▼           ▼
               COMPLETED    REFUNDED
```

**Stock deduction:**
- Trừ stock ngay khi tạo đơn (PENDING) → tránh oversell
- Hoàn stock khi: order CANCELLED, order timeout (SePay 10 phút), order REFUNDED

**User cancellation:**
- User chỉ cancel được khi đơn ở PENDING
- Admin/Order Manager cancel được ở PENDING hoặc CONFIRMED

### 4.5 Payment: SePay Integration

1. User chọn "Thanh toán chuyển khoản" → API tạo order `PENDING` với unique `sepayRef` (format: `SEVN` + random code)
2. Frontend gọi `GET /api/payments/sepay/qr/:orderId` → nhận QR code info
3. Frontend hiển thị QR code + countdown 10 phút
4. User chuyển khoản với nội dung chứa `sepayRef`
5. SePay gửi webhook POST đến `POST /api/payments/sepay/webhook`
6. Backend verify webhook (HMAC-SHA256), match `content` với `sepayRef`, verify `transferAmount` >= `order.total`
7. Match thành công → update order: `paymentStatus = PAID`, `paidAt = now()`
8. Frontend polling hoặc WebSocket → nhận kết quả → redirect sang order success page

**Timeout:**
- Cron job hoặc scheduled task: check orders có `paymentMethod = SEPAY` + `status = PENDING` + `createdAt` > 10 phút
- Auto cancel: `status = CANCELLED`, `cancelReason = "Payment timeout"`, hoàn stock

### 4.6 Payment: COD

1. User chọn "Thanh toán khi nhận hàng" → API tạo order `PENDING`
2. Admin/Order Manager xác nhận → `CONFIRMED`
3. Giao hàng → `SHIPPING` → `DELIVERED`
4. Khi `DELIVERED`: `paymentStatus = PAID`, `paidAt = now()`
5. User xác nhận hoàn thành → `COMPLETED`

### 4.7 Coupon System

- **Types**: `PERCENTAGE` (%) hoặc `FIXED` (VND)
- **Conditions**: `minOrderValue`, `maxUses`, `startsAt`, `expiresAt`
- **Cap**: `maxDiscount` cho coupon PERCENTAGE (tránh giảm quá nhiều)
- **Apply**: 1 coupon/order
- **Validation** (`POST /api/coupons/validate`):
  1. Check `code` exists & `isActive`
  2. Check `startsAt` <= now <= `expiresAt`
  3. Check `usedCount` < `maxUses`
  4. Check `order subtotal` >= `minOrderValue`
  5. Calculate discount (respect `maxDiscount` cap)

### 4.8 Shipping

- Phí ship cố định, mặc định: **30,000 VND** toàn quốc
- Lưu trong `Setting` table (key: `shipping_fee`)
- Admin có thể thay đổi trong Admin > Settings

### 4.9 Address System

- Sử dụng VN Provinces API: `https://provinces.open-api.vn/api/v2/`
- **Dữ liệu sau sáp nhập** của Việt Nam
- Cascade dropdown: Tỉnh/Thành → Quận/Huyện → Phường/Xã
- User có thể lưu nhiều địa chỉ, chọn 1 làm default
- API proxy + cache: backend proxy VN Provinces API và cache response (tránh gọi external API mỗi request)

### 4.10 Product Variants

**Concept**: Shopify-style variant system

- Mọi product luôn có **ít nhất 1 variant** (default variant)
- Product không có biến thể thực tế → 1 default variant, `options` rỗng
- Stock quản lý ở level **ProductVariant**, KHÔNG ở Product
- Cart items và Order items reference **ProductVariant**, không Product

**Ví dụ:**

```
Product: "Tai nghe Sony WH-1000XM5"
├── OptionType: "Màu sắc"
│   ├── Value: "Đen"
│   └── Value: "Bạc"
│
├── Variant: SKU "SONY-XM5-BLK" (Đen)
│   ├── price: null (dùng basePrice)
│   ├── stock: 15
│   └── isDefault: true
│
└── Variant: SKU "SONY-XM5-SLV" (Bạc)
    ├── price: 8_990_000 (giá riêng)
    ├── stock: 8
    └── isDefault: false
```

**Giá hiển thị**: `variant.price ?? product.basePrice`
**Sale price**: Áp dụng ở product level (`product.salePrice`)

### 4.11 Product Images

- Images gắn với **Product** (không per-variant)
- `isPrimary = true`: Ảnh chính — hiển thị trên listing, cart, search results (1 per product)
- `isPrimary = false`: Ảnh gallery — hiển thị trên slider trang chi tiết sản phẩm
- Ảnh minh hoạ trong mô tả: embed inline trong rich text HTML (không lưu riêng)

#### Image Upload Flow

```
1. Client uploads file → POST /api/products/:id/images
2. Multer saves to ./uploads/temp/ (temporary)
3. Validate file type (JPEG, PNG, WEBP) & size (max 5MB)
4. Upload to Cloudinary (auto-optimize quality, format)
5. DELETE local temp file immediately (success or fail)
6. Create ProductImage record in DB
7. Return cloudinary_url & public_id to client
```

#### Image Transformations (Frontend via Cloudinary URL)

```typescript
{
  thumbnail: cloudinary.url(publicId, { width: 150, height: 150, crop: 'fill' }),
  medium: cloudinary.url(publicId, { width: 500, height: 500, crop: 'limit' }),
  large: cloudinary.url(publicId, { width: 1000, height: 1000, crop: 'limit' }),
  original: cloudinary.url(publicId)
}
```

#### Product Images vs Generic Uploads

- Product images: dùng `POST /api/products/:productId/images` (tự động link metadata)
- Generic uploads (categories, brands, avatars): dùng `POST /api/upload/images`

### 4.12 Product Description

- Dạng **rich text / HTML**
- Admin nhập qua WYSIWYG editor (TipTap recommended — modern, extensible, TypeScript-native)
- Sanitize HTML trước khi save (DOMPurify server-side)
- Frontend render bằng `dangerouslySetInnerHTML` (đã sanitized)

### 4.13 Reviews

- User đã đăng nhập có thể review bất kỳ sản phẩm nào
- 1 review/user/product
- Rating: 1-5 sao + comment text (optional)
- Review cần admin/content manager **duyệt** trước khi hiển thị
- Status flow: `PENDING` → `APPROVED` (hiển thị) hoặc `REJECTED`
- Product detail page hiển thị: average rating + số lượng reviews + danh sách reviews (APPROVED only)

### 4.14 Search

- Sử dụng **SQL Server Full-Text Search**
- Search trên: `product.name`, `product.description`
- Tạo Full-Text Index trên các columns này
- Frontend: search bar ở header, debounce 300ms, hiển thị search suggestions

### 4.15 Out-of-Stock Handling

- Product/variant hết hàng (stock = 0): vẫn hiển thị trên listing
- Badge "Hết hàng" trên product card
- Trang chi tiết: disable nút "Thêm vào giỏ hàng"
- Cart quantity: giới hạn bằng stock còn lại của variant

### 4.16 Email Notifications

- **Nodemailer + Gmail SMTP** (free tier)
- Gửi email khi:
  1. Reset password (chứa link reset)
  2. Đặt hàng thành công (order confirmation)
  3. Đơn hàng đã giao thành công (delivery confirmation)
- Template: HTML email với brand styling cơ bản

### 4.17 Soft Delete

- Áp dụng cho: User, Product, Category, Brand
- Field: `deletedAt` (DateTime, nullable)
- Global Prisma middleware: auto filter `deletedAt = null`
- Admin có thể xem/restore soft-deleted records

---

## 5. API Endpoints

### 5.0 Health Check

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Health check | Public |

### 5.1 Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký | Public |
| `POST` | `/api/auth/login` | Đăng nhập, set httpOnly cookie | Public |
| `POST` | `/api/auth/logout` | Clear cookie | Auth |
| `POST` | `/api/auth/google` | Google OAuth callback | Public |
| `POST` | `/api/auth/forgot-password` | Gửi email reset password | Public |
| `POST` | `/api/auth/reset-password` | Reset password với token | Public |
| `GET` | `/api/auth/me` | Get current user | Auth |
| `PATCH` | `/api/auth/profile` | Update own profile | Auth |
| `PATCH` | `/api/auth/change-password` | Change password | Auth |

### 5.2 Users

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/users` | List users (filter by role, is_active, is_locked) | ADMIN |
| `GET` | `/api/users/:id` | Get user detail | ADMIN |
| `PATCH` | `/api/users/:id` | Update user (role, status) | ADMIN |
| `DELETE` | `/api/users/:id` | Soft delete user | ADMIN |
| `POST` | `/api/users/:id/restore` | Restore soft-deleted user | ADMIN |
| `POST` | `/api/users/:id/unlock` | Unlock locked account | ADMIN |

### 5.3 Products

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/products` | List products (filter, search, sort, pagination) | Public |
| `GET` | `/api/products/:slug` | Get product detail (variants return `stockStatus` only) | Public |
| `POST` | `/api/products` | Create product | CONTENT_MANAGER, ADMIN |
| `PATCH` | `/api/products/:id` | Update product | CONTENT_MANAGER, ADMIN |
| `DELETE` | `/api/products/:id` | Soft delete product | CONTENT_MANAGER, ADMIN |
| `GET` | `/api/products/:id/variants` | List variants (public: stockStatus only) | Public |
| `POST` | `/api/products/:id/variants` | Create variant | CONTENT_MANAGER, ADMIN |
| `PATCH` | `/api/products/variants/:variantId` | Update variant | CONTENT_MANAGER, ADMIN |
| `DELETE` | `/api/products/variants/:variantId` | Delete variant | CONTENT_MANAGER, ADMIN |
| `POST` | `/api/products/:id/images` | Upload product image (Cloudinary) | CONTENT_MANAGER, ADMIN |
| `PATCH` | `/api/products/images/:imageId` | Update image metadata | CONTENT_MANAGER, ADMIN |
| `DELETE` | `/api/products/images/:imageId` | Delete image | CONTENT_MANAGER, ADMIN |
| `PATCH` | `/api/products/images/:imageId/set-primary` | Set as primary image | CONTENT_MANAGER, ADMIN |

**Query params for `GET /api/products`:**
- `?page=1&limit=20` — Pagination
- `?search=sony` — Full-text search
- `?categoryId=xxx` — Filter by category
- `?brandId=xxx` — Filter by brand
- `?minPrice=100000&maxPrice=5000000` — Price range
- `?sortBy=price&sortOrder=asc` — Sort (price, name, createdAt)
- `?isFeatured=true` — Featured products only

### 5.4 Categories

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/categories` | List categories (tree: parent + children) | Public |
| `GET` | `/api/categories/:slug` | Get category detail | Public |
| `POST` | `/api/categories` | Create category | CONTENT_MANAGER, ADMIN |
| `PATCH` | `/api/categories/:id` | Update category | CONTENT_MANAGER, ADMIN |
| `DELETE` | `/api/categories/:id` | Soft delete category | ADMIN |

### 5.5 Brands

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/brands` | List brands | Public |
| `POST` | `/api/brands` | Create brand | CONTENT_MANAGER, ADMIN |
| `PATCH` | `/api/brands/:id` | Update brand | CONTENT_MANAGER, ADMIN |
| `DELETE` | `/api/brands/:id` | Soft delete brand | ADMIN |

### 5.6 Cart

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/cart` | Get user's cart (with items, variants, products) | Auth |
| `POST` | `/api/cart/items` | Add item to cart | Auth |
| `PATCH` | `/api/cart/items/:id` | Update item quantity | Auth |
| `DELETE` | `/api/cart/items/:id` | Remove item from cart | Auth |
| `POST` | `/api/cart/merge` | Merge guest (localStorage) cart into DB cart | Auth |

### 5.7 Orders

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/orders` | Create order (checkout) | Auth |
| `GET` | `/api/orders` | List current user's orders | Auth |
| `GET` | `/api/orders/:id` | Get order detail | Auth (own order) |
| `PATCH` | `/api/orders/:id/cancel` | Cancel order (PENDING only) | Auth (own order) |
| `GET` | `/api/admin/orders` | List all orders (filter, search) | INV_MGR, ORD_MGR, ADMIN |
| `GET` | `/api/admin/orders/:id` | Get any order detail | INV_MGR, ORD_MGR, ADMIN |
| `PATCH` | `/api/admin/orders/:id/status` | Update order status | ORDER_MANAGER, ADMIN |

### 5.8 Payments

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/payments/sepay/webhook` | SePay webhook receiver | Public (HMAC verified) |
| `GET` | `/api/payments/sepay/qr/:orderId` | Get QR code data for order | Auth |

### 5.9 Addresses

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/addresses` | List user's addresses | Auth |
| `POST` | `/api/addresses` | Create address | Auth |
| `PATCH` | `/api/addresses/:id` | Update address | Auth (own) |
| `DELETE` | `/api/addresses/:id` | Delete address | Auth (own) |
| `PATCH` | `/api/addresses/:id/default` | Set default address | Auth (own) |
| `GET` | `/api/provinces` | Get provinces (proxy + cache) | Public |
| `GET` | `/api/provinces/:code/districts` | Get districts | Public |
| `GET` | `/api/districts/:code/wards` | Get wards | Public |

### 5.10 Reviews

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/products/:productId/reviews` | List approved reviews for product | Public |
| `POST` | `/api/products/:productId/reviews` | Create review | Auth |
| `PATCH` | `/api/reviews/:id` | Edit own review | Auth (own) |
| `DELETE` | `/api/reviews/:id` | Delete own review | Auth (own) |
| `GET` | `/api/admin/reviews` | List all reviews (filter by status) | CONTENT_MANAGER, ADMIN |
| `PATCH` | `/api/admin/reviews/:id/status` | Approve/reject review | CONTENT_MANAGER, ADMIN |

### 5.11 Inventory

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/inventory` | Stock overview (exact quantities) | INV_MGR, CONTENT_MGR, ADMIN |
| `GET` | `/api/inventory/low-stock` | Low stock warnings (stockAvailable <= threshold) | INV_MGR, ADMIN |
| `GET` | `/api/inventory/out-of-stock` | Out of stock items (stockAvailable = 0) | INV_MGR, ADMIN |
| `GET` | `/api/inventory/variants/:variantId` | Variant stock detail | INV_MGR, ADMIN |
| `PATCH` | `/api/inventory/variants/:variantId/adjust` | Adjust stock quantity | INVENTORY_MANAGER, ADMIN |

### 5.12 Coupons

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/coupons` | List coupons | ADMIN |
| `POST` | `/api/coupons` | Create coupon | ADMIN |
| `PATCH` | `/api/coupons/:id` | Update coupon | ADMIN |
| `DELETE` | `/api/coupons/:id` | Delete coupon | ADMIN |
| `POST` | `/api/coupons/validate` | Validate coupon code (check & calculate) | Auth |

### 5.13 Upload

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/upload/images` | Upload images to Cloudinary | CONTENT_MANAGER, ADMIN |
| `DELETE` | `/api/upload/images/:publicId` | Delete image from Cloudinary | CONTENT_MANAGER, ADMIN |

### 5.14 Dashboard

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Overview statistics | ADMIN, ORDER_MANAGER |
| `GET` | `/api/dashboard/revenue` | Revenue chart data (7d/30d) | ADMIN |

### 5.15 Settings

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/settings` | Get all settings | ADMIN |
| `PATCH` | `/api/settings/:key` | Update setting value | ADMIN |
| `GET` | `/api/settings/public` | Get public settings (shipping fee) | Public |

### 5.16 API Response Format

**Success:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

**Paginated:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Error:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

---

## 6. Frontend Design (Web Customer)

### 6.1 Design System

Per DESIGN.md (renamed from "Lumina Tech" → "ApexGear"):

- **Primary**: `#0058BE` (tech blue)
- **Surface**: `#F8F9FF` (light, clean background)
- **On-surface**: `#121C2A` (deep charcoal text)
- **Font**: Inter (systematic, utilitarian — fits tech gear context)
- **Elevation**: Tonal layering, subtle shadows
- **Shapes**: Soft-technical (4px base, 8px cards, pill for chips)

### 6.2 Pages

**Homepage:**
- Header: Logo + Nav links + Search bar + Cart icon (badge) + Auth button
- Hero: Split layout (DESIGN_VARIANCE=6, anti-center-bias) — left: headline + sub + CTA, right: featured product image
- Featured Categories: 4 category cards (Tai nghe, Màn hình, Chuột, Bàn phím)
- Featured Products: Product grid (4 cols desktop, 2 cols mobile)
- Brands Banner: Logo wall (brands từ data crawled)
- Footer: Navigation links, contact info, copyright

**Product Listing:**
- Sidebar: Category filter (parent + children), Brand checkboxes, Price range slider, Sort dropdown
- Grid: ProductCards (image + name + price + rating + "Hết hàng" badge)
- Pagination: Numbered pages
- Mobile: Filters in bottom sheet / drawer

**Product Detail:**
- Image gallery: Main image + thumbnail strip (click to switch)
- Product info: Name, brand link, rating stars, price (sale price highlight), stock status
- Variant selector: Buttons/dropdown per option type (Màu sắc → color swatches, Kích thước → buttons)
- Quantity selector + Add to Cart CTA (disabled if out of stock)
- Specs: Grouped specs (cards or grouped rows — not boring table per taste-skill)
- Description: Rich text HTML rendered section
- Reviews: Average rating + review list (approved only) + write review form (logged in)
- Related products: Horizontal scrollable cards

**Cart:**
- Items list: Image + name + variant info + quantity (editable) + line total + remove button
- Coupon input field + apply button
- Order summary sidebar: Subtotal + Shipping + Discount + Total
- Checkout CTA
- Empty state: Illustrated empty cart + "Tiếp tục mua sắm" link

**Checkout (multi-step):**
1. **Địa chỉ giao hàng**: Select saved address / add new (cascade: Tỉnh → Quận → Phường + detail)
2. **Phương thức thanh toán**: Radio: SePay (QR chuyển khoản) / COD
3. **Xác nhận đơn hàng**: Review items + address + payment + total → Place Order
4. **Kết quả**:
   - SePay: QR code page + countdown 10 phút + polling status
   - COD: Order success page
   - Cả hai: Order number + link to order detail

**Auth Pages:**
- Login: Email/password form + "Quên mật khẩu?" link + Google OAuth button + "Chưa có tài khoản?" link
- Register: Name + Email + Password + Confirm password + Google OAuth button
- Forgot Password: Email input → "Đã gửi email" message
- Reset Password: New password + Confirm → "Đã đổi mật khẩu" → redirect login

**Profile / Account:**
- Profile info: Avatar (upload Cloudinary), name, email, phone → Edit form
- Sổ địa chỉ: Address list + add/edit/delete + set default
- Đơn hàng: Order list (filterable by status) → Order detail (items + status timeline + cancel button if PENDING)

### 6.3 Responsive Breakpoints

| Breakpoint | Width | Grid |
|---|---|---|
| Mobile | < 768px | 1-2 columns |
| Tablet | 768px - 1023px | 2-3 columns |
| Desktop | >= 1024px | 3-4 columns |
| Max container | 1280px | Centered |

### 6.4 State Management (Zustand)

- **authStore**: user, isAuthenticated, login(), logout(), updateProfile()
- **cartStore**: items (local), syncWithServer(), addItem(), removeItem(), updateQuantity(), mergeCarts()

### 6.5 Motion / Animations

Per taste-skill dials (MOTION_INTENSITY=5):
- Page transitions: Subtle fade
- ProductCard hover: Shadow lift (Level 1 → Level 2 per DESIGN.md)
- Add to Cart: Cart icon bounce + badge count animation
- Skeleton loaders: Matching final layout shapes
- Button press: `scale(0.98)` on `:active`
- Toast notifications: Slide in from top-right

---

## 7. Admin Dashboard Design

### 7.1 Layout

- **Sidebar navigation**: Collapsible (icon-only on collapse), grouped by module
- **Top bar**: Admin name + avatar + role badge + logout
- **Content area**: Breadcrumb + page title + content
- **Responsive**: Sidebar → hamburger menu on mobile

### 7.2 Pages

**Dashboard (Home):**
- Stat cards: Tổng doanh thu, Đơn hàng hôm nay, Sản phẩm hết hàng, Users mới
- Revenue chart (line chart, 7d / 30d toggle)
- Recent orders table (5 latest)
- Low stock alerts (variants with stock <= 5)

**Product Management** (CONTENT_MANAGER, ADMIN):
- List: DataTable (search, filter by category/brand, sort, pagination)
- Create/Edit form: Name, slug (auto-gen), description (TipTap WYSIWYG editor), basePrice, salePrice, category (2-level select), brand, isFeatured, images (upload/reorder/delete), specs (dynamic key-value rows), option types + values, variants (auto-generated from option combinations + manual SKU/price/stock)
- Delete: Soft delete with confirmation

**Category Management** (CONTENT_MANAGER, ADMIN):
- List: Parent categories + children (tree view or grouped table)
- Create/Edit: Name, slug, description, image, parent (optional)

**Brand Management** (CONTENT_MANAGER, ADMIN):
- List: Simple table
- Create/Edit: Name, slug, logo

**Inventory** (INVENTORY_MANAGER, ADMIN):
- Stock overview table: Product name + variant info + SKU + current stock + low stock warning (<= 5)
- Quick edit: Inline stock adjustment

**Order Management** (ORDER_MANAGER, ADMIN):
- List: DataTable (filter by status, date range, payment method; search by order number)
- Detail: Customer info + items table + payment info + shipping address + status timeline
- Actions: Update status dropdown (follow allowed transitions)

**Review Management** (CONTENT_MANAGER, ADMIN):
- List: DataTable (filter by status: PENDING/APPROVED/REJECTED)
- Actions: Approve / Reject buttons

**User Management** (ADMIN):
- List: DataTable (search by name/email, filter by role)
- Edit: Change role, toggle isActive

**Coupon Management** (ADMIN):
- List: DataTable
- Create/Edit: Code, type, value, minOrderValue, maxDiscount, maxUses, startsAt, expiresAt

**Settings** (ADMIN):
- Shipping fee input
- Store info

### 7.3 Role-based Navigation

Sidebar items visible per role:

| Menu Item | CONTENT_MGR | INV_MGR | ORD_MGR | ADMIN |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Products | ✅ | ❌ | ❌ | ✅ |
| Categories | ✅ | ❌ | ❌ | ✅ |
| Brands | ✅ | ❌ | ❌ | ✅ |
| Inventory | ✅ (view) | ✅ | ❌ | ✅ |
| Orders | ❌ | ✅ (view) | ✅ | ✅ |
| Reviews | ✅ | ❌ | ❌ | ✅ |
| Users | ❌ | ❌ | ❌ | ✅ |
| Coupons | ❌ | ❌ | ❌ | ✅ |
| Settings | ❌ | ❌ | ❌ | ✅ |

---

## 8. Data Crawler (Playwright)

### 8.1 Target

- **Source**: GearVN.com
- **Categories**: Tai nghe, Màn hình, Chuột, Bàn phím
- **Volume**: 4 brands/category x 5-10 products/brand = **80-160 products**

### 8.2 Data per Product

- Tên sản phẩm
- Giá bán (giá gốc + giá khuyến mãi nếu có)
- Hình ảnh (primary + gallery)
- Mô tả ngắn / rich text
- Thông số kỹ thuật (specs) — grouped
- Brand name
- Category / Sub-category
- Trạng thái còn hàng

### 8.3 Architecture

```
scripts/crawler/
├── index.ts              # Main entry, orchestration
├── gearvn.crawler.ts     # GearVN page navigation & extraction
├── categories.ts         # Category URLs + brand mappings
├── transformers.ts       # Raw data → DB-ready JSON format
├── uploader.ts           # Upload images to Cloudinary
│                         # Folder structure: apexgear/products/{category}/{brand}/
└── output/               # Temporary JSON output files
```

### 8.4 Flow

1. **Crawl**: Playwright → navigate category pages → collect product URLs → crawl product detail pages
2. **Transform**: Clean data, normalize specs, map categories/brands
3. **Upload images**: Download to temp local → upload to Cloudinary (`apexgear/products/`) → get URLs → delete local
4. **Output**: Save JSON per category to `output/`
5. **Seed**: Prisma seed script reads JSON → inserts categories, brands, products, variants, images, specs into DB

### 8.5 Cloudinary Folder Structure

```
apexgear/
├── products/
│   ├── tai-nghe/
│   │   ├── sony/
│   │   ├── logitech/
│   │   └── ...
│   ├── man-hinh/
│   ├── chuot/
│   └── ban-phim/
├── brands/              # Brand logos
├── categories/          # Category images
└── avatars/             # User avatars
```

## 9. Error Handling & Validation

### 9.1 Global Exception Filter

**Features:**
- Standardized error format cho tất cả responses
- Prisma error handling (auto-mapping)
- Sanitize errors in production (không leak internal info)
- Preserve custom fields (`remaining_attempts`, `retry_after`)

**Prisma Error Mapping:**

| Prisma Code | HTTP Status | Description |
|---|---|---|
| `P2002` | `409 Conflict` | Unique constraint violation |
| `P2003` | `400 Bad Request` | Foreign key constraint |
| `P2025` | `404 Not Found` | Record not found |
| Others | `500 Internal Server Error` | Sanitized message |

### 9.2 Validation Pipeline

**Global ValidationPipe:**
```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => {
    const formattedErrors = errors.map(e => ({
      field: e.property,
      message: Object.values(e.constraints || {}).join(', ')
    }));
    return new BadRequestException({
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
})
```

### 9.3 ClassSerializerInterceptor

Automatically exclude sensitive fields from responses:
```typescript
export class UserEntity {
  @Exclude()
  password: string;

  @Exclude()
  failedLoginAttempts: number;

  @Exclude()
  lockedUntil: Date;

  @Exclude()
  tokenVersion: number;
}
```

---

## 10. Future Enhancements (TODO)

Các tính năng sau ghi chú lại để implement sau version 1:

- [ ] Email verification khi đăng ký
- [ ] Banner slider trang chủ (admin quản lý)
- [ ] Admin notification system (đơn hàng mới, low stock alerts)
- [ ] Audit log (ai thay đổi gì)
- [ ] Wishlist / Yêu thích
- [ ] So sánh sản phẩm
- [ ] Đánh giá có ảnh (review with images)
- [ ] Tìm kiếm nâng cao (Elasticsearch/MeiliSearch)
- [ ] Multi-language support (English)
- [ ] Progressive Web App (PWA)
- [ ] Social login (Facebook)
- [ ] Chat support
- [ ] Analytics dashboard nâng cao
- [ ] Token revocation mechanism (tokenVersion field)

---

## 11. Environment Variables Template

```env
# .env.example

# Database
DATABASE_URL="sqlserver://localhost:1433;database=apexgear;user=sa;password=YourPassword;encrypt=true;trustServerCertificate=true"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# CORS
FRONTEND_URL="http://localhost:5173"
ADMIN_URL="http://localhost:5174"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email (Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="ApexGear <noreply@apexgear.vn>"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"

# SePay
SEPAY_API_KEY="your-sepay-api-key"
SEPAY_WEBHOOK_SECRET="your-webhook-hmac-secret"
SEPAY_BANK_ACCOUNT="your-bank-account-number"

# Node
NODE_ENV="development"
PORT="3001"
```

---

## 12. Dependencies

### Production Dependencies

```bash
# NestJS Core
npm install @nestjs/common @nestjs/core @nestjs/platform-express

# Config & Validation
npm install @nestjs/config
npm install class-validator class-transformer

# Auth
npm install @nestjs/jwt @nestjs/passport
npm install passport passport-jwt passport-google-oauth20
npm install bcrypt cookie-parser

# Database
npm install @prisma/client

# API Docs
npm install @nestjs/swagger

# Rate Limiting
npm install @nestjs/throttler

# Image Upload
npm install cloudinary multer

# Email
npm install nodemailer

# Scheduling (SePay timeout)
npm install @nestjs/schedule
```

### Dev Dependencies

```bash
npm install -D @nestjs/cli @nestjs/schematics @nestjs/testing
npm install -D @types/node @types/express @types/multer
npm install -D @types/passport-jwt @types/passport-google-oauth20
npm install -D @types/bcrypt @types/cookie-parser @types/nodemailer
npm install -D typescript ts-node
npm install -D prisma
npm install -D eslint prettier
```

### Frontend Dependencies (Web + Admin)

```bash
# Core
npm install react react-dom react-router-dom

# State & Data Fetching
npm install zustand axios

# i18n
npm install react-i18next i18next

# UI & Styling
npm install tailwindcss @tailwindcss/vite

# Rich Text Editor (Admin)
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image

# Motion
npm install motion

# Utilities
npm install clsx date-fns
```

---

## 13. Design System Reference

Xem DESIGN.md cho:
- Color tokens (full Material-style palette)
- Typography scale (Inter, 9 variants)
- Spacing system (4px base unit)
- Border radius scale
- Elevation levels (shadow definitions)
- Component specs (buttons, inputs, cards, chips, lists, checkboxes)

---

**Design Status:** ✅ Approved
**Ready for Implementation:** Yes
**Next Step:** Write implementation plan (writing-plans skill)
