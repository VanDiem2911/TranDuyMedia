import { AddTile, RemoveButton } from "@/components/admin/about/inline-edit";
import { T } from "@/components/about/edit-kit";
import { Button, Container } from "@/components/ui";
import { homeDefaults } from "@/data/home-content";
import { pad } from "@/lib/utils";

/**
 * Quy trình sản xuất: cột trái ghim (sticky) khi cuộn, cột phải lần lượt hiện từng bước (số bước tự đánh).
 * content: nội dung chỉnh được từ trang quản trị (mặc định = homeDefaults.process); edit: chế độ sửa trực tiếp.
 */
export function Process({ content = homeDefaults.process, edit }) {
  return (
    <section id="quy-trinh" className="bg-white section-y" data-nav-theme="light">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="reveal mb-4 eyebrow">
              <T edit={edit} path="process.eyebrow" value={content.eyebrow} />
            </p>
            <h2 className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
              <T edit={edit} path="process.title" value={content.title} />
            </h2>
            <p
              className="reveal mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg"
              style={{ "--reveal-delay": "160ms" }}
            >
              <T edit={edit} path="process.description" value={content.description} />
            </p>
            <div className="reveal mt-8" style={{ "--reveal-delay": "240ms" }}>
              <Button pill data-booking>
                <T edit={edit} path="process.buttonLabel" value={content.buttonLabel} />
              </Button>
            </div>
          </div>

          <ol className="divide-y divide-ink/10 border-y border-ink/10">
            {content.steps.map((s, i) => (
              <li
                key={i}
                className="reveal group relative grid grid-cols-[3.5rem_1fr] gap-4 py-5 sm:grid-cols-[5rem_1fr] sm:gap-8 sm:py-6"
                style={{ "--reveal-delay": `${(i % 2) * 80}ms` }}
              >
                <span className="text-3xl h-display text-paper-200 transition-colors duration-500 group-hover:text-orange-500 sm:text-5xl">
                  {pad(i + 1)}
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    <T edit={edit} path={`process.steps.${i}.title`} value={s.title} />
                  </h3>
                  <p className="mt-2 max-w-lg leading-relaxed text-ink-soft">
                    <T edit={edit} path={`process.steps.${i}.desc`} value={s.desc} />
                  </p>
                </div>
                {edit && <RemoveButton edit={edit} listPath="process.steps" index={i} />}
              </li>
            ))}
            {edit && (
              <li className="py-5">
                <AddTile edit={edit} listPath="process.steps" label="Thêm bước" />
              </li>
            )}
          </ol>
        </div>
      </Container>
    </section>
  );
}
