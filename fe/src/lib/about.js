import { cacheLife, cacheTag } from "next/cache";
import { ABOUT_TAG, aboutDefaults, mergeAbout } from "@/data/about-content";

/**
 * Nội dung trang "Về chúng tôi" — lấy từ backend (MongoDB), chỉ dùng phía server.
 * Cùng cơ chế với sản phẩm (lib/products.js): kết quả cache theo tag "about"; trang quản trị gọi /api/revalidate
 * ngay sau khi lưu → khách thấy nội dung mới ngay, còn lại luôn phục vụ từ bộ nhớ đệm nên rất nhanh.
 * Backend lỗi / chưa có dữ liệu → dùng nội dung mặc định, không làm sập trang.
 */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

// LỖI KẾT NỐI không được cache: hàm "use cache" ném lỗi ra ngoài (Next không lưu kết quả lỗi), hàm bọc bên
// ngoài mới xử lý → backend chập chờn vài giây không làm trang hiện nội dung mặc định suốt nhiều phút.
async function cachedAbout() {
  "use cache";
  cacheTag(ABOUT_TAG);
  cacheLife("hours");
  const res = await fetch(`${BACKEND_URL}/api/v1/content/about`, {
    headers: { accept: "application/json" },
    cache: "no-store", // bộ nhớ đệm do "use cache" + cacheTag quản lý, không để fetch-cache lưu thêm một lớp
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  return mergeAbout(aboutDefaults, (await res.json()).data?.data);
}

export async function getAbout() {
  try {
    return await cachedAbout();
  } catch {
    return aboutDefaults;
  }
}
