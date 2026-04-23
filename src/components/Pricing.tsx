import { Check, Crown, Snowflake, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { onBook: () => void };

const plans = [
  { name: "الباقة الأساسية", subtitle: "تزلج + معدات", price: "2,500", icon: Snowflake,
    features: ["تذكرة تزلج ليوم كامل", "استئجار زلاجات وعصي", "خوذة مجانية", "دخول لمنطقة المبتدئين"], featured: false },
  { name: "الباقة المميزة", subtitle: "تزلج + إطلالات الجبل", price: "4,500", icon: Mountain,
    features: ["تذكرة تزلج ليوم كامل", "جولة في نقاط المشاهدة", "معدات احترافية", "مدرب لمدة ساعة"], featured: true, badge: "الأكثر طلباً" },
  { name: "باقة VIP الشاملة", subtitle: "تزلج شامل + سبا", price: "7,500", icon: Crown,
    features: ["تزلج غير محدود", "جولة خاصة في القمم", "جلسة سبا وجاكوزي", "وجبة غداء فاخرة", "مدرب خاص ٣ ساعات"], featured: false, badge: "VIP" },
];

export const Pricing = ({ onBook }: Props) => (
  <section id="pricing" className="relative py-24 md:py-32">
    <div className="container">
      <div className="reveal text-center mb-16">
        <span className="inline-block rounded-full border border-border/60 bg-gold/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold">💎 الباقات</span>
        <h2 className="mt-4 text-4xl md:text-5xl font-black">اختر <span className="text-gradient-aurora">تجربتك</span></h2>
        <p className="mt-4 text-muted-foreground max-w-lg mx-auto">باقات مصممة لكل مستوى من المغامرة</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((p, i) => (
          <div
            key={p.name}
            className={`reveal relative rounded-3xl p-8 transition-spring hover:-translate-y-2 ${
              p.featured ? "bg-gradient-to-br from-ice/20 via-card to-navy border-2 border-gold/40 shadow-gold lg:scale-105"
                         : "bg-gradient-card border border-border/60 hover:border-ice/40 hover:shadow-ice"
            }`}
            style={{ ["--reveal-delay" as string]: `${i * 0.1}s` } as React.CSSProperties}
          >
            {p.badge && (
              <div className={`absolute -top-3 right-1/2 translate-x-1/2 px-4 py-1 rounded-full text-xs font-black tracking-wider ${
                p.featured ? "bg-gradient-gold text-night shadow-gold" : "bg-ice text-night"
              }`}>{p.badge}</div>
            )}
            <div className="text-center mb-6">
              <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${p.featured ? "bg-gradient-gold shadow-gold" : "bg-gradient-ice shadow-ice"}`}>
                <p.icon className="h-8 w-8 text-night" strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-2xl font-black text-frost">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.subtitle}</p>
            </div>
            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-2">
                <span className={`text-5xl font-black ${p.featured ? "text-gradient-gold" : "text-frost"}`}>{p.price}</span>
                <span className="text-muted-foreground font-medium">ج.م</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">/ للشخص</div>
            </div>
            <ul className="space-y-3 mb-8">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-frost/90">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-ice/15 flex-shrink-0">
                    <Check className="h-3 w-3 text-ice" strokeWidth={3} />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button onClick={onBook} className={`w-full h-12 font-bold transition-spring ${
              p.featured ? "bg-gradient-gold text-night shadow-gold hover:shadow-lift hover:-translate-y-0.5"
                         : "bg-gradient-ice text-night shadow-ice hover:shadow-lift hover:-translate-y-0.5"
            }`}>احجز الآن</Button>
          </div>
        ))}
      </div>
    </div>
  </section>
);
