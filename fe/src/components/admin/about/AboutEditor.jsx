"use client";

import {
  AboutHeader,
  AboutValues,
  CoreValues,
  Ecosystem,
  Profile,
  Standards,
} from "@/components/about/AboutSections";
import { aboutDefaults } from "@/data/about-content";
import { PageEditor } from "../pages/PageEditor";
import { limitOf } from "./about-limits";
import { LISTS } from "./about-lists";

function AboutCanvas({ content: c, edit }) {
  return (
    <>
      <AboutHeader header={c.header} edit={edit} />
      <Profile story={c.story} edit={edit} />
      <CoreValues core={c.core} edit={edit} />
      <Standards standards={c.standards} edit={edit} />
      <Ecosystem ecosystem={c.ecosystem} edit={edit} />
      <AboutValues values={c.values} edit={edit} />
    </>
  );
}

const config = {
  key: "about",
  title: "Về chúng tôi",
  viewHref: "/gioi-thieu",
  defaults: aboutDefaults,
  lists: LISTS,
  limitOf,
  uploadFolder: "about", // thư mục Cloudinary — backend chỉ tự dọn ảnh cũ trong about/ và site/
  // Chọn nền banner là video thì phải có video
  check: (c) =>
    c.header.banner.mode === "video" && !c.header.banner.video.src
      ? {
          title: "Chưa chọn video nền",
          message:
            "Banner đang chọn nền là video nhưng chưa có video. Hãy chọn video hoặc chuyển về ảnh trôi.",
        }
      : null,
  Canvas: AboutCanvas,
  note: "Chữ của khối Showreel và danh sách đối tác dùng chung với Trang chủ nên sửa ở tab “Trang chủ”. Trên website, 6 thẻ dịch vụ cuộn ngang; ở đây xếp thành lưới để sửa cùng lúc.",
};

/** Trang quản trị "Về chúng tôi": sửa trực tiếp trên giao diện trang (xem ../pages/PageEditor.jsx). */
export function AboutEditor() {
  return <PageEditor config={config} />;
}
