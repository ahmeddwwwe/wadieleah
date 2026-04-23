import { Facebook, Instagram, Twitter } from "lucide-react";
import logo from "@/assets/logo.webp";
import { useT } from "@/i18n/LanguageProvider";

export const Footer = () => {
  const t = useT();
  return (
    <footer className="relative border-t border-border/60 bg-night pt-16 pb-8">
      <div className="container">
        <div className="grid gap-10 md:grid-cols-3 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-ice/40 shadow-ice">
                <img src={logo} alt={t("footer.logoAlt")} width={48} height={48} className="h-full w-full object-cover" />
              </span>
              <div>
                <div className="text-lg font-black text-frost">{t("brand.name")}</div>
                <div className="text-xs text-ice-light">{t("brand.tagline")}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.about")}
            </p>
            <div className="flex gap-3 mt-5">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#" aria-label={t("footer.social")} className="grid h-10 w-10 place-items-center rounded-full glass transition-spring hover:bg-gradient-ice hover:text-night hover:-translate-y-1">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-black text-frost mb-4">{t("footer.links")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#about" className="hover:text-gold transition-colors">{t("nav.about")}</a></li>
              <li><a href="#services" className="hover:text-gold transition-colors">{t("nav.services")}</a></li>
              <li><a href="#pricing" className="hover:text-gold transition-colors">{t("nav.pricing")}</a></li>
              <li><a href="#offers" className="hover:text-gold transition-colors">{t("nav.offers")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-frost mb-4">{t("footer.services")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t("footer.f.skiing")}</li>
              <li>{t("footer.f.views")}</li>
              <li>{t("footer.f.spa")}</li>
              <li>{t("footer.f.maze")}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 pt-6 flex flex-col md:flex-row gap-2 items-center justify-between text-xs text-muted-foreground">
          <p>{t("footer.copyright").replace("{year}", String(new Date().getFullYear()))}</p>
          <p>{t("footer.craft")}</p>
        </div>
      </div>
    </footer>
  );
};
