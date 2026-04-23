import { useEffect } from "react";

// IntersectionObserver-powered reveal — adds .in-view to any .reveal / .reveal-left / .reveal-right
export const useRevealOnScroll = () => {
  useEffect(() => {
    const reveal = (el: Element) => el.classList.add("in-view");
    const els = document.querySelectorAll<HTMLElement>(".reveal, .reveal-left, .reveal-right");
    // Fallback: reveal anything already inside (or near) the viewport on mount
    // so short viewports never get stuck with hidden content.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px 200px 0px" },
    );
    els.forEach((el) => io.observe(el));
    // Safety net — if for any reason observer doesn't fire, force-reveal after 2s
    const safety = window.setTimeout(() => {
      document.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach(reveal);
    }, 2000);
    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);
};
