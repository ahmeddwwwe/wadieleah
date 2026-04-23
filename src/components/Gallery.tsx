import { useState, lazy, Suspense } from "react";
import g1 from "@/assets/saint-catherine-resort.webp";
import g2 from "@/assets/gallery-simulator.webp";
import g3 from "@/assets/gallery-lobby.webp";
import g4 from "@/assets/gallery-snow-cannon.webp";
import g5 from "@/assets/gallery-slope.webp";
import g6 from "@/assets/gallery-uniforms.webp";
import g7 from "@/assets/gallery-lounge.webp";
import g8 from "@/assets/gallery-rental.webp";
import g9 from "@/assets/gallery-school.webp";

const Lightbox = lazy(() => import("./Lightbox").then((m) => ({ default: m.Lightbox })));

type Item = { src: string; alt: string; label: string; span?: string };

const items: Item[] = [
  { src: g1, alt: "إطلالة جوية على المركز في سانت كاترين", label: "المركز الرئيسي", span: "md:col-span-2 md:row-span-2" },
  { src: g5, alt: "قاعة المنحدر الداخلي مع الثلج الصناعي", label: "المنحدر الداخلي" },
  { src: g3, alt: "صالة الاستقبال الرئيسية بالمركز", label: "صالة الاستقبال" },
  { src: g2, alt: "محاكي التزلج الدوّار", label: "محاكي التزلج", span: "md:col-span-2" },
  { src: g4, alt: "مدفع الثلج الصناعي يعمل داخل القاعة", label: "مدفع الثلج" },
  { src: g9, alt: "مدرسة التزلج للأطفال مع المدرب", label: "مدرسة التزلج" },
  { src: g8, alt: "غرفة تأجير معدات التزلج", label: "تأجير المعدات" },
  { src: g7, alt: "صالة الاستراحة والمدفأة", label: "صالة الاستراحة" },
  { src: g6, alt: "بدلات التزلج الرسمية للمركز", label: "زي المركز" },
];

export const Gallery = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="gallery" className="relative py-24 md:py-32 bg-deep/40">
      <div className="container">
        <div className="reveal text-center mb-14">
          <span className="inline-block rounded-full border border-border/60 bg-ice/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-ice-light">
            📸 معرض الصور
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black">
            داخل <span className="text-gradient-aurora">المشروع</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            جولة بصرية في مرافق المركز ومضاميره وخدماته
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[200px]">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => setOpen(i)}
              className={`reveal group relative overflow-hidden rounded-2xl md:rounded-3xl shadow-soft hover:shadow-lift transition-spring focus:outline-none focus:ring-2 focus:ring-ice/60 ${it.span ?? ""}`}
              style={{ ["--reveal-delay" as string]: `${i * 0.05}s` } as React.CSSProperties}
              aria-label={`تكبير: ${it.label}`}
            >
              <img
                src={it.src}
                alt={it.alt}
                loading="lazy"
                width={800}
                height={600}
                className="absolute inset-0 h-full w-full object-cover transition-spring group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/10 to-transparent opacity-90 group-hover:opacity-100 transition-smooth" />
              <span className="absolute bottom-3 right-3 left-3 text-right text-frost font-bold text-sm md:text-base drop-shadow">
                {it.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {open !== null && (
        <Suspense fallback={null}>
          <Lightbox item={items[open]} onClose={() => setOpen(null)} />
        </Suspense>
      )}
    </section>
  );
};
