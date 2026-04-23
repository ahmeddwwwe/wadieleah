import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Trophy, Home, Pause } from "lucide-react";

// ============================================================
// Types
// ============================================================
type GameState = "menu" | "playing" | "paused" | "over";

type Obstacle = {
  kind: "tree" | "rock" | "bump" | "coin" | "gateR" | "gateB" | "boost";
  x: number; // world x (centered at 0, ±track width)
  y: number; // world y (distance traveled downhill, increases over time)
  taken?: boolean;
  r: number; // collision radius (world units)
  // extra per-kind state
  seed?: number;
};

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; // seconds remaining
  maxLife: number;
  size: number;
  color: string;
  kind: "snow" | "spark" | "flake" | "coin";
};

// ============================================================
// Constants — tuned for feel
// ============================================================
const TRACK_HALF_WIDTH = 280;        // world units, each side of center
const BASE_SPEED = 150;              // baseline downhill speed (units/s) — slower start
const MAX_SPEED = 540;
const BOOST_SPEED = 700;
const GRAVITY_ACCEL = 22;            // accel toward max speed
const BRAKE_DECEL = 280;
const BOOST_ACCEL = 420;
const STEER_ACCEL = 1500;            // lateral accel when holding key — much more responsive
const STEER_IMPULSE = 180;           // instant velocity bump on tap (one-tap dodge)
const STEER_DAMP = 5.5;              // lateral damping
const MAX_LATERAL = 520;
const FINISH_DISTANCE = 6000;        // world units to finish
const WORLD_ZOOM = 1.35;

// Reward tiers — score → free hours of equipment usage
const REWARD_TIERS = [
  { score: 800,  hours: 1, label: "ساعة مجانية", code: "SKI-BRONZE" },
  { score: 2000, hours: 3, label: "٣ ساعات مجانية", code: "SKI-SILVER" },
  { score: 4000, hours: 6, label: "٦ ساعات مجانية", code: "SKI-GOLD" },
  { score: 7000, hours: 12, label: "يوم كامل مجاني", code: "SKI-PLATINUM" },
];

// ============================================================
// Utility
// ============================================================
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (min: number, max: number) => min + Math.random() * (max - min);

// ============================================================
// Main game component
// ============================================================
export const SkiGame2D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<GameState>("menu");
  const [hud, setHud] = useState({ speed: 0, distance: 0, score: 0, coins: 0, gates: 0 });
  const [best, setBest] = useState<number>(() => Number(localStorage.getItem("ski2d-best") || 0));
  const [overMsg, setOverMsg] = useState("");

  // Game state kept in refs for the rAF loop (no re-render per frame)
  const g = useRef({
    running: false,
    paused: false,
    // skier in world coords
    sx: 0,            // lateral (-TRACK_HALF_WIDTH .. TRACK_HALF_WIDTH)
    svx: 0,           // lateral velocity
    sy: 0,            // downhill distance
    speed: BASE_SPEED,
    // input
    keys: { left: false, right: false, brake: false, boost: false },
    // world
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    nextObstacleY: 0,
    // scoring
    score: 0, coins: 0, gates: 0,
    // animation timers
    t: 0,
    skierAnim: 0,
    screenShake: 0,
    flash: 0,
    boostFlash: 0,
    // viewport
    w: 800, h: 600,
    dpr: 1,
    // background parallax seeds
    bgSeed: Math.random() * 1000,
  });

  // ============================================================
  // World generation — smoothly spawn obstacles as we descend
  // ============================================================
  const spawnObstacles = useCallback(() => {
    const s = g.current;
    while (s.nextObstacleY < s.sy + 2000) {
      const y = s.nextObstacleY;
      // Difficulty curve: easy first 25%, then ramps up sharply
      const progress = clamp(s.sy / FINISH_DISTANCE, 0, 1);
      const difficulty = progress < 0.25
        ? progress * 0.4                      // very easy start (0..0.1)
        : 0.1 + Math.pow((progress - 0.25) / 0.75, 1.8) * 0.9; // ramps to ~1.0
      // Density grows with difficulty
      const density = 1 + difficulty * 4;     // 1..5 items per row
      const count = Math.max(1, Math.round(rand(density - 0.5, density + 1)));
      // Spacing tightens as difficulty rises
      const rowSpacing = 200 - difficulty * 80; // 200 → 120
      for (let i = 0; i < count; i++) {
        const row = y + rand(20, 100);
        const kind = pickKind(difficulty);
        const x = rand(-TRACK_HALF_WIDTH + 30, TRACK_HALF_WIDTH - 30);
        s.obstacles.push(makeObstacle(kind, x, row));
      }
      // Gates appear more often as we descend
      if (Math.random() < 0.4 + difficulty * 0.3) {
        const gy = y + rand(40, 90);
        const gx = rand(-TRACK_HALF_WIDTH + 80, TRACK_HALF_WIDTH - 80);
        const color: Obstacle["kind"] = Math.random() < 0.5 ? "gateR" : "gateB";
        s.obstacles.push(makeObstacle(color, gx - 35, gy));
        s.obstacles.push(makeObstacle(color, gx + 35, gy));
      }
      // Boost arrows — more frequent late game to give skill ceiling
      if (Math.random() < 0.15 + difficulty * 0.15) {
        s.obstacles.push(makeObstacle("boost", rand(-TRACK_HALF_WIDTH + 40, TRACK_HALF_WIDTH - 40), y + rand(30, 90)));
      }
      s.nextObstacleY += rowSpacing;
    }
    s.obstacles = s.obstacles.filter((o) => o.y > s.sy - 200);
  }, []);

  const pickKind = (difficulty: number): Obstacle["kind"] => {
    const r = Math.random();
    // Easy start: more coins, fewer rocks
    const wCoin = 0.45 - difficulty * 0.15;     // 0.45 → 0.30
    const wTree = 0.20 + difficulty * 0.15;     // 0.20 → 0.35
    const wRock = 0.05 + difficulty * 0.20;     // 0.05 → 0.25 (rare early)
    const wBump = 0.15;
    const total = wCoin + wTree + wRock + wBump;
    const n = r * total;
    if (n < wCoin) return "coin";
    if (n < wCoin + wTree) return "tree";
    if (n < wCoin + wTree + wRock) return "rock";
    return "bump";
  };

  const makeObstacle = (kind: Obstacle["kind"], x: number, y: number): Obstacle => {
    const radii: Record<Obstacle["kind"], number> = {
      tree: 18, rock: 20, bump: 16, coin: 14, gateR: 10, gateB: 10, boost: 22,
    };
    return { kind, x, y, r: radii[kind], seed: Math.random() };
  };

  // ============================================================
  // Particle helpers
  // ============================================================
  const emitSnowTrail = (sx: number, sy: number, speed: number, dt: number) => {
    const s = g.current;
    const count = Math.floor(speed * dt * 0.08) + 1;
    for (let i = 0; i < count; i++) {
      s.particles.push({
        x: sx + rand(-8, 8),
        y: sy - rand(0, 8),
        vx: rand(-40, 40),
        vy: -rand(30, 80), // upward in world (behind skier visually)
        life: rand(0.4, 0.9),
        maxLife: 0.9,
        size: rand(2, 5),
        color: "#ffffff",
        kind: "snow",
      });
    }
  };

  const emitCrash = (x: number, y: number) => {
    const s = g.current;
    for (let i = 0; i < 30; i++) {
      s.particles.push({
        x, y,
        vx: rand(-260, 260),
        vy: rand(-260, 120),
        life: rand(0.5, 1.1),
        maxLife: 1.1,
        size: rand(3, 7),
        color: Math.random() < 0.6 ? "#ffffff" : "#dfeeff",
        kind: "spark",
      });
    }
  };

  const emitCoinBurst = (x: number, y: number) => {
    const s = g.current;
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      s.particles.push({
        x, y,
        vx: Math.cos(ang) * rand(80, 160),
        vy: Math.sin(ang) * rand(80, 160),
        life: 0.5,
        maxLife: 0.5,
        size: rand(2, 4),
        color: "#fbbf24",
        kind: "coin",
      });
    }
  };

  // Ambient snowflakes for whole screen
  const seedAmbientFlakes = () => {
    const s = g.current;
    for (let i = 0; i < 50; i++) {
      s.particles.push({
        x: rand(-TRACK_HALF_WIDTH * 2, TRACK_HALF_WIDTH * 2),
        y: s.sy + rand(-200, 800),
        vx: rand(-20, 20),
        vy: rand(-10, 20),
        life: 999,
        maxLife: 999,
        size: rand(1.2, 2.8),
        color: "#ffffff",
        kind: "flake",
      });
    }
  };

  // ============================================================
  // Canvas resize
  // ============================================================
  useEffect(() => {
    const onResize = () => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth;
      const h = c.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      g.current.w = w;
      g.current.h = h;
      g.current.dpr = dpr;
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ============================================================
  // Input
  // ============================================================
  useEffect(() => {
    const keyMap: Record<string, keyof typeof g.current.keys> = {
      ArrowLeft: "left", a: "left", A: "left",
      ArrowRight: "right", d: "right", D: "right",
      ArrowDown: "brake", s: "brake", S: "brake",
      ArrowUp: "boost", w: "boost", W: "boost", " ": "boost",
    };
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape" && g.current.running) {
        setState((st) => (st === "playing" ? "paused" : st));
      }
      const k = keyMap[e.key];
      if (k) {
        // Detect tap (just pressed, not held) — gives impulse for one-tap dodge
        if (!g.current.keys[k]) {
          if (k === "left") g.current.svx -= STEER_IMPULSE;
          else if (k === "right") g.current.svx += STEER_IMPULSE;
        }
        g.current.keys[k] = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = keyMap[e.key];
      if (k) { g.current.keys[k] = false; }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // ============================================================
  // Start / reset
  // ============================================================
  const startGame = () => {
    const s = g.current;
    s.sx = 0; s.svx = 0; s.sy = 0;
    s.speed = BASE_SPEED;
    s.score = 0; s.coins = 0; s.gates = 0;
    s.obstacles = [];
    s.particles = [];
    s.nextObstacleY = 0;
    s.t = 0; s.skierAnim = 0; s.screenShake = 0; s.flash = 0; s.boostFlash = 0;
    s.keys = { left: false, right: false, brake: false, boost: false };
    s.running = true;
    s.paused = false;
    spawnObstacles();
    seedAmbientFlakes();
    setHud({ speed: 0, distance: 0, score: 0, coins: 0, gates: 0 });
    setOverMsg("");
    setState("playing");
  };

  const endGame = (msg: string) => {
    const s = g.current;
    s.running = false;
    setOverMsg(msg);
    if (s.score > best) {
      setBest(s.score);
      localStorage.setItem("ski2d-best", String(s.score));
    }
    setState("over");
  };

  const resumeGame = () => { g.current.paused = false; setState("playing"); };

  // ============================================================
  // Main loop
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const s = g.current;
      s.t += dt;

      if (state === "playing" && s.running && !s.paused) {
        update(dt);
      }
      render(ctx);
      raf = requestAnimationFrame(loop);
    };

    const update = (dt: number) => {
      const s = g.current;

      // ----- speed -----
      let accel = GRAVITY_ACCEL;
      if (s.keys.boost) { accel += BOOST_ACCEL; s.boostFlash = Math.min(1, s.boostFlash + dt * 3); }
      else s.boostFlash = Math.max(0, s.boostFlash - dt * 2);
      if (s.keys.brake) accel -= BRAKE_DECEL;
      s.speed += accel * dt;
      const maxSpd = s.keys.boost ? BOOST_SPEED : MAX_SPEED;
      s.speed = clamp(s.speed, 60, maxSpd);

      // ----- steering -----
      if (s.keys.left) s.svx -= STEER_ACCEL * dt;
      if (s.keys.right) s.svx += STEER_ACCEL * dt;
      s.svx -= s.svx * STEER_DAMP * dt;
      s.svx = clamp(s.svx, -MAX_LATERAL, MAX_LATERAL);
      s.sx += s.svx * dt;
      // Bounce off track edges softly
      if (s.sx > TRACK_HALF_WIDTH - 8) { s.sx = TRACK_HALF_WIDTH - 8; s.svx = -Math.abs(s.svx) * 0.3; }
      if (s.sx < -TRACK_HALF_WIDTH + 8) { s.sx = -TRACK_HALF_WIDTH + 8; s.svx = Math.abs(s.svx) * 0.3; }

      // ----- advance downhill -----
      s.sy += s.speed * dt;

      // ----- animation -----
      s.skierAnim += dt * (4 + s.speed / 200);
      s.screenShake = Math.max(0, s.screenShake - dt * 4);
      s.flash = Math.max(0, s.flash - dt * 4);

      // ----- trail -----
      emitSnowTrail(s.sx, s.sy, s.speed, dt);

      // ----- world spawn -----
      spawnObstacles();

      // ----- collisions -----
      const skierR = 14;
      for (const o of s.obstacles) {
        if (o.taken) continue;
        const dy = o.y - s.sy;
        if (dy < -40 || dy > 40) continue;
        const dx = o.x - s.sx;
        const dist2 = dx * dx + dy * dy;
        const rr = (o.r + skierR) * (o.r + skierR);
        if (dist2 < rr) {
          if (o.kind === "coin") {
            o.taken = true;
            s.coins++;
            s.score += 50;
            s.flash = 0.4;
            emitCoinBurst(o.x, o.y);
          } else if (o.kind === "boost") {
            o.taken = true;
            s.speed = Math.min(BOOST_SPEED, s.speed + 180);
            s.boostFlash = 1;
            s.score += 20;
          } else if (o.kind === "bump") {
            o.taken = true;
            s.speed *= 0.88;
            s.screenShake = 0.3;
          } else if (o.kind === "gateR" || o.kind === "gateB") {
            // Gate passing — counted once when we cross the y line
            // handled below by y-crossing
          } else {
            // tree / rock — crash
            s.screenShake = 1;
            emitCrash(o.x, o.y);
            endGame(o.kind === "tree" ? "💥 اصطدمت بشجرة!" : "💥 اصطدمت بصخرة!");
            return;
          }
        }
      }

      // Gate passing — test when skier y passes gate y
      for (const o of s.obstacles) {
        if (o.taken) continue;
        if (o.kind !== "gateR" && o.kind !== "gateB") continue;
        if (o.y <= s.sy && o.y > s.sy - s.speed * dt - 2) {
          // Find its pair within 80 units
          const pair = s.obstacles.find((p) => !p.taken && p !== o && p.kind === o.kind && Math.abs(p.y - o.y) < 12);
          if (pair) {
            const gateMinX = Math.min(o.x, pair.x);
            const gateMaxX = Math.max(o.x, pair.x);
            if (s.sx > gateMinX && s.sx < gateMaxX) {
              s.gates++;
              s.score += 30;
              s.flash = 0.25;
            }
            o.taken = true; pair.taken = true;
          } else {
            o.taken = true;
          }
        }
      }

      // ----- particles -----
      for (const p of s.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === "snow" || p.kind === "spark") {
          p.vy += 200 * dt; // gravity in world, but we flip in render
          p.vx *= 0.96;
        } else if (p.kind === "flake") {
          p.x += Math.sin(s.t * 1.2 + p.y * 0.01) * 8 * dt;
          // Keep ambient flakes in a window around skier
          if (p.y < s.sy - 300) p.y += 1200;
          if (p.y > s.sy + 900) p.y -= 1200;
        } else if (p.kind === "coin") {
          p.vy += 400 * dt;
        }
        if (p.kind !== "flake") p.life -= dt;
      }
      s.particles = s.particles.filter((p) => p.life > 0);

      // ----- finish -----
      if (s.sy >= FINISH_DISTANCE) {
        s.score += 500;
        endGame("🏁 وصلت النهاية!");
        return;
      }

      // ----- HUD (throttle to 10Hz) -----
      if (Math.floor(s.t * 10) !== Math.floor((s.t - dt) * 10)) {
        setHud({
          speed: s.speed,
          distance: s.sy,
          score: s.score,
          coins: s.coins,
          gates: s.gates,
        });
      }
    };

    // ============================================================
    // Rendering — all draw code lives here
    // ============================================================
    const render = (ctx: CanvasRenderingContext2D) => {
      const s = g.current;
      const { w, h, dpr } = s;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Camera: skier sits at bottom-third of screen, world scrolls
      const camY = s.sy - h * 0.62;
      const camX = s.sx * 0.35; // slight parallax of camera

      // Screen shake
      const shakeX = s.screenShake > 0 ? (Math.random() - 0.5) * 8 * s.screenShake : 0;
      const shakeY = s.screenShake > 0 ? (Math.random() - 0.5) * 8 * s.screenShake : 0;

      // worldToScreen: world x is centered at 0, screen centered at w/2
      const wx = (x: number) => (x - camX) + w / 2 + shakeX;
      const wy = (y: number) => (y - camY) + shakeY;

      // ---- Sky gradient (top 35% of screen) ----
      const horizonY = h * 0.28;
      const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
      sky.addColorStop(0, "#9ec4e8");
      sky.addColorStop(0.6, "#cfe0ee");
      sky.addColorStop(1, "#e8f0f7");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, horizonY);

      // ---- Sun glow (top right) ----
      const sunG = ctx.createRadialGradient(w * 0.78, h * 0.1, 0, w * 0.78, h * 0.1, 220);
      sunG.addColorStop(0, "rgba(255,235,180,0.95)");
      sunG.addColorStop(0.4, "rgba(255,220,180,0.25)");
      sunG.addColorStop(1, "rgba(255,220,180,0)");
      ctx.fillStyle = sunG;
      ctx.fillRect(0, 0, w, horizonY);

      // ---- Distant mountain skyline (only above horizon) ----
      drawSkyline(ctx, w, horizonY, camY * 0.03, "#9cb4cc", 0.5, 0);
      drawSkyline(ctx, w, horizonY, camY * 0.08, "#b8c8dc", 0.35, 1);
      drawSkyline(ctx, w, horizonY, camY * 0.16, "#d4dde7", 0.22, 2);

      // ---- Ground/snow base (everything below horizon) ----
      const ground = ctx.createLinearGradient(0, horizonY, 0, h);
      ground.addColorStop(0, "#e0ebf3");
      ground.addColorStop(0.4, "#f2f7fb");
      ground.addColorStop(1, "#ffffff");
      ctx.fillStyle = ground;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // ---- Snow slope with track markers ----
      drawSlope(ctx, s, wx, wy, w, h, horizonY);

      // ---- Off-piste trees (outside track) ----
      drawForestSides(ctx, s, wx, wy, w, h, horizonY);

      // ---- Trail streaks (under obstacles) ----
      drawTrailStreaks(ctx, s, wx, wy);

      // ---- Obstacles — sorted by y so closer ones overlap correctly ----
      const visible = s.obstacles
        .filter((o) => o.y > s.sy - 300 && o.y < s.sy + 900)
        .sort((a, b) => a.y - b.y);
      for (const o of visible) drawObstacle(ctx, o, wx, wy, s);

      // ---- Skier (always at camera-relative position) ----
      drawSkier(ctx, s, wx, wy);

      // ---- Particles (snow, sparks, flakes) ----
      drawParticles(ctx, s, wx, wy);

      // ---- Boost overlay ----
      if (s.boostFlash > 0.01) drawBoostOverlay(ctx, w, h, s.boostFlash);

      // ---- Flash (coin / gate) ----
      if (s.flash > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.25})`;
        ctx.fillRect(0, 0, w, h);
      }

      // ---- Vignette ----
      const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.4, w / 2, h / 2, h * 0.9);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(10,20,35,0.4)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Touch with impulse on press (mirrors keyboard tap-to-dodge)
  const touch = (k: keyof typeof g.current.keys, on: boolean) => () => {
    if (on && !g.current.keys[k]) {
      if (k === "left") g.current.svx -= STEER_IMPULSE;
      else if (k === "right") g.current.svx += STEER_IMPULSE;
    }
    g.current.keys[k] = on;
  };

  return (
    <div className="fixed inset-0 z-50 bg-night overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ imageRendering: "auto" }}
      />

      {/* HUD */}
      {state === "playing" && (
        <>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
            <HudChip label="السرعة" value={`${Math.round(hud.speed * 0.6)}`} unit="km/h" accent="ice" />
            <HudChip label="النقاط" value={`${hud.score}`} accent="gold" />
            <HudChip label="المسافة" value={`${Math.round((hud.distance / FINISH_DISTANCE) * 100)}%`} accent="frost" hideSm={false} />
          </div>

          <div className="absolute top-3 right-3 glass-strong rounded-xl px-3 py-1.5 text-frost text-xs flex gap-2 font-bold">
            <span>🪙 {hud.coins}</span>
            <span className="text-border">|</span>
            <span>🚩 {hud.gates}</span>
          </div>

          {/* Progress bar */}
          <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 w-56 sm:w-72 h-1 rounded-full bg-frost/15 overflow-hidden pointer-events-none">
            <div
              className="h-full bg-gradient-aurora"
              style={{ width: `${Math.min(100, (hud.distance / FINISH_DISTANCE) * 100)}%`, transition: "width .1s linear" }}
            />
          </div>

          {/* Pause button */}
          <button
            onClick={() => { g.current.paused = true; setState("paused"); }}
            className="absolute top-3 left-3 h-10 w-10 rounded-full glass-strong text-frost grid place-items-center hover:bg-night/80 transition-smooth"
            aria-label="إيقاف"
          >
            <Pause className="h-4 w-4" />
          </button>

          {/* Touch controls — LEFT arrow on left side, RIGHT arrow on right side */}
          <div className="absolute bottom-4 inset-x-0 flex justify-between items-end px-4 sm:hidden pointer-events-none">
            {/* LEFT side: left arrow */}
            <button
              onPointerDown={touch("left", true)} onPointerUp={touch("left", false)} onPointerLeave={touch("left", false)} onPointerCancel={touch("left", false)}
              className="pointer-events-auto h-20 w-20 rounded-2xl glass-strong text-frost text-4xl font-black active:scale-95 active:bg-ice/30 transition-spring shadow-lift"
              aria-label="يسار"
            >◀</button>

            {/* Center: brake + boost */}
            <div className="flex gap-2 pointer-events-auto">
              <button
                onPointerDown={touch("brake", true)} onPointerUp={touch("brake", false)} onPointerLeave={touch("brake", false)} onPointerCancel={touch("brake", false)}
                className="h-14 w-14 rounded-2xl glass-strong text-frost text-xs font-bold active:scale-95 transition-spring"
              >فرامل</button>
              <button
                onPointerDown={touch("boost", true)} onPointerUp={touch("boost", false)} onPointerLeave={touch("boost", false)} onPointerCancel={touch("boost", false)}
                className="h-14 w-14 rounded-2xl bg-gradient-ice text-night text-xs font-black active:scale-95 transition-spring shadow-ice"
              >سرعة</button>
            </div>

            {/* RIGHT side: right arrow */}
            <button
              onPointerDown={touch("right", true)} onPointerUp={touch("right", false)} onPointerLeave={touch("right", false)} onPointerCancel={touch("right", false)}
              className="pointer-events-auto h-20 w-20 rounded-2xl glass-strong text-frost text-4xl font-black active:scale-95 active:bg-ice/30 transition-spring shadow-lift"
              aria-label="يمين"
            >▶</button>
          </div>
        </>
      )}

      {/* Menu */}
      {state === "menu" && <Menu onStart={startGame} best={best} />}

      {/* Paused */}
      {state === "paused" && (
        <div className="absolute inset-0 flex items-center justify-center bg-night/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-strong rounded-3xl p-8 max-w-sm mx-4 text-center">
            <h2 className="text-3xl font-black text-frost mb-6">متوقفة مؤقتاً</h2>
            <div className="flex gap-3">
              <Button onClick={resumeGame} className="flex-1 bg-gradient-ice text-night font-black h-12 shadow-ice">
                <Play className="h-4 w-4 ml-2 fill-current" /> استمرار
              </Button>
              <Button onClick={() => setState("menu")} variant="outline" className="flex-1 h-12 border-frost/25 text-frost">
                <Home className="h-4 w-4 ml-2" /> خروج
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Game over */}
      {state === "over" && (() => {
        const earnedReward = [...REWARD_TIERS].reverse().find((t) => hud.score >= t.score);
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-night/70 backdrop-blur-sm animate-fade-in p-4 overflow-auto">
            <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-md w-full text-center animate-scale-in my-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-frost mb-2">{overMsg}</h2>
              <div className="grid grid-cols-4 gap-2 my-5">
                <Stat label="النقاط" value={hud.score} color="gold" />
                <Stat label="عملات" value={hud.coins} color="gold" />
                <Stat label="بوابات" value={hud.gates} color="ice" />
                <Stat label="المسافة" value={`${Math.round(hud.distance)}`} color="frost" />
              </div>
              {hud.score >= best && hud.score > 0 && (
                <div className="text-gold font-black mb-3 flex items-center justify-center gap-2 animate-fade-in text-sm">
                  <Trophy className="h-4 w-4" /> رقم قياسي جديد!
                </div>
              )}

              {earnedReward ? (
                <div className="mb-5 rounded-2xl bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border-2 border-gold/40 p-4 animate-scale-in">
                  <div className="text-3xl mb-1">🎁</div>
                  <div className="text-gold font-black text-lg mb-1">مبروك! فزت بجائزة</div>
                  <div className="text-frost font-bold text-xl mb-2">{earnedReward.label}</div>
                  <div className="text-xs text-muted-foreground mb-2">من معدات التزلج في المركز</div>
                  <div className="bg-night/60 rounded-xl py-2 px-3 border border-gold/30">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">كود الخصم</div>
                    <div className="text-gold font-black text-lg tracking-widest font-mono">{earnedReward.code}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2">اعرض هذا الكود عند الحجز في المركز</div>
                </div>
              ) : (
                <div className="mb-5 rounded-2xl bg-night/40 border border-border/50 p-3 text-xs text-muted-foreground">
                  <div className="text-frost font-bold mb-1">🎯 اقترب من الجائزة!</div>
                  <div>اجمع <span className="text-gold font-black">{REWARD_TIERS[0].score - hud.score}</span> نقطة إضافية للفوز بـ {REWARD_TIERS[0].label}</div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={startGame} className="flex-1 bg-gradient-ice text-night font-black h-12 shadow-ice hover:-translate-y-0.5 transition-spring">
                  <RotateCcw className="h-4 w-4 ml-2" /> العب مجدداً
                </Button>
                <Button onClick={() => setState("menu")} variant="outline" className="flex-1 h-12 border-frost/25 text-frost">
                  <Home className="h-4 w-4 ml-2" /> القائمة
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ============================================================
// HUD sub-components
// ============================================================
const HudChip = ({ label, value, unit, accent, hideSm }: { label: string; value: string; unit?: string; accent: "ice" | "gold" | "frost"; hideSm?: boolean }) => {
  const colorMap = { ice: "text-ice", gold: "text-gold", frost: "text-frost" } as const;
  return (
    <div className={`glass-strong rounded-2xl px-3 py-1.5 ${hideSm === false ? "hidden sm:block" : ""}`}>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-black leading-none ${colorMap[accent]}`}>
        {value}
        {unit && <span className="text-[9px] text-muted-foreground font-medium ml-1">{unit}</span>}
      </div>
    </div>
  );
};

const Stat = ({ label, value, color }: { label: string; value: number | string; color: "gold" | "ice" | "frost" }) => {
  const c = { gold: "text-gold", ice: "text-ice", frost: "text-frost" } as const;
  return (
    <div className="bg-night/50 rounded-2xl p-3">
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-black ${c[color]}`}>{value}</div>
    </div>
  );
};

const Menu = ({ onStart, best }: { onStart: () => void; best: number }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-night via-deep to-night overflow-hidden animate-fade-in">
    {/* Decorative snowflakes */}
    <div className="absolute inset-0 pointer-events-none opacity-30">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-frost text-2xl"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 23) % 100}%`,
            animation: `float-y ${3 + (i % 4)}s ease-in-out ${i * 0.15}s infinite`,
          }}
        >❄</span>
      ))}
    </div>
    <div className="glass-strong rounded-3xl p-8 max-w-md mx-4 text-center relative animate-scale-in">
      <div className="text-7xl mb-3 float-y">⛷️</div>
      <h1 className="text-4xl font-black text-gradient-frost mb-2">تحدي المنحدر</h1>
      <p className="text-muted-foreground mb-6">انزل المنحدر، اجمع العملات، وتجنب العقبات!</p>

      <div className="text-right text-xs text-frost/80 space-y-1.5 mb-4 bg-night/40 rounded-2xl p-4">
        <div className="flex justify-between"><span>للتوجيه</span> <span><kbd className="px-1.5 py-0.5 rounded bg-mid text-[10px]">◀ ▶</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-mid text-[10px]">A D</kbd></span></div>
        <div className="flex justify-between"><span>تسريع</span> <kbd className="px-1.5 py-0.5 rounded bg-mid text-[10px]">Space</kbd></div>
        <div className="flex justify-between"><span>فرامل</span> <kbd className="px-1.5 py-0.5 rounded bg-mid text-[10px]">▼ / S</kbd></div>
        <div className="flex justify-between pt-2 border-t border-border/40 mt-2">
          <span className="text-gold">🪙 = 50</span>
          <span className="text-gold">🚩 = 30</span>
          <span className="text-ice">⚡ = boost</span>
        </div>
      </div>

      {/* Rewards preview */}
      <div className="text-right text-xs space-y-1.5 mb-5 bg-gradient-to-br from-gold/10 to-transparent border border-gold/30 rounded-2xl p-4">
        <div className="text-gold font-black text-center mb-2 text-sm">🎁 جوائز حقيقية في المركز</div>
        {REWARD_TIERS.map((t) => (
          <div key={t.code} className="flex justify-between items-center text-frost/90">
            <span className="text-gold font-bold">{t.score}+ نقطة</span>
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {best > 0 && (
        <div className="flex items-center justify-center gap-2 text-gold mb-4 font-bold">
          <Trophy className="h-5 w-5" /> أفضل نتيجة: <span className="font-black">{best}</span>
        </div>
      )}

      <Button
        size="lg"
        onClick={onStart}
        className="bg-gradient-ice text-night font-black h-14 px-10 text-lg shadow-ice hover:shadow-lift hover:-translate-y-1 transition-spring w-full"
      >
        <Play className="h-5 w-5 ml-2 fill-current" />
        ابدأ اللعب
      </Button>
    </div>
  </div>
);

// ============================================================
// Drawing primitives
// ============================================================

function drawSkyline(
  ctx: CanvasRenderingContext2D,
  w: number, horizonY: number,
  camOffset: number,
  color: string,
  heightRatio: number,
  layer: number,
) {
  const amp = horizonY * heightRatio;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  const peaks = 6 + layer * 2;
  const phase = -camOffset * 0.01 + layer * 1.3;
  for (let i = 0; i <= peaks; i++) {
    const x = (i / peaks) * w;
    const n = Math.sin(phase + i * 1.7) * 0.5 + Math.sin(phase + i * 0.8 + layer) * 0.5;
    const y = horizonY - (n * amp * 0.5 + amp * 0.45);
    if (i === 0) ctx.lineTo(x, y);
    else {
      const px = ((i - 0.5) / peaks) * w;
      const pn = Math.sin(phase + (i - 0.5) * 1.7) * 0.5 + Math.sin(phase + (i - 0.5) * 0.8 + layer) * 0.5;
      const py = horizonY - (pn * amp * 0.5 + amp * 0.45);
      ctx.quadraticCurveTo(px, py - 6, x, y);
    }
  }
  ctx.lineTo(w, horizonY);
  ctx.closePath();
  ctx.fill();
  // Snow caps on front layer
  if (layer === 2) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i <= peaks; i++) {
      const x = (i / peaks) * w;
      const n = Math.sin(phase + i * 1.7) * 0.5 + Math.sin(phase + i * 0.8 + layer) * 0.5;
      const y = horizonY - (n * amp * 0.5 + amp * 0.45);
      ctx.beginPath();
      ctx.moveTo(x - 14, y + 10);
      ctx.quadraticCurveTo(x, y - 2, x + 14, y + 10);
      ctx.quadraticCurveTo(x, y + 6, x - 14, y + 10);
      ctx.fill();
    }
  }
}

function drawForestSides(
  ctx: CanvasRenderingContext2D,
  s: any,
  wx: (x: number) => number,
  wy: (y: number) => number,
  w: number, h: number,
  horizonY: number,
) {
  // Deterministic row of dark trees along each side of the track
  const spacing = 55;
  const startY = Math.floor((s.sy - 200) / spacing) * spacing;
  for (let y = startY; y < s.sy + 1000; y += spacing) {
    for (const side of [-1, 1]) {
      // Several trees per row, outside track edge
      for (let k = 0; k < 4; k++) {
        const hash = Math.sin(y * 0.13 + side * 7 + k * 3.1) * 10000;
        const jitter = hash - Math.floor(hash);
        const off = 20 + k * 55 + jitter * 25;
        const tx = side * (TRACK_HALF_WIDTH + off);
        const ty = y + (jitter - 0.5) * 30;
        const sx = wx(tx);
        const sy = wy(ty);
        if (sy < horizonY - 10 || sy > h + 40) continue;
        if (sx < -40 || sx > w + 40) continue;
        // scale by perspective (farther back = smaller)
        const depth = clamp((ty - s.sy + 300) / 1300, 0.4, 1);
        drawMiniTree(ctx, sx, sy, depth);
      }
    }
  }
}

function drawMiniTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  const s = scale;
  // shadow
  ctx.fillStyle = "rgba(30,50,80,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y + 4 * s, 14 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // trunk
  ctx.fillStyle = "#5a3a20";
  ctx.fillRect(x - 2 * s, y - 4 * s, 4 * s, 10 * s);
  // layers
  const layers = [
    { w: 20, h: 22, off: 10, c: "#1e5a35" },
    { w: 15, h: 18, off: 20, c: "#246b3f" },
    { w: 10, h: 14, off: 28, c: "#2a7c4a" },
  ];
  for (const L of layers) {
    ctx.fillStyle = L.c;
    ctx.beginPath();
    ctx.moveTo(x - L.w * s, y - L.off * s + 4 * s);
    ctx.lineTo(x + L.w * s, y - L.off * s + 4 * s);
    ctx.lineTo(x, y - (L.off + L.h) * s);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSlope(
  ctx: CanvasRenderingContext2D,
  s: any,
  wx: (x: number) => number,
  wy: (y: number) => number,
  w: number, h: number,
  horizonY: number,
) {
  // The slope is a white corridor with clear dark-green edges.
  const leftEdge = wx(-TRACK_HALF_WIDTH);
  const rightEdge = wx(TRACK_HALF_WIDTH);
  const topY = Math.max(horizonY, wy(s.sy + 1200));
  const botY = wy(s.sy - 300);

  // Slope (brighter white) — drawn on top of ground base
  const slopeGrad = ctx.createLinearGradient(0, topY, 0, botY);
  slopeGrad.addColorStop(0, "#e8f1f9");
  slopeGrad.addColorStop(0.5, "#fafdff");
  slopeGrad.addColorStop(1, "#ffffff");
  ctx.fillStyle = slopeGrad;
  ctx.fillRect(leftEdge, topY, rightEdge - leftEdge, botY - topY);

  // Track edge markers — subtle colored lines
  ctx.strokeStyle = "rgba(80,110,150,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(leftEdge, topY);
  ctx.lineTo(leftEdge, botY);
  ctx.moveTo(rightEdge, topY);
  ctx.lineTo(rightEdge, botY);
  ctx.stroke();

  // Edge shading (soft falloff)
  const edgeGrad1 = ctx.createLinearGradient(leftEdge, 0, leftEdge + 50, 0);
  edgeGrad1.addColorStop(0, "rgba(150,170,190,0.45)");
  edgeGrad1.addColorStop(1, "rgba(150,170,190,0)");
  ctx.fillStyle = edgeGrad1;
  ctx.fillRect(leftEdge, topY, 50, botY - topY);
  const edgeGrad2 = ctx.createLinearGradient(rightEdge, 0, rightEdge - 50, 0);
  edgeGrad2.addColorStop(0, "rgba(150,170,190,0.45)");
  edgeGrad2.addColorStop(1, "rgba(150,170,190,0)");
  ctx.fillStyle = edgeGrad2;
  ctx.fillRect(rightEdge - 50, topY, 50, botY - topY);

  // Horizontal guide bands that scroll — gives speed sensation
  ctx.strokeStyle = "rgba(180,200,220,0.35)";
  ctx.lineWidth = 2;
  const spacing = 120;
  const offset = s.sy % spacing;
  for (let y = s.sy - 300; y < s.sy + 1200; y += spacing) {
    const yy = wy(y - (offset - s.sy % spacing));
    ctx.beginPath();
    // curve slightly for depth
    const centerX = wx(0);
    const half = (rightEdge - leftEdge) / 2;
    const bulge = ((y - s.sy) / 1200) * 8;
    ctx.moveTo(centerX - half, yy + bulge);
    ctx.quadraticCurveTo(centerX, yy - bulge * 0.3, centerX + half, yy + bulge);
    ctx.stroke();
  }

  // Soft snow bumps scattered on slope (procedural)
  for (let i = 0; i < 14; i++) {
    const bx = ((i * 271 + Math.floor(s.sy / 50) * 37) % 600) - 300;
    const by = s.sy + (((i * 173) % 1400));
    const sx = wx(bx);
    const sy = wy(by);
    if (sx < leftEdge + 20 || sx > rightEdge - 20) continue;
    const bg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 30);
    bg.addColorStop(0, "rgba(180,200,220,0.25)");
    bg.addColorStop(1, "rgba(180,200,220,0)");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTrailStreaks(
  ctx: CanvasRenderingContext2D,
  s: any,
  wx: (x: number) => number,
  wy: (y: number) => number,
) {
  // Render a soft "S" curve behind skier based on recent lateral velocity history
  // (approximated by sin wave from current svx)
  const leftSki = s.sx - 6;
  const rightSki = s.sx + 6;
  ctx.strokeStyle = "rgba(140,170,200,0.35)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (const sideX of [leftSki, rightSki]) {
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const dy = i * 8;
      const wobble = Math.sin((s.sy - dy) * 0.03) * s.svx * 0.02;
      const x = wx(sideX + wobble);
      const y = wy(s.sy - dy);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  o: Obstacle,
  wx: (x: number) => number,
  wy: (y: number) => number,
  s: any,
) {
  const x = wx(o.x);
  const y = wy(o.y);
  const bob = Math.sin(s.t * 4 + (o.seed || 0) * 10) * 2;

  // Shadow
  ctx.fillStyle = "rgba(30,50,80,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y + 6, o.r * 0.9, o.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (o.kind) {
    case "tree": {
      // Trunk
      ctx.fillStyle = "#5a3a20";
      ctx.fillRect(x - 3, y - 4, 6, 12);
      // Layered triangles
      const layers = [
        { w: 28, h: 30, off: 14, c: "#1e5a35" },
        { w: 22, h: 26, off: 22, c: "#246b3f" },
        { w: 16, h: 22, off: 30, c: "#2a7c4a" },
      ];
      for (const L of layers) {
        ctx.fillStyle = L.c;
        ctx.beginPath();
        ctx.moveTo(x - L.w, y - L.off + 6);
        ctx.lineTo(x + L.w, y - L.off + 6);
        ctx.lineTo(x, y - L.off - L.h);
        ctx.closePath();
        ctx.fill();
        // Snow highlight
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.beginPath();
        ctx.moveTo(x - L.w * 0.7, y - L.off + 4);
        ctx.lineTo(x - L.w * 0.3, y - L.off - L.h * 0.5);
        ctx.lineTo(x - L.w * 0.1, y - L.off - L.h * 0.4);
        ctx.lineTo(x + L.w * 0.1, y - L.off + 2);
        ctx.closePath();
        ctx.fill();
      }
      // Snow cap
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y - 52, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "rock": {
      // Realistic rock — natural brown/gray tones with partial snow cover only on top
      // Dark base shadow
      ctx.fillStyle = "#3d2f24";
      ctx.beginPath();
      ctx.ellipse(x, y + 2, o.r + 2, (o.r + 2) * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Main rock body — warm earthy brown
      ctx.fillStyle = "#6b4f3a";
      ctx.beginPath();
      ctx.ellipse(x, y, o.r, o.r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      // Mid-tone — slate gray-brown
      ctx.fillStyle = "#8a6e54";
      ctx.beginPath();
      ctx.ellipse(x - 2, y - 2, o.r - 3, (o.r - 3) * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      // Highlight — lighter warm gray
      ctx.fillStyle = "#a89178";
      ctx.beginPath();
      ctx.ellipse(x - 5, y - 5, o.r - 9, (o.r - 9) * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Texture cracks
      ctx.strokeStyle = "rgba(45,30,20,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - o.r * 0.3, y - o.r * 0.1);
      ctx.lineTo(x + o.r * 0.2, y + o.r * 0.3);
      ctx.moveTo(x + o.r * 0.1, y - o.r * 0.4);
      ctx.lineTo(x + o.r * 0.4, y);
      ctx.stroke();
      // Partial snow cap on top — only covers ~40% of rock, irregular shape
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(x - o.r * 0.7, y - o.r * 0.35);
      ctx.quadraticCurveTo(x - o.r * 0.4, y - o.r * 0.85, x - o.r * 0.1, y - o.r * 0.75);
      ctx.quadraticCurveTo(x + o.r * 0.3, y - o.r * 0.95, x + o.r * 0.65, y - o.r * 0.55);
      ctx.quadraticCurveTo(x + o.r * 0.5, y - o.r * 0.3, x + o.r * 0.2, y - o.r * 0.4);
      ctx.quadraticCurveTo(x - o.r * 0.2, y - o.r * 0.25, x - o.r * 0.7, y - o.r * 0.35);
      ctx.closePath();
      ctx.fill();
      // Subtle snow shadow
      ctx.fillStyle = "rgba(180,200,220,0.5)";
      ctx.beginPath();
      ctx.ellipse(x, y - o.r * 0.45, o.r * 0.5, o.r * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "bump": {
      const g1 = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, o.r);
      g1.addColorStop(0, "#ffffff");
      g1.addColorStop(1, "#b8cadd");
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.ellipse(x, y, o.r, o.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "coin": {
      const float = bob;
      // Glow
      const glow = ctx.createRadialGradient(x, y - 8 + float, 0, x, y - 8 + float, 22);
      glow.addColorStop(0, "rgba(251,191,36,0.55)");
      glow.addColorStop(1, "rgba(251,191,36,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y - 8 + float, 22, 0, Math.PI * 2);
      ctx.fill();
      // Coin body — rotating ellipse
      const squish = Math.abs(Math.cos(s.t * 5 + (o.seed || 0) * 6));
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.ellipse(x, y - 8 + float + 2, 12, 12 * squish, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.ellipse(x, y - 8 + float, 12, 12 * squish, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.ellipse(x - 2, y - 10 + float, 8, 8 * squish, 0, 0, Math.PI * 2);
      ctx.fill();
      // Sparkle
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x - 4, y - 12 + float, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "gateR":
    case "gateB": {
      const color = o.kind === "gateR" ? "#ef4444" : "#3b82f6";
      // Pole (shadow then body)
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x - 1, y - 42, 3, 42);
      ctx.fillStyle = color;
      ctx.fillRect(x - 2, y - 46, 4, 46);
      // Flag — waves
      const wave = Math.sin(s.t * 6 + (o.seed || 0) * 5) * 4;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 42);
      ctx.quadraticCurveTo(x + 14 + wave, y - 40, x + 22 + wave, y - 36);
      ctx.lineTo(x + 22 + wave, y - 26);
      ctx.quadraticCurveTo(x + 14 + wave, y - 24, x + 2, y - 28);
      ctx.closePath();
      ctx.fill();
      // Top cap
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y - 48, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "boost": {
      const float = bob * 0.5;
      // Glow
      const glow = ctx.createRadialGradient(x, y - 6 + float, 0, x, y - 6 + float, 30);
      glow.addColorStop(0, "rgba(56,189,248,0.7)");
      glow.addColorStop(1, "rgba(56,189,248,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 30, y - 36 + float, 60, 60);
      // Chevron stack
      ctx.fillStyle = "#0ea5e9";
      for (let k = 0; k < 3; k++) {
        const yy = y - 6 + float - k * 8 + Math.sin(s.t * 6 + k) * 2;
        ctx.globalAlpha = 0.6 + k * 0.13;
        ctx.beginPath();
        ctx.moveTo(x - 14, yy + 8);
        ctx.lineTo(x, yy - 4);
        ctx.lineTo(x + 14, yy + 8);
        ctx.lineTo(x + 14, yy + 2);
        ctx.lineTo(x, yy - 10);
        ctx.lineTo(x - 14, yy + 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
  }
}

function drawSkier(
  ctx: CanvasRenderingContext2D,
  s: any,
  wx: (x: number) => number,
  wy: (y: number) => number,
) {
  const x = wx(s.sx);
  const y = wy(s.sy);
  // Lean angle from lateral velocity
  const lean = clamp(s.svx / MAX_LATERAL, -1, 1);
  const tilt = lean * 0.35;
  const crouch = s.keys.boost ? 3 : s.keys.brake ? -2 : Math.sin(s.skierAnim) * 0.6;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  // Shadow
  ctx.fillStyle = "rgba(30,50,80,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Skis — two parallel red sticks angling slightly with lean
  const skiAngle = lean * 0.2;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 6, 6);
    ctx.rotate(skiAngle);
    // ski body
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-3, -22, 6, 32);
    // tip curl
    ctx.fillStyle = "#b91c1c";
    ctx.beginPath();
    ctx.moveTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.lineTo(2, -26);
    ctx.lineTo(-2, -26);
    ctx.closePath();
    ctx.fill();
    // binding
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-3, -6, 6, 4);
    ctx.restore();
  }

  // Legs (dark navy)
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(-8, -8 + crouch * 0.5, 6, 14);
  ctx.fillRect(2, -8 + crouch * 0.5, 6, 14);

  // Torso — orange jacket
  ctx.fillStyle = "#ea580c";
  roundRect(ctx, -11, -22 + crouch, 22, 18, 4);
  ctx.fill();
  // Jacket highlight
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  roundRect(ctx, -10, -21 + crouch, 8, 14, 3);
  ctx.fill();

  // Arms — tucked forward
  ctx.fillStyle = "#ea580c";
  ctx.save();
  ctx.translate(-10, -18 + crouch);
  ctx.rotate(-0.4 + lean * 0.3);
  ctx.fillRect(-3, 0, 6, 12);
  ctx.restore();
  ctx.save();
  ctx.translate(10, -18 + crouch);
  ctx.rotate(0.4 + lean * 0.3);
  ctx.fillRect(-3, 0, 6, 12);
  ctx.restore();

  // Gloves
  ctx.fillStyle = "#1f2937";
  ctx.beginPath();
  ctx.arc(-14 + lean * 3, -8 + crouch, 3, 0, Math.PI * 2);
  ctx.arc(14 + lean * 3, -8 + crouch, 3, 0, Math.PI * 2);
  ctx.fill();

  // Head / helmet
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(0, -28 + crouch, 7, 0, Math.PI * 2);
  ctx.fill();
  // Helmet shine
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.arc(-2, -30 + crouch, 3, 0, Math.PI * 2);
  ctx.fill();
  // Goggles
  ctx.fillStyle = "#38bdf8";
  roundRect(ctx, -5, -28 + crouch, 10, 3, 1.5);
  ctx.fill();
  // Goggles reflection
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-4, -27.5 + crouch, 2, 1);

  ctx.restore();

  // Boost aura
  if (s.boostFlash > 0.01) {
    ctx.save();
    ctx.globalAlpha = s.boostFlash * 0.6;
    const g1 = ctx.createRadialGradient(x, y, 0, x, y, 50);
    g1.addColorStop(0, "rgba(56,189,248,0.7)");
    g1.addColorStop(1, "rgba(56,189,248,0)");
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  s: any,
  wx: (x: number) => number,
  wy: (y: number) => number,
) {
  for (const p of s.particles) {
    const x = wx(p.x);
    const y = wy(p.y);
    if (p.kind === "flake") {
      ctx.fillStyle = `rgba(255,255,255,0.75)`;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "snow") {
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = `rgba(255,255,255,${a * 0.9})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "spark") {
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    } else if (p.kind === "coin") {
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = `rgba(251,191,36,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBoostOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  // Speed lines on the sides
  ctx.save();
  ctx.globalAlpha = intensity * 0.7;
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  const seed = performance.now() * 0.01;
  for (let i = 0; i < 14; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const baseX = side < 0 ? 30 : w - 30;
    const x = baseX + side * ((i * 17 + seed * 20) % 60);
    const yStart = (i * 53 + seed * 80) % h;
    ctx.beginPath();
    ctx.moveTo(x, yStart);
    ctx.lineTo(x, yStart + 40);
    ctx.stroke();
  }
  // Edge vignette — blue tint
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, `rgba(56,189,248,${intensity * 0.15})`);
  grad.addColorStop(1, `rgba(56,189,248,0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// rounded rect helper
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
