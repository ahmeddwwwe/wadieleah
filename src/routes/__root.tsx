import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { LanguageProvider, useT } from "../i18n/LanguageProvider";

function NotFoundInner() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black text-gradient-aurora">404</h1>
        <h2 className="mt-4 text-xl font-black text-frost">{t("nf.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("nf.desc")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-gold px-5 py-2.5 text-sm font-bold text-night shadow-gold transition-spring hover:-translate-y-0.5"
          >
            {t("nf.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <LanguageProvider>
      <NotFoundInner />
    </LanguageProvider>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Wadi Al-Raha | Egypt's First Snow Experience" },
      { name: "description", content: "Wadi Al-Raha — Egypt's first winter-sports and skiing destination, on the peaks of the Saint Catherine mountains." },
      { name: "author", content: "Wadi Al-Raha" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Wadi Al-Raha | Egypt's First Snow Experience" },
      { property: "og:description", content: "Wadi Al-Raha — Egypt's first winter-sports and skiing destination, on the peaks of the Saint Catherine mountains." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Wadi Al-Raha | Egypt's First Snow Experience" },
      { name: "twitter:description", content: "Wadi Al-Raha — Egypt's first winter-sports and skiing destination, on the peaks of the Saint Catherine mountains." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/87297350-0336-4f2b-83cc-de44b80be6d8/id-preview-513556e4--552b17a3-7a1b-496b-b2b8-4b21b8ac1a57.lovable.app-1776961827865.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/87297350-0336-4f2b-83cc-de44b80be6d8/id-preview-513556e4--552b17a3-7a1b-496b-b2b8-4b21b8ac1a57.lovable.app-1776961827865.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&family=Inter:wght@400;600;800;900&family=Amiri:wght@700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <LanguageProvider>
      <Outlet />
    </LanguageProvider>
  );
}
