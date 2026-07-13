# Phase 1A: API Core Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the NestJS backend API foundation for ApexGear e-commerce — database schema, auth, RBAC, core CRUD (Products, Categories, Brands, Users), inventory management, and Cloudinary image upload.

**Architecture:** NestJS monorepo app at `apps/api/` using Prisma ORM + SQL Server. JWT auth via httpOnly cookie. Role-based access control with 5 roles. Global exception filter + validation pipeline. Cloudinary for image storage.

**Tech Stack:** NestJS 10.x, TypeScript 5.x, Prisma 5.x, SQL Server, JWT, Passport, bcrypt, class-validator, @nestjs/throttler, @nestjs/swagger, Cloudinary, Multer

## Global Constraints

- **Language:** TypeScript strict mode
- **ORM:** Prisma with SQL Server — use `@db.NVarChar()` for all Vietnamese text fields, `@db.Decimal(18, 2)` for money
- **Naming:** camelCase for code, snake_case for DB columns (Prisma `@@map`)
- **Auth:** JWT stored in httpOnly cookie, NOT in response body
- **Soft Delete:** `deletedAt` field with filtered unique indexes (SQL Server `WHERE deleted_at IS NULL`)
- **API Prefix:** `/api` for all routes
- **Response Format:** `{ data, meta }` for success; `{ statusCode, message, errors, timestamp, path }` for errors
- **Validation:** `class-validator` + `class-transformer` with `whitelist: true, forbidNonWhitelisted: true`
- **Password:** bcrypt saltRounds=10, min 8 chars, uppercase+lowercase+number
- **Public Variant Security:** Public endpoints return `stockStatus` enum only, NOT exact stock numbers
- **Spec:** `docs/superpowers/specs/2026-07-14-apexgear-ecommerce-design.md`

---

### Task 1: Project Scaffolding & Monorepo Setup

**Files:**
- Create: `package.json` (root workspace)
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `apps/api/.env`

**Interfaces:**
- Consumes: Nothing (first task)
- Produces: Working NestJS app that starts on port 3001, monorepo workspace structure

- [ ] **Step 1: Initialize root monorepo**

Create `package.json` at project root:

```json
{
  "name": "apexgear",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:api": "npm run dev -w apps/api",
    "build:api": "npm run build -w apps/api",
    "lint:api": "npm run lint -w apps/api"
  }
}
```

Create `.gitignore`:

```
node_modules/
dist/
.env
uploads/
*.log
```

Create `.env.example`:

```env
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

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"

# Node
NODE_ENV="development"
PORT="3001"
```

- [ ] **Step 2: Scaffold NestJS app**

```bash
cd apps
npx -y @nestjs/cli@latest new api --skip-git --skip-install --package-manager npm --language ts
```

After scaffolding, update `apps/api/package.json` to set `"name": "@apexgear/api"` and add scripts:

```json
{
  "name": "@apexgear/api",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "nest start",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,test}/**/*.ts\" --fix"
  }
}
```

- [ ] **Step 3: Install production dependencies**

```bash
cd apps/api
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/swagger @nestjs/throttler @nestjs/schedule
npm install @prisma/client
npm install passport passport-jwt passport-google-oauth20
npm install bcrypt cookie-parser
npm install class-validator class-transformer
npm install cloudinary multer
npm install nodemailer
```

- [ ] **Step 4: Install dev dependencies**

```bash
npm install -D @types/passport-jwt @types/passport-google-oauth20 @types/bcrypt @types/cookie-parser @types/nodemailer @types/multer
npm install -D prisma
```

- [ ] **Step 5: Create main.ts with global config**

Create `apps/api/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.ADMIN_URL || 'http://localhost:5174',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('ApexGear API')
    .setDescription('ApexGear E-commerce API documentation')
    .setVersion('1.0')
    .addCookieAuth('jwt')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 ApexGear API running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
```

- [ ] **Step 6: Create app.module.ts**

Create `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
  ],
})
export class AppModule {}
```

- [ ] **Step 7: Copy .env.example to apps/api/.env and fill in real values**

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env` with your actual DATABASE_URL, JWT_SECRET, etc.

- [ ] **Step 8: Run and verify**

```bash
npm run dev:api
```

Expected: NestJS starts on port 3001, Swagger docs accessible at `http://localhost:3001/api/docs`

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold monorepo and NestJS API app with global config"
```

---

### Task 2: Prisma Setup & Database Schema

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Modify: `apps/api/src/app.module.ts` (import PrismaModule)

**Interfaces:**
- Consumes: Working NestJS app (Task 1)
- Produces: `PrismaService` injectable service, database tables created, `PrismaModule` globally available

- [ ] **Step 1: Initialize Prisma**

```bash
cd apps/api
npx prisma init --datasource-provider sqlserver
```

- [ ] **Step 2: Write the full Prisma schema**

Replace `apps/api/prisma/schema.prisma` with the complete schema from the spec. This includes ALL models: User, PasswordResetToken, Category, Brand, Product, ProductImage, ProductSpec, ProductOptionType, ProductOptionValue, ProductVariant, VariantOption, Review, Cart, CartItem, Order, OrderItem, Address, Coupon, Setting. Plus all enums: Role, AuthProvider, ReviewStatus, OrderStatus, PaymentMethod, PaymentStatus, CouponType.

The schema is defined in `docs/superpowers/specs/2026-07-14-apexgear-ecommerce-design.md` Section 3.2. Copy it exactly — the agent implementing this task MUST read that spec section and use the complete schema verbatim.

Key points to NOT miss:
- Use `@db.NVarChar()` for all Vietnamese text fields
- Use `@db.Decimal(18, 2)` for all money fields
- Use filtered `@unique(map: "unique_active_...")` for soft-deleteable entities
- Add `@@index` directives on all foreign keys and frequently queried columns
- Use `onDelete: Cascade` on child relations (ProductImage, ProductSpec, ProductVariant, CartItem, OrderItem, VariantOption)
- User model includes `failedLoginAttempts`, `lockedUntil`, `tokenVersion` fields

- [ ] **Step 3: Create PrismaService**

Create `apps/api/src/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 4: Create PrismaModule**

Create `apps/api/src/prisma/prisma.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 5: Import PrismaModule in AppModule**

Modify `apps/api/src/app.module.ts` — add `PrismaModule` to imports:

```typescript
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Run migration**

```bash
cd apps/api
npx prisma migrate dev --name init
```

Expected: Migration created, all tables created in SQL Server.

- [ ] **Step 7: Create filtered unique indexes (SQL Server specific)**

After migration, create a custom SQL migration for filtered unique indexes that Prisma doesn't support natively:

```bash
npx prisma migrate dev --name add_filtered_unique_indexes --create-only
```

Then edit the generated SQL file to add:

```sql
-- Filtered unique indexes for soft-delete support
CREATE UNIQUE NONCLUSTERED INDEX unique_active_email ON [dbo].[User](email) WHERE deleted_at IS NULL;
CREATE UNIQUE NONCLUSTERED INDEX unique_active_category_slug ON [dbo].[Category](slug) WHERE deleted_at IS NULL;
CREATE UNIQUE NONCLUSTERED INDEX unique_active_brand_name ON [dbo].[Brand](name) WHERE deleted_at IS NULL;
CREATE UNIQUE NONCLUSTERED INDEX unique_active_brand_slug ON [dbo].[Brand](slug) WHERE deleted_at IS NULL;
CREATE UNIQUE NONCLUSTERED INDEX unique_active_product_slug ON [dbo].[Product](slug) WHERE deleted_at IS NULL;
CREATE UNIQUE NONCLUSTERED INDEX unique_active_sku ON [dbo].[ProductVariant](sku) WHERE deleted_at IS NULL;
```

Then apply:

```bash
npx prisma migrate dev
```

- [ ] **Step 8: Generate Prisma client and verify**

```bash
npx prisma generate
npx prisma studio
```

Expected: Prisma Studio opens, all tables visible.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema with full database models and migrations"
```

---

### Task 3: Global Infrastructure (Guards, Filters, Interceptors, Decorators)

**Files:**
- Create: `apps/api/src/common/decorators/public.decorator.ts`
- Create: `apps/api/src/common/decorators/roles.decorator.ts`
- Create: `apps/api/src/common/decorators/current-user.decorator.ts`
- Create: `apps/api/src/common/filters/http-exception.filter.ts`
- Create: `apps/api/src/common/interceptors/transform.interceptor.ts`
- Create: `apps/api/src/common/dto/pagination-query.dto.ts`
- Modify: `apps/api/src/main.ts` (register global filter + interceptor)

**Interfaces:**
- Consumes: PrismaService (Task 2)
- Produces: `@Public()` decorator, `@Roles(...roles)` decorator, `@CurrentUser()` decorator, `HttpExceptionFilter` (global), `TransformInterceptor` (global), `PaginationQueryDto`

- [ ] **Step 1: Create @Public() decorator**

Create `apps/api/src/common/decorators/public.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 2: Create @Roles() decorator**

Create `apps/api/src/common/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 3: Create @CurrentUser() decorator**

Create `apps/api/src/common/decorators/current-user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

- [ ] **Step 4: Create barrel export**

Create `apps/api/src/common/decorators/index.ts`:

```typescript
export * from './public.decorator';
export * from './roles.decorator';
export * from './current-user.decorator';
```

- [ ] **Step 5: Create HttpExceptionFilter**

Create `apps/api/src/common/filters/http-exception.filter.ts`:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] | undefined;

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object') {
        const res = exResponse as any;
        message = res.message || message;
        errors = res.errors;
      }
    }
    // Handle Prisma errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[]) || [];
          message = `Unique constraint violation on: ${target.join(', ')}`;
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint violation';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        default:
          this.logger.error(`Prisma error ${exception.code}`, exception.message);
          message = 'Database error';
      }
    }
    // Handle unknown errors
    else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      if (process.env.NODE_ENV === 'development') {
        message = exception.message;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

- [ ] **Step 6: Create TransformInterceptor**

Create `apps/api/src/common/interceptors/transform.interceptor.ts`:

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, any>;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        // If response already has `data` key, pass through (for paginated responses)
        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          return {
            data: responseData.data,
            meta: {
              ...responseData.meta,
              timestamp: new Date().toISOString(),
            },
          };
        }
        // Wrap plain response in { data }
        return {
          data: responseData,
          meta: { timestamp: new Date().toISOString() },
        };
      }),
    );
  }
}
```

- [ ] **Step 7: Create PaginationQueryDto**

Create `apps/api/src/common/dto/pagination-query.dto.ts`:

```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

- [ ] **Step 8: Register global filter + interceptor in main.ts**

Add to `apps/api/src/main.ts` before `app.listen()`:

```typescript
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// After validation pipe setup:
app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalInterceptors(
  new ClassSerializerInterceptor(app.get(Reflector)),
  new TransformInterceptor(),
);
```

- [ ] **Step 9: Verify app still starts**

```bash
npm run dev:api
```

Expected: App starts without errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add global guards, filters, interceptors, and decorators"
```

---

### Task 4: Health Check Module

**Files:**
- Create: `apps/api/src/modules/health/health.controller.ts`
- Create: `apps/api/src/modules/health/health.module.ts`
- Modify: `apps/api/src/app.module.ts` (import HealthModule)

**Interfaces:**
- Consumes: `@Public()` decorator (Task 3)
- Produces: `GET /api/health` → `{ status: "ok", timestamp: "..." }`

- [ ] **Step 1: Create HealthController**

Create `apps/api/src/modules/health/health.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

- [ ] **Step 2: Create HealthModule**

Create `apps/api/src/modules/health/health.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

- [ ] **Step 3: Import HealthModule in AppModule**

Add `HealthModule` to `imports` array in `apps/api/src/app.module.ts`.

- [ ] **Step 4: Test**

```bash
curl http://localhost:3001/api/health
```

Expected: `{ "data": { "status": "ok", "timestamp": "..." }, "meta": { "timestamp": "..." } }`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add health check endpoint"
```

---

### Task 5: Auth Module (JWT + Login + Register + Guards)

**Files:**
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/modules/auth/guards/roles.guard.ts`
- Create: `apps/api/src/modules/auth/dto/register.dto.ts`
- Create: `apps/api/src/modules/auth/dto/login.dto.ts`
- Create: `apps/api/src/modules/auth/dto/change-password.dto.ts`
- Create: `apps/api/src/modules/auth/dto/update-profile.dto.ts`
- Create: `apps/api/src/modules/auth/entities/user.entity.ts`
- Modify: `apps/api/src/app.module.ts` (import AuthModule, set JwtAuthGuard as global guard)

**Interfaces:**
- Consumes: PrismaService (Task 2), `@Public()`, `@Roles()`, `@CurrentUser()` (Task 3)
- Produces: `JwtAuthGuard` (global), `RolesGuard` (global), `AuthService.register()`, `AuthService.login()`, `AuthService.validateUser()`, endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PATCH /api/auth/profile`, `PATCH /api/auth/change-password`

- [ ] **Step 1: Create User entity with @Exclude()**

Create `apps/api/src/modules/auth/entities/user.entity.ts`:

```typescript
import { Exclude } from 'class-transformer';
import { Role, AuthProvider } from '@prisma/client';

export class UserEntity {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  provider: AuthProvider;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  password: string | null;

  @Exclude()
  googleId: string | null;

  @Exclude()
  failedLoginAttempts: number;

  @Exclude()
  lockedUntil: Date | null;

  @Exclude()
  tokenVersion: number;

  @Exclude()
  deletedAt: Date | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
```

- [ ] **Step 2: Create DTOs**

Create `apps/api/src/modules/auth/dto/register.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}
```

Create `apps/api/src/modules/auth/dto/login.dto.ts`:

```typescript
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  password: string;
}
```

Create `apps/api/src/modules/auth/dto/change-password.dto.ts`:

```typescript
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  newPassword: string;
}
```

Create `apps/api/src/modules/auth/dto/update-profile.dto.ts`:

```typescript
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(15)
  phone?: string;
}
```

- [ ] **Step 3: Create JWT Strategy**

Create `apps/api/src/modules/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        return req?.cookies?.jwt || null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
```

- [ ] **Step 4: Create JwtAuthGuard**

Create `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`:

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
```

- [ ] **Step 5: Create RolesGuard**

Create `apps/api/src/modules/auth/guards/roles.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../../common/decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
```

- [ ] **Step 6: Create AuthService**

Create `apps/api/src/modules/auth/auth.service.ts`:

```typescript
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserEntity } from './entities/user.entity';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<UserEntity> {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    return new UserEntity(user);
  }

  async login(dto: LoginDto): Promise<{ user: UserEntity; token: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const retryAfter = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 1000,
      );
      throw new HttpException(
        { message: 'Account is locked', retry_after: retryAfter },
        HttpStatus.LOCKED,
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      // Increment failed login attempts
      const attempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      const remaining = MAX_LOGIN_ATTEMPTS - attempts;
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        remaining_attempts: Math.max(remaining, 0),
      });
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const token = this.generateToken(user);
    return { user: new UserEntity(user), token };
  }

  async getProfile(userId: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return new UserEntity(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return new UserEntity(user);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.password) {
      throw new BadRequestException('Cannot change password for OAuth accounts');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
  }

  private generateToken(user: { id: string; email: string; role: string }): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
```

- [ ] **Step 7: Create AuthController**

Create `apps/api/src/modules/auth/auth.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public, CurrentUser } from '../../common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new customer account' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and set JWT cookie' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.authService.login(dto);
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear JWT cookie' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update own profile' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, dto);
    return { message: 'Password changed successfully' };
  }
}
```

- [ ] **Step 8: Create AuthModule**

Create `apps/api/src/modules/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 9: Register AuthModule + global guards in AppModule**

Modify `apps/api/src/app.module.ts`:

```typescript
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

@Module({
  imports: [
    // ... existing imports
    AuthModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

- [ ] **Step 10: Test auth flow manually**

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234","name":"Test User"}'

# Login (check Set-Cookie header)
curl -v -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'

# Get profile (with cookie)
curl http://localhost:3001/api/auth/me \
  -H "Cookie: jwt=<token_from_login>"

# Health check still works without auth
curl http://localhost:3001/api/health
```

Expected: Register returns user (no password), Login sets jwt cookie, /me returns profile, /health works without auth.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add auth module with JWT cookie, login security, and RBAC guards"
```

---

### Task 6: Categories Module (CRUD, 2-level hierarchy)

**Files:**
- Create: `apps/api/src/modules/categories/categories.module.ts`
- Create: `apps/api/src/modules/categories/categories.service.ts`
- Create: `apps/api/src/modules/categories/categories.controller.ts`
- Create: `apps/api/src/modules/categories/dto/create-category.dto.ts`
- Create: `apps/api/src/modules/categories/dto/update-category.dto.ts`
- Create: `apps/api/src/modules/categories/dto/query-category.dto.ts`
- Modify: `apps/api/src/app.module.ts` (import CategoriesModule)

**Interfaces:**
- Consumes: PrismaService (Task 2), `@Public()`, `@Roles()`, `@CurrentUser()` (Task 3), JwtAuthGuard + RolesGuard (Task 5)
- Produces: `CategoriesService.findAll()`, `CategoriesService.findBySlug()`, `CategoriesService.create()`, `CategoriesService.update()`, `CategoriesService.remove()`. Endpoints: `GET /api/categories`, `GET /api/categories/:slug`, `POST /api/categories`, `PATCH /api/categories/:id`, `DELETE /api/categories/:id`

Implementation: Standard NestJS CRUD module following the patterns established in Auth (Task 5). The service should:
- `findAll()`: Return tree structure (parents with nested children). Public users see `isActive: true` only, staff see all.
- `findBySlug()`: Find by slug with children included.
- `create()`: Auto-generate slug from name. Validate `parentId` exists and is a top-level category (no grandchildren).
- `update()`: Allow updating name (auto-regenerate slug), description, image, parentId, sortOrder, isActive.
- `remove()`: Soft delete (`deletedAt = now()`). Reject if category has products.
- Roles: `@Public()` for GET, `@Roles(CONTENT_MANAGER, ADMIN)` for POST/PATCH, `@Roles(ADMIN)` for DELETE.

Steps follow the same pattern: create DTOs → service → controller → module → register → test → commit.

- [ ] **Step 1: Create DTOs**

Create the DTOs with proper class-validator decorators. `CreateCategoryDto` should have: `name` (required, NVarChar), `description?`, `image?`, `parentId?` (optional UUID), `sortOrder?`. `UpdateCategoryDto` extends `PartialType(CreateCategoryDto)` plus `isActive?`. `QueryCategoryDto` extends `PaginationQueryDto` with `includeInactive?` boolean.

- [ ] **Step 2: Create CategoriesService**

Implement all CRUD methods. Use `slugify()` utility to auto-generate slug from Vietnamese name. Include soft-delete filter (`where: { deletedAt: null }`) on all queries. Return tree structure for `findAll()`.

- [ ] **Step 3: Create CategoriesController**

Wire up routes with proper decorators: `@Public()` on GET, `@Roles()` on mutations.

- [ ] **Step 4: Create CategoriesModule and register in AppModule**

- [ ] **Step 5: Test CRUD manually via Swagger**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add categories module with 2-level hierarchy and soft delete"
```

---

### Task 7: Brands Module (CRUD)

**Files:**
- Create: `apps/api/src/modules/brands/brands.module.ts`
- Create: `apps/api/src/modules/brands/brands.service.ts`
- Create: `apps/api/src/modules/brands/brands.controller.ts`
- Create: `apps/api/src/modules/brands/dto/create-brand.dto.ts`
- Create: `apps/api/src/modules/brands/dto/update-brand.dto.ts`
- Modify: `apps/api/src/app.module.ts` (import BrandsModule)

**Interfaces:**
- Consumes: PrismaService (Task 2), decorators (Task 3), guards (Task 5)
- Produces: `BrandsService.findAll()`, `.create()`, `.update()`, `.remove()`. Endpoints: `GET /api/brands`, `POST /api/brands`, `PATCH /api/brands/:id`, `DELETE /api/brands/:id`

Implementation: Same CRUD pattern as Categories but simpler (no hierarchy). Fields: `name`, `slug` (auto), `description`, `logo`, `website`. Same role permissions as Categories.

- [ ] **Step 1: Create DTOs, Service, Controller, Module** (same pattern as Task 6)
- [ ] **Step 2: Register in AppModule, test via Swagger**
- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add brands module with CRUD and soft delete"
```

---

### Task 8: Uploads Module (Cloudinary)

**Files:**
- Create: `apps/api/src/modules/uploads/uploads.module.ts`
- Create: `apps/api/src/modules/uploads/uploads.service.ts`
- Create: `apps/api/src/modules/uploads/uploads.controller.ts`
- Create: `apps/api/src/config/cloudinary.config.ts`
- Create: `apps/api/uploads/temp/.gitkeep`
- Modify: `apps/api/src/app.module.ts` (import UploadsModule)

**Interfaces:**
- Consumes: ConfigService (Task 1), decorators (Task 3), guards (Task 5)
- Produces: `UploadsService.uploadImage(file, folder)` → `{ url, publicId }`, `UploadsService.deleteImage(publicId)` → `void`. Endpoints: `POST /api/upload/images`, `DELETE /api/upload/images/:publicId`

Implementation:
- Configure Cloudinary SDK from env vars.
- Multer middleware saves to `./uploads/temp/` with 5MB limit, JPEG/PNG/WEBP only.
- Upload flow: validate → upload to Cloudinary → delete local temp → return `{ url, publicId }`.
- Delete flow: remove from Cloudinary by publicId.
- Always cleanup local file (success or failure).

- [ ] **Step 1: Create Cloudinary config**

Create `apps/api/src/config/cloudinary.config.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const configureCloudinary = (configService: ConfigService) => {
  cloudinary.config({
    cloud_name: configService.getOrThrow('CLOUDINARY_CLOUD_NAME'),
    api_key: configService.getOrThrow('CLOUDINARY_API_KEY'),
    api_secret: configService.getOrThrow('CLOUDINARY_API_SECRET'),
  });
  return cloudinary;
};
```

- [ ] **Step 2: Create UploadsService with upload/delete methods**
- [ ] **Step 3: Create UploadsController with Multer interceptor**
- [ ] **Step 4: Create UploadsModule and register in AppModule**
- [ ] **Step 5: Create `uploads/temp/` directory with .gitkeep**
- [ ] **Step 6: Test upload via Swagger (multipart form)**
- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add uploads module with Cloudinary integration"
```

---

### Task 9: Products Module (CRUD + Variants + Images + Specs)

**Files:**
- Create: `apps/api/src/modules/products/products.module.ts`
- Create: `apps/api/src/modules/products/products.service.ts`
- Create: `apps/api/src/modules/products/products.controller.ts`
- Create: `apps/api/src/modules/products/dto/create-product.dto.ts`
- Create: `apps/api/src/modules/products/dto/update-product.dto.ts`
- Create: `apps/api/src/modules/products/dto/query-product.dto.ts`
- Create: `apps/api/src/modules/products/variants.service.ts`
- Create: `apps/api/src/modules/products/variants.controller.ts`
- Create: `apps/api/src/modules/products/dto/create-variant.dto.ts`
- Create: `apps/api/src/modules/products/dto/update-variant.dto.ts`
- Create: `apps/api/src/modules/products/product-images.service.ts`
- Create: `apps/api/src/modules/products/product-images.controller.ts`
- Modify: `apps/api/src/app.module.ts` (import ProductsModule)

**Interfaces:**
- Consumes: PrismaService (Task 2), decorators (Task 3), guards (Task 5), UploadsService (Task 8), CategoriesService (Task 6), BrandsService (Task 7)
- Produces: Product CRUD, Variant CRUD, Image management. This is the largest module.

Implementation details:
- **Product CRUD:** Create with auto-generated slug. Create includes auto-creating a default variant (SKU auto-generated). Query supports: search (SQL LIKE for now), filter by categoryId/brandId/price range/isFeatured, sort by price/name/createdAt, pagination.
- **Public product detail** (`GET /products/:slug`): Include images, specs, optionTypes+values, variants (but variants return `stockStatus` enum NOT exact numbers).
- **Variant CRUD:** Create/update/delete variants under a product. Each variant has SKU, optional price (fallback to product.basePrice), stockTotal, stockAvailable, attributes (JSON), displayOrder. Exactly 1 default variant per product.
- **Product Images:** Upload via Cloudinary (reuse UploadsService), set isPrimary, reorder, delete. Folder: `apexgear/products/{productId}/`.

- [ ] **Step 1: Create Product DTOs** (CreateProductDto, UpdateProductDto, QueryProductDto)
- [ ] **Step 2: Create ProductsService** with CRUD + search + filter + auto-slug + default variant creation
- [ ] **Step 3: Create ProductsController** with proper auth decorators
- [ ] **Step 4: Create Variant DTOs** (CreateVariantDto, UpdateVariantDto)
- [ ] **Step 5: Create VariantsService** with CRUD + stockStatus computation
- [ ] **Step 6: Create VariantsController** nested under products
- [ ] **Step 7: Create ProductImagesService** using UploadsService for Cloudinary
- [ ] **Step 8: Create ProductImagesController** with Multer upload
- [ ] **Step 9: Create ProductsModule** combining all providers/controllers
- [ ] **Step 10: Register in AppModule**
- [ ] **Step 11: Test full flow** — create product → add variants → upload images → query with filters
- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add products module with variants, images, specs, and search"
```

---

### Task 10: Users Module (Admin Management)

**Files:**
- Create: `apps/api/src/modules/users/users.module.ts`
- Create: `apps/api/src/modules/users/users.service.ts`
- Create: `apps/api/src/modules/users/users.controller.ts`
- Create: `apps/api/src/modules/users/dto/query-user.dto.ts`
- Create: `apps/api/src/modules/users/dto/update-user.dto.ts`
- Modify: `apps/api/src/app.module.ts` (import UsersModule)

**Interfaces:**
- Consumes: PrismaService (Task 2), decorators (Task 3), guards (Task 5), UserEntity (Task 5)
- Produces: Admin-only user management. Endpoints: `GET /api/users`, `GET /api/users/:id`, `PATCH /api/users/:id`, `DELETE /api/users/:id`, `POST /api/users/:id/restore`, `POST /api/users/:id/unlock`

Implementation:
- All endpoints require `@Roles(Role.ADMIN)`.
- `findAll()`: Filter by role, isActive, isLocked (computed: `lockedUntil > now()`). Paginated.
- `update()`: Change role, isActive. Cannot change own role (prevent self-demotion).
- `remove()`: Soft delete. Cannot delete self.
- `restore()`: Set `deletedAt = null`.
- `unlock()`: Clear `failedLoginAttempts` and `lockedUntil`.

- [ ] **Step 1: Create DTOs, Service, Controller, Module**
- [ ] **Step 2: Register in AppModule, test via Swagger**
- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add users module for admin management"
```

---

### Task 11: Inventory Module (Stock Management)

**Files:**
- Create: `apps/api/src/modules/inventory/inventory.module.ts`
- Create: `apps/api/src/modules/inventory/inventory.service.ts`
- Create: `apps/api/src/modules/inventory/inventory.controller.ts`
- Create: `apps/api/src/modules/inventory/dto/adjust-stock.dto.ts`
- Create: `apps/api/src/modules/inventory/dto/query-inventory.dto.ts`
- Modify: `apps/api/src/app.module.ts` (import InventoryModule)

**Interfaces:**
- Consumes: PrismaService (Task 2), decorators (Task 3), guards (Task 5)
- Produces: Inventory management. Endpoints: `GET /api/inventory`, `GET /api/inventory/low-stock`, `GET /api/inventory/out-of-stock`, `GET /api/inventory/variants/:variantId`, `PATCH /api/inventory/variants/:variantId/adjust`

Implementation:
- `overview()`: List all variants with product name, variant name, SKU, stockTotal, stockAvailable, lowStockThreshold. Paginated.
- `lowStock()`: Filter variants where `stockAvailable <= lowStockThreshold`.
- `outOfStock()`: Filter variants where `stockAvailable = 0`.
- `adjustStock()`: Takes `{ adjustment: number, reason?: string }`. Updates both `stockTotal` and `stockAvailable` by the adjustment value. Validates `stockAvailable` doesn't go negative.
- Roles: INVENTORY_MANAGER and ADMIN for adjust; INVENTORY_MANAGER, CONTENT_MANAGER, ADMIN for view.

- [ ] **Step 1: Create DTOs, Service, Controller, Module**
- [ ] **Step 2: Register in AppModule, test via Swagger**
- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add inventory module with stock management and alerts"
```

---

### Task 12: Seed Data & Final Verification

**Files:**
- Create: `apps/api/prisma/seed.ts`
- Modify: `apps/api/package.json` (add prisma seed script)

**Interfaces:**
- Consumes: All modules (Tasks 1-11)
- Produces: Seeded database with admin user, sample categories, brands, and settings

- [ ] **Step 1: Create seed script**

Create `apps/api/prisma/seed.ts` that:
1. Creates an ADMIN user (email: `admin@apexgear.vn`, password: `Admin123`)
2. Creates 4 parent categories: Tai nghe, Màn hình, Chuột, Bàn phím
3. Creates sample sub-categories for each
4. Creates sample brands: Sony, Logitech, Razer, Dell, Samsung, SteelSeries, Corsair, HyperX
5. Creates default settings: `shipping_fee: "30000"`, `store_name: "ApexGear"`

- [ ] **Step 2: Add seed script to package.json**

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

- [ ] **Step 3: Run seed**

```bash
npx prisma db seed
```

- [ ] **Step 4: Full verification**

Test all endpoints via Swagger:
1. `GET /api/health` → 200
2. `POST /api/auth/login` with admin credentials → sets cookie
3. `GET /api/auth/me` → returns admin user
4. `GET /api/categories` → returns category tree
5. `GET /api/brands` → returns brands list
6. `POST /api/products` → create a test product
7. `GET /api/products` → returns product list
8. `GET /api/products/:slug` → returns product detail with stockStatus
9. `GET /api/inventory` → returns stock overview
10. `GET /api/users` → returns users list (admin only)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add database seed script and complete Phase 1A verification"
```

---

## Summary

| Task | Description | Key Deliverables |
|------|-------------|------------------|
| 1 | Project Scaffolding | Monorepo, NestJS app, global config |
| 2 | Prisma + Database | Full schema, migrations, filtered indexes |
| 3 | Global Infrastructure | Decorators, filters, interceptors, DTOs |
| 4 | Health Check | `GET /api/health` endpoint |
| 5 | Auth Module | JWT cookie, login security, RBAC guards |
| 6 | Categories | 2-level CRUD with soft delete |
| 7 | Brands | CRUD with soft delete |
| 8 | Uploads | Cloudinary integration |
| 9 | Products | CRUD + Variants + Images + Specs + Search |
| 10 | Users | Admin user management |
| 11 | Inventory | Stock management + alerts |
| 12 | Seed & Verify | Seed data, full end-to-end verification |
