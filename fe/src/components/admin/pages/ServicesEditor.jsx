"use client";

import { Faq } from "@/components/sections";
import { Journey, Packages, ServiceList, ServicesHero } from "@/components/services";
import { servicesDefaults } from "@/data/services-content";
import { PageEditor } from "./PageEditor";
import { makeLimitOf } from "./limits";
import { SERVICES_LISTS } from "./services-lists";

function ServicesCanvas({ content: c, edit }) {
  return (
    <>
      <ServicesHero content={c.hero} edit={edit} />
      <Journey content={c.journey} edit={edit} />
      <ServiceList content={c.list} edit={edit} />
      <Packages content={c.packages} edit={edit} />
      <Faq content={c.faq} edit={edit} />
    </>
  );
}

const config = {
  key: "services",
  title: "Dịch vụ",
  viewHref: "/dich-vu",
  defaults: servicesDefaults,
  lists: SERVICES_LISTS,
  limitOf: makeLimitOf({ q: 200, a: 800, features: 120, text: 160, menuDesc: 60, tagline: 140 }),
  uploadFolder: "site/services", // thư mục Cloudinary — backend chỉ tự dọn ảnh cũ trong about/ và site/
  Canvas: ServicesCanvas,
  note: "Đây là trang danh sách /dich-vu. Chữ và ảnh của 5 dịch vụ chính sửa ở đây chỉ hiện ở trang danh sách (đường dẫn trang con giữ nguyên); nội dung các trang chi tiết dịch vụ sẽ có phần sửa riêng. Trên website, hành trình các bước hiện dạng cột nở rộng; ở đây xếp thành lưới để sửa.",
};

/** Trang quản trị "Dịch vụ": sửa trực tiếp trên giao diện trang (xem PageEditor.jsx). */
export function ServicesEditor() {
  return <PageEditor config={config} />;
}
