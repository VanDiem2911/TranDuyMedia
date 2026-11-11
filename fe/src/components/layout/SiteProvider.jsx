"use client";

import { createContext, useContext } from "react";
import { siteConfig } from "@/config/site";

const SiteContext = createContext(null);

/**
 * Thông tin liên hệ + mạng xã hội dùng chung cho các thành phần phía trình duyệt (popup đặt lịch, form…):
 * nội dung chỉnh ở trang quản trị (Chân trang, menu & SEO). Chưa chỉnh → dùng giá trị mặc định trong config/site.js.
 */
export function SiteProvider({ value, children }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSiteView = () => useContext(SiteContext) ?? siteConfig;
