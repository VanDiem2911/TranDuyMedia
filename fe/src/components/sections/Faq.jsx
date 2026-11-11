"use client";

import { useState } from "react";
import { AddTile, RemoveButton } from "@/components/admin/about/inline-edit";
import { T } from "@/components/about/edit-kit";
import { Icon } from "@/components/icons";
import { Container, SectionHeading } from "@/components/ui";
import { faqs } from "@/data/services";
import { cn } from "@/lib/utils";

/**
 * items: câu hỏi riêng (mặc định: FAQ chung). title: tiêu đề cột trái.
 * content: { eyebrow, title, description, items } chỉnh được từ trang quản trị (trang Dịch vụ) — có thì dùng thay cho các prop trên;
 * edit: chế độ sửa trực tiếp (mọi câu hỏi mở sẵn để sửa, có thêm / xoá).
 */
export function Faq({
  items = faqs,
  // Giữ liền các cụm "khách hàng", "bắt đầu." → không bị tách mỗi chữ một dòng
  title = (
    <>
      Những điều <span className="whitespace-nowrap">khách hàng</span> hay hỏi trước khi{" "}
      <span className="whitespace-nowrap">bắt đầu.</span>
    </>
  ),
  bg = "bg-paper",
  content,
  edit,
}) {
  const [open, setOpen] = useState(0);
  const list = content ? content.items : items;

  return (
    <section className={cn(bg, "section-y")} data-nav-theme="light">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20">
          <SectionHeading
            eyebrow={
              content ? (
                <T edit={edit} path="faq.eyebrow" value={content.eyebrow} />
              ) : (
                "Câu hỏi thường gặp"
              )
            }
            title={content ? <T edit={edit} path="faq.title" value={content.title} /> : title}
            description={
              content ? (
                <T edit={edit} path="faq.description" value={content.description} />
              ) : (
                "Chưa thấy câu trả lời? Gọi hotline hoặc để lại thông tin, chúng tôi phản hồi trong 24 giờ."
              )
            }
          />
          <ul className="divide-y divide-ink/10 border-y border-ink/10">
            {list.map((f, i) => {
              const isOpen = edit ? true : open === i;
              return (
                <li
                  key={i}
                  className="reveal group relative"
                  style={{ "--reveal-delay": `${(i % 3) * 70}ms` }}
                >
                  {edit ? (
                    <div className="py-6 pr-24">
                      <p className="text-lg font-medium tracking-tight sm:text-xl">
                        <T edit={edit} path={`faq.items.${i}.q`} value={f.q} />
                      </p>
                      <p className="mt-3 leading-relaxed text-ink-soft">
                        <T edit={edit} path={`faq.items.${i}.a`} value={f.a} />
                      </p>
                      <RemoveButton edit={edit} listPath="faq.items" index={i} />
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? -1 : i)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-6 py-6 text-left"
                      >
                        <span className="text-lg font-medium tracking-tight sm:text-xl">{f.q}</span>
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-all duration-300",
                            isOpen && "rotate-45 bg-navy-900 text-white",
                          )}
                        >
                          <Icon name="plus" className="size-4" />
                        </span>
                      </button>
                      <div
                        className={cn(
                          "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <p className="overflow-hidden pr-14 leading-relaxed text-ink-soft">
                          <span className="block pb-6">{f.a}</span>
                        </p>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
            {edit && (
              <li className="py-5">
                <AddTile edit={edit} listPath="faq.items" label="Thêm câu hỏi" />
              </li>
            )}
          </ul>
        </div>
      </Container>
    </section>
  );
}
