# SePay Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the real-time SePay payment integration (Backend SSE + Frontend Split View Checkout).

**Architecture:** We use NestJS `@Sse()` with `EventEmitter2` on the backend to stream payment success events. The frontend (Vite+React) uses `EventSource` to listen for real-time updates and updates the checkout UI automatically.

**Tech Stack:** NestJS, `@nestjs/event-emitter`, React, TailwindCSS, `EventSource`.

## Global Constraints

- No leaking of original `Error` messages or stack traces for 500 errors to the client. Keep them in `Logger.error()`.
- Error format must match the `{ success: boolean, data/error, meta }` envelope.

---

### Task 1: Backend Event Emitter Setup & Emission

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/modules/payments/payments.service.ts`
- Modify: `apps/api/src/modules/payments/payments.service.spec.ts`

**Interfaces:**
- Produces: Emits `order.paid` event with payload `{ orderId: string, orderNumber: string }`.

- [ ] **Step 1: Install EventEmitter package**

```bash
cd apps/api && npm install @nestjs/event-emitter
```

- [ ] **Step 2: Register EventEmitterModule**

Modify `apps/api/src/app.module.ts` to import `EventEmitterModule`.

```typescript
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    // ...existing imports
    EventEmitterModule.forRoot(),
  ],
})
```

- [ ] **Step 3: Write failing test for PaymentsService event emission**

Modify `apps/api/src/modules/payments/payments.service.spec.ts`. Mock `EventEmitter2` and verify it is called when webhook succeeds.

```typescript
// Add EventEmitter2 mock
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        // ...existing providers
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        }
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should emit order.paid event on successful webhook', async () => {
    // Setup valid webhook payload and mock prisma to return a pending order
    // call service.handleWebhook
    // expect(eventEmitter.emit).toHaveBeenCalledWith('order.paid', { orderId: 'id', orderNumber: 'num' });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd apps/api && npm run test -- src/modules/payments/payments.service.spec.ts`
Expected: FAIL (emit not called).

- [ ] **Step 5: Implement event emission in PaymentsService**

Modify `apps/api/src/modules/payments/payments.service.ts`:

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private eventEmitter: EventEmitter2, // Add this
  ) {}

  async handleWebhook(body: Record<string, unknown>, signature?: string) {
    // ...existing code...
    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.PAID, paidAt: new Date() },
    });

    this.logger.log(`Payment received for order ${order.orderNumber}`);
    
    // Add emission
    this.eventEmitter.emit('order.paid', {
      orderId: order.id,
      orderNumber: order.orderNumber
    });

    return { success: true, orderNumber: order.orderNumber };
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd apps/api && npm run test -- src/modules/payments/payments.service.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/package.json apps/api/package-lock.json apps/api/src/app.module.ts apps/api/src/modules/payments/payments.service.ts apps/api/src/modules/payments/payments.service.spec.ts
git commit -m "feat(api): emit order.paid event on sepay webhook success"
```

---

### Task 2: Backend SSE Controller Endpoint

**Files:**
- Modify: `apps/api/src/modules/payments/payments.controller.ts`
- Create: `apps/api/src/modules/payments/payments.controller.spec.ts`

**Interfaces:**
- Consumes: Listens to `order.paid` event.
- Produces: `GET /api/payments/stream/:orderId` returning text/event-stream.

- [ ] **Step 1: Write failing test for SSE Endpoint**

Create `apps/api/src/modules/payments/payments.controller.spec.ts`.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: {} },
        { provide: EventEmitter2, useValue: { fromEvent: jest.fn() } },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should return an observable for payment stream', () => {
    jest.spyOn(eventEmitter, 'fromEvent').mockReturnValue(new Observable());
    const result = controller.streamPayment('order-1');
    expect(result).toBeInstanceOf(Observable);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npm run test -- src/modules/payments/payments.controller.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement SSE Endpoint**

Modify `apps/api/src/modules/payments/payments.controller.ts`:

```typescript
import { Controller, Get, Param, Sse, MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map, filter } from 'rxjs';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ...existing endpoints...

  @Sse('stream/:orderId')
  streamPayment(@Param('orderId') orderId: string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'order.paid').pipe(
      filter((payload: any) => payload.orderId === orderId),
      map((payload: any) => ({
        data: { success: true, orderNumber: payload.orderNumber },
      } as MessageEvent)),
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && npm run test -- src/modules/payments/payments.controller.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/payments/payments.controller.ts apps/api/src/modules/payments/payments.controller.spec.ts
git commit -m "feat(api): add SSE endpoint for payment status streaming"
```

---

### Task 3: Frontend SePay Payment Page

**Files:**
- Create: `apps/web/src/pages/checkout/PaymentPage.tsx`
- Modify: `apps/web/src/App.tsx` (or main router file) to add route `/checkout/payment/:orderId`.

**Interfaces:**
- Consumes: `GET /api/payments/qr/:orderId` and `GET /api/payments/stream/:orderId`.

- [ ] **Step 1: Create PaymentPage component**

Create `apps/web/src/pages/checkout/PaymentPage.tsx` with Split View design and hooks for fetching QR data and SSE.

```tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 mins
  
  // Fetch QR Data
  useEffect(() => {
    fetch(`/api/payments/qr/${orderId}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setQrData(res.data);
          const expires = new Date(res.data.expiresAt).getTime();
          const now = new Date().getTime();
          setTimeLeft(Math.max(0, Math.floor((expires - now) / 1000)));
        }
      });
  }, [orderId]);

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // SSE Connection
  useEffect(() => {
    const eventSource = new EventSource(`/api/payments/stream/${orderId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.success) {
        eventSource.close();
        navigate(`/order/${orderId}/success`);
      }
    };

    return () => eventSource.close();
  }, [orderId, navigate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!qrData) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 mt-10 border rounded shadow-sm bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Thanh toán Đơn hàng</h2>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Order Info */}
        <div className="flex-1 border-r pr-8">
          <h3 className="text-xl font-semibold mb-4">Chi tiết thanh toán</h3>
          <p>Mã đơn hàng: <span className="font-bold">{qrData.orderNumber}</span></p>
          <p className="mt-2">Số tiền: <span className="text-red-500 font-bold text-lg">{qrData.amount.toLocaleString()}đ</span></p>
          <p className="mt-2">Số tài khoản: <strong>{qrData.bankAccount}</strong></p>
          <p className="mt-2">Nội dung chuyển khoản: <strong>{qrData.content}</strong></p>
        </div>
        
        {/* Right: QR Code & Timer */}
        <div className="flex-1 text-center flex flex-col items-center">
          <div className="p-4 bg-gray-50 border rounded-lg mb-4">
             {/* Note: We use VietQR api to generate image for simplicity */}
             <img src={`https://img.vietqr.io/image/970422-${qrData.bankAccount}-compact2.png?amount=${qrData.amount}&addInfo=${qrData.content}`} alt="QR Code" className="w-48 h-48" />
          </div>
          <p className="text-gray-600 mb-2">Vui lòng quét mã QR qua ứng dụng ngân hàng.</p>
          
          {timeLeft > 0 ? (
            <div className="text-red-500 font-bold text-xl">
              Chờ thanh toán ({formatTime(timeLeft)})
            </div>
          ) : (
            <div className="text-red-500 font-bold text-xl">
              Đơn hàng đã hết hạn thanh toán
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Route to App Router**

Modify `apps/web/src/App.tsx` (or `main.tsx`/`routes.tsx` depending on current structure) to import and add the new route.

```tsx
import PaymentPage from './pages/checkout/PaymentPage';
// Add to your react-router routes:
// <Route path="/checkout/payment/:orderId" element={<PaymentPage />} />
```

- [ ] **Step 3: Run build/lint to verify React syntax**

Run: `cd apps/web && npm run build`
Expected: Build succeeds without TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/checkout/PaymentPage.tsx apps/web/src/App.tsx
git commit -m "feat(web): add SePay PaymentPage with Split View and SSE"
```
