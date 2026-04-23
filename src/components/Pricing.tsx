import { Check, Crown, Snowflake, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

type Props = { onBook: () => void };

type Plan = {
  nameKey: TranslationKey;
  subtitleKey: TranslationKey;
  price: string;
  icon: typeof Snowflake;
  features: TranslationKey[];
  featured: boolean;
  badgeKey?: TranslationKey;
};

const plans: Plan[] = [
  { nameKey: "pricing.basic.name", subtitleKey: "pricing.basic.subtitle", price: "2,500", icon: Snowflake,
    features: ["pricing.basic.f1", "pricing.basic.f2", "pricing.basic.f3", "pricing.basic.f4"], featured: false },
  { nameKey: "pricing.premium.name", subtitleKey: "pricing.premium.subtitle", price: "4,500", icon: Mountain,
    features: ["pricing.premium.f1", "pricing.premium.f2", "pricing.premium.f3", "pricing.premium.f4"], featured: true, badgeKey: "pricing.premium.badge" },
  { nameKey: "pricing.vip.name", subtitleKey: "pricing.vip.subtitle", price: "7,500", icon: Crown,
    features: ["pricing.vip.f1", "pricing.vip.f2", "pricing.vip.f3", "pricing.vip.f4", "pricing.vip.f5"], featured: false, badgeKey: "pricing.vip.badge" },
];

export const Pricing = ({ onBook }: Props) => {
  const t = useT();
  return (
    <section id="pricing" className="relative py-24 md:py-32">
      <div className="container">
        <div className="reveal text-center mb-16">
          <span className="inline-block rounded-full border border-border/60 bg-gold/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold">{t("pricing.tag")}</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black">{t("pricing.title.l1")} <span className="text-gradient-aurora">{t("pricing.title.l2")}</span></h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">{t("pricing.subtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((p, i) => (
            <div
              key={p.nameKey}
              className={`reveal relative rounded-3xl p-8 transition-spring hover:-translate-y-2 ${
                p.featured ? "bg-gradient-to-br from-ice/20 via-card to-navy border-2 border-gold/40 shadow-gold lg:scale-105"
                           : "bg-gradient-card border border-border/60 hover:border-ice/40 hover:shadow-ice"
              }`}
              style={{ ["--reveal-delay" as string]: `${i * 0.1}s` } as React.CSSProperties}
            >
              {p.badgeKey && (
                <div className={`absolute -top-3 right-1/2 translate-x-1/2 px-4 py-1 rounded-full text-xs font-black tracking-wider ${
                  p.featured ? "bg-gradient-gold text-night shadow-gold" : "bg-ice text-night"
                }`}>{t(p.badgeKey)}</div>
              )}
              <div className="text-center mb-6">
                <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${p.featured ? "bg-gradient-gold shadow-gold" : "bg-gradient-ice shadow-ice"}`}>
                  <p.icon className="h-8 w-8 text-night" strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-2xl font-black text-frost">{t(p.nameKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(p.subtitleKey)}</p>
              </div>
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-5xl font-black ${p.featured ? "text-gradient-gold" : "text-frost"}`}>{p.price}</span>
                  <span className="text-muted-foreground font-medium">{t("pricing.currency")}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{t("pricing.perPerson")}</div>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((fKey) => (
                  <li key={fKey} className="flex items-start gap-3 text-sm text-frost/90">
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-ice/15 flex-shrink-0">
                      <Check className="h-3 w-3 text-ice" strokeWidth={3} />
                    </span>
                    <span>{t(fKey)}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={onBook} className={`w-full h-12 font-bold transition-spring ${
                p.featured ? "bg-gradient-gold text-night shadow-gold hover:shadow-lift hover:-translate-y-0.5"
                           : "bg-gradient-ice text-night shadow-ice hover:shadow-lift hover:-translate-y-0.5"
              }`}>{t("pricing.bookCta")}</Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
