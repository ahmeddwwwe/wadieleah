import { useEffect, useState } from "react";
import { Menu, X, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.webp";
import { useLang, useT } from "@/i18n/LanguageProvider";

type Props = { onBook: () => void; onPlay: () => void };

const linkKeys = [
  { href: "#about", key: "nav.about" as const },
  { href: "#services", key: "nav.services" as const },
  { href: "#pricing", key: "nav.pricing" as const },
  { href: "#offers", key: "nav.offers" as const },
  { href: "#contact", key: "nav.contact" as const },
];

export const Navbar = ({ onBook, onPlay }: Props) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const t = useT();
  const { lang, toggle } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const LangBtn = ({ className = "" }: { className?: string }) => (
    <button
      onClick={toggle}
      aria-label={t("lang.aria")}
      className={`inline-flex items-center gap-1.5 rounded-full border border-frost/20 bg-night/40 backdrop-blur px-3 py-1.5 text-xs font-bold text-frost hover:border-gold/50 hover:text-gold transition-smooth ${className}`}
    >
      <Languages className="h-3.5 w-3.5" />
      {lang === "en" ? "AR" : "EN"}
    </button>
  );

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-smooth ${scrolled ? "glass-strong py-3 shadow-soft" : "bg-transparent py-5"}`}>
        <nav className="container flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3 group">
            <span className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-ice/40 shadow-ice transition-spring group-hover:scale-105">
              <img src={logo} alt={t("footer.logoAlt")} width={48} height={48} className="h-full w-full object-cover" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-black text-frost">{t("brand.name")}</span>
              <span className="text-[0.65rem] font-light tracking-wider text-ice-light">{t("brand.tagline")}</span>
            </span>
          </a>

          <ul className="hidden items-center gap-8 lg:flex">
            {linkKeys.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="relative text-sm font-medium text-frost/80 transition-colors hover:text-frost after:absolute after:-bottom-1.5 after:right-0 after:h-0.5 after:w-0 after:bg-gold after:transition-all hover:after:w-full">
                  {t(l.key)}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 md:gap-3">
            <LangBtn className="hidden sm:inline-flex" />
            <Button onClick={onPlay} className="hidden md:inline-flex bg-gradient-ice text-night font-bold border-0 shadow-ice hover:-translate-y-0.5 hover:shadow-lift transition-spring">
              {t("nav.play")}
            </Button>
            <Button onClick={onBook} className="hidden md:inline-flex bg-gradient-gold text-night font-bold border-0 shadow-gold hover:-translate-y-0.5 hover:shadow-lift transition-spring">
              {t("nav.book")}
            </Button>
            <button onClick={() => setOpen((v) => !v)} className="lg:hidden grid h-10 w-10 place-items-center rounded-xl glass text-frost" aria-label={t("nav.menu")}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      <div className={`fixed inset-0 z-40 lg:hidden transition-smooth ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="absolute inset-0 bg-night/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside className={`absolute start-0 top-0 h-full w-[78%] max-w-xs glass-strong p-8 pt-24 transition-spring ${open ? "translate-x-0" : "rtl:translate-x-full ltr:-translate-x-full"}`}>
          <div className="mb-4">
            <LangBtn />
          </div>
          <ul className="flex flex-col gap-1">
            {linkKeys.map((l) => (
              <li key={l.href} className="border-b border-border/40">
                <a href={l.href} onClick={() => setOpen(false)} className="block py-4 text-lg font-medium text-frost/90 hover:text-gold">
                  {t(l.key)}
                </a>
              </li>
            ))}
          </ul>
          <Button onClick={() => { setOpen(false); onPlay(); }} className="mt-8 w-full bg-gradient-ice text-night font-bold shadow-ice">
            {t("nav.playGame")}
          </Button>
          <Button onClick={() => { setOpen(false); onBook(); }} className="mt-3 w-full bg-gradient-gold text-night font-bold shadow-gold">
            {t("nav.book")}
          </Button>
        </aside>
      </div>
    </>
  );
};
