import { Button, Container } from "@/components/ui";
import { processSteps } from "@/data/services";

/**
 * Quy trình sản xuất 7 bước: cột trái ghim (sticky) khi cuộn, cột phải lần lượt hiện từng bước.
 */
export function Process() {
  return (
    <section id="quy-trinh" className="bg-white section-y" data-nav-theme="light">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="reveal mb-4 eyebrow">Quy trình làm việc</p>
            <h2 className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
              Quy trình sản xuất.
            </h2>
            <p
              className="reveal mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg"
              style={{ "--reveal-delay": "160ms" }}
            >
              Quy trình chặt chẽ và khắt khe đảm bảo chất lượng thành phẩm, giúp bạn an tâm đồng
              hành cùng chúng tôi.
            </p>
            <div className="reveal mt-8" style={{ "--reveal-delay": "240ms" }}>
              <Button pill data-booking>
                Bắt đầu với một buổi brief
              </Button>
            </div>
          </div>

          <ol className="divide-y divide-ink/10 border-y border-ink/10">
            {processSteps.map((s, i) => (
              <li
                key={s.step}
                className="reveal group grid grid-cols-[3.5rem_1fr] gap-4 py-5 sm:grid-cols-[5rem_1fr] sm:gap-8 sm:py-6"
                style={{ "--reveal-delay": `${(i % 2) * 80}ms` }}
              >
                <span className="text-3xl h-display text-paper-200 transition-colors duration-500 group-hover:text-orange-500 sm:text-5xl">
                  {s.step}
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{s.title}</h3>
                  <p className="mt-2 max-w-lg leading-relaxed text-ink-soft">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
