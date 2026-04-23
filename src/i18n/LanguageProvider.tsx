import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { translations, TranslationKey } from "./translations";

export type Lang = "en" | "ar";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: TranslationKey) => string;
  dir: "ltr" | "rtl";
};

const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "wadi-lang";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", dir);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((p) => (p === "en" ? "ar" : "en")), []);
  const t = useCallback(
    (key: TranslationKey) => {
      const entry = translations[key];
      if (!entry) return String(key);
      return entry[lang] ?? entry.en ?? String(key);
    },
    [lang],
  );

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, toggle, t, dir: lang === "ar" ? "rtl" : "ltr" }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
};

export const useT = () => useLang().t;
