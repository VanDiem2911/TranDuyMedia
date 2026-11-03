"use client";

import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import DIMS from "@/data/image-dims.json";

/**
 * next/image + tự chọn bản ảnh ĐỦ NÉT cho khung đang hiển thị.
 *
 * Ảnh `fill` + object-cover đặt trong khung khác tỉ lệ (vd. ảnh ngang trong khung dọc) thực chất bị
 * phóng to để phủ kín — `sizes` khai báo theo bề rộng khung là chưa đủ, trình duyệt tải bản nhỏ rồi
 * kéo giãn → mờ. Sau khi gắn vào trang, đo khung thật + tỉ lệ ảnh gốc (src/data/image-dims.json, hoặc
 * prop `ratio` / width-height của ảnh từ Cloudinary), tính bề rộng ảnh THỰC SỰ hiển thị (gồm cả phóng
 * do object-cover và transform của lớp cha như zoom cắt khung) rồi cập nhật `sizes` → trình duyệt tự
 * chọn bản đủ độ phân giải (nhân thêm mật độ điểm ảnh màn hình). Chỉ tăng, không giảm.
 * Ảnh lazy (mặc định) chỉ tải khi gần màn hình — lúc đó `sizes` đã đúng, không tải 2 lần.
 * Props như next/image; thêm `ratio` (rộng / cao ảnh gốc) khi ảnh không nằm trong public/.
 * Ảnh fill KHÔNG ưu tiên (không preload / eager): chỉ gắn vào trang khi cách màn hình < NEAR — trình duyệt
 * không biết tốc độ mạng (vd. lúc đo PageSpeed) sẽ tải sẵn mọi ảnh lazy trong ~5000px, giành băng thông với
 * phần đầu trang. Ảnh fill nằm trong khung đã có kích thước nên chưa gắn ảnh cũng không xê dịch bố cục.
 * `autoSizes={false}`: giữ nguyên `sizes` khai báo — dùng cho ảnh tải ngay khi mở trang (hero) đã tính sẵn
 * `sizes` chính xác: đổi `sizes` sau khi ảnh đang tải sẽ khiến trình duyệt tải thêm bản khác (tốn băng thông).
 */
const NEAR = "1200px";

/**
 * Ảnh trên Cloudinary: trình duyệt tải THẲNG từ CDN Cloudinary (gần người xem, có sẵn bộ đệm toàn cầu) với
 * đúng bề rộng cần + định dạng tối ưu (AVIF/WebP theo trình duyệt) + chất lượng tự động — thay vì đi vòng qua
 * bộ tối ưu ảnh của máy chủ Next.js (phải tải ảnh gốc về rồi nén lại → chậm lần đầu, tốn tài nguyên máy chủ).
 * Ảnh tĩnh trong /public vẫn dùng bộ tối ưu của Next như cũ.
 */
const CLOUDINARY = /^https:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\//;
export function cloudinaryLoader({ src, width, quality }) {
  const q = quality && quality < 90 ? `q_${quality}` : quality >= 90 ? "q_auto:best" : "q_auto:good";
  // Bỏ biến đổi cũ trong link (vd. so_auto,q_auto) rồi gắn biến đổi theo bề rộng cần hiển thị
  return src.replace(
    /\/upload\/(?:(?:[a-z]{1,3}_[^/,]+,?)+\/)?/,
    `/upload/f_auto,${q},c_limit,w_${width}/`,
  );
}

export const SmartImage = forwardRef(function SmartImage(
  { sizes, ratio, fill, onLoad, alt, autoSizes = true, ...props },
  forwardedRef,
) {
  const ref = useRef(null);
  const [auto, setAuto] = useState(null);
  const natural = useRef(ratio ?? ratioOf(props.src));
  const deferrable = fill && !props.preload && !props.priority && props.loading !== "eager";
  const [near, setNear] = useState(!deferrable);
  const holder = useRef(null);

  useEffect(() => {
    if (near) return;
    const el = holder.current;
    if (!el || typeof IntersectionObserver === "undefined") return setNear(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: `${NEAR} ${NEAR}` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  const setRefs = useCallback(
    (el) => {
      ref.current = el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    },
    [forwardedRef],
  );

  const measure = useCallback(() => {
    const img = ref.current;
    if (!img || !fill || !autoSizes) return;
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    if (!w || !h) return;
    // transform của lớp cha (zoom cắt khung, parallax scale…) → bề rộng hiển thị thật / bề rộng bố cục
    const scale = Math.max(1, img.getBoundingClientRect().width / w);
    const R = natural.current;
    const cover = getComputedStyle(img).objectFit === "cover" && R ? Math.max(1, (h * R) / w) : 1;
    const need = Math.ceil(w * cover * scale);
    setAuto((prev) => (prev && prev >= need ? prev : need));
  }, [fill, autoSizes]);

  useLayoutEffect(() => {
    measure();
    const img = ref.current;
    if (!img || !fill || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(img);
    return () => ro.disconnect();
  }, [measure, fill, near]);

  if (!near) return <span ref={holder} aria-hidden="true" className="absolute inset-0" />;

  return (
    <Image
      ref={setRefs}
      loader={
        typeof props.src === "string" && CLOUDINARY.test(props.src) ? cloudinaryLoader : undefined
      }
      alt={alt}
      fill={fill}
      sizes={auto ? `${auto}px` : sizes}
      onLoad={(e) => {
        const el = e.currentTarget;
        if (!natural.current && el.naturalWidth && el.naturalHeight) {
          natural.current = el.naturalWidth / el.naturalHeight;
          measure();
        }
        onLoad?.(e);
      }}
      {...props}
    />
  );
});

/** Tỉ lệ ảnh gốc (rộng / cao) từ bảng kích thước ảnh tĩnh — null nếu không có. */
export function ratioOf(src) {
  const key = typeof src === "string" ? src.split("?")[0] : null;
  const d = key && DIMS[key];
  return d ? d[0] / d[1] : null;
}
