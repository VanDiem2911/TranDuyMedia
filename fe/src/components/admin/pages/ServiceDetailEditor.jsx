"use client";

import { useState } from "react";
import { PageHeader } from "@/components/sections";
import { T } from "@/components/about/edit-kit";
import {
  Pricing,
  ServiceFeatures,
  ServiceOverview,
  ServiceWorks,
  StudioRooms,
} from "@/components/services";
import { applyServiceDetail, serviceDetailDefaults } from "@/data/service-detail-content";
import { getService } from "@/data/services";
import { cn } from "@/lib/utils";
import { PageEditor } from "./PageEditor";
import { makeLimitOf } from "./limits";
import { SERVICE_LISTS } from "./service-detail-lists";

/** Một dịch vụ: đầu trang · giới thiệu · (điểm nổi bật) · báo giá — cùng khối với trang chi tiết thật. */
function ServiceCanvas({ content, edit }) {
  const [idx, setIdx] = useState(0);
  const d = content.items[idx];
  const base0 = getService(d.slug);
  const s = applyServiceDetail(base0, d);
  const studio = s.kind === "studio";
  const base = `items.${idx}`;
  return (
    <>
      {/* Chọn dịch vụ cần sửa */}
      <div
        role="tablist"
        aria-label="Chọn dịch vụ"
        className="flex flex-wrap gap-1.5 border-b border-ink/10 bg-paper p-3"
      >
        {content.items.map((it, i) => (
          <button
            key={it.slug}
            type="button"
            role="tab"
            aria-selected={i === idx}
            onClick={() => setIdx(i)}
            className={cn(
              "inline-flex h-10 items-center rounded-full px-4 text-[13px] font-semibold transition",
              i === idx
                ? "bg-navy-950 text-white"
                : "bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink",
            )}
          >
            {getService(it.slug).number} · {getService(it.slug).menuDesc}
          </button>
        ))}
      </div>

      {/* Đầu trang (trên website là video nền / ảnh trôi; ở đây chỉ hiện nền tối để sửa chữ) */}
      <PageHeader
        title={<T edit={edit} path={`${base}.hero.title`} value={s.title} />}
        description={<T edit={edit} path={`${base}.hero.description`} value={s.heroDesc} />}
        eyebrow={false}
        crumbs={[{ label: "Dịch vụ", href: "/dich-vu" }]}
      />
      <ServiceOverview
        s={s}
        className={studio ? "bg-paper" : "bg-white"}
        flush={studio}
        edit={edit}
        base={base}
      />
      {studio && <ServiceFeatures s={s} edit={edit} base={base} />}
      {studio ? (
        <StudioRooms rooms={s.rooms} slug={s.slug} edit={edit} base={base} />
      ) : (
        <ServiceWorks s={s} edit={edit} base={base} />
      )}
      <Pricing
        key={d.slug}
        slug={s.slug}
        plans={s.pricing.plans}
        title={s.pricingTitle}
        note={s.pricingNote}
        className={studio ? "bg-white" : undefined}
        edit={edit}
        base={`${base}.pricing`}
      />
    </>
  );
}

const config = {
  key: "service",
  title: "Chi tiết dịch vụ",
  viewHref: "/dich-vu",
  defaults: serviceDetailDefaults,
  lists: SERVICE_LISTS,
  limitOf: makeLimitOf({
    title: 140,
    headlineLead: 100,
    accent: 100,
    description: 700,
    label: 60,
    value: 20,
    name: 80,
    desc: 220,
    price: 40,
    note: 300,
    link: 300,
    folder: 300,
    short: 240,
    size: 20,
  }),
  uploadFolder: "site/service",
  Canvas: ServiceCanvas,
  note: "Chọn từng dịch vụ ở thanh trên cùng rồi sửa. Video nền đầu trang giữ nguyên. Các khối dùng chung ở cuối trang: 3 thế mạnh sửa ở “Về chúng tôi”, đối tác và hậu trường sửa ở “Trang chủ”, hành trình sửa ở “Dịch vụ”. Giá để “Liên hệ báo giá” nếu chưa có.",
};

/** Trang quản trị "Chi tiết dịch vụ": sửa trực tiếp trên giao diện trang chi tiết (xem PageEditor.jsx). */
export function ServiceDetailEditor() {
  return <PageEditor config={config} />;
}
