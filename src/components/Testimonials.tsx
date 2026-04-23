import { useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

type Item = { nameKey: TranslationKey; cityKey: TranslationKey; textKey: TranslationKey; stars: number };

const items: Item[] = [
  { nameKey: "t.r1.name", cityKey: "t.r1.city", textKey: "t.r1.text", stars: 5 },
  { nameKey: "t.r2.name", cityKey: "t.r2.city", textKey: "t.r2.text", stars: 5 },
  { nameKey: "t.r3.name", cityKey: "t.r3.city", textKey: "t.r3.text", stars: 5 },
  { nameKey: "t.r4.name", cityKey: "t.r4.city", textKey: "t.r4.text", stars: 4 },
  { nameKey: "t.r5.name", cityKey: "t.r5.city", textKey: "t.r5.text", stars: 5 },
];

export const Testimonials = () => {
  const t = useT();
  const [i, setI] = useState(0);
  const next = () => setI((p) => (p + 1) % items.length);
  const prev = () => setI((p) => (p - 1 + items.length) % items.length);
  const cur = items[i];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="aurora-bg opacity-60" aria-hidden />
      <div className="container relative">
        <div className="reveal text-center mb-12">
          <span className="inline-block rounded-full border border-border/60 bg-gold/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold">{t("testimonials.tag")}</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black">{t("testimonials.title.l1")} <span className="text-gradient-aurora">{t("testimonials.title.l2")}</span> {t("testimonials.title.l3")}</h2>
        </div>

        <div className="reveal max-w-3xl mx-auto">
          <div className="relative">
            <div className="glass-strong rounded-3xl p-8 md:p-12 min-h-[260px]">
              <div className="flex gap-1 mb-5 justify-center">
                {Array.from({ length: cur.stars }).map((_, idx) => (
                  <Star key={idx} className="h-5 w-5 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-lg md:text-xl text-center leading-relaxed text-frost/90 font-serif">
                « {t(cur.textKey)} »
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-ice text-night font-black text-lg shadow-ice">
                  {t(cur.nameKey)[0]}
                </div>
                <div>
                  <div className="font-bold text-frost">{t(cur.nameKey)}</div>
                  <div className="text-xs text-muted-foreground">{t(cur.cityKey)}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={prev} className="grid h-11 w-11 place-items-center rounded-full glass transition-spring hover:bg-ice hover:text-night hover:scale-110" aria-label={t("testimonials.prev")}>
                <ChevronLeft className="h-5 w-5 rtl:hidden" />
                <ChevronRight className="h-5 w-5 ltr:hidden" />
              </button>
              <div className="flex gap-2">
                {items.map((_, idx) => (
                  <button key={idx} onClick={() => setI(idx)} aria-label={`${t("testimonials.review")} ${idx + 1}`} className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-gradient-gold" : "w-2 bg-border"}`} />
                ))}
              </div>
              <button onClick={next} className="grid h-11 w-11 place-items-center rounded-full glass transition-spring hover:bg-ice hover:text-night hover:scale-110" aria-label={t("testimonials.next")}>
                <ChevronRight className="h-5 w-5 rtl:hidden" />
                <ChevronLeft className="h-5 w-5 ltr:hidden" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
