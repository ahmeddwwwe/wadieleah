import { useEffect, useRef } from "react";

export const SnowCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Respect user preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile = window.innerWidth < 768;
    const FLAKE_COUNT = isMobile ? 35 : 80;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const makeFlake = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.4 + 0.4,
      s: Math.random() * 1.1 + 0.3,
      d: (Math.random() - 0.5) * 0.6,
      o: Math.random() * 0.55 + 0.2,
    });
    let flakes = Array.from({ length: FLAKE_COUNT }, makeFlake);
    let raf = 0;
    let active = true; // pauses when scrolled past first viewport

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!active || document.visibilityState !== "visible") return;
      ctx.clearRect(0, 0, w, h);
      const t = Date.now() / 3000;
      for (const f of flakes) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235,245,255,${f.o})`;
        ctx.fill();
        f.y += f.s;
        f.x += f.d + Math.sin(t + f.x * 0.01) * 0.25;
        if (f.y > h) { f.y = -4; f.x = Math.random() * w; }
        if (f.x > w) f.x = 0;
        if (f.x < 0) f.x = w;
      }
    };

    const onScroll = () => {
      // pause snow once user scrolls past first viewport — saves CPU
      active = window.scrollY < window.innerHeight * 1.2;
      if (!active) ctx.clearRect(0, 0, w, h);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <canvas id="snow-canvas" ref={ref} aria-hidden="true" />;
};
