# ApexGear Shared Package Roadmap

> Context snapshot for future sessions. This document records the current senior-level decision on what should and should not be shared across `apps/web`, `apps/admin`, and potentially `apps/api`.

## Current status

The initial incremental shared package work has been completed and committed.

Commit:

```text
e27ea50 feat(shared): add shared workspace package
```

Implemented package:

```text
packages/shared
```

Package name:

```text
@apexgear/shared
```

Current shared scope:

- `formatPrice`
- `formatDate`
- `formatDateTime`
- commerce/domain union types:
  - `OrderStatus`
  - `PaymentStatus`
  - `PaymentMethod`
  - `CouponType`
  - `ReviewStatus`
  - `Role`
- runtime value arrays:
  - `ORDER_STATUS_VALUES`
  - `PAYMENT_STATUS_VALUES`
  - `PAYMENT_METHOD_VALUES`
  - `COUPON_TYPE_VALUES`
  - `REVIEW_STATUS_VALUES`
  - `ROLE_VALUES`
- role helpers:
  - `STAFF_ROLES`
  - `ALL_STAFF_ROLES`
  - `CONTENT_ROLES`
  - `isStaffRole`
- order transition helpers:
  - `ALLOWED_TRANSITIONS`
  - `getAllowedTransitions`
  - `requiresCancelReason`

Current migration strategy:

- `apps/web` and `apps/admin` import shared code through compatibility wrappers/barrels where possible.
- Existing app import paths were preserved to reduce churn.
- Backend/API imports from `@apexgear/shared` were intentionally not included yet.
- i18n was intentionally not moved into shared.

Verification already run after the shared migration:

```powershell
npm test -w @apexgear/shared
npm run typecheck -w @apexgear/shared
npm test -w apps/web
npm test -w apps/admin
```

Fresh results at the time:

- shared: 2 test files passed, 11 tests passed
- web: 29 test files passed, 126 tests passed
- admin: 37 test files passed, 208 tests passed

Playwright smoke-check was also performed against:

- customer: `http://apexgear.local:5173`
- admin: `http://admin.apexgear.local:5174`

Smoke-check findings:

- Admin login succeeded with admin credentials.
- Customer site rendered with existing customer session.
- VND price formatting rendered correctly on both sides.
- Date/date-time formatting rendered correctly on both sides.
- Admin navigation included `Vận chuyển` / Shipping and matched the updated 11-item expectation.
- Completed order detail showed terminal status without transition action buttons.
- Settings currently renders the supported `store_name` setting only.

## Guiding principle

Only share code when it is one of these:

1. A domain contract used by more than one app.
2. Pure logic whose behavior must stay consistent across apps.
3. A constant/rule where duplication creates a real risk of behavior drift.

Do **not** share code merely because it looks similar. If sharing does not provide real consistency, safety, or maintenance value, keep it app-local.

## i18n decision

Do **not** move admin/customer i18n into `@apexgear/shared`.

Reasoning:

- Admin and customer apps serve different audiences.
- Customer copy should be friendly and commerce-oriented.
- Admin copy should be concise and operation-oriented.
- Shared i18n would easily make customer UI sound like admin UI, or admin UI sound too verbose/customer-facing.
- i18n sharing provides limited value compared to its maintenance and UX risks.
- Text changes often affect accessibility queries and tests.

Preferred direction:

- Keep `apps/web/src/i18n/vi.json` app-specific.
- Keep `apps/admin/src/i18n/vi.json` app-specific.
- Share domain codes/types/rules, not user-facing text.

If status labels ever need stronger consistency, prefer sharing the status **codes** and keeping labels in each app's own i18n tree.

## What should remain shared

### 1. Domain enum values and TypeScript unions

These are good shared candidates and are already shared:

- `OrderStatus`
- `PaymentStatus`
- `PaymentMethod`
- `CouponType`
- `ReviewStatus`
- `Role`
- corresponding runtime value arrays

Reason:

- They are domain contracts.
- Web/admin both depend on them.
- Drift would create real bugs.
- They are pure and not tied to React/i18n/UI.

### 2. Pure format utilities

Already shared:

- `formatPrice`
- `formatDate`
- `formatDateTime`

Reason:

- Customer and admin both display VND and Vietnamese date formats.
- Inconsistent formatting is visible to users.
- Functions are pure and easy to test.

Future additions should only happen if duplicate usage is found, for example:

- `formatPercent`
- `formatPhoneNumber`
- `formatOrderCode`

Do not add these proactively without evidence of real reuse.

### 3. Order transition rules

Already shared:

- `ALLOWED_TRANSITIONS`
- `getAllowedTransitions`
- `requiresCancelReason`

Reason:

- This is business logic.
- Admin UI needs to show valid actions.
- Duplication increases risk of UI/API mismatch.

Note:

- Backend currently still has its own transition logic.
- Backend migration to shared should be separate due to module/build risk.

### 4. Role group helpers

Already shared:

- `STAFF_ROLES`
- `ALL_STAFF_ROLES`
- `CONTENT_ROLES`
- `isStaffRole`

Reason:

- Role semantics are domain/security-adjacent.
- Admin nav/route guard/tests need the same basic role grouping.

Do not prematurely build a large permission framework unless duplication justifies it.

## What may be shared later, only after audit

These are candidates, not automatic tasks.

Only migrate if all are true:

1. At least two apps use the logic.
2. The logic is truly identical.
3. It is pure and not tied to React, UI copy, routing, or app-specific UX.
4. If it remains duplicated, there is a real risk of behavior drift.

### Candidate: domain type guards

Potential helpers:

```ts
isOrderStatus(value: unknown): value is OrderStatus
isPaymentStatus(value: unknown): value is PaymentStatus
isRole(value: unknown): value is Role
```

Useful if both apps parse raw query params, route params, or API values.

Do not add until actual duplicate casts/validation are found.

### Candidate: pagination/query helpers

Potential helpers:

```ts
normalizePage(value)
normalizePageSize(value)
buildPaginationParams()
```

Only share if web/admin both implement equivalent logic.

### Candidate: API error normalization core

Web/admin both normalize API errors, but UX/copy should remain app-specific.

Possible shared shape:

```ts
normalizeApiError(error, {
  network,
  unauthorized,
  forbidden,
  invalidCredentials,
  generic,
})
```

or lower-level pure helpers:

```ts
getApiErrorStatus(error)
getApiErrorMessage(error)
isNetworkLikeApiError(error)
```

Rules:

- Do not share Axios instances.
- Do not share redirects/auth behavior.
- Do not share i18n text.
- Keep app-specific behavior in each app.

### Candidate: pure validation helpers

Possible examples:

```ts
isValidVietnamPhone()
normalizePhone()
isValidCouponCode()
validateQuantity()
```

Only share if admin and customer both use the same domain rule.

Frontend validation is not a replacement for backend validation.

### Candidate: small API contract types

Possible examples:

```ts
PaginatedResponse<T>
PaginationMeta
SortDirection
```

Only share stable API contract shapes.

Avoid sharing broad Prisma/entity-shaped models too early.

## What should not be shared now

### 1. i18n UI copy

Do not share:

- `nav.*`
- `pages.*`
- `forms.*`
- CTA/button wording
- toast wording
- customer/admin page descriptions

Keep text app-local.

### 2. UI components

Do not create a shared UI package yet.

Reason:

- Admin is dashboard/data/CRUD-oriented.
- Customer is storefront/checkout-oriented.
- Shared UI too early tends to become over-generic and harder to maintain.

Both apps can follow the same design tokens without sharing React components.

### 3. Nav config and routes

Do not share admin/customer nav trees.

Share role constants if needed, but keep app navigation app-specific.

### 4. Axios instances and service layers

Do not share app `api.ts` instances or services.

Reason:

- Auth redirects differ.
- UX differs.
- Endpoint usage differs.
- Error display differs.

Only consider shared lower-level pure helpers if duplication proves worthwhile.

### 5. Broad backend DTO/entity types too early

Do not blindly share `Product`, `Order`, `User`, or Prisma-shaped models.

Reason:

- Backend database entities are not always frontend DTOs.
- Admin and customer often need different fields.
- Leaking backend entity shape to frontend creates false safety.

Share small stable contracts only after audit.

## Recommended next steps

### Step 1: Package hardening

This is the safest and most useful immediate follow-up.

Tasks:

1. Add `@apexgear/shared` as a dependency in `apps/web/package.json`.
2. Add `@apexgear/shared` as a dependency in `apps/admin/package.json`.
3. Run `npm install` from the repo root to update `package-lock.json`.
4. Re-run verification:

```powershell
npm test -w @apexgear/shared
npm run typecheck -w @apexgear/shared
npm test -w apps/web
npm test -w apps/admin
```

Recommended additional verification if time allows:

```powershell
npm run build -w apps/web
npm run build -w apps/admin
```

Reason:

- Code now imports `@apexgear/shared`.
- Vite/Vitest aliases currently make resolution work.
- Declaring workspace dependency makes the package graph explicit and safer for CI/tooling.

Risk: low.

### Step 2: Audit duplicate pure logic

Do not migrate yet. First audit.

Search for duplication across `apps/web` and `apps/admin` in these areas:

- API error normalization
- pagination/query helpers
- status/role casts and predicates
- phone validation
- coupon validation
- simple API response wrapper types

For each candidate, decide using the four audit criteria above.

If a candidate fails the criteria, keep it app-local.

### Step 3: Migrate only high-value pure duplicates

If audit finds real duplication, migrate in small commits.

Each migration should include:

- failing test first where behavior is new or being fixed
- minimal shared implementation
- app wrapper/barrel updates when preserving old import paths helps reduce churn
- focused verification

### Step 4: Backend shared usage only as a separate phase

Backend imports from `@apexgear/shared` are possible but should not be mixed with frontend shared cleanup.

Risks:

- ESM/CommonJS mismatch
- NestJS build/runtime module resolution
- Jest/Vitest/tooling differences
- Prisma enum/source-of-truth questions

If backend sharing is desired later, first decide whether `packages/shared` should emit compiled JS and `.d.ts` rather than exporting TS source directly.

## Senior recommendation

Current shared migration is correctly scoped.

Do next:

1. Package hardening and lockfile.
2. Audit duplicate pure logic.
3. Share only the candidates with clear reuse and drift risk.

Do not do next:

- shared i18n
- shared UI package
- shared route/nav config
- shared Axios/services
- broad DTO/entity sharing

The goal is not maximum DRY. The goal is stable domain contracts and consistent pure behavior with minimal coupling.
