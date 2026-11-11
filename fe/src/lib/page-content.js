import { cacheLife, cacheTag } from "next/cache";
import { mergeContent } from "@/data/content-merge";
import { PAGE_DEFAULTS, pageTag } from "@/data/page-registry";

/**
 * Nội dung một trang (about, home, services, site, products) — lấy từ backend (MongoDB), chỉ dùng phía server.
 * Cùng cơ chế với sản phẩm (lib/products.js): kết quả cache theo thẻ của trang; trang quản trị gọi /api/revalidate
 * ngay sau khi lưu → khách thấy nội dung mới ngay, còn lại luôn phục vụ từ bộ nhớ đệm nên rất nhanh.
 * Backend lỗi / chưa có dữ liệu → dùng nội dung mặc định, không làm sập trang.
 */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

// Lỗi kết nối (backend đang ngủ / chưa chạy lúc build…) KHÔNG được làm hỏng bản build: ném lỗi ra ngoài hàm
// "use cache" sẽ làm Next dừng cả quá trình build. Nên bắt lỗi ngay trong hàm, trả nội dung mặc định và chỉ cache
// rất ngắn (1 phút) để trang tự lấy lại nội dung thật khi backend sẵn sàng; thành công thì cache dài như thường.
async function cachedPage(key) {
  "use cache";
  cacheTag(pageTag(key));
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/content/${key}`, {
      headers: { accept: "application/json" },
      cache: "no-store", // bộ nhớ đệm do "use cache" + cacheTag quản lý, không để fetch-cache lưu thêm một lớp
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const merged = mergeContent(PAGE_DEFAULTS[key], (await res.json()).data?.data);
    cacheLife("hours");
    return merged;
  } catch {
    cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
    return PAGE_DEFAULTS[key];
  }
}

export const getPageContent = cachedPage;
