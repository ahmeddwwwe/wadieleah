import { useEffect, useRef } from "react";
import { Play, MapPin, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-mountain.webp";
import { useT } from "@/i18n/LanguageProvider";

type Props = { onBook: () => void };

export const Hero = ({ onBook }: Props) => {
  const t = useT();
  const mountainsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let rafId = 0;
    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          if (mountainsRef.current)
            mountainsRef.current.style.transform = `translate3d(0, ${y * 0.15}px, 0)`;
        }
        pending = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section id="hero" className="relative min-h-[100svh] overflow-hidden bg-gradient-hero flex items-center">
      <div ref={mountainsRef} className="absolute inset-0 will-change-transform">
        <img
          src={heroImg}
          alt={t("hero.imgAlt")}
          width={1600}
          height={900}
          fetchPriority="high"
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night/40 via-night/55 to-night" />
      </div>

      <div className="aurora-bg" aria-hidden />

      <div className="container relative z-10 pt-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold animate-fade-down opacity-0" style={{ animationDelay: "0.4s" }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-75 animate-pulse-soft" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            <MapPin className="h-3.5 w-3.5" />
            {t("hero.location")}
          </div>

          <h1 className="mt-6 font-black leading-[0.95] tracking-tight text-frost [font-size:clamp(3rem,8vw,6rem)]">
            <span className="block opacity-0 animate-fade-in" style={{ animationDelay: "0.5s" }}>{t("hero.title.l1")}</span>
            <span className="block text-gradient-frost opacity-0 animate-fade-in" style={{ animationDelay: "0.7s" }}>{t("hero.title.l2")}</span>
            <span className="block opacity-0 animate-fade-in" style={{ animationDelay: "0.9s" }}>{t("hero.title.l3")}</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-frost/75 opacity-0 animate-fade-in" style={{ animationDelay: "1.1s" }}>
            {t("hero.subtitle")}
          </p>

          <div className="mt-10 flex flex-wrap gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "1.3s" }}>
            <Button size="lg" onClick={onBook} className="bg-gradient-ice text-night font-bold shadow-ice hover:shadow-lift hover:-translate-y-1 transition-spring h-14 px-8 text-base">
              <Play className="h-4 w-4 me-2 fill-current" />
              {t("hero.cta.start")}
            </Button>
            <Button size="lg" variant="outline" onClick={onBook} className="h-14 px-8 border-frost/25 bg-transparent text-frost hover:border-gold hover:text-gold hover:bg-gold/5 transition-spring text-base">
              {t("hero.cta.book")}
            </Button>
          </div>

          <div className="mt-16 flex items-center gap-3 text-sm text-muted-foreground opacity-0 animate-fade-in" style={{ animationDelay: "1.5s" }}>
            <ArrowDown className="h-5 w-5 text-ice animate-bounce-soft" />
            <span>{t("hero.scroll")}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
