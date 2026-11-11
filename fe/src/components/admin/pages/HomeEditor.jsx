"use client";

import {
  BehindScenes,
  Hero,
  Intro,
  Partners,
  Process,
  Showreel,
  VideoFocus,
} from "@/components/sections";
import { homeDefaults, showreelMedia } from "@/data/home-content";
import { PageEditor } from "./PageEditor";
import { HOME_LISTS } from "./home-lists";
import { makeLimitOf } from "./limits";

function HomeCanvas({ content: c, edit }) {
  return (
    <>
      <Hero content={c.hero} edit={edit} />
      <Showreel
        eyebrow={c.showreel.eyebrow}
        title={c.showreel.title}
        description={c.showreel.description}
        media={showreelMedia(c.showreel)}
        edit={edit}
      />
      <Intro content={c.intro} edit={edit} />
      <VideoFocus content={c.focus} edit={edit} />
      <Process content={c.process} edit={edit} />
      <BehindScenes content={c.bts} edit={edit} />
      <Partners content={c.partners} edit={edit} />
    </>
  );
}

const config = {
  key: "home",
  title: "Trang chủ",
  viewHref: "/",
  defaults: homeDefaults,
  lists: HOME_LISTS,
  limitOf: makeLimitOf(),
  uploadFolder: "site/home", // thư mục Cloudinary — backend chỉ tự dọn ảnh cũ trong about/ và site/
  Canvas: HomeCanvas,
  note: "Video showreel đổi bằng nút “Đổi video showreel” trên khung video (áp dụng cho cả Về chúng tôi và popup xem toàn màn hình). Trên website, ảnh hậu trường và logo đối tác tự cuộn; ở đây xếp thành lưới để sửa cùng lúc.",
};

/** Trang quản trị "Trang chủ": sửa trực tiếp trên giao diện trang (xem PageEditor.jsx). */
export function HomeEditor() {
  return <PageEditor config={config} />;
}
