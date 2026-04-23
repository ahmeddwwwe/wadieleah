import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause, Maximize2 } from "lucide-react";
import heroImg from "@/assets/hero-mountain.webp";

const VIDEO_SRC = "/hero-video.mp4"; // served from /public — no bundle bloat

export const VideoShowcase = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const userMutedRef = useRef(false);

  // Lazy-mount video only when section approaches viewport
  useEffect(() => {
    const s = sectionRef.current;
    if (!s) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(s);
    return () => io.disconnect();
  }, []);

  // Auto play/pause based on visibility
  useEffect(() => {
    if (!loaded) return;
    const v = videoRef.current;
    const s = sectionRef.current;
    if (!v || !s) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const vid = videoRef.current;
        if (!vid) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
          vid.play().then(() => setPlaying(true)).catch(() => {
            vid.muted = true;
            setMuted(true);
            vid.play().then(() => setPlaying(true)).catch(() => {});
          });
        } else {
          vid.pause();
          setPlaying(false);
        }
      },
      { threshold: [0, 0.4, 0.75] },
    );
    io.observe(s);
    return () => io.disconnect();
  }, [loaded]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    userMutedRef.current = v.muted;
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
      className="relative w-screen left-1/2 right-1/2 -translate-x-1/2 h-[100svh] bg-night overflow-hidden"
    >
      {loaded ? (
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          poster={heroImg}
          playsInline
          loop
          muted
          preload="metadata"
          onClick={togglePlay}
          className="absolute inset-0 h-full w-full object-cover cursor-pointer"
          aria-label="فيديو جولة داخل مركز وادي الراحة"
        />
      ) : (
        <img src={heroImg} alt="جبال سانت كاترين" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night/80 to-transparent" />

      <div className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-between gap-3 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="h-12 w-12 grid place-items-center rounded-full bg-frost/15 hover:bg-frost/25 text-frost backdrop-blur transition-smooth" aria-label={playing ? "إيقاف" : "تشغيل"}>
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
          </button>
          <button onClick={toggleMute} className="h-12 w-12 grid place-items-center rounded-full bg-frost/15 hover:bg-frost/25 text-frost backdrop-blur transition-smooth" aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}>
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
        <button onClick={goFullscreen} className="h-12 w-12 grid place-items-center rounded-full bg-frost/15 hover:bg-frost/25 text-frost backdrop-blur transition-smooth" aria-label="ملء الشاشة">
          <Maximize2 className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
};
