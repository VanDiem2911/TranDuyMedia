import { EditableText } from "@/components/admin/about/inline-edit";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import { cdn } from "@/lib/cdn";
import { cn } from "@/lib/utils";

/**
 * Bộ dụng cụ nhỏ dùng chung cho các khối có thể sửa trực tiếp (trang Về chúng tôi).
 * Không truyền `edit` → hiển thị đúng như bản thiết kế trên website, không thêm thẻ nào.
 */

/** Chữ có thể sửa: bình thường chỉ là chữ thuần (không thêm thẻ nào), ở chế độ sửa là ô gõ trực tiếp. */
export function T({ edit, path, value }) {
  return edit ? <EditableText edit={edit} path={path} /> : value;
}

/** Giữ 2 từ cuối của tiêu đề dính liền nhau (không để 1 từ lẻ rơi xuống dòng riêng) — như bản thiết kế gốc. */
export function NoOrphan({ text }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 3) return <span className="whitespace-nowrap">{text}</span>;
  return (
    <>
      {words.slice(0, -2).join(" ")}{" "}
      <span className="whitespace-nowrap">{words.slice(-2).join(" ")}</span>
    </>
  );
}

export function Title({ edit, path, value }) {
  return edit ? <EditableText edit={edit} path={path} /> : <NoOrphan text={value} />;
}

/**
 * Ảnh phủ kín khung cha. Trang công khai dùng next/image (tối ưu + tải nhanh);
 * trang quản trị dùng <img> thường vì ảnh vừa chọn từ máy (blob:) chưa có địa chỉ để next/image xử lý.
 */
export function Pic({ edit, src, alt, pos, sizes, className, ...rest }) {
  if (edit) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- xem trước trong trang quản trị
      <img
        src={cdn(src, 1200)}
        alt={alt}
        draggable={false}
        className={cn("absolute inset-0 size-full", className)}
        style={{ objectPosition: pos }}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      style={{ objectPosition: pos }}
      {...rest}
    />
  );
}
