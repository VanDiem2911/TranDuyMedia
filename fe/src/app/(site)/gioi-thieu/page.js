import {
  AboutHeader,
  AboutValues,
  CoreValues,
  Ecosystem,
  Profile,
  Standards,
} from "@/components/about/AboutSections";
import { Partners, Showreel } from "@/components/sections";
import { getAbout } from "@/lib/about";
import { getHome } from "@/lib/home";
import { createMetadata } from "@/lib/metadata";
import { getSiteContent } from "@/lib/site";

// Tiêu đề + mô tả hiện trên Google / khi chia sẻ link: chỉnh ở trang quản trị (Chân trang, menu & SEO)
export async function generateMetadata() {
  const { seo } = await getSiteContent();
  return createMetadata({
    title: seo.about.title,
    description: seo.about.description,
    path: "/gioi-thieu",
    image: "/images/bts/bts-05.webp",
  });
}

/**
 * Trang Về chúng tôi — bố cục liền mạch, cô đọng (feedback 02/11), nền sáng/tối xen kẽ:
 * câu chuyện → giá trị cốt lõi (tầm nhìn · sứ mệnh) → chuẩn mực sản xuất → hệ sinh thái dịch vụ (cuộn ngang)
 * → vì sao khách hàng chọn Trần Duy Media → showreel → đối tác (ngay trên "Bắt đầu dự án…" của chân trang).
 */
export default async function AboutPage() {
  // Nội dung chỉnh ở trang quản trị (DB) — cache theo thẻ, lưu xong là cập nhật ngay; lỗi → nội dung mặc định
  const [c, home] = await Promise.all([getAbout(), getHome()]);
  return (
    <>
      <AboutHeader header={c.header} />
      <Profile story={c.story} />
      <CoreValues core={c.core} />
      <Standards standards={c.standards} />
      <Ecosystem ecosystem={c.ecosystem} />
      <AboutValues values={c.values} />
      <Showreel
        id="showreel-gioi-thieu"
        eyebrow={home.showreel.eyebrow}
        title={home.showreel.title}
        description={home.showreel.description}
      />
      <Partners content={home.partners} />
    </>
  );
}
