# SePay Integration Design

## Overview
This document outlines the design for completing the SePay payment integration in the ApexGear E-commerce application. The goal is to provide a seamless, real-time payment experience for customers using SePay (Bank Transfer via QR Code).

## Architecture & Data Flow

1. **Checkout**: Customer places an order and selects SePay as the payment method. The frontend redirects to the payment page: `/checkout/payment/:orderId`.
2. **QR & Order Details**: The frontend calls `GET /api/payments/qr/:orderId` to fetch the payment details (amount, bank account, content/sepayRef) and the expiration time (10 minutes from order creation).
3. **Real-time Connection**: The frontend establishes a Server-Sent Events (SSE) connection to `GET /api/payments/stream/:orderId`.
4. **Webhook Processing**: When the customer transfers the money, SePay sends a webhook to `POST /api/payments/webhook`.
5. **State Update & Event Emission**:
   - Backend verifies the webhook signature and amount.
   - Updates the order `paymentStatus` to `PAID` in the database.
   - Emits an internal event (e.g., `order.paid`) using `@nestjs/event-emitter`.
6. **Client Notification**: The SSE stream listens to the internal event and pushes a notification to the connected frontend client.
7. **Client Reaction**: The frontend receives the event, displays a success message, and redirects the user to the order confirmation/success page.
8. **Timeout Fallback**: If no payment is received within 10 minutes, an existing backend cron job automatically cancels the order. The frontend countdown timer will also expire and inform the user.

## Component Details

### Backend (apps/api)
- **`payments.controller.ts`**:
  - Add `GET /stream/:orderId` endpoint decorated with `@Sse()`.
  - Validate the `orderId`.
  - Return an `Observable` that listens to `order.paid` events and filters by `orderId`.
- **`payments.service.ts`**:
  - In `handleWebhook`, inject `EventEmitter2` and emit `order.paid` with the `orderId` upon successful payment verification and database update.
- **Dependencies**:
  - Install `@nestjs/event-emitter` in `apps/api`.
  - Register `EventEmitterModule.forRoot()` in `app.module.ts` or `payments.module.ts`.

### Frontend (apps/web)
- **`PaymentPage.tsx`**:
  - **Layout**: Split View.
    - Left Panel: Order details summary (total amount, items).
    - Right Panel: QR Code (generated using a library like `react-qr-code` or by using VietQR's image API `https://img.vietqr.io/image/<bank>-<account>-<template>.png?amount=<amount>&addInfo=<content>`), and a countdown timer (10:00).
  - **Hooks & State**:
    - Fetch order details on mount.
    - `EventSource` hook to listen to `/api/payments/stream/:orderId`.
    - Handle countdown logic. If it reaches 0, update UI to show "Expired".
    - On SSE success message, navigate to `/order/:orderId/success`.

## Error Handling & Edge Cases
- **Insufficient Payment**: Webhook logs the issue and does not emit the success event. Manual intervention is required (existing behavior).
- **Network Disconnection**: SSE has built-in automatic reconnection. If the frontend drops connection and reconnects after payment, we might miss the event. 
  - *Mitigation*: The frontend should re-fetch the order status (or the stream endpoint should immediately emit the current status upon connection if already paid). Let's implement an initial status check upon loading the PaymentPage to cover this.
- **Invalid Webhook Signature**: Rejected with 400 Bad Request.

## Testing Strategy
- **Backend Unit Tests**: Verify `EventEmitter` is called when webhook succeeds. Verify SSE controller returns the correct observable.
- **Frontend Integration**: Test the countdown timer expiration and the SSE event handling via mocked EventSource.

## Scope
This design is well-isolated to the payment module and the checkout flow. It does not require architectural changes to other parts of the system.
