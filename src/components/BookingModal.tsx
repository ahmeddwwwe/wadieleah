import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Snowflake, Users } from "lucide-react";
import { useT } from "@/i18n/LanguageProvider";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export const BookingModal = ({ open, onOpenChange }: Props) => {
  const t = useT();
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onOpenChange(false);
      toast.success(t("book.toast.title"), {
        description: t("book.toast.desc"),
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
          <DialogTitle className="text-2xl font-black text-frost">{t("book.title")}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("book.desc")}
          </DialogDescription>
          <div className="inline-flex items-center gap-2 text-xs text-gold mt-1">
            <Users className="h-3.5 w-3.5" />
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-75 animate-pulse-soft" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            {t("book.viewing")}
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3 mt-2">
          <Input required placeholder={t("book.field.name")} className="bg-mid/50 border-border/60 h-11" />
          <Input required type="tel" placeholder={t("book.field.phone")} className="bg-mid/50 border-border/60 h-11" />
          <Input required type="email" placeholder={t("book.field.email")} className="bg-mid/50 border-border/60 h-11" />
          <Select required>
            <SelectTrigger className="bg-mid/50 border-border/60 h-11">
              <SelectValue placeholder={t("book.field.package")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">{t("book.opt.basic")}</SelectItem>
              <SelectItem value="premium">{t("book.opt.premium")}</SelectItem>
              <SelectItem value="vip">{t("book.opt.vip")}</SelectItem>
            </SelectContent>
          </Select>
          <Input required type="date" className="bg-mid/50 border-border/60 h-11" />
          <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-gold text-night font-black shadow-gold hover:shadow-lift transition-spring text-base">
            {loading ? t("book.sending") : t("book.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
