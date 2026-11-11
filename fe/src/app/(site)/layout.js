import { BookingModal, VideoModal } from "@/components/booking";
import { ShowreelProvider } from "@/components/booking/ShowreelProvider";
import { SiteProvider } from "@/components/layout/SiteProvider";
import { IntroSplash, PageTransition, Reveal, ScrollTop, SmoothScroll } from "@/components/fx";
import { FloatingContact, Footer, Header } from "@/components/layout";
import { showreelMedia } from "@/data/home-content";
import { siteView } from "@/data/site-content";
import { getHome } from "@/lib/home";
import { getSiteContent } from "@/lib/site";

/** Khung chung của website công khai: header, footer, cuộn mượt, màn chào, popup đặt lịch / video. */
export default async function SiteLayout({ children }) {
  // Chân trang + liên hệ chỉnh ở trang quản trị (DB) — cache theo thẻ, lưu xong là cập nhật ngay
  const [site, home] = await Promise.all([getSiteContent(), getHome()]);
  const view = siteView(site);
  return (
    <SiteProvider value={view}>
      <ShowreelProvider value={showreelMedia(home.showreel)}>
        <a
          href="#main"
          className="sr-only z-100 rounded-lg bg-orange-500 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Bỏ qua đến nội dung chính
        </a>
        <SmoothScroll />
        {/* Màn chào thương hiệu: chỉ khi tải trang đầy đủ (lần đầu / F5), không hiện khi chuyển trang.
          Đặt SAU SmoothScroll để Lenis đã được tạo khi màn chào khoá cuộn. */}
        <IntroSplash />
        <PageTransition />
        <Reveal />
        <Header site={view} />
        <main id="main">{children}</main>
        <Footer content={site} />
        <FloatingContact site={view} />
        <ScrollTop />
        <BookingModal />
        <VideoModal />
      </ShowreelProvider>
    </SiteProvider>
  );
}
