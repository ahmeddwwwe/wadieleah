import resortImg from "@/assets/saint-catherine-resort.webp";
import lobbyImg from "@/assets/locker-room.webp";
import equipmentImg from "@/assets/equipment-lounge.webp";

export const About = () => (
  <section id="about" className="relative py-24 md:py-32">
    <div className="aurora-bg" aria-hidden />
    <div className="container relative">
      <div className="reveal text-center mb-16">
        <span className="inline-block rounded-full border border-border/60 bg-ice/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-ice-light">
          🏔️ قصتنا
        </span>
        <h2 className="mt-4 text-4xl md:text-5xl font-black">
          مركز <span className="text-gradient-aurora">وادي الراحة</span>
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="reveal-right relative">
          <div className="grid grid-cols-3 gap-3 h-[480px]">
            <div className="col-span-2 row-span-2 relative overflow-hidden rounded-3xl shadow-lift group">
              <img src={resortImg} alt="مركز وادي الراحة في سانت كاترين" loading="lazy" width={1200} height={800} className="h-full w-full object-cover transition-smooth group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-transparent" />
              <span className="absolute bottom-4 right-4 text-sm font-bold text-frost bg-night/50 backdrop-blur px-3 py-1.5 rounded-full">
                سانت كاترين • ٢٦٠٠م
              </span>
            </div>
            <div className="relative overflow-hidden rounded-2xl shadow-soft group">
              <img src={lobbyImg} alt="صالة الاستقبال" loading="lazy" width={400} height={300} className="h-full w-full object-cover transition-smooth group-hover:scale-110" />
            </div>
            <div className="relative overflow-hidden rounded-2xl shadow-soft group">
              <img src={equipmentImg} alt="المعدات الاحترافية" loading="lazy" width={400} height={300} className="h-full w-full object-cover transition-smooth group-hover:scale-110" />
            </div>
          </div>

          <div className="absolute -top-6 -right-6 glass-strong rounded-2xl p-4 text-center shadow-ice">
            <div className="text-3xl font-black text-gradient-gold">2026</div>
            <div className="text-[0.7rem] text-muted-foreground font-medium">تأسس</div>
          </div>
        </div>

        <div className="reveal-left space-y-6">
          <p className="text-2xl md:text-3xl font-bold leading-relaxed text-frost">
            أول وجهة متخصصة في الرياضات الشتوية في مصر، في قلب جبال سانت كاترين.
          </p>
          <p className="text-muted-foreground leading-loose text-lg">
            نقدم تجربة فريدة من نوعها — حيث الثلج الطبيعي يلتقي بأحدث التقنيات، والمدربون المعتمدون يضمنون أمانك ومتعتك في كل لحظة.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { n: "١٥", l: "مدرب معتمد" },
              { n: "٨", l: "مضامير تزلج" },
              { n: "٢٤/٧", l: "دعم فني" },
            ].map((s) => (
              <div key={s.l} className="glass rounded-2xl p-5 text-center transition-spring hover:-translate-y-1 hover:border-ice/40">
                <div className="text-3xl font-black text-gradient-gold">{s.n}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
