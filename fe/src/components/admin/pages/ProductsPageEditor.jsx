"use client";

import { ProductsHeader } from "@/components/about/ProductsHeader";
import { productsDefaults } from "@/data/products-content";
import { PageEditor } from "./PageEditor";
import { makeLimitOf } from "./limits";

function ProductsCanvas({ content: c, edit }) {
  return <ProductsHeader header={c.header} edit={edit} />;
}

const config = {
  key: "products",
  title: "Trang Sản phẩm",
  viewHref: "/san-pham",
  defaults: productsDefaults,
  lists: {},
  limitOf: makeLimitOf(),
  uploadFolder: "site/products", // thư mục Cloudinary — backend chỉ tự dọn ảnh cũ trong about/ và site/
  Canvas: ProductsCanvas,
  note: "Đây là phần đầu trang /san-pham (dòng nhỏ, mô tả, 18 ảnh nền trôi). Danh sách các sản phẩm quản lý ở tab “Sản phẩm”.",
};

/** Trang quản trị "Trang Sản phẩm": sửa trực tiếp phần đầu trang (xem PageEditor.jsx). */
export function ProductsPageEditor() {
  return <PageEditor config={config} />;
}
