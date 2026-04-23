import { Snowflake, Trees, Package, Waves, Sparkles, Flame } from "lucide-react";

const services = [
  { icon: Snowflake, title: "تزلج على الثلج", desc: "مضامير متعددة المستويات مع معدات احترافية ومدربين معتمدين." },
  { icon: Trees, title: "التزلج الحر", desc: "مناطق مخصصة للتزلج الحر وألعاب الثلج للمبتدئين والمحترفين." },
  { icon: Sparkles, title: "متاهة الجليد المضيئة", desc: "متاهة ضخمة من جدران الجليد مع إضاءة LED تفاعلية وموسيقى غامرة ليلاً." },
  { icon: Package, title: "تأجير المعدات", desc: "أحدث الزلاجات والمعدات الاحترافية بأحجام تناسب جميع الأعمار." },
  { icon: Waves, title: "سبا وجاكوزي", desc: "استرخِ بعد المغامرة في جلسات سبا فاخرة وجاكوزي دافئ." },
  { icon: Flame, title: "خيام النار البدوية", desc: "أمسيات حول النار في خيام بدوية فاخرة مع شاي وحطب وقصص تحت النجوم." },
];

export const Services = () => (
  <section id="services" className="relative py-24 md:py-32 bg-deep/50">
    <div className="container">
      <div className="reveal text-center mb-16">
        <span className="inline-block rounded-full border border-border/60 bg-gold/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold">
          🏂 خدماتنا
        </span>
        <h2 className="mt-4 text-4xl md:text-5xl font-black">
          ما <span className="text-gradient-aurora">نقدمه</span> لك
        </h2>
        <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
          أحدث المعدات وأفضل الخدمات لتجربة ممتعة وآمنة
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <div
            key={s.title}
            className="reveal group relative overflow-hidden rounded-3xl bg-gradient-card border border-border/60 p-8 transition-spring hover:-translate-y-2 hover:border-ice/40 hover:shadow-ice"
            style={{ ["--reveal-delay" as string]: `${i * 0.08}s` } as React.CSSProperties}
          >
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-ice opacity-0 blur-3xl transition-smooth group-hover:opacity-30" />
            <div className="relative">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-ice shadow-ice mb-5 transition-spring group-hover:rotate-[-8deg] group-hover:scale-110">
                <s.icon className="h-7 w-7 text-night" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-black text-frost mb-2">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
