import { FooterView } from "./FooterView";

async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

/** Chân trang của website: nội dung chỉnh được từ trang quản trị (xem FooterView.jsx). */
export function Footer({ content }) {
  return <FooterView content={content} year={<CopyrightYear />} />;
}
