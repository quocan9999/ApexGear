# ApexGear

> Nền tảng thương mại điện tử B2C chuyên cung cấp thiết bị công nghệ & gaming gear (bàn phím, chuột, tai nghe, màn hình) cho game thủ Việt, tích hợp thanh toán tự động qua SePay webhook, phân quyền RBAC chặt chẽ và tìm kiếm bằng SQL Server Full-Text Search.

---

## Hướng dẫn chạy nhanh với Docker (Khuyên dùng)

### 1. Yêu cầu hệ thống

* Cài đặt sẵn [Docker Desktop](https://www.docker.com/products/docker-desktop/) (đảm bảo Docker đang chạy).

### 2. Khởi chạy dự án

Mở terminal/Command Prompt tại thư mục gốc của dự án và chạy lệnh sau:

```bash
docker-compose up --build
```

Lệnh này sẽ tự động tải SQL Server, cài đặt dependencies, chạy migrations, seed dữ liệu mẫu và khởi chạy đồng thời Backend API, Storefront Web, Admin Dashboard.

*(Lần chạy đầu tiên có thể mất vài phút).*

### 3. Link truy cập (sau khi Docker chạy thành công)

* **Customer Storefront:** [http://localhost:5173/](http://localhost:5173/)
* **Admin Dashboard:** [http://localhost:5174/](http://localhost:5174/)
* **API Backend:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

### 4. Danh sách tài khoản Test (Seed Data)

| Tài khoản (Email)        | Mật khẩu      | Mô tả                                                        |
|:------------------------ |:------------- |:------------------------------------------------------------ |
| `customer@apexgear.vn`   | `Test@123456` | Khách Hàng Test - Tài khoản mua hàng cơ bản                  |
| `content@apexgear.vn`    | `Test@123456` | Quản Lý Nội Dung - Viết bài, thông tin trang tĩnh            |
| `inventory@apexgear.vn`  | `Test@123456` | Quản Lý Kho Hàng - Nhập/xuất kho, cấu hình sản phẩm          |
| `order@apexgear.vn`      | `Test@123456` | Quản Lý Đơn Hàng - Theo dõi trạng thái giao hàng, vận chuyển |
| `admin@apexgear.vn`      | `Test@123456` | Quản Trị Viên - Quản lý chung hệ thống eCommerce             |
| `superadmin@apexgear.vn` | `Test@123456` | Quản Trị Viên Cấp Cao - Toàn quyền kiểm soát hệ thống        |

### Giao diện thực tế của dự án

#### 1. Trang chủ cửa hàng (Storefront)

<img title="" src="screenshots/web-homepage.png" alt="Storefront Home" data-align="inline">

#### 2. Trang quản trị hệ thống (Admin Dashboard)

![Admin Dashboard](screenshots/admin-dashboard.png)

---

## Bài toán & Giải pháp thực tế

### Vấn đề thực tế

* Trải nghiệm mua sắm thiết bị gaming trực tuyến tại Việt Nam còn phân mảnh, đặc biệt khâu thanh toán chuyển khoản ngân hàng thường làm thủ công (phải chụp ảnh màn hình giao dịch gửi cho admin xác nhận), gây tốn thời gian và dễ nhầm lẫn.
* Việc quản lý kho hàng, danh mục sản phẩm phức tạp, thiếu phân quyền (RBAC) rõ ràng cho nhân viên kho, nhân viên đơn hàng, nhân viên nội dung dẫn đến thất thoát hoặc sai sót dữ liệu.
* Tìm kiếm sản phẩm không hiệu quả trên lượng dữ liệu lớn khi chỉ sử dụng truy vấn `LIKE` thông thường.

### Giải pháp của bạn

* **Kiến trúc Monorepo đồng bộ:** Xây dựng hệ thống monorepo tích hợp Storefront, Admin Dashboard và API Backend, giao tiếp mượt mà qua proxy và JWT cookie-based auth.
* **Tự động hóa thanh toán ngân hàng:** Tích hợp cổng SePay QR + webhook tự động xác thực chữ ký HMAC SHA-256, chuyển trạng thái đơn hàng ngay lập tức khi nhận tiền chuyển khoản.
* **Hệ thống phân quyền (RBAC) chi tiết:** Chia nhỏ quyền hạn với 5 roles (`CUSTOMER`, `ADMIN`, `CONTENT_MANAGER`, `INVENTORY_MANAGER`, `ORDER_MANAGER`) giúp quản trị viên vận hành hệ thống chuyên nghiệp và an toàn.
* **Tối ưu tìm kiếm:** Triển khai SQL Server Full-Text Search (raw queries) xử lý tiếng Việt có dấu, tìm kiếm sản phẩm tối ưu.
* **Đồng bộ đa ngôn ngữ:** Hỗ trợ đa ngôn ngữ hoàn chỉnh (`vi` / `en`) bằng `react-i18next` cho cả Storefront và Admin.

---

## Công nghệ sử dụng

| Thành phần             | Công nghệ                                   | Lý do chọn lựa                                                                                                                            |
|:---------------------- |:------------------------------------------- |:----------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**           | React 19 + Vite + Tailwind CSS v4 + Zustand | React 19 tối ưu render, Tailwind v4 hiện đại hóa CSS, Zustand quản lý state đơn giản, trực quan thay vì Redux cồng kềnh.                  |
| **Backend**            | NestJS + TypeScript                         | NestJS cung cấp cấu trúc code modular chuẩn mực, TypeScript tăng tính an toàn và minh bạch cho mã nguồn.                                  |
| **Database**           | SQL Server + Prisma ORM                     | SQL Server mạnh mẽ về giao dịch, hỗ trợ Full-Text Search tốt; Prisma ORM tăng tốc phát triển và bảo đảm an toàn kiểu dữ liệu (type-safe). |
| **Thanh toán & Media** | SePay API + Cloudinary                      | SePay tự động hóa webhook ngân hàng; Cloudinary quản lý và tối ưu hóa hình ảnh sản phẩm phân phát qua CDN.                                |
| **Hosting**            | *Chưa cấu hình (Chạy local)*                | *Note: Dự án hiện tại đang chạy ở môi trường phát triển local, chưa được deploy lên các nền tảng online như Vercel/Render.*               |

---

## Tính năng cốt lõi

* **Xác thực và Bảo mật nâng cao:** Đăng nhập JWT qua httpOnly cookies, bảo vệ tài khoản chống tấn công brute-force (khóa tài khoản 15 phút sau 5 lần nhập sai), giới hạn tần suất request IP (IP throttle dùng `@nestjs/throttler`).
* **Phân quyền người dùng (RBAC):** Phân chia 5 roles giúp vận hành doanh nghiệp e-commerce: Quản lý catalog sản phẩm, quản lý kho hàng, quản lý đơn hàng, và giám sát chung.
* **Thanh toán tự động (SePay Webhook):** Tạo mã QR chuyển khoản và xác thực webhook tự động bằng thuật toán so sánh an toàn thời gian chữ ký HMAC SHA-256.
* **Checkout an toàn với Transaction:** Áp dụng cơ chế Prisma Transactions khi thanh toán để kiểm tra, trừ tồn kho và khôi phục tồn kho tự động nếu đơn hàng hủy/thất bại, loại bỏ race condition.
* **Thông báo Realtime cho Admin:** Sử dụng cơ chế Server-Sent Events (SSE) để đẩy thông báo realtime lên giao diện Admin khi có đơn hàng mới hoặc sản phẩm sắp hết hàng.
* **Xóa mềm (Soft Delete):** Sử dụng xóa mềm (`deletedAt`) kết hợp SQL Server filtered unique indexes để lưu trữ dữ liệu lịch sử mà không lo trùng lặp định danh email hay SKU.

---

## Kiến trúc & Thiết kế Database

Kiến trúc luồng dữ liệu của hệ thống:

```
[Khách hàng / Admin Web]
          │
      (HTTP/Vite Proxy)
          │
          ▼
    [NestJS Web API] ──(Authentication / JWT)
          │
     (Prisma ORM)
          │
          ▼
    [SQL Server Database]
```

*Note: Sơ đồ database chi tiết có thể được tham khảo trong file [schema.prisma](file:///E:/SourceCode/ApexGear/apps/api/prisma/schema.prisma). Cơ sở dữ liệu bao gồm các bảng được chuẩn hóa: User, Product, Category, Brand, Order, OrderItem, Cart, CartItem, Inventory, Coupon, Notification.*

---

## Hướng dẫn chạy local

Làm theo các bước sau để chạy dự án trên máy tính của bạn:

### 1. Yêu cầu hệ thống

* Node.js phiên bản `>= 20.x`
* Cài đặt sẵn Microsoft SQL Server (hoặc chạy qua Docker)

### 2. Cài đặt các thư viện bổ sung

```bash
# Cài đặt toàn bộ dependencies tại thư mục gốc monorepo
npm install
```

### 3. Cấu hình biến môi trường (Environment Variables)

Tạo file `.env` tại thư mục `apps/api/` dựa trên template `.env.example`:

```powershell
copy apps\api\.env.example apps\api\.env
```

Điền các giá trị thích hợp, đặc biệt là `DATABASE_URL` kết nối tới SQL Server của bạn, `JWT_SECRET`, và các khóa API (SePay, Cloudinary, v.v. nếu cần test tính năng thực tế).

### 4. Khởi chạy cơ sở dữ liệu

Chạy các lệnh sau tại thư mục API để khởi tạo cơ sở dữ liệu và seed dữ liệu mẫu:

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
npx prisma db seed
cd ../..
```

### 5. Khởi chạy dự án

Mở 3 terminal song song để chạy các dự án con (hoặc chạy riêng lẻ):

```bash
# Chạy Backend API (Port 3001)
cd apps/api
npm run dev

# Chạy Storefront Customer (Port 5173)
cd apps/web
npm run dev

# Chạy Admin Dashboard (Port 5174)
cd apps/admin
npm run dev
```

---

## Kết quả đạt được

* **Hiệu suất & Tính năng:** Rút ngắn quy trình xác nhận thanh toán chuyển khoản ngân hàng tự động chỉ trong vài giây. Đồng thời, giải quyết triệt để bài toán đồng bộ tồn kho e-commerce bằng transaction.
* **Bản địa hóa & Trải nghiệm:** Giao diện Lumina Tech hiện đại, hỗ trợ tiếng Việt mượt mà giúp người dùng dễ tiếp cận.
* **Quy mô thử nghiệm:** Đã thử nghiệm thành công toàn bộ luồng mua hàng và xử lý đơn hàng nội bộ tại local với tập dữ liệu seed đa dạng.
* **Nội dung / Trang thông tin pháp lý:** *Note: Các trang tĩnh như Hỗ trợ (`/help`), Vận chuyển (`/shipping`), Đổi trả (`/returns`), Bảo hành (`/warranty`), Chính sách (`/policy`), Điều khoản (`/terms`), Bảo mật (`/privacy`) hiện chỉ là giao diện boilerplate tĩnh cơ bản, chưa có nội dung đầy đủ.*
* **Các tính năng chưa phát triển (TODO / Future Enhancements):** *Note: Dự án chưa phát triển các tính năng nâng cao sau (theo spec tương lai):*
  * Banner slider trang chủ cho admin quản lý.
  * Audit log thật ghi nhận chi tiết thao tác Admin/Staff (chỉ mới bảo toàn dữ liệu bằng soft-delete + isActive).
  * Danh sách yêu thích (Wishlist) & So sánh sản phẩm.
  * Đánh giá sản phẩm kèm hình ảnh.
  * Tìm kiếm nâng cao bằng Elasticsearch / MeiliSearch (hiện đang dùng SQL Server FTS).
  * Cơ chế Token revocation dùng `tokenVersion`.
  * Live chat support & Analytics dashboard nâng cao cho Admin.
  * Hỗ trợ Progressive Web App (PWA).

---

## Thông tin liên hệ

* **Tác giả:** Trình Quốc An
* **Email:** `trinhquocan999@gmail.com`
* **GitHub Project:** [github.com/quocan9999/ApexGear](https://github.com/quocan9999/ApexGear)
* **Facebook:** [Trinh Quoc An](https://facebook.com/perossss)
