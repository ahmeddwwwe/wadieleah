import { useEffect, useRef, useState } from "react";
import { useT, useLang } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

type Stat = { target: number; labelKey: TranslationKey; suffixKey?: TranslationKey; suffix?: string };

const stats: Stat[] = [
  { target: 2026, labelKey: "stats.openYear" },
  { target: 5000, labelKey: "stats.visitors", suffix: "+" },
  { target: 2600, labelKey: "stats.altitude", suffixKey: "stats.suffix.m" },
  { target: 12, labelKey: "stats.activities" },
];

const Counter = ({ stat }: { stat: Stat }) => {
  const t = useT();
  const { lang } = useLang();
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !done.current) {
        done.current = true;
        const duration = 2200;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.floor(stat.target * eased));
          if (p < 1) requestAnimationFrame(tick);
          else setVal(stat.target);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [stat.target]);

  const formatted = val.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
  const suffix = stat.suffixKey ? t(stat.suffixKey) : (stat.suffix ?? "");

  return (
    <div ref={ref} className="group p-5 md:p-8 text-center transition-colors hover:bg-ice/5 border-b border-l border-border/50 [&:nth-child(2n)]:border-l-0 md:[&:nth-child(2n)]:border-l md:last:border-l-0 md:border-b-0">
      <div className="text-2xl sm:text-3xl md:text-5xl font-black text-gradient-gold leading-none tabular-nums">
        {formatted}{suffix}
      </div>
      <div className="mt-2 text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground tracking-wider">{t(stat.labelKey)}</div>
    </div>
  );
};

export const StatsBar = () => (
  <section className="relative z-10 border-y border-border/50 glass-strong">
    <div className="container grid grid-cols-2 md:flex md:flex-wrap">
      {stats.map((s) => <Counter key={s.labelKey} stat={s} />)}
    </div>
  </section>
);
