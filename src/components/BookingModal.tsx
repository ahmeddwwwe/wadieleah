import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Snowflake, Users } from "lucide-react";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export const BookingModal = ({ open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onOpenChange(false);
      toast.success("تم إرسال طلب الحجز!", {
        description: "فريقنا هيتواصل معاك في أقرب وقت 🎿",
      });
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-ice/20 max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-ice shadow-ice mb-2">
            <Snowflake className="h-7 w-7 text-night" strokeWidth={2.5} />
          </div>
          <DialogTitle className="text-2xl font-black text-frost">احجز مغامرتك</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            أماكن محدودة — لا تفوّت الفرصة
          </DialogDescription>
          <div className="inline-flex items-center gap-2 text-xs text-gold mt-1">
            <Users className="h-3.5 w-3.5" />
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-75 animate-pulse-soft" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            ٢٣ شخص يشاهدون هذه الصفحة الآن
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3 mt-2">
          <Input required placeholder="الاسم الكامل" className="bg-mid/50 border-border/60 h-11" />
          <Input required type="tel" placeholder="رقم الهاتف" className="bg-mid/50 border-border/60 h-11" />
          <Input required type="email" placeholder="البريد الإلكتروني" className="bg-mid/50 border-border/60 h-11" />
          <Select required>
            <SelectTrigger className="bg-mid/50 border-border/60 h-11">
              <SelectValue placeholder="اختر الباقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">الباقة الأساسية — 2,500 ج.م</SelectItem>
              <SelectItem value="premium">الباقة المميزة — 4,500 ج.م</SelectItem>
              <SelectItem value="vip">الباقة VIP — 7,500 ج.م</SelectItem>
            </SelectContent>
          </Select>
          <Input required type="date" className="bg-mid/50 border-border/60 h-11" />
          <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-gold text-night font-black shadow-gold hover:shadow-lift transition-spring text-base">
            {loading ? "جارٍ الإرسال..." : "إرسال طلب الحجز 🏔️"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
