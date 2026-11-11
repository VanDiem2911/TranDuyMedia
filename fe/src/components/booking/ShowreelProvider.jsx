"use client";

import { createContext, useContext } from "react";
import { siteConfig } from "@/config/site";

const ShowreelContext = createContext(null);

/**
 * Video showreel dùng chung cho cả website (khung trong trang, popup toàn màn hình): nội dung chỉnh ở trang quản trị
 * (Trang chủ → Showreel). Chưa chỉnh → dùng video mặc định trong config/site.js.
 */
export function ShowreelProvider({ value, children }) {
  return <ShowreelContext.Provider value={value}>{children}</ShowreelContext.Provider>;
}

export const useShowreel = () => useContext(ShowreelContext) ?? siteConfig.showreel;
