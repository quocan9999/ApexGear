# ApexGear

B2C e-commerce platform for tech gear & gaming (Tai nghe, Màn hình, Chuột, Bàn phím).

## Phase 1A — API Core Foundation

NestJS monorepo app at `apps/api/` with:

- Prisma + SQL Server schema
- JWT httpOnly cookie auth + RBAC (5 roles)
- Categories (2-level), Brands, Products (+ variants/images/specs)
- Users (admin), Inventory, Cloudinary uploads
- Health check, Swagger, global validation/filters

### Prerequisites

- Node.js 20+
- SQL Server (local or Docker)
- Cloudinary account (optional for image upload tests)

### Quick start

```powershell
# 1. Install deps
npm install

# 2. Configure env
copy .env.example apps\api\.env
# Edit apps/api/.env — set DATABASE_URL, JWT_SECRET, Cloudinary keys

# 3. SQL Server via Docker (optional)
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourPassword123" `
  -p 1433:1433 --name apexgear-sql -d mcr.microsoft.com/mssql/server:2022-latest

# 4. Migrate + seed
cd apps\api
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# 5. Run API
cd ..\..
npm run dev:api
```

- API: http://localhost:3001/api  
- Swagger: http://localhost:3001/api/docs  
- Seed admin: `admin@apexgear.vn` / `Admin123`

### Filtered unique indexes (soft-delete)

After the first migration, create a custom SQL migration for filtered uniques:

```sql
CREATE UNIQUE NONCLUSTERED INDEX unique_active_email ON [User](email) WHERE deletedAt IS NULL;
CREATE UNIQUE NONCLUSTERED INDEX unique_active_category_slug ON [Category](slug) WHERE deletedAt IS NULL;
CREATE UNIQUE NONCLUSTERED INDEX unique_active_brand_name ON [Brand](name) WHERE deletedAt IS NULL;
CREATE UNIQUE NONCLUSTERED INDEX unique_active_brand_slug ON [Brand](slug) WHERE deletedAt IS NULL;
CREATE UNIQUE NONCLUSTERED INDEX unique_active_product_slug ON [Product](slug) WHERE deletedAt IS NULL;
CREATE UNIQUE NONCLUSTERED INDEX unique_active_sku ON [ProductVariant](sku) WHERE deletedAt IS NULL;
```

(Adjust column/table casing to match Prisma’s generated SQL Server schema.)

### Workspace scripts

| Script | Description |
|--------|-------------|
| `npm run dev:api` | NestJS watch mode |
| `npm run build:api` | Production build |
| `npm run lint:api` | ESLint |

### Spec & plan

- Design: `docs/superpowers/specs/2026-07-14-apexgear-ecommerce-design.md`
- Plan: `docs/superpowers/plans/2026-07-14-phase-1a-api-core-foundation.md`
