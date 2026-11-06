// Cấu hình OpenNext cho Cloudflare Workers (website Next.js chạy trên Cloudflare).
// Tài liệu: https://opennext.js.org/cloudflare/caching
//
// Website dùng cache theo thẻ ("use cache" + cacheTag) và trang quản trị gọi revalidateTag() ngay sau khi lưu
// → cần đủ 3 phần để "lưu xong là website đổi ngay":
//  • incrementalCache (R2)  : nơi lưu kết quả đã cache (trang, dữ liệu sản phẩm, nội dung trang Về chúng tôi…)
//  • tagCache (D1)          : ghi nhớ thẻ nào vừa bị làm mới (revalidateTag) → lần tải kế tiếp lấy dữ liệu mới
//  • queue (Durable Object) : xếp hàng việc làm mới lại trang ở nền
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: doQueue,
});
