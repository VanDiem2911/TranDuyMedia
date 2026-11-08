# Tran Duy Media Studio

Website giới thiệu dịch vụ của Tran Duy Media Studio — sản xuất video thương mại, cho thuê bối cảnh
studio, chụp ảnh thương mại. Repo gồm 2 ứng dụng độc lập:

| Thư mục      | Ứng dụng                                                                   | Cổng mặc định |
| ------------ | -------------------------------------------------------------------------- | ------------- |
| [`fe/`](fe/) | Frontend — Next.js 16 + TailwindCSS 4                                      | `3000`        |
| [`be/`](be/) | Backend API — ExpressJS 5 (routes → controllers → services → repositories) | `4000`        |
| `docs/`      | Tài liệu yêu cầu dự án                                                     |               |

## Bắt đầu

```bash
npm run install:all      # cài dependencies cho cả fe và be

# chạy song song ở 2 terminal
npm run dev:fe           # http://localhost:3000
npm run dev:be           # http://localhost:4000/api/v1/health
```

Hoặc vào từng thư mục và dùng script riêng — xem [fe/README.md](fe/README.md) và [be/README.md](be/README.md).

Mỗi app có `.env.example` riêng: copy thành `fe/.env.local` và `be/.env`.

### Đăng nhập quản trị

1. Điền `ADMIN_ID`, `ADMIN_PASSWORD` (≥ 12 ký tự) và 2 secret JWT (`npm run secret --prefix be`) vào `be/.env`
2. Mở http://localhost:3000/login → vào `/admin`

Frontend gọi API qua `/api/v1/*` cùng tên miền, Next.js chuyển tiếp sang `BACKEND_URL`
(địa chỉ này được chốt lúc build — đặt `BACKEND_URL` trước `npm run build` khi deploy).

## Deploy: frontend lên Cloudflare, backend lên Render

Cloudflare chỉ chạy **frontend** (`fe/`) bằng Workers + OpenNext (Pages không còn được khuyến nghị cho Next.js). Backend (`be/`) chạy riêng trên Render.

**1. Backend (Render):** đặt `CORS_ORIGINS` = địa chỉ website Cloudflare, cùng các biến trong `be/.env.example`.

**2. Frontend (Cloudflare → Workers & Pages → Create → Import a repository):**

- Root directory: `fe`
- Build command: `npm run build:cf` · Deploy command: `npm run deploy:cf`
- Biến môi trường (đặt ở **cả** Build variables và Variables/Secrets của Worker):
  `BACKEND_URL` = địa chỉ backend Render (vd. `https://xxx.onrender.com`), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
  `BACKEND_URL` được chốt lúc build, nên đổi thì phải build lại.
- R2 bucket, D1 database và Durable Object (cache để lưu xong là website đổi ngay) được tạo tự động khi deploy lần đầu, khai báo trong `fe/wrangler.jsonc`.

**3. Sau lần deploy đầu:** vào `/admin/about`, sửa một chữ, Lưu, rồi mở `/gioi-thieu` để kiểm tra website đổi ngay.

Chạy thử cục bộ: `npm run preview --prefix fe` (cần `fe/.dev.vars` có `NEXTJS_ENV=development` và `BACKEND_URL`).

Lưu ý: tệp tĩnh tối đa 25 MiB (video showreel 1080p đã nén để vừa giới hạn này).
