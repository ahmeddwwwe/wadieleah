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
import { useT } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

const Lightbox = lazy(() => import("./Lightbox").then((m) => ({ default: m.Lightbox })));

type Item = { src: string; altKey: TranslationKey; labelKey: TranslationKey; span?: string; reveal?: string };

const items: Item[] = [
  { src: g1, altKey: "gallery.alt.main", labelKey: "gallery.label.main", span: "md:col-span-2 md:row-span-2", reveal: "reveal-zoom" },
  { src: g2, altKey: "gallery.alt.simulator", labelKey: "gallery.label.simulator", span: "md:col-span-2", reveal: "reveal-left" },
  { src: g3, altKey: "gallery.alt.lobby", labelKey: "gallery.label.lobby", reveal: "reveal-blur" },
  { src: g5, altKey: "gallery.alt.slope", labelKey: "gallery.label.slope", span: "md:row-span-2", reveal: "reveal-right" },
  { src: g4, altKey: "gallery.alt.cannon", labelKey: "gallery.label.cannon", reveal: "reveal-blur" },
  { src: g9, altKey: "gallery.alt.school", labelKey: "gallery.label.school", reveal: "reveal" },
  { src: g7, altKey: "gallery.alt.lounge", labelKey: "gallery.label.lounge", span: "md:col-span-2", reveal: "reveal-left" },
  { src: g8, altKey: "gallery.alt.rental", labelKey: "gallery.label.rental", reveal: "reveal-blur" },
  { src: g6, altKey: "gallery.alt.uniforms", labelKey: "gallery.label.uniforms", reveal: "reveal" },
];

export const Gallery = () => {
  const t = useT();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="gallery" className="relative py-24 md:py-32 bg-deep/40 overflow-hidden">
      <div className="aurora-bg opacity-40" aria-hidden />
      <div className="container relative">
        <div className="reveal text-center mb-14">
          <span className="inline-block rounded-full border border-border/60 bg-ice/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-ice-light">
            {t("gallery.tag")}
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black">
            {t("gallery.title.l1")} <span className="text-gradient-aurora">{t("gallery.title.l2")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            {t("gallery.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[180px] md:auto-rows-[220px]">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => setOpen(i)}
              className={`${it.reveal ?? "reveal"} group relative overflow-hidden rounded-2xl md:rounded-3xl shadow-soft hover:shadow-lift transition-spring focus:outline-none focus:ring-2 focus:ring-ice/60 hover:-translate-y-1 ${it.span ?? ""}`}
              style={{ ["--reveal-delay" as string]: `${i * 0.08}s` } as React.CSSProperties}
              aria-label={`${t("gallery.zoom")}${t(it.labelKey)}`}
            >
              <img
                src={it.src}
                alt={t(it.altKey)}
                loading="lazy"
                width={800}
                height={600}
                className="absolute inset-0 h-full w-full object-cover transition-spring duration-700 group-hover:scale-125 group-hover:rotate-1"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent opacity-90 group-hover:opacity-100 transition-smooth" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-frost/20 to-transparent skew-x-[-20deg]" />
              <span className="absolute bottom-3 end-3 start-3 text-end text-frost font-bold text-sm md:text-base drop-shadow-lg group-hover:translate-y-[-4px] transition-spring">
                {t(it.labelKey)}
              </span>
              <span className="absolute top-3 start-3 h-8 w-8 rounded-full bg-frost/20 backdrop-blur-md grid place-items-center text-frost text-xs opacity-0 group-hover:opacity-100 transition-smooth">
                ↗
              </span>
            </button>
          ))}
        </div>
      </div>

      {open !== null && (
        <Suspense fallback={null}>
          <Lightbox item={{ src: items[open].src, alt: t(items[open].altKey), label: t(items[open].labelKey) }} onClose={() => setOpen(null)} />
        </Suspense>
      )}
    </section>
  );
};
