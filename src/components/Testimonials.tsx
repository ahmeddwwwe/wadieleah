import { useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const items = [
  { name: "محمد السيد", city: "القاهرة", stars: 5, text: "تجربة لا تُنسى! أول مرة أشوف ثلج في مصر وكانت مذهلة. المدربين محترفين جداً والمنظر خيالي." },
  { name: "سارة خالد", city: "الإسكندرية", stars: 5, text: "أخذنا الأولاد وكانوا في غاية السعادة. الباقة العائلية ممتازة والسعر مناسب." },
  { name: "أحمد المنصور", city: "الجيزة", stars: 5, text: "باقة VIP تستحق كل قرش. الجاكوزي بعد التزلج كان تجربة مختلفة تماماً." },
  { name: "نور الهدى", city: "المنصورة", stars: 4, text: "المكان جميل جداً والخدمة ممتازة. التلفريك كان أجمل جزء في الرحلة." },
  { name: "عمر فاروق", city: "طنطا", stars: 5, text: "جيت مع أصحابي وكانت تجربة مختلفة عن أي حاجة عملناها قبل كده." },
];

export const Testimonials = () => {
  const [i, setI] = useState(0);
  const next = () => setI((p) => (p + 1) % items.length);
  const prev = () => setI((p) => (p - 1 + items.length) % items.length);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="aurora-bg opacity-60" aria-hidden />
      <div className="container relative">
        <div className="reveal text-center mb-12">
          <span className="inline-block rounded-full border border-border/60 bg-gold/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold">⭐ آراء الزوار</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black">ماذا <span className="text-gradient-aurora">قالوا</span> عنا</h2>
        </div>

        <div className="reveal max-w-3xl mx-auto">
          <div className="relative">
            <div className="glass-strong rounded-3xl p-8 md:p-12 min-h-[260px]">
              <div className="flex gap-1 mb-5 justify-center">
                {Array.from({ length: items[i].stars }).map((_, idx) => (
                  <Star key={idx} className="h-5 w-5 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-lg md:text-xl text-center leading-relaxed text-frost/90 font-serif">
                « {items[i].text} »
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-ice text-night font-black text-lg shadow-ice">
                  {items[i].name[0]}
                </div>
                <div>
                  <div className="font-bold text-frost">{items[i].name}</div>
                  <div className="text-xs text-muted-foreground">{items[i].city}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={prev} className="grid h-11 w-11 place-items-center rounded-full glass transition-spring hover:bg-ice hover:text-night hover:scale-110" aria-label="السابق">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                {items.map((_, idx) => (
                  <button key={idx} onClick={() => setI(idx)} aria-label={`مراجعة ${idx + 1}`} className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-gradient-gold" : "w-2 bg-border"}`} />
                ))}
              </div>
              <button onClick={next} className="grid h-11 w-11 place-items-center rounded-full glass transition-spring hover:bg-ice hover:text-night hover:scale-110" aria-label="التالي">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
