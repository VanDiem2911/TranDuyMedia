import { SmartImage as Image } from "@/components/ui/SmartImage";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Container, Logo } from "@/components/ui";
import { T } from "@/components/about/edit-kit";
import { FooterMap } from "./FooterMap";
import { mainNav, siteConfig } from "@/config/site";
import { services } from "@/data/services";
import { siteDefaults, siteView } from "@/data/site-content";

/**
 * Chân trang dạng trình bày thuần. content: nội dung chỉnh được từ trang quản trị (mặc định = siteDefaults);
 * year: năm bản quyền (website truyền thành phần có cache, trang quản trị truyền số); edit: chế độ sửa trực tiếp.
 */
export function FooterView({ content = siteDefaults, year, edit }) {
  const { contact, socials, nav } = siteView(content);
  const socialLinks = [
    ["facebook", socials.facebook],
    ["youtube", socials.youtube],
    ["tiktok", socials.tiktok],
  ];

  return (
    <footer className="relative bg-navy-950 text-white/60" data-nav-theme="dark">
      {/* Dải CTA lớn trên nền ảnh ghép các bối cảnh studio (public/images/cta-collage.webp — npm run assets) */}
      <div id="lien-he" className="relative isolate overflow-hidden border-b border-white/10">
        <Image
          src="/images/cta-collage.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover"
        />
        {/* Phủ tối: đậm bên trái (chữ), nhạt dần sang phải để ảnh còn thấy rõ */}
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-navy-950 via-navy-950/85 to-navy-950/55" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-navy-950/70 via-transparent to-navy-950/70" />
        <Container className="py-20 sm:py-24">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-16">
            {/* "tiếp theo" luôn đi liền nhau; từ sm ngắt dòng có chủ đích sau "tiếp theo" */}
            <h2 className="text-[2.2rem] h-display text-white text-legible sm:text-5xl lg:text-6xl">
              <T edit={edit} path="footer.ctaLead" value={content.footer.ctaLead} />{" "}
              <span className="whitespace-nowrap text-orange-500">
                <T edit={edit} path="footer.ctaAccent" value={content.footer.ctaAccent} />
              </span>
              <br className="max-sm:hidden" />{" "}
              <T edit={edit} path="footer.ctaTail" value={content.footer.ctaTail} />
            </h2>
            {/* Liên hệ (feedback 02/11): 2 nút cùng chiều cao trên 1 hàng — đặt lịch (cam, nổi bật) + hotline
                (viền sáng) — email là dòng chữ nhẹ bên dưới → rõ thứ bậc, gọn, không nặng như 3 khối xếp chồng */}
            {/* Điện thoại: 2 nút trải ngang & thẳng mép trái với tiêu đề; máy tính: cụm co gọn, canh giữa nhau */}
            <div className="flex w-full flex-col gap-5 sm:w-fit sm:items-center lg:justify-self-end">
              <div className="grid gap-3 sm:flex sm:flex-wrap sm:justify-center">
                <button
                  type="button"
                  data-booking
                  // Điện thoại: chữ + mũi tên canh giữa (cùng kiểu nút số điện thoại bên dưới → 2 nút cân nhau);
                  // máy tính: giữ vòng tròn mũi tên trắng sát mép phải
                  className="group inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-orange-500 px-6 text-[15px] font-semibold text-white shadow-[0_14px_32px_-16px_rgba(248,104,8,0.8)] transition hover:bg-orange-600 sm:gap-3 sm:pr-1.5"
                >
                  <Icon name="calendar" className="size-[18px] sm:hidden" />
                  <T edit={edit} path="footer.bookingLabel" value={content.footer.bookingLabel} />
                  <Icon
                    name="arrowRight"
                    className="size-[18px] transition-transform group-hover:translate-x-0.5 sm:hidden"
                  />
                  <span className="btn-circle hidden size-10 items-center justify-center rounded-full bg-white text-orange-600 transition-transform group-hover:translate-x-0.5 sm:flex">
                    <Icon name="arrowRight" className="size-[18px]" />
                  </span>
                </button>
                <a
                  href={contact.phoneHref}
                  className="inline-flex h-13 items-center justify-center gap-2.5 rounded-full border border-white/30 bg-white/5 px-6 text-[15px] font-semibold tracking-wide text-white backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-navy-900"
                >
                  <Icon name="phone" className="size-[18px] text-orange-500" />
                  <T edit={edit} path="contact.phone" value={contact.phone} />
                </a>
              </div>
              <a
                href={`mailto:${contact.email}`}
                className="group inline-flex items-center gap-2.5 text-sm text-white/70 transition-colors hover:text-white"
              >
                <Icon name="mail" className="size-4 text-orange-500" />
                <span>
                  <T edit={edit} path="footer.emailPrefix" value={content.footer.emailPrefix} />{" "}
                  <span className="font-medium text-white/90 transition-colors group-hover:text-orange-400">
                    <T edit={edit} path="contact.email" value={contact.email} />
                  </span>
                </span>
              </a>
            </div>
          </div>
        </Container>
      </div>

      {/* Desktop: 4 cột rộng theo nội dung, dàn đều (justify-between) → mép trái/phải thẳng hàng với khung
          nội dung các section phía trên, 3 khe giữa các cột bằng nhau */}
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:flex lg:justify-between lg:gap-10">
        <div className="lg:w-[300px] xl:w-[320px]">
          {/* Logo là đường về trang chủ (menu không có mục "Trang chủ") */}
          <Link href="/" aria-label={`${siteConfig.name} – Trang chủ`} className="inline-block">
            <Logo light className="h-16" />
          </Link>
          <p className="mt-5 max-w-sm text-left text-sm leading-relaxed">
            <T edit={edit} path="footer.description" value={content.footer.description} />
          </p>
          <ul className="mt-6 flex gap-3">
            {socialLinks.map(([name, href]) => (
              <li key={name}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="flex size-10 items-center justify-center rounded-full bg-white/5 text-white/80 transition-colors hover:bg-orange-500 hover:text-white"
                >
                  <Icon name={name} className="size-[18px]" />
                </a>
              </li>
            ))}
          </ul>
          {edit && (
            // Trang quản trị: địa chỉ các mạng xã hội (biểu tượng ở trên bấm vào sẽ mở các địa chỉ này)
            <dl className="mt-4 space-y-1.5 text-[12px] text-white/70">
              {["facebook", "youtube", "tiktok", "messenger", "zalo"].map((k) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-16 shrink-0 font-semibold text-white/90 capitalize">{k}</dt>
                  <dd className="min-w-0 break-all">
                    <T edit={edit} path={`socials.${k}`} value={socials[k]} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <FooterColumn title="Dịch vụ">
          {services.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/dich-vu/${s.slug}`}
                className="inline-block py-1 transition-colors hover:text-white lg:py-0"
              >
                {s.title}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/san-pham"
              className="inline-block py-1 transition-colors hover:text-white lg:py-0"
            >
              Sản phẩm đã thực hiện
            </Link>
          </li>
        </FooterColumn>

        {/* Bản đồ (thay cột Studio) */}
        <div className="lg:w-[340px] xl:w-[380px]">
          <h3 className="text-[11px] font-semibold tracking-eyebrow text-white uppercase">
            Bản đồ
          </h3>
          <div className="mt-5">
            <FooterMap contact={contact} />
          </div>
        </div>

        <FooterColumn title="Liên hệ">
          <li className="flex gap-3">
            <Icon name="mapPin" className="size-5 shrink-0 text-orange-500" />
            <a
              href={contact.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              <T edit={edit} path="contact.address" value={contact.address} />,{" "}
              <T edit={edit} path="contact.city" value={contact.city} />
            </a>
          </li>
          <li className="flex gap-3">
            <Icon name="phone" className="size-5 shrink-0 text-orange-500" />
            <a href={contact.phoneHref} className="inline-block py-0.5 hover:text-white lg:py-0">
              <T edit={edit} path="contact.phone" value={contact.phone} />
            </a>
          </li>
          <li className="flex gap-3">
            <Icon name="mail" className="size-5 shrink-0 text-orange-500" />
            <a
              href={`mailto:${contact.email}`}
              className="inline-block py-0.5 hover:text-white lg:py-0"
            >
              <T edit={edit} path="contact.email" value={contact.email} />
            </a>
          </li>
          <li className="flex gap-3">
            <Icon name="clock" className="size-5 shrink-0 text-orange-500" />
            <T edit={edit} path="contact.workingHours" value={contact.workingHours} />
          </li>
        </FooterColumn>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-xs sm:flex-row">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap justify-center gap-x-3.5 gap-y-1 sm:gap-x-5">
            {mainNav.map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block py-1 transition-colors hover:text-white lg:py-0"
                >
                  <T edit={edit} path={`nav.${i}.label`} value={nav[i] ?? item.label} />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div className="lg:max-w-[300px]">
      <h3 className="text-[11px] font-semibold tracking-eyebrow text-white uppercase">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm">{children}</ul>
    </div>
  );
}
