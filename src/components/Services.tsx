import { Snowflake, Trees, Package, Waves, Sparkles, Flame, ArrowUpLeft } from "lucide-react";
import skiing from "@/assets/service-skiing.jpg";
import freestyle from "@/assets/service-freestyle.jpg";
import icemaze from "@/assets/service-icemaze.jpg";
import rental from "@/assets/service-rental.jpg";
import spa from "@/assets/service-spa.jpg";
import bonfire from "@/assets/service-bonfire.jpg";

const services = [
  {
    icon: Snowflake,
    title: "تزلج على الثلج",
    desc: "مضامير متعددة المستويات مع معدات احترافية ومدربين معتمدين.",
    img: skiing,
    tag: "النشاط الأول",
    stat: "+12 مضمار",
    accent: "from-ice/40 via-ice/10 to-transparent",
  },
  {
    icon: Trees,
    title: "التزلج الحر",
    desc: "مناطق مخصصة للتزلج الحر وألعاب الثلج للمبتدئين والمحترفين.",
    img: freestyle,
    tag: "أكشن",
    stat: "قفزات حتى 8م",
    accent: "from-gold/40 via-gold/10 to-transparent",
  },
  {
    icon: Sparkles,
    title: "متاهة الجليد المضيئة",
    desc: "متاهة ضخمة من جدران الجليد مع إضاءة LED تفاعلية وموسيقى غامرة ليلاً.",
    img: icemaze,
    tag: "حصري",
    stat: "تجربة ليلية",
    accent: "from-purple-500/40 via-ice/10 to-transparent",
  },
  {
    icon: Package,
    title: "تأجير المعدات",
    desc: "أحدث الزلاجات والمعدات الاحترافية بأحجام تناسب جميع الأعمار.",
    img: rental,
    tag: "احترافي",
    stat: "+500 قطعة",
    accent: "from-amber-500/40 via-gold/10 to-transparent",
  },
  {
    icon: Waves,
    title: "سبا وجاكوزي",
    desc: "استرخِ بعد المغامرة في جلسات سبا فاخرة وجاكوزي دافئ.",
    img: spa,
    tag: "استرخاء",
    stat: "إطلالة بانورامية",
    accent: "from-rose-400/40 via-ice/10 to-transparent",
  },
  {
    icon: Flame,
    title: "خيام النار البدوية",
    desc: "أمسيات حول النار في خيام بدوية فاخرة مع شاي وحطب وقصص تحت النجوم.",
    img: bonfire,
    tag: "تجربة فريدة",
    stat: "تحت النجوم",
    accent: "from-orange-500/50 via-red-500/15 to-transparent",
  },
];

export const Services = () => (
  <section id="services" className="relative py-24 md:py-32 bg-deep/50 overflow-hidden">
    {/* ambient glows */}
    <div className="pointer-events-none absolute top-0 right-1/4 h-96 w-96 rounded-full bg-ice/10 blur-[120px]" />
    <div className="pointer-events-none absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-gold/10 blur-[120px]" />

    <div className="container relative">
      <div className="reveal text-center mb-16">
        <span className="inline-block rounded-full border border-border/60 bg-gold/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold">
          🏂 خدماتنا
        </span>
        <h2 className="mt-4 text-4xl md:text-6xl font-black">
          تجارب <span className="text-gradient-aurora">لا تُنسى</span>
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          ٦ تجارب حصرية على ارتفاع ٢٦٠٠ متر — كل لحظة فيها أكشن، أدرينالين، أو سحر
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <article
            key={s.title}
            className="reveal group relative overflow-hidden rounded-3xl border border-border/60 bg-card transition-spring hover:-translate-y-2 hover:border-ice/40 hover:shadow-ice cursor-pointer aspect-[4/5]"
            style={{ ["--reveal-delay" as string]: `${i * 0.08}s` } as React.CSSProperties}
          >
            {/* Background image with zoom */}
            <img
              src={s.img}
              alt={s.title}
              loading="lazy"
              width={1024}
              height={1024}
              className="absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-[1200ms] ease-out group-hover:scale-110 group-hover:saturate-150"
            />

            {/* Dark gradient overlay for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-night via-night/70 to-night/10" />

            {/* Color accent on hover */}
            <div className={`absolute inset-0 bg-gradient-to-tr ${s.accent} opacity-0 transition-smooth group-hover:opacity-100 mix-blend-overlay`} />

            {/* Animated shine sweep */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] transition-transform duration-700 group-hover:translate-x-full" />

            {/* Top tag */}
            <div className="absolute top-4 right-4 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-night/70 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-frost">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-soft" />
                {s.tag}
              </span>
            </div>

            {/* Arrow indicator */}
            <div className="absolute top-4 left-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-night/60 backdrop-blur-md border border-white/10 text-frost transition-spring group-hover:bg-gold group-hover:text-night group-hover:rotate-45">
              <ArrowUpLeft className="h-4 w-4" strokeWidth={2.5} />
            </div>

            {/* Content bottom */}
            <div className="absolute inset-x-0 bottom-0 p-6 z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-ice shadow-ice transition-spring group-hover:scale-110 group-hover:rotate-[-8deg]">
                  <s.icon className="h-6 w-6 text-night" strokeWidth={2.5} />
                </div>
                <span className="text-xs font-bold text-gold tracking-wider">{s.stat}</span>
              </div>
              <h3 className="text-2xl font-black text-frost mb-2 leading-tight">{s.title}</h3>
              <p className="text-sm text-frost/70 leading-relaxed line-clamp-2 transition-smooth group-hover:text-frost/90">
                {s.desc}
              </p>

              {/* Bottom gold line */}
              <div className="mt-4 h-0.5 w-12 bg-gradient-gold transition-all duration-500 group-hover:w-full" />
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);
