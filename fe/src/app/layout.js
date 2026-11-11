import { Be_Vietnam_Pro } from "next/font/google";
import { INTRO_SKIP_SCRIPT } from "@/components/fx/intro-skip";
import { Toaster } from "@/components/ui/Toaster";
import { UploadResumer } from "@/components/admin/products/UploadResumer";
import { siteConfig } from "@/config/site";
import { siteView } from "@/data/site-content";
import { getSiteContent } from "@/lib/site";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  // Chỉ các độ đậm thực sự dùng (400–700) → bớt 2 tệp font phải tải
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: { telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: siteConfig.themeColor,
  colorScheme: "light",
};

// Dữ liệu có cấu trúc cho Google (LocalBusiness)
const buildJsonLd = ({ contact, socials }) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  telephone: "+84" + contact.phoneRaw.replace(/^0/, ""),
  email: contact.email,
  image: `${siteConfig.url}/images/og-image.png`,
  logo: `${siteConfig.url}/images/brand/logo.webp`,
  address: {
    "@type": "PostalAddress",
    streetAddress: contact.address,
    addressLocality: "Nhà Bè",
    addressRegion: contact.city,
    addressCountry: "VN",
  },
  hasMap: contact.mapsLink,
  sameAs: [socials.facebook, socials.youtube, socials.tiktok],
  priceRange: "$$",
});

export default async function RootLayout({ children }) {
  // Liên hệ chỉnh ở trang quản trị (DB) — cache theo thẻ
  const jsonLd = buildJsonLd(siteView(await getSiteContent()));
  return (
    // suppressHydrationWarning: màn chào (IntroSplash) gắn data-intro lên <html> trước khi React hydrate
    <html lang={siteConfig.lang} className={sans.variable} suppressHydrationWarning>
      <head>
        {/* Mở sẵn kết nối tới CDN ảnh / video (Cloudinary) → ảnh sản phẩm hiện nhanh hơn */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Bỏ qua màn chào khi đi từ chính website sang — script thường trong <head> của layout gốc (render ở máy chủ,
            không render lại phía trình duyệt) → chạy ngay khi đọc tới, trước khung hình đầu */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SKIP_SCRIPT }} />
      </head>
      <body>
        {/* Khung website công khai (header, footer, cuộn mượt…) nằm ở app/(site)/layout.js;
            trang đăng nhập, quản trị và trang lỗi dùng bố cục riêng. */}
        {children}
        {/* Toast dùng chung cho toàn site (website, đăng nhập, quản trị) — luôn nằm trên cùng */}
        <Toaster />
        {/* Tự tải tiếp việc lưu sản phẩm bị gián đoạn khi tải lại trang (chỉ trình duyệt quản trị viên có việc dở) */}
        <UploadResumer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
