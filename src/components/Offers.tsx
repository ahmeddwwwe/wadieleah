import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Flame, Gift, Users, Percent } from "lucide-react";

type Props = { onBook: () => void };

const offers = [
  { icon: Percent, label: "٢٠٪", title: "خصم الحجز المبكر", desc: "احجز قبل ٣٠ يوماً واحصل على خصم ٢٠٪", tone: "ice" },
  { icon: Users, label: "عائلة", title: "خصم ١٥٪ للمجموعات", desc: "للعائلات والمجموعات التي تزيد عن ٤ أفراد", tone: "ice" },
  { icon: Gift, label: "هدية", title: "تصوير احترافي مجاني", desc: "مع كل حجز لباقة VIP، جلسة تصوير مجانية", tone: "ice" },
  { icon: Flame, label: "مغامرة", title: "تزلج + تلفريك + سبا", desc: "باقة شاملة بسعر ٥,٩٩٩ بدلاً من ٧,٥٠٠ ج.م", tone: "gold" },
];

// Fixed deadline: end of the upcoming Sunday at 23:59:59 (Cairo time)
const getDeadline = () => {
  const now = new Date();
  const target = new Date(now);
  const dow = now.getDay(); // 0 = Sunday
  const daysUntilSunday = (7 - dow) % 7 || 7;
  target.setDate(now.getDate() + daysUntilSunday);
  target.setHours(23, 59, 59, 999);
  return target.getTime();
};

const useCountdown = () => {
  const [time, setTime] = useState({ d: "00", h: "00", m: "00", s: "00" });
  useEffect(() => {
    const end = getDeadline();
    const update = () => {
      const diff = Math.max(0, end - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({
        d: String(d).padStart(2, "0"),
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return time;
};

export const Offers = ({ onBook }: Props) => {
  const t = useCountdown();
  return (
    <section id="offers" className="relative py-24 md:py-32 bg-deep/50">
      <div className="container">
        <div className="reveal text-center mb-12">
          <span className="inline-block rounded-full border border-border/60 bg-destructive/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold">🔥 عروض حصرية</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black">لا تفوّت <span className="text-gradient-aurora">الفرص</span></h2>
          <div className="mt-6 inline-flex items-center gap-3 glass rounded-2xl px-5 py-3">
            <span className="text-sm text-muted-foreground">ينتهي العرض خلال:</span>
            <div className="flex gap-2 font-black text-lg tabular-nums text-gradient-gold">
              <span className="glass rounded-md px-2 py-1">{t.h}</span><span>:</span>
              <span className="glass rounded-md px-2 py-1">{t.m}</span><span>:</span>
              <span className="glass rounded-md px-2 py-1">{t.s}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {offers.map((o, i) => (
            <div
              key={o.title}
              className={`reveal group relative overflow-hidden rounded-3xl p-6 transition-spring hover:-translate-y-2 ${
                o.tone === "gold" ? "bg-gradient-to-br from-gold/15 via-card to-navy border-2 border-gold/40 hover:shadow-gold"
                                  : "bg-gradient-card border border-border/60 hover:border-ice/40 hover:shadow-ice"
              }`}
              style={{ ["--reveal-delay" as string]: `${i * 0.08}s` } as React.CSSProperties}
            >
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-ice opacity-0 blur-3xl transition-smooth group-hover:opacity-40" />
              <div className="relative">
                <div className={`inline-flex items-center gap-2 mb-4 rounded-full px-3 py-1 text-2xl font-black ${o.tone === "gold" ? "text-gradient-gold" : "text-gradient-aurora"}`}>
                  <o.icon className="h-5 w-5" />{o.label}
                </div>
                <h3 className="text-lg font-black text-frost mb-2">{o.title}</h3>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{o.desc}</p>
                <Button onClick={onBook} size="sm" variant="outline" className="w-full border-border/60 bg-transparent hover:bg-ice hover:text-night hover:border-ice transition-spring">
                  استفد الآن
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
