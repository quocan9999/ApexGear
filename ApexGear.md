# GearHub - Project Summary

## 1. Mục tiêu

Xây dựng một website **B2C E-commerce** bán thiết bị công nghệ & gaming
để ứng tuyển vị trí **Backend Intern / Full Stack Intern**.

Mục tiêu chính: - Thể hiện tư duy api. - Thiết kế database tốt. -
Xây dựng RESTful API chuẩn. - Có frontend React đủ để demo.

------------------------------------------------------------------------

# 2. Tech Stack

## API

- NestJS
- TypeScript
- Prisma ORM
- SQL Server
- JWT
- Passport
- bcrypt
- Swagger (OpenAPI)
- class-validator
- class-transformer

## Web (Customer)

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios

## Admin Dashboard

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios

------------------------------------------------------------------------

# 3. Clean Architecture (Pragmatic Clean Architecture)

## Monorepo

Một repository duy nhất:

```text
apexgear
```

## Request Flow

```text
HTTP Request
      │
      ▼
Controller
      │
      ▼
Service
      │
      ▼
Repository (khi cần)
      │
      ▼
PrismaService
      │
      ▼
SQL Server
```

## Project Structure

```text
ApexGear
├── apps
│   ├── api
│   │   ├── src
│   │   │   ├── common
│   │   │   ├── config
│   │   │   ├── prisma
│   │   │   ├── modules
│   │   │   │   ├── auth
│   │   │   │   ├── users
│   │   │   │   ├── products
│   │   │   │   │   ├── dto
│   │   │   │   │   ├── interfaces
│   │   │   │   │   ├── repositories
│   │   │   │   │   ├── product.controller.ts
│   │   │   │   │   ├── product.service.ts
│   │   │   │   │   └── product.module.ts
│   │   │   │   ├── brands
│   │   │   │   ├── categories
│   │   │   │   ├── carts
│   │   │   │   └── orders
│   │   │   └── main.ts
│   │   ├── prisma
│   │   └── package.json
│   ├── web
│   │   ├── src
│   │   │   ├── assets
│   │   │   ├── components
│   │   │   ├── contexts
│   │   │   ├── hooks
│   │   │   ├── layouts
│   │   │   ├── pages
│   │   │   ├── routes
│   │   │   ├── services
│   │   │   ├── types
│   │   │   ├── utils
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public
│   │   └── package.json
│   └── admin
│       ├── src
│       │   ├── assets
│       │   ├── components
│       │   ├── contexts
│       │   ├── hooks
│       │   ├── layouts
│       │   ├── pages
│       │   ├── routes
│       │   ├── services
│       │   ├── types
│       │   ├── utils
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── public
│       └── package.json

│       ├── src
│       │   ├── assets
│       │   ├── components
│       │   ├── contexts
│       │   ├── hooks
│       │   ├── layouts
│       │   ├── pages
│       │   ├── routes
│       │   ├── services
│       │   ├── types
│       │   ├── utils
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── public
│       └── package.json
├── docs
├── README.md
├── .gitignore
└── package.json
```

  -------------

# 4. Design Pattern

  \- Dependency
  Injection -
  Service
  Layer -
  Repository
  Pattern
  (Prisma) -
  DTO Pattern

  -------------

# 5. Kỹ thuật bắt buộc

- JWT Authentication
- Role-based Authorization
- Validation
- Global Exception Filter
- Pagination
- Search
- Filter
- Sort
- Soft Delete
- Swagger/OpenAPI

------------------------------------------------------------------------
