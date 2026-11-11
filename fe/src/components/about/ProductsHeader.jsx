import { BannerTools } from "@/components/admin/about/inline-edit";
import { T } from "@/components/about/edit-kit";
import { PageHeader } from "@/components/sections";

/**
 * Đầu trang Sản phẩm: tiêu đề cố định "Sản phẩm", dòng nhỏ + mô tả + ảnh nền (18 ảnh trôi) sửa được.
 * Dùng chung cho trang công khai /san-pham và trang quản trị (truyền `edit`).
 */
export function ProductsHeader({ header, edit }) {
  const banner = (
    <PageHeader
      title="Sản phẩm"
      eyebrow={<T edit={edit} path="header.eyebrow" value={header.eyebrow} />}
      description={<T edit={edit} path="header.description" value={header.description} />}
      columns={header.columns}
    />
  );
  if (!edit) return banner;
  return (
    <div className="relative">
      {banner}
      <BannerTools edit={edit} columns={header.columns} videoEnabled={false} />
    </div>
  );
}
