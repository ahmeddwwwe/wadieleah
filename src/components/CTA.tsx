import { Button } from "@/components/ui/button";
import { Phone, Snowflake } from "lucide-react";
import skiingImg from "@/assets/snow-cannon.webp";
import { useT, useLang } from "@/i18n/LanguageProvider";

type Props = { onBook: () => void };

export const CTA = ({ onBook }: Props) => {
  const t = useT();
  const { lang } = useLang();
  const initials = lang === "ar" ? ["م", "س", "أ", "ن"] : ["M", "S", "A", "N"];
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <img src={skiingImg} alt="" loading="lazy" width={1600} height={900} className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/80 to-night/60" />
      </div>
      <div className="aurora-bg" aria-hidden />

      <div className="container relative text-center">
        <div className="reveal max-w-2xl mx-auto">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-gold shadow-gold mb-6 float-y">
            <Snowflake className="h-8 w-8 text-night" strokeWidth={2.5} />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-frost leading-tight">
            {t("cta.title.l1")} <span className="text-gradient-aurora">{t("cta.title.l2")}</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            {t("cta.subtitle")}
          </p>

          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <div className="flex -space-x-2 rtl:-space-x-reverse">
              {initials.map((l) => (
                <div key={l} className="grid h-10 w-10 place-items-center rounded-full bg-gradient-ice text-night font-black border-2 border-night text-sm">
                  {l}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{t("cta.social")}</span>
          </div>

          <div className="mt-10 flex gap-4 justify-center flex-wrap">
            <Button onClick={onBook} size="lg" className="h-14 px-8 bg-gradient-gold text-night font-black shadow-gold hover:shadow-lift hover:-translate-y-1 transition-spring text-base">
              {t("cta.book")}
            </Button>
            <a href="#contact">
              <Button size="lg" variant="outline" className="h-14 px-8 border-frost/25 bg-transparent text-frost hover:border-ice hover:text-ice hover:bg-ice/5 transition-spring text-base">
                <Phone className="h-4 w-4 me-2" />
                {t("cta.contact")}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
