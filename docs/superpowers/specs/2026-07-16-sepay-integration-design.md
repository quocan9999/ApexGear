# Thiết kế Tích hợp Thanh toán SePay

## Tổng quan
Tài liệu này mô tả thiết kế để hoàn thiện tính năng thanh toán SePay trong ứng dụng thương mại điện tử ApexGear. Mục tiêu là cung cấp trải nghiệm thanh toán mượt mà, thời gian thực cho khách hàng sử dụng SePay (Chuyển khoản Ngân hàng qua Mã QR).

## Kiến trúc & Luồng dữ liệu

1. **Đặt hàng**: Khách hàng tiến hành đặt hàng và chọn SePay làm phương thức thanh toán. Frontend chuyển hướng khách đến trang thanh toán: `/checkout/payment/:orderId`.
2. **QR & Chi tiết Đơn hàng**: Frontend gọi API `GET /api/payments/qr/:orderId` để lấy chi tiết thanh toán (số tiền, số tài khoản ngân hàng, nội dung chuyển khoản/sepayRef) và thời gian hết hạn (10 phút kể từ lúc tạo đơn).
3. **Kết nối Real-time**: Frontend thiết lập một kết nối Server-Sent Events (SSE) tới `GET /api/payments/stream/:orderId`.
4. **Xử lý Webhook**: Khi khách hàng chuyển khoản thành công, SePay gửi một webhook tới `POST /api/payments/webhook`.
5. **Cập nhật Trạng thái & Phát Sự kiện**:
   - Backend xác thực chữ ký webhook và số tiền nhận được.
   - Cập nhật `paymentStatus` của đơn hàng thành `PAID` trong database.
   - Phát một sự kiện nội bộ (ví dụ: `order.paid`) sử dụng `@nestjs/event-emitter`.
6. **Thông báo đến Client**: Luồng SSE lắng nghe sự kiện nội bộ `order.paid` và đẩy thông báo xuống cho client frontend đang kết nối.
7. **Phản hồi từ Client**: Frontend nhận sự kiện, hiển thị thông báo thành công, và tự động chuyển hướng người dùng đến trang xác nhận/cảm ơn đơn hàng.
8. **Hết hạn Thanh toán**: Nếu không nhận được thanh toán trong vòng 10 phút, một cron job có sẵn trên Backend sẽ tự động huỷ đơn. Bộ đếm ngược trên Frontend cũng sẽ chạy hết giờ và thông báo cho người dùng biết đơn đã bị huỷ.

## Chi tiết Component

### Backend (apps/api)
- **`payments.controller.ts`**:
  - Thêm endpoint `GET /stream/:orderId` được đánh dấu bằng `@Sse()`.
  - Validate tham số `orderId`.
  - Trả về một `Observable` lắng nghe các sự kiện `order.paid` và lọc theo `orderId`.
- **`payments.service.ts`**:
  - Trong hàm `handleWebhook`, inject `EventEmitter2` và emit sự kiện `order.paid` kèm theo `orderId` sau khi xác thực thanh toán thành công và cập nhật database.
- **Dependencies**:
  - Cài đặt `@nestjs/event-emitter` vào `apps/api`.
  - Đăng ký `EventEmitterModule.forRoot()` trong `app.module.ts` hoặc `payments.module.ts`.

### Frontend (apps/web)
- **`PaymentPage.tsx`**:
  - **Bố cục**: Chia đôi màn hình (Split View).
    - Cột trái: Tóm tắt chi tiết đơn hàng (tổng tiền, danh sách sản phẩm).
    - Cột phải: Mã QR Code (được tạo bằng thư viện `react-qr-code` hoặc gọi API ảnh của VietQR `https://img.vietqr.io/image/<bank>-<account>-<template>.png?amount=<amount>&addInfo=<content>`), cùng với bộ đếm ngược thời gian (10:00).
  - **Hooks & State**:
    - Fetch chi tiết đơn hàng khi component mount.
    - Dùng hook `EventSource` để lắng nghe `/api/payments/stream/:orderId`.
    - Xử lý logic đếm ngược. Nếu về 0, cập nhật UI hiển thị chữ "Đã hết hạn".
    - Khi nhận được message thành công từ SSE, chuyển hướng đến `/order/:orderId/success`.

## Xử lý Lỗi & Các trường hợp ngoại lệ
- **Chuyển khoản thiếu tiền**: Webhook sẽ log lỗi lại và KHÔNG emit sự kiện thành công. Yêu cầu xử lý thủ công (giữ nguyên logic hiện tại).
- **Mất kết nối mạng**: SSE có cơ chế tự động kết nối lại. Tuy nhiên, nếu frontend mất mạng và kết nối lại sau khi đã thanh toán xong, có thể sẽ bị lỡ event.
  - *Giải pháp*: Frontend cần gọi API kiểm tra lại trạng thái đơn hàng ngay khi load xong PaymentPage (hoặc endpoint stream sẽ lập tức emit trạng thái hiện tại ngay khi vừa kết nối). Chúng ta sẽ thêm bước kiểm tra trạng thái lúc init trang PaymentPage để đề phòng.
- **Chữ ký Webhook không hợp lệ**: Bị từ chối với lỗi 400 Bad Request.

## Chiến lược Testing
- **Backend Unit Tests**: Viết test xác nhận `EventEmitter` được gọi khi webhook chạy thành công. Test SSE controller có trả về đúng observable không.
- **Frontend Integration**: Test UI đếm ngược thời gian hết hạn và test việc bắt sự kiện SSE thông qua mock `EventSource`.

## Phạm vi (Scope)
Thiết kế này được cô lập tốt trong module thanh toán và luồng checkout. Nó không đòi hỏi phải thay đổi kiến trúc ở các phần khác của hệ thống.
