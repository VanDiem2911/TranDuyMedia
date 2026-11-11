"use client";

import { T } from "@/components/about/edit-kit";
import { FooterView } from "@/components/layout/FooterView";
import { mainNav } from "@/config/site";
import { siteDefaults } from "@/data/site-content";
import { PageEditor } from "./PageEditor";
import { makeLimitOf } from "./limits";

const SEO_PAGES = [
  ["home", "Trang chủ", "/"],
  ["about", "Về chúng tôi", "/gioi-thieu"],
  ["services", "Dịch vụ", "/dich-vu"],
  ["products", "Sản phẩm", "/san-pham"],
];

/** Thanh menu đầu trang (chỉ nhãn chữ; đường dẫn từng mục giữ nguyên). */
function NavPreview({ content, edit }) {
  return (
    <div className="bg-navy-950 px-5 py-6 text-white sm:px-8">
      <p className="mb-3 text-[11px] font-semibold tracking-widest text-white/50 uppercase">
        Menu đầu trang & chân trang
      </p>
      <ul className="flex flex-wrap gap-2">
        {mainNav.map((item, i) => (
          <li
            key={item.href}
            className="rounded-full bg-white/10 px-5 py-2.5 text-[15px] font-semibold tracking-wide"
          >
            <T edit={edit} path={`nav.${i}.label`} value={content.nav[i].label} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Giống kết quả tìm kiếm Google: tiêu đề xanh, địa chỉ, mô tả. */
function SeoPanel({ content, edit }) {
  return (
    <section className="bg-paper px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
        Hiển thị trên Google & khi chia sẻ link
      </p>
      <ul className="mt-4 grid gap-4 lg:grid-cols-2">
        {SEO_PAGES.map(([key, name, href]) => (
          <li key={key} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5">
            <p className="text-xs font-semibold text-ink-muted">
              {name} · <span className="font-normal">{href}</span>
            </p>
            <h3 className="mt-2 text-[1.2rem] leading-snug text-[#1a0dab]">
              <T edit={edit} path={`seo.${key}.title`} value={content.seo[key].title} />
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              <T edit={edit} path={`seo.${key}.description`} value={content.seo[key].description} />
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SiteCanvas({ content, edit }) {
  return (
    <>
      <NavPreview content={content} edit={edit} />
      <FooterView content={content} year={new Date().getFullYear()} edit={edit} />
      <SeoPanel content={content} edit={edit} />
    </>
  );
}

const baseLimit = makeLimitOf({
  phone: 20,
  email: 80,
  address: 120,
  city: 60,
  workingHours: 80,
  facebook: 300,
  youtube: 300,
  tiktok: 300,
  messenger: 300,
  zalo: 300,
});

const config = {
  key: "site",
  title: "Chân trang, menu & SEO",
  viewHref: "/",
  defaults: siteDefaults,
  lists: {},
  // Tiêu đề trên Google ≤ 70 ký tự, mô tả ≤ 200
  limitOf: (path) => (/^seo\./.test(path) ? (path.endsWith("title") ? 70 : 200) : baseLimit(path)),
  uploadFolder: "site/site",
  Canvas: SiteCanvas,
  note: "Số điện thoại, email, địa chỉ ở đây cũng hiện ở thanh đầu trang và nút liên hệ nổi. Địa chỉ và thành phố tự cập nhật bản đồ. Nhãn menu đổi ở khung đầu (đường dẫn từng mục giữ nguyên). Khối “Hiển thị trên Google” là tiêu đề và mô tả của từng trang trên kết quả tìm kiếm và khi chia sẻ link (khuyên: tiêu đề ≤ 70, mô tả ≤ 160 ký tự).",
};

/** Trang quản trị "Chân trang, menu & SEO": sửa trực tiếp trên giao diện (xem PageEditor.jsx). */
export function SiteEditor() {
  return <PageEditor config={config} />;
}
