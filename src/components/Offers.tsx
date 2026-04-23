import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Flame, Gift, Users, Percent } from "lucide-react";
import { useT } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

type Props = { onBook: () => void };

type Offer = {
  icon: typeof Flame;
  labelKey: TranslationKey;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  tone: "ice" | "gold";
};

const offers: Offer[] = [
  { icon: Percent, labelKey: "offers.o1.label", titleKey: "offers.o1.title", descKey: "offers.o1.desc", tone: "ice" },
  { icon: Users,   labelKey: "offers.o2.label", titleKey: "offers.o2.title", descKey: "offers.o2.desc", tone: "ice" },
  { icon: Gift,    labelKey: "offers.o3.label", titleKey: "offers.o3.title", descKey: "offers.o3.desc", tone: "ice" },
  { icon: Flame,   labelKey: "offers.o4.label", titleKey: "offers.o4.title", descKey: "offers.o4.desc", tone: "gold" },
];

const getDeadline = () => {
  const now = new Date();
  const target = new Date(now);
  const dow = now.getDay();
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
  const t = useT();
  const time = useCountdown();
  return (
    <section id="offers" className="relative py-24 md:py-32 bg-deep/50">
      <div className="container">
        <div className="reveal text-center mb-12">
          <span className="inline-block rounded-full border border-border/60 bg-destructive/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold">{t("offers.tag")}</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black">{t("offers.title.l1")} <span className="text-gradient-aurora">{t("offers.title.l2")}</span></h2>
          <div className="mt-6 inline-flex items-center gap-3 glass rounded-2xl px-5 py-3">
            <span className="text-sm text-muted-foreground">{t("offers.endsIn")}</span>
            <div className="flex items-center gap-1.5 font-black text-lg tabular-nums" dir="ltr">
              <span className="rounded-md bg-night/60 border border-gold/30 px-2.5 py-1 text-gold">{time.d}<span className="text-[10px] font-medium text-muted-foreground ms-1">{t("offers.unit.d")}</span></span><span className="text-gold/60">:</span>
              <span className="rounded-md bg-night/60 border border-gold/30 px-2.5 py-1 text-gold">{time.h}</span><span className="text-gold/60">:</span>
              <span className="rounded-md bg-night/60 border border-gold/30 px-2.5 py-1 text-gold">{time.m}</span><span className="text-gold/60">:</span>
              <span className="rounded-md bg-night/60 border border-gold/30 px-2.5 py-1 text-gold">{time.s}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {offers.map((o, i) => (
            <div
              key={o.titleKey}
              className={`reveal group relative overflow-hidden rounded-3xl p-6 transition-spring hover:-translate-y-2 ${
                o.tone === "gold" ? "bg-gradient-to-br from-gold/15 via-card to-navy border-2 border-gold/40 hover:shadow-gold"
                                  : "bg-gradient-card border border-border/60 hover:border-ice/40 hover:shadow-ice"
              }`}
              style={{ ["--reveal-delay" as string]: `${i * 0.08}s` } as React.CSSProperties}
            >
              <div className="absolute -top-10 -end-10 h-32 w-32 rounded-full bg-gradient-ice opacity-0 blur-3xl transition-smooth group-hover:opacity-40" />
              <div className="relative">
                <div className={`inline-flex items-center gap-2 mb-4 rounded-full px-3 py-1 text-2xl font-black ${o.tone === "gold" ? "text-gradient-gold" : "text-gradient-aurora"}`}>
                  <o.icon className="h-5 w-5" />{t(o.labelKey)}
                </div>
                <h3 className="text-lg font-black text-frost mb-2">{t(o.titleKey)}</h3>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{t(o.descKey)}</p>
                <Button onClick={onBook} size="sm" variant="outline" className="w-full border-border/60 bg-transparent hover:bg-ice hover:text-night hover:border-ice transition-spring">
                  {t("offers.cta")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
