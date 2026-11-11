// Nội dung CHỈNH ĐƯỢC của chân trang + thông tin liên hệ dùng chung (trang quản trị → "Chân trang & liên hệ", lưu vào DB).
// Số điện thoại, email, địa chỉ, mạng xã hội ở đây hiện ở chân trang, thanh đầu trang và nút liên hệ nổi.
// Đây là nội dung MẶC ĐỊNH (lấy từ config/site.js): chưa chỉnh gì thì website hiển thị đúng như cũ.

import { mainNav, siteConfig } from "@/config/site";

const { contact, socials } = siteConfig;

// Tiêu đề + mô tả hiện trên Google và khi chia sẻ link (giá trị mặc định = đang dùng trong code các trang)
export const siteDefaults = {
  // Nhãn menu đầu trang / chân trang (đường dẫn của từng mục giữ nguyên, theo thứ tự config/site.js → mainNav)
  nav: mainNav.map(({ label }) => ({ label })),
  seo: {
    home: { title: `${siteConfig.name} | ${siteConfig.tagline}`, description: siteConfig.description },
    about: {
      title: "Về chúng tôi",
      description:
        "Trần Duy Media – đối tác gia công video, hình ảnh toàn diện cho doanh nghiệp với hơn 10 năm kinh nghiệm thực chiến: video short, iTVC, phim doanh nghiệp & sự kiện, chụp ảnh quảng cáo và cho thuê studio tại TP.HCM.",
    },
    services: {
      title: "Dịch vụ sản xuất video & hình ảnh",
      description:
        "Sản xuất video short marketing, iTVC & viral, phim doanh nghiệp & sự kiện, chụp ảnh quảng cáo và cho thuê studio (Room 24m² & 150m²) — một ekip, trọn gói.",
    },
    products: {
      title: "Sản phẩm đã thực hiện",
      description:
        "Các dự án video marketing, chụp ảnh thương mại, chụp ảnh sự kiện do Trần Duy Media Studio thực hiện — từ ý tưởng, sản xuất đến hậu kỳ.",
    },
  },
  footer: {
    ctaLead: "Bắt đầu dự án",
    ctaAccent: "tiếp theo",
    ctaTail: "cùng chúng tôi.",
    bookingLabel: "Đặt lịch tư vấn",
    emailPrefix: "Hoặc gửi email:",
    description: siteConfig.footerText,
  },
  contact: {
    phone: contact.phone,
    email: contact.email,
    address: contact.address,
    city: contact.city,
    workingHours: contact.workingHours,
  },
  socials: {
    facebook: socials.facebook,
    youtube: socials.youtube,
    tiktok: socials.tiktok,
    messenger: socials.messenger,
    zalo: socials.zalo,
  },
};

/** Từ nội dung chỉnh được → dạng website dùng (thêm các liên kết tự suy ra từ số điện thoại, địa chỉ). */
export function siteView(content) {
  const c = content.contact;
  const digits = c.phone.replace(/\D/g, "");
  const mapsQuery = `${c.address}, ${c.city}`;
  return {
    contact: {
      ...c,
      phoneRaw: digits,
      phoneHref: `tel:+84${digits.replace(/^0/, "")}`,
      mapsQuery,
      mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`,
    },
    socials: content.socials,
    nav: content.nav.map((n) => n.label),
  };
}
