# ApexGear — Project Instructions

Monorepo (npm workspaces): `apps/api` (NestJS + Prisma + SQL Server), `apps/web` (Vite + React 18 + TS + Tailwind v4 + Zustand + react-i18next).

## Frontend design workflow (BẮT BUỘC)

Khi làm **frontend UI mới hoặc redesign đáng kể**, PHẢI đi theo 3 bước sau — không tự chế UI từ đầu:

**Bước 1 — Chốt hướng thiết kế.** Invoke skill `design-taste-frontend` (taste-skill). Đọc brief, suy ra design direction, audit-first nếu là redesign. Không bỏ qua bước này.

**Bước 2 — Thiết kế bằng Stitch MCP.** Dùng Stitch MCP trên project có sẵn:
- URL: https://stitch.withgoogle.com/projects/2845269665937327341
- `projectId` (không kèm prefix `projects/`): `2845269665937327341`
- Design system trong Stitch đã là **Lumina Tech** — trùng với `DESIGN.md` ở root repo. Khi generate/edit screen PHẢI truyền `designSystem` của Lumina Tech (lấy qua `get_project` / `list_design_systems`) để không lệch token.
- Tool thường dùng: `mcp__stitch__get_project`, `mcp__stitch__generate_screen_from_text`, `mcp__stitch__edit_screens`, `mcp__stitch__get_screen`.
- **Artifact bàn giao:** Stitch trả về **screen ID + HTML/CSS render + ảnh preview**. Lấy HTML/ảnh đó (qua `get_screen`) làm nguồn tham chiếu cho bước 3.

**Bước 3 — Kéo output về implement.** Dịch HTML/thiết kế Stitch sang code repo thật:
- React + TypeScript, component theo convention có sẵn trong `apps/web/src/components`.
- Tailwind v4 (`@theme` trong `apps/web/src/app.css`) — dùng **design token của `DESIGN.md` / Lumina Tech**, KHÔNG hardcode màu/spacing.
- Mọi chuỗi user-facing qua `t()` (react-i18next), chỉ locale `vi` (`apps/web/src/i18n/vi.json`).
- Không copy nguyên HTML Stitch — implement lại đúng pattern React + token của repo.

### Ngoại lệ — KHÔNG cần Stitch
Bỏ qua bước 1–2, code trực tiếp khi thay đổi nhỏ / không tạo layout-UI mới:
- Sửa bug, đổi text/i18n, tinh chỉnh vài dòng CSS/spacing/màu.
- Thêm/sửa logic, state, service, type không đụng giao diện.
- Tweak component đã có mà không đổi cấu trúc thị giác.
- Refactor không đổi diện mạo.

Nghi ngờ "đủ lớn để cần Stitch không" → hỏi user trước khi gọi Stitch.

## Ràng buộc kỹ thuật frontend (luôn giữ)
- Design tokens: `DESIGN.md` (Lumina Tech) — primary `#0058be`, surface `#f8f9ff`, on-surface `#121c2a`, font Inter.
- Tailwind v4 via `@tailwindcss/vite`; token khai báo trong `apps/web/src/app.css` `@theme`.
- i18n: chỉ `vi`, không hardcode tiếng Việt trong JSX.
- Auth: httpOnly cookie, Axios `withCredentials: true`. API proxy `/api` → `http://localhost:3001`.
