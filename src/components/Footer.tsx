import { Facebook, Instagram, Twitter } from "lucide-react";
import logo from "@/assets/logo.webp";

export const Footer = () => (
  <footer className="relative border-t border-border/60 bg-night pt-16 pb-8">
    <div className="container">
      <div className="grid gap-10 md:grid-cols-3 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-ice/40 shadow-ice">
              <img src={logo} alt="شعار وادي الراحة" width={48} height={48} className="h-full w-full object-cover" />
            </span>
            <div>
              <div className="text-lg font-black text-frost">وادي الراحة</div>
              <div className="text-xs text-ice-light">Winter Sports Center</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            وجهة الرياضات الشتوية الأولى في مصر، حيث الطبيعة والثلج والمغامرة.
          </p>
          <div className="flex gap-3 mt-5">
            {[Facebook, Instagram, Twitter].map((Icon, i) => (
              <a key={i} href="#" aria-label="رابط اجتماعي" className="grid h-10 w-10 place-items-center rounded-full glass transition-spring hover:bg-gradient-ice hover:text-night hover:-translate-y-1">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-black text-frost mb-4">روابط سريعة</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#about" className="hover:text-gold transition-colors">قصتنا</a></li>
            <li><a href="#services" className="hover:text-gold transition-colors">الخدمات</a></li>
            <li><a href="#pricing" className="hover:text-gold transition-colors">الأسعار</a></li>
            <li><a href="#offers" className="hover:text-gold transition-colors">العروض</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-black text-frost mb-4">الخدمات</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>تزلج على الثلج</li>
            <li>إطلالات الجبل</li>
            <li>السبا والجاكوزي</li>
            <li>مطعم الجبل</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 pt-6 flex flex-col md:flex-row gap-2 items-center justify-between text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} مركز وادي الراحة للرياضات الشتوية. جميع الحقوق محفوظة.</p>
        <p>صُنع بإتقان 🎿❄️</p>
      </div>
    </div>
  </footer>
);
