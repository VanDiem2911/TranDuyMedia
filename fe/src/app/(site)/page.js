import {
  BehindScenes,
  Hero,
  Intro,
  Partners,
  Process,
  Showreel,
  VideoFocus,
} from "@/components/sections";

// Thứ tự theo feedback 02/11: khối "Đối tác tiêu biểu" chuyển xuống cuối (ngay trên "Bắt đầu dự án…"),
// khối cảm nhận khách hàng thay bằng ảnh hậu trường sản xuất cuộn ngang (#hau-truong).
export default function HomePage() {
  return (
    <>
      <Hero />
      <Showreel />
      <Intro />
      <VideoFocus />
      <Process />
      <BehindScenes />
      <Partners />
    </>
  );
}
