import { Journey, Packages, ServiceList, ServicesHero } from "@/components/services";
import { Faq } from "@/components/sections";
import { createMetadata } from "@/lib/metadata";
import { getSiteContent } from "@/lib/site";
import { getServicesPage } from "@/lib/services";

// Tiêu đề + mô tả hiện trên Google / khi chia sẻ link: chỉnh ở trang quản trị (Chân trang, menu & SEO)
export async function generateMetadata() {
  const { seo } = await getSiteContent();
  return createMetadata({
    title: seo.services.title,
    description: seo.services.description,
    path: "/dich-vu",
    image: "/images/bts/bts-02.webp",
  });
}

/**
 * Trang tổng hợp dịch vụ (bố cục theo trang Dịch vụ của ButStudio):
 * Hero (chữ + 3 ảnh so le) → Hành trình các bước (nền tối, cột ảnh nở rộng) → 5 dịch vụ zig-zag
 * (dẫn tới trang con /dich-vu/[slug]) → Gói gợi ý → FAQ. CTA cuối trang nằm ở footer.
 * Nội dung chỉnh ở trang quản trị (DB) — cache theo thẻ, lưu xong là cập nhật ngay; lỗi → nội dung mặc định.
 */
export default async function ServicesPage() {
  const c = await getServicesPage();
  return (
    <>
      <ServicesHero content={c.hero} />
      <Journey content={c.journey} />
      <ServiceList content={c.list} />
      <Packages content={c.packages} />
      <Faq content={c.faq} />
    </>
  );
}
