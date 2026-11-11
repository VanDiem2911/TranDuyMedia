import { revalidateTag } from "next/cache";
import { PAGE_TAGS } from "@/data/page-registry";
import { PRODUCTS_TAG } from "@/lib/products";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const ALLOWED = new Set([PRODUCTS_TAG, ...PAGE_TAGS]);

/**
 * Làm mới dữ liệu website ngay sau khi quản trị viên thay đổi nội dung.
 * Chỉ admin đang đăng nhập (kiểm tra qua backend bằng cookie của request) mới gọi được.
 */
export async function POST(request) {
  if (request.headers.get("x-requested-with") !== "fetch") {
    return Response.json({ success: false }, { status: 403 });
  }
  const me = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!me?.ok) return Response.json({ success: false }, { status: 401 });

  const { tag } = await request.json().catch(() => ({}));
  if (!ALLOWED.has(tag)) return Response.json({ success: false }, { status: 400 });
  revalidateTag(tag, { expire: 0 });
  return Response.json({ success: true });
}
