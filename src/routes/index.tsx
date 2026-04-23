import { useState, lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { VideoShowcase } from "@/components/VideoShowcase";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { Gallery } from "@/components/Gallery";
import { Pricing } from "@/components/Pricing";
import { Offers } from "@/components/Offers";
import { Testimonials } from "@/components/Testimonials";
import { CTA } from "@/components/CTA";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { SnowCanvas } from "@/components/SnowCanvas";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

// Lazy-loaded — heavy components loaded on demand
const BookingModal = lazy(() =>
  import("@/components/BookingModal").then((m) => ({ default: m.BookingModal })),
);
const SkiGame2D = lazy(() =>
  import("@/components/game/SkiGame2D").then((m) => ({ default: m.SkiGame2D })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "وادي الراحة | تجربة الثلج الأولى في مصر" },
      {
        name: "description",
        content:
          "أول وجهة للرياضات الشتوية والتزلج على الثلج في مصر، على قمم جبال سانت كاترين على ارتفاع 2600م.",
      },
      { property: "og:title", content: "وادي الراحة | تجربة الثلج الأولى في مصر" },
      {
        property: "og:description",
        content: "احجز تجربتك الثلجية في قلب جبال سانت كاترين — تزلج، تلفريك، سبا، ومرافق فاخرة.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  useRevealOnScroll();

  const openBooking = () => setBookingOpen(true);
  const openGame = () => setGameOpen(true);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <SnowCanvas />
      <Navbar onBook={openBooking} onPlay={openGame} />
      <main>
        <Hero onBook={openBooking} />
        <StatsBar />
        <VideoShowcase />
        <About />
        <Services />
        <Gallery />
        <Pricing onBook={openBooking} />
        <Offers onBook={openBooking} />
        <Testimonials />
        <CTA onBook={openBooking} />
        <Contact />
      </main>
      <Footer />

      {/* Lazy-loaded modals — only loaded when opened */}
      {bookingOpen && (
        <Suspense fallback={null}>
          <BookingModal open={bookingOpen} onOpenChange={setBookingOpen} />
        </Suspense>
      )}

      {/* Floating play button */}
      {!gameOpen && (
        <Button
          onClick={openGame}
          size="lg"
          className="fixed bottom-6 left-6 z-40 h-16 px-6 rounded-full bg-gradient-ice text-night font-black shadow-ice hover:shadow-lift hover:-translate-y-1 transition-spring"
        >
          <Play className="h-5 w-5 ml-2 fill-current" />
          ⛷️ العب اللعبة
        </Button>
      )}

      {gameOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 grid place-items-center bg-night/95 backdrop-blur">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full border-4 border-ice/30 border-t-ice animate-spin" />
                <p className="mt-4 text-frost font-bold">جارٍ تحميل اللعبة...</p>
              </div>
            </div>
          }
        >
          <SkiGame2D />
          <button
            onClick={() => setGameOpen(false)}
            className="fixed top-4 left-4 z-[60] h-10 w-10 rounded-full glass-strong text-frost grid place-items-center hover:bg-night/80 transition-smooth"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </Suspense>
      )}

      <Toaster />
    </div>
  );
}
