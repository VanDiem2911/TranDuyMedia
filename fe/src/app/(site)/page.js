import {
  BehindScenes,
  Hero,
  Intro,
  Partners,
  Process,
  Showreel,
  VideoFocus,
} from "@/components/sections";
import { getHome } from "@/lib/home";
import { createMetadata } from "@/lib/metadata";
import { getSiteContent } from "@/lib/site";

// Tiêu đề + mô tả hiện trên Google / khi chia sẻ link: chỉnh ở trang quản trị (Chân trang, menu & SEO)
export async function generateMetadata() {
  const { seo } = await getSiteContent();
  const base = createMetadata({ description: seo.home.description, path: "/" });
  return {
    ...base,
    title: { absolute: seo.home.title },
    openGraph: { ...base.openGraph, title: seo.home.title },
    twitter: { ...base.twitter, title: seo.home.title },
  };
}

// Thứ tự theo feedback 02/11: khối "Đối tác tiêu biểu" chuyển xuống cuối (ngay trên "Bắt đầu dự án…"),
// khối cảm nhận khách hàng thay bằng ảnh hậu trường sản xuất cuộn ngang (#hau-truong).
// Nội dung chỉnh ở trang quản trị (DB) — cache theo thẻ, lưu xong là cập nhật ngay; lỗi → nội dung mặc định.
export default async function HomePage() {
  const c = await getHome();
  return (
    <>
      <Hero content={c.hero} />
      <Showreel
        eyebrow={c.showreel.eyebrow}
        title={c.showreel.title}
        description={c.showreel.description}
      />
      <Intro content={c.intro} />
      <VideoFocus content={c.focus} />
      <Process content={c.process} />
      <BehindScenes content={c.bts} />
      <Partners content={c.partners} />
    </>
  );
}
