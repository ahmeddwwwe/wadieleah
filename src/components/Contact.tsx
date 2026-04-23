import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import { useT } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";

type Item = { icon: typeof Phone; titleKey: TranslationKey; value: string; valueKey?: TranslationKey; href: string };

const items: Item[] = [
  { icon: Phone, titleKey: "contact.phone.title", value: "+20 123 456 789", href: "tel:+20123456789" },
  { icon: MessageCircle, titleKey: "contact.whatsapp.title", value: "+20 123 456 789", href: "https://wa.me/20123456789" },
  { icon: Mail, titleKey: "contact.email.title", value: "info@wadi-alraha.com", href: "mailto:info@wadi-alraha.com" },
  { icon: MapPin, titleKey: "contact.location.title", value: "", valueKey: "contact.location.value", href: "https://maps.google.com/?q=Saint+Catherine+Sinai" },
];

export const Contact = () => {
  const t = useT();
  return (
    <section id="contact" className="relative py-24 md:py-32 bg-deep/50">
      <div className="container">
        <div className="reveal text-center mb-12">
          <span className="inline-block rounded-full border border-border/60 bg-ice/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-ice-light">{t("contact.tag")}</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black">{t("contact.title.l1")} <span className="text-gradient-aurora">{t("contact.title.l2")}</span></h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {items.map((it, i) => (
            <a
              key={it.titleKey}
              href={it.href}
              target={it.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="reveal group block rounded-3xl bg-gradient-card border border-border/60 p-6 text-center transition-spring hover:-translate-y-2 hover:border-ice/40 hover:shadow-ice"
              style={{ ["--reveal-delay" as string]: `${i * 0.08}s` } as React.CSSProperties}
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-ice shadow-ice mb-4 transition-spring group-hover:scale-110 group-hover:rotate-[-6deg]">
                <it.icon className="h-6 w-6 text-night" strokeWidth={2} />
              </div>
              <h4 className="font-black text-frost mb-1">{t(it.titleKey)}</h4>
              <p className="text-sm text-muted-foreground break-all">{it.valueKey ? t(it.valueKey) : it.value}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
