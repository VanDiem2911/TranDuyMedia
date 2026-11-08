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
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Về chúng tôi",
  description:
    "Trần Duy Media – đối tác gia công video, hình ảnh toàn diện cho doanh nghiệp với hơn 10 năm kinh nghiệm thực chiến: video short, iTVC, phim doanh nghiệp & sự kiện, chụp ảnh quảng cáo và cho thuê studio tại TP.HCM.",
  path: "/gioi-thieu",
  image: "/images/bts/bts-05.webp",
});

/**
 * Trang Về chúng tôi — bố cục liền mạch, cô đọng (feedback 02/11), nền sáng/tối xen kẽ:
 * câu chuyện → giá trị cốt lõi (tầm nhìn · sứ mệnh) → chuẩn mực sản xuất → hệ sinh thái dịch vụ (cuộn ngang)
 * → vì sao khách hàng chọn Trần Duy Media → showreel → đối tác (ngay trên "Bắt đầu dự án…" của chân trang).
 */
export default async function AboutPage() {
  // Nội dung chỉnh ở trang quản trị (DB) — cache theo thẻ, lưu xong là cập nhật ngay; lỗi → nội dung mặc định
  const c = await getAbout();
  return (
    <>
      <AboutHeader header={c.header} />
      <Profile story={c.story} />
      <CoreValues core={c.core} />
      <Standards standards={c.standards} />
      <Ecosystem ecosystem={c.ecosystem} />
      <AboutValues values={c.values} />
      <Showreel id="showreel-gioi-thieu" />
      <Partners />
    </>
  );
}
