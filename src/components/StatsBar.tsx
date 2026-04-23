import { useEffect, useRef, useState } from "react";

type Stat = { target: number; label: string; suffix?: string; duration?: number };

const stats: Stat[] = [
  { target: 2026, label: "عام الافتتاح" },
  { target: 5000, label: "زائر في الشهر الأول", suffix: "+" },
  { target: 2600, label: "متر فوق سطح البحر", suffix: "م" },
  { target: 12, label: "نشاط ومرفق" },
];

const Counter = ({ stat }: { stat: Stat }) => {
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

  return (
    <div ref={ref} className="group flex-1 min-w-[140px] border-l border-border/50 last:border-l-0 p-8 text-center transition-colors hover:bg-ice/5">
      <div className="text-4xl md:text-5xl font-black text-gradient-gold leading-none tabular-nums">
        {val}{stat.suffix ?? ""}
      </div>
      <div className="mt-2 text-xs md:text-sm font-medium text-muted-foreground tracking-wider">{stat.label}</div>
    </div>
  );
};

export const StatsBar = () => (
  <section className="relative z-10 border-y border-border/50 glass-strong">
    <div className="container flex flex-wrap">
      {stats.map((s) => <Counter key={s.label} stat={s} />)}
    </div>
  </section>
);
