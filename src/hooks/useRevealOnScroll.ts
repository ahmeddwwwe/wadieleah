import { useEffect } from "react";

// IntersectionObserver-powered reveal — adds .in-view to any reveal class
const SELECTOR = ".reveal, .reveal-left, .reveal-right, .reveal-zoom, .reveal-blur";

export function useRevealOnScroll() {
  useEffect(() => {
    const reveal = (el: Element) => el.classList.add("in-view");
    const els = document.querySelectorAll<HTMLElement>(SELECTOR);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    els.forEach((el) => io.observe(el));
    const safety = window.setTimeout(() => {
      document.querySelectorAll(SELECTOR).forEach(reveal);
    }, 2500);
    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);
}
