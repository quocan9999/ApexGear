# ApexGear — Global Error Handling Design Spec

> **Date:** 2026-07-16
> **Status:** Approved
> **Domain:** API Error Handling & Response Formatting

---

## 1. Mục tiêu
Chuẩn hóa cách xử lý và trả về phản hồi (response) từ toàn bộ API của hệ thống ApexGear. Áp dụng một **Định dạng bọc (Wrapped Format)** duy nhất cho cả request thành công và thất bại. Loại bỏ việc phân mảnh trong xử lý lỗi tại các Service/Controller bằng cách đẩy mọi ngoại lệ (exceptions) về một Global Error Handler duy nhất. Tăng cường bảo mật bằng cách ẩn các thông tin lỗi nhạy cảm của hệ thống khỏi người dùng cuối.

---

## 2. Cấu trúc Response Thống Nhất

Tất cả các API endpoints sẽ luôn trả về HTTP Response Body dưới dạng một JSON Object chứa 3 keys gốc: `success`, `data` (hoặc `error`), và `meta`.

### 2.1 Thành công (Success Response)
Được xử lý tự động bởi `TransformInterceptor`.

```json
{
  "success": true,
  "data": { ... }, // Payload chính (có thể là array hoặc object)
  "meta": {
    "timestamp": "2026-07-16T12:00:00.000Z"
    // Các thông tin khác như pagination
  }
}
```

### 2.2 Thất bại (Error Response)
Được bọc và xử lý tự động bởi `HttpExceptionFilter`.

```json
{
  "success": false,
  "error": {
    "code": "HTTP_STATUS_NAME_OR_CUSTOM_CODE",
    "message": "Thông báo lỗi thân thiện dành cho user.",
    "details": ["email", "password"] // (Tùy chọn) Chứa mảng các trường bị lỗi, array validation, hoặc target DB.
  },
  "meta": {
    "timestamp": "2026-07-16T12:00:00.000Z",
    "path": "/api/resource"
  }
}
```

---

## 3. Global Exception Filter (`http-exception.filter.ts`)

Filter sử dụng `@Catch()` (không truyền tham số) để hứng **toàn bộ** exceptions phát sinh trong ứng dụng.

### 3.1 Quy tắc Mapping Lỗi
Tùy vào kiểu của `exception`, Filter sẽ map ra HTTP Status Code, Error Code (dạng text), Message (tiếng Việt), và Details tương ứng:

| Loại Exception | Mã Prisma | HTTP Status | Error Code | Friendly Message | Details |
|---|---|---|---|---|---|
| **Prisma Error** | `P2002` | `409 Conflict` | `CONFLICT_ERROR` | Dữ liệu này đã tồn tại trong hệ thống. | Tên trường bị trùng |
| **Prisma Error** | `P2003` | `400 Bad Request` | `FOREIGN_KEY_VIOLATION` | Dữ liệu ràng buộc không hợp lệ. | N/A |
| **Prisma Error** | `P2025` | `404 Not Found` | `NOT_FOUND` | Không tìm thấy dữ liệu yêu cầu. | N/A |
| **Prisma Error** | Khác | `500 Internal Server Error`| `INTERNAL_SERVER_ERROR`| Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau. | N/A |
| **HttpException**| N/A | Dựa vào `.getStatus()`| `HTTP_ERROR_NAME` | Trích xuất từ NestJS payload (hoặc mặc định của Nest) | Các field lỗi (nếu là Validation) |
| **Unknown Error**| N/A | `500 Internal Server Error`| `INTERNAL_SERVER_ERROR`| Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau. | N/A |

### 3.2 Quy tắc Bảo mật
- **Không bao giờ** rò rỉ `exception.message` gốc hoặc `exception.stack` đối với các lỗi 500 (Internal Server Error) ra Response, bất kể môi trường (Dev hay Prod), nhằm đảm bảo tính nhất quán của cấu trúc Response.
- Thay vào đó, **luôn luôn** gọi `Logger.error(exception.message, exception.stack)` ở Backend để lưu log và phục vụ việc trace bug.

---

## 4. Kế hoạch Refactor (Codebase Cleanup)

Việc áp dụng Global Error Handler giúp mã nguồn (đặc biệt là các Services) trở nên tinh gọn. Các bước dọn dẹp bao gồm:

1. **Quét toàn bộ** thư mục `apps/api/src/modules/**/*.service.ts`.
2. **Tìm các khối `try/catch`** có mục đích duy nhất là dò mã `P2002` (hoặc các mã lỗi Prisma tương tự) rồi ném ra `ConflictException` hoặc `InternalServerErrorException`.
3. **Loại bỏ `try/catch`**: Để các hàm thực thi trực tiếp thao tác Database (ví dụ: `await this.prisma.brand.create(...)`). Lỗi Prisma sẽ tự "bốc hơi" (bubble up) lên Controller và bị `HttpExceptionFilter` tóm gọn.
4. **Cập nhật `transform.interceptor.ts`**: Bổ sung cờ `success: true` vào khối try-map trả về.
5. **Cập nhật `http-exception.filter.ts`**: Viết lại theo cấu trúc Response Envelope Thất bại đã định nghĩa ở phần 2.2.
