import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause, Maximize2 } from "lucide-react";
import heroImg from "@/assets/hero-mountain.webp";
import heroVideo from "@/assets/hero-video.mp4";
import { useT } from "@/i18n/LanguageProvider";

const VIDEO_SRC = heroVideo;

export const VideoShowcase = () => {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    const s = sectionRef.current;
    if (!v || !s) return;

    const tryPlay = () => {
      v.muted = true;
      const p = v.play();
      if (p && typeof p.then === "function") {
        p.then(() => setPlaying(true)).catch(() => {
          setPlaying(false);
        });
      }
    };

    tryPlay();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const vid = videoRef.current;
          if (!vid) return;
          if (entry.isIntersecting) {
            if (vid.paused) tryPlay();
          } else {
            if (!vid.paused) {
              vid.pause();
              setPlaying(false);
            }
          }
        });
      },
      { threshold: 0.15 },
    );
    io.observe(s);
    return () => io.disconnect();
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) { v.volume = 1; v.play().catch(() => {}); }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().then(() => setPlaying(true)).catch(() => {});
    else { v.pause(); setPlaying(false); }
  };

  const goFullscreen = () => {
    const v = videoRef.current;
    if (v?.requestFullscreen) v.requestFullscreen();
  };

  return (
    <section
      id="video"
      ref={sectionRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls((s) => !s)}
      className="relative w-screen left-1/2 right-1/2 -translate-x-1/2 h-[100svh] bg-night overflow-hidden"
    >
      <video
        ref={videoRef}
        poster={heroImg}
        playsInline
        loop
        muted
        autoPlay
        preload="auto"
        onClick={togglePlay}
        onError={(e) => console.error("[VideoShowcase] error", e.currentTarget.error)}
        onLoadedData={() => console.log("[VideoShowcase] loaded")}
        className="absolute inset-0 h-full w-full object-cover cursor-pointer"
        aria-label={t("video.alt")}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
      <img
        src={heroImg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover -z-10"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-night/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-night/85 via-night/30 to-transparent" />

      <div className="absolute top-8 md:top-12 inset-x-0 z-10 text-center px-4 pointer-events-none">
        <span className="inline-block rounded-full glass-strong px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-ice-light uppercase">
          {t("video.tag")}
        </span>
        <h2 className="mt-4 text-4xl md:text-6xl font-black text-frost drop-shadow-2xl">
          {t("video.title.l1")} <span className="text-gradient-aurora">{t("video.title.l2")}</span> {t("video.title.l3")}
        </h2>
      </div>

      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-10 grid place-items-center group"
          aria-label={t("video.play")}
        >
          <div className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-frost/15 backdrop-blur-md border border-frost/30 grid place-items-center group-hover:scale-110 group-hover:bg-frost/25 transition-spring shadow-lift">
            <Play className="h-10 w-10 md:h-12 md:w-12 text-frost fill-current ms-1" />
          </div>
        </button>
      )}

      <div
        className={`absolute bottom-0 inset-x-0 z-10 flex items-center justify-between gap-3 p-4 md:p-6 transition-smooth ${
          showControls || !playing ? "opacity-100" : "opacity-0 md:opacity-60"
        }`}
      >
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="h-12 w-12 grid place-items-center rounded-full bg-frost/15 hover:bg-frost/25 text-frost backdrop-blur transition-smooth" aria-label={playing ? t("video.pause") : t("video.play")}>
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
          </button>
          <button onClick={toggleMute} className="h-12 w-12 grid place-items-center rounded-full bg-frost/15 hover:bg-frost/25 text-frost backdrop-blur transition-smooth" aria-label={muted ? t("video.unmute") : t("video.mute")}>
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
        <button onClick={goFullscreen} className="h-12 w-12 grid place-items-center rounded-full bg-frost/15 hover:bg-frost/25 text-frost backdrop-blur transition-smooth" aria-label={t("video.fullscreen")}>
          <Maximize2 className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
};
