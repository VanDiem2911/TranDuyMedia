// Danh sách các trang chỉnh được từ trang quản trị: khoá trang → nội dung mặc định.
// Khoá phải khớp CONTENT_KEYS ở be/src/models/site-content.model.js.
import { aboutDefaults } from "@/data/about-content";
import { homeDefaults } from "@/data/home-content";
import { productsDefaults } from "@/data/products-content";
import { serviceDetailDefaults } from "@/data/service-detail-content";
import { servicesDefaults } from "@/data/services-content";
import { siteDefaults } from "@/data/site-content";

export const PAGE_DEFAULTS = {
  about: aboutDefaults,
  home: homeDefaults,
  services: servicesDefaults,
  service: serviceDetailDefaults,
  products: productsDefaults,
  site: siteDefaults,
};

/** Thẻ cache của từng trang: website cache theo thẻ này, trang quản trị làm mới thẻ ngay sau khi lưu. */
export const pageTag = (key) => `content-${key}`;
export const PAGE_TAGS = Object.keys(PAGE_DEFAULTS).map(pageTag);
