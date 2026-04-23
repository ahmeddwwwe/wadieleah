import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Trophy, Home, Pause, Star, ChevronRight } from "lucide-react";

// ============================================================
// Types
// ============================================================
type GameState = "menu" | "intro" | "playing" | "paused" | "levelComplete" | "over" | "victory";

type ObstacleKind =
  | "tree" | "rock" | "bump" | "coin" | "gateR" | "gateB" | "boost"
  | "ramp" | "shield" | "slowmo" | "windL" | "windR" | "iceCave" | "yeti";

type Obstacle = {
  kind: ObstacleKind;
  x: number;
  y: number;
  taken?: boolean;
  r: number;
  seed?: number;
  vx?: number; // for moving obstacles (yeti)
};

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: "snow" | "spark" | "flake" | "coin" | "shield" | "trail";
};

type LevelConfig = {
  id: number;
  name: string;
  nameEn: string;
  emoji: string;
  description: string;
  distance: number;
  bgTop: string;
  bgMid: string;
  bgBot: string;
  groundTint: string;
  fog: number; // 0..1
  windStrength: number; // -1..1 lateral push
  spawnWeights: Partial<Record<ObstacleKind, number>>;
  hasBoss: boolean;
  intro: string;
};

// ============================================================
// Constants — tuned for feel
// ============================================================
const TRACK_HALF_WIDTH = 280;
const BASE_SPEED = 150;
const MAX_SPEED = 540;
const BOOST_SPEED = 720;
const GRAVITY_ACCEL = 22;
const BRAKE_DECEL = 280;
const BOOST_ACCEL = 420;
const STEER_ACCEL = 1500;
const STEER_IMPULSE = 180;
const STEER_DAMP = 5.5;
const MAX_LATERAL = 520;
const WORLD_ZOOM = 1.35;

// ============================================================
// Levels — 5 progressive stages with unique themes
// ============================================================
const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "التدريب",
    nameEn: "Training Slope",
    emoji: "🏔️",
    description: "تعلم الأساسيات — اجمع العملات وتجنب الأشجار",
    distance: 3000,
    bgTop: "#9ec4e8", bgMid: "#cfe0ee", bgBot: "#e8f0f7",
    groundTint: "#ffffff",
    fog: 0,
    windStrength: 0,
    spawnWeights: { coin: 0.55, tree: 0.15, rock: 0.03, bump: 0.12, boost: 0.15 },
    hasBoss: false,
    intro: "ابدأ رحلتك! استخدم الأسهم أو السحب للتوجيه",
  },
  {
    id: 2,
    name: "الغابة",
    nameEn: "Pine Forest",
    emoji: "🌲",
    description: "غابة كثيفة مع بوابات سلالوم — انعطف بدقة",
    distance: 3500,
    bgTop: "#7ba8c9", bgMid: "#9fbcd0", bgBot: "#c9d8e2",
    groundTint: "#f4f8fb",
    fog: 0.1,
    windStrength: 0,
    spawnWeights: { coin: 0.25, tree: 0.4, rock: 0.05, bump: 0.1, boost: 0.05, gateB: 0.075, gateR: 0.075 },
    hasBoss: false,
    intro: "اعبر البوابات الملونة لنقاط إضافية!",
  },
  {
    id: 3,
    name: "العاصفة الثلجية",
    nameEn: "Blizzard",
    emoji: "❄️",
    description: "رؤية محدودة ورياح قوية — انتبه لإشارات الرياح",
    distance: 4000,
    bgTop: "#5a7892", bgMid: "#8ca5b8", bgBot: "#b8c8d4",
    groundTint: "#e6edf2",
    fog: 0.45,
    windStrength: 0.6,
    spawnWeights: { coin: 0.2, tree: 0.2, rock: 0.1, bump: 0.1, boost: 0.08, windL: 0.08, windR: 0.08, slowmo: 0.04, shield: 0.04, gateB: 0.04, gateR: 0.04 },
    hasBoss: false,
    intro: "الرياح ستدفعك! استخدم الدرع 🛡️ والوقت البطيء ⏱️",
  },
  {
    id: 4,
    name: "المنحدر الصخري",
    nameEn: "Rocky Cliff",
    emoji: "🪨",
    description: "قفزات وكهوف جليدية — اطر فوق المنحدرات",
    distance: 4500,
    bgTop: "#6a5a7a", bgMid: "#9b8da8", bgBot: "#c8bdd0",
    groundTint: "#f0eaf2",
    fog: 0.15,
    windStrength: 0,
    spawnWeights: { coin: 0.18, tree: 0.08, rock: 0.22, bump: 0.08, boost: 0.08, ramp: 0.15, iceCave: 0.08, shield: 0.05, slowmo: 0.04, gateR: 0.04 },
    hasBoss: false,
    intro: "اضغط القفز فوق المنحدرات 🏁 لتطير!",
  },
  {
    id: 5,
    name: "قمة سانت كاترين",
    nameEn: "Summit Boss",
    emoji: "👹",
    description: "الزعيم Yeti يطاردك — انجو حتى النهاية!",
    distance: 5000,
    bgTop: "#2a3a5a", bgMid: "#5a6a85", bgBot: "#9098a8",
    groundTint: "#dde1e8",
    fog: 0.25,
    windStrength: 0.3,
    spawnWeights: { coin: 0.18, tree: 0.15, rock: 0.18, bump: 0.06, boost: 0.12, ramp: 0.08, shield: 0.06, slowmo: 0.05, gateR: 0.04, gateB: 0.04, iceCave: 0.04 },
    hasBoss: true,
    intro: "👹 احذر! الـ Yeti يلاحقك. اجمع كل البوسترات لتنجو!",
  },
];

// Reward tiers — based on TOTAL score across all levels
const REWARD_TIERS = [
  { score: 500,   stars: 1, hours: 1, label: "ساعة مجانية", code: "SKI-BRONZE" },
  { score: 1500,  stars: 2, hours: 3, label: "٣ ساعات مجانية", code: "SKI-SILVER" },
  { score: 3500,  stars: 3, hours: 6, label: "٦ ساعات مجانية", code: "SKI-GOLD" },
  { score: 7000,  stars: 4, hours: 12, label: "يوم كامل مجاني", code: "SKI-PLATINUM" },
  { score: 12000, stars: 5, hours: 24, label: "يومان كاملان مجاناً", code: "SKI-DIAMOND" },
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
  const [hud, setHud] = useState({ speed: 0, distance: 0, score: 0, coins: 0, gates: 0, shields: 0, slowmo: 0, level: 1 });
  const [best, setBest] = useState<number>(() => Number(localStorage.getItem("ski2d-best") || 0));
  const [maxLevel, setMaxLevel] = useState<number>(() => Number(localStorage.getItem("ski2d-maxlvl") || 1));
  const [overMsg, setOverMsg] = useState("");
  const [levelStats, setLevelStats] = useState({ score: 0, coins: 0, stars: 0, time: 0 });

  // Game state kept in refs for the rAF loop
  const g = useRef({
    running: false,
    paused: false,
    sx: 0, svx: 0, sy: 0,
    speed: BASE_SPEED,
    keys: { left: false, right: false, brake: false, boost: false, jump: false, useShield: false, useSlowmo: false },
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    nextObstacleY: 0,
    score: 0, coins: 0, gates: 0,
    levelScore: 0, levelCoins: 0, levelTime: 0,
    levelIdx: 0, // 0-based
    // Powerups
    shields: 0, slowmo: 0, // counts available
    activeShield: 0, // seconds remaining
    activeSlowmo: 0,  // seconds remaining
    // Player abilities
    airTime: 0, // seconds airborne (from ramp)
    jumpVy: 0,
    z: 0, // height above ground (visual only)
    // Boss
    bossActive: false,
    bossY: 0, // distance behind player (positive = behind)
    bossX: 0,
    bossAnim: 0,
    // animation
    t: 0,
    skierAnim: 0,
    screenShake: 0,
    flash: 0,
    boostFlash: 0,
    shieldFlash: 0,
    slowmoFlash: 0,
    // viewport
    w: 800, h: 600,
    dpr: 1,
    bgSeed: Math.random() * 1000,
  });

  // ============================================================
  // World generation
  // ============================================================
  const spawnObstacles = useCallback(() => {
    const s = g.current;
    const level = LEVELS[s.levelIdx];
    const FINISH = level.distance;

    while (s.nextObstacleY < s.sy + 2000) {
      const y = s.nextObstacleY;
      const progress = clamp(s.sy / FINISH, 0, 1);
      // Per-level difficulty curve
      const difficulty = progress < 0.2
        ? progress * 0.5
        : 0.1 + Math.pow((progress - 0.2) / 0.8, 1.6) * 0.9;
      const density = 1 + difficulty * 4;
      const count = Math.max(1, Math.round(rand(density - 0.5, density + 1)));
      const rowSpacing = 200 - difficulty * 80;

      for (let i = 0; i < count; i++) {
        const row = y + rand(20, 100);
        const kind = pickKind(level);
        const x = rand(-TRACK_HALF_WIDTH + 30, TRACK_HALF_WIDTH - 30);
        s.obstacles.push(makeObstacle(kind, x, row));
      }

      // Slalom gates (only relevant levels)
      const gateChance = (level.spawnWeights.gateR || 0) + (level.spawnWeights.gateB || 0);
      if (gateChance > 0 && Math.random() < 0.3 + difficulty * 0.3) {
        const gy = y + rand(40, 90);
        const gx = rand(-TRACK_HALF_WIDTH + 80, TRACK_HALF_WIDTH - 80);
        const color: ObstacleKind = Math.random() < 0.5 ? "gateR" : "gateB";
        s.obstacles.push(makeObstacle(color, gx - 35, gy));
        s.obstacles.push(makeObstacle(color, gx + 35, gy));
      }

      s.nextObstacleY += rowSpacing;
    }
    s.obstacles = s.obstacles.filter((o) => o.y > s.sy - 200);
  }, []);

  const pickKind = (level: LevelConfig): ObstacleKind => {
    const weights = level.spawnWeights;
    const entries = Object.entries(weights) as [ObstacleKind, number][];
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let n = Math.random() * total;
    for (const [kind, w] of entries) {
      n -= w;
      if (n <= 0) return kind;
    }
    return "coin";
  };

  const makeObstacle = (kind: ObstacleKind, x: number, y: number): Obstacle => {
    const radii: Record<ObstacleKind, number> = {
      tree: 18, rock: 20, bump: 16, coin: 14, gateR: 10, gateB: 10, boost: 22,
      ramp: 32, shield: 18, slowmo: 18, windL: 24, windR: 24, iceCave: 28, yeti: 30,
    };
    return { kind, x, y, r: radii[kind], seed: Math.random() };
  };

  // ============================================================
  // Particle helpers
  // ============================================================
  const emitSnowTrail = (sx: number, sy: number, speed: number, dt: number) => {
    const s = g.current;
    if (s.airTime > 0) return; // no trail in air
    const count = Math.floor(speed * dt * 0.08) + 1;
    for (let i = 0; i < count; i++) {
      s.particles.push({
        x: sx + rand(-8, 8), y: sy - rand(0, 8),
        vx: rand(-40, 40), vy: -rand(30, 80),
        life: rand(0.4, 0.9), maxLife: 0.9,
        size: rand(2, 5), color: "#ffffff", kind: "snow",
      });
    }
  };

  const emitCrash = (x: number, y: number) => {
    const s = g.current;
    for (let i = 0; i < 30; i++) {
      s.particles.push({
        x, y,
        vx: rand(-260, 260), vy: rand(-260, 120),
        life: rand(0.5, 1.1), maxLife: 1.1,
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
        vx: Math.cos(ang) * rand(80, 160), vy: Math.sin(ang) * rand(80, 160),
        life: 0.5, maxLife: 0.5,
        size: rand(2, 4), color: "#fbbf24", kind: "coin",
      });
    }
  };

  const emitShieldBurst = (x: number, y: number) => {
    const s = g.current;
    for (let i = 0; i < 20; i++) {
      const ang = (i / 20) * Math.PI * 2;
      s.particles.push({
        x, y,
        vx: Math.cos(ang) * 200, vy: Math.sin(ang) * 200,
        life: 0.6, maxLife: 0.6,
        size: rand(3, 6), color: "#38bdf8", kind: "shield",
      });
    }
  };

  const seedAmbientFlakes = () => {
    const s = g.current;
    const level = LEVELS[s.levelIdx];
    const count = 50 + Math.floor(level.fog * 80);
    for (let i = 0; i < count; i++) {
      s.particles.push({
        x: rand(-TRACK_HALF_WIDTH * 2, TRACK_HALF_WIDTH * 2),
        y: s.sy + rand(-200, 800),
        vx: rand(-20, 20), vy: rand(-10, 20),
        life: 999, maxLife: 999,
        size: rand(1.2, 2.8), color: "#ffffff", kind: "flake",
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
      const w = c.clientWidth, h = c.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      g.current.w = w; g.current.h = h; g.current.dpr = dpr;
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
      // Powerup keys
      if ((e.key === "q" || e.key === "Q") && g.current.shields > 0 && g.current.activeShield <= 0) {
        activateShield();
      }
      if ((e.key === "e" || e.key === "E") && g.current.slowmo > 0 && g.current.activeSlowmo <= 0) {
        activateSlowmo();
      }
      const k = keyMap[e.key];
      if (k) {
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
      if (k) g.current.keys[k] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const activateShield = () => {
    const s = g.current;
    if (s.shields <= 0 || s.activeShield > 0) return;
    s.shields--;
    s.activeShield = 5; // 5 seconds
    s.shieldFlash = 1;
    emitShieldBurst(s.sx, s.sy);
  };
  const activateSlowmo = () => {
    const s = g.current;
    if (s.slowmo <= 0 || s.activeSlowmo > 0) return;
    s.slowmo--;
    s.activeSlowmo = 4; // 4 seconds
    s.slowmoFlash = 1;
  };

  // ============================================================
  // Start / reset / level transitions
  // ============================================================
  const startGame = () => {
    g.current.levelIdx = 0;
    g.current.score = 0;
    g.current.coins = 0;
    g.current.gates = 0;
    g.current.shields = 0;
    g.current.slowmo = 0;
    setState("intro");
    setTimeout(() => beginLevel(), 100);
  };

  const startFromLevel = (levelIdx: number) => {
    g.current.levelIdx = levelIdx;
    g.current.score = 0;
    g.current.coins = 0;
    g.current.gates = 0;
    g.current.shields = levelIdx >= 2 ? 1 : 0;
    g.current.slowmo = levelIdx >= 2 ? 1 : 0;
    setState("intro");
    setTimeout(() => beginLevel(), 100);
  };

  const beginLevel = () => {
    const s = g.current;
    s.sx = 0; s.svx = 0; s.sy = 0;
    s.speed = BASE_SPEED;
    s.levelScore = 0; s.levelCoins = 0; s.levelTime = 0;
    s.obstacles = [];
    s.particles = [];
    s.nextObstacleY = 0;
    s.t = 0; s.skierAnim = 0; s.screenShake = 0; s.flash = 0; s.boostFlash = 0;
    s.shieldFlash = 0; s.slowmoFlash = 0;
    s.activeShield = 0; s.activeSlowmo = 0;
    s.airTime = 0; s.jumpVy = 0; s.z = 0;
    s.keys = { left: false, right: false, brake: false, boost: false, jump: false, useShield: false, useSlowmo: false };
    s.bossActive = LEVELS[s.levelIdx].hasBoss;
    s.bossY = 600; // starts behind
    s.bossX = 0;
    s.bossAnim = 0;
    s.running = true;
    s.paused = false;
    spawnObstacles();
    seedAmbientFlakes();
    setHud({ speed: 0, distance: 0, score: s.score, coins: s.coins, gates: s.gates, shields: s.shields, slowmo: s.slowmo, level: s.levelIdx + 1 });
    setOverMsg("");
    setState("playing");
  };

  const completeLevel = () => {
    const s = g.current;
    s.running = false;
    s.score += s.levelScore + 500; // level completion bonus
    // Star rating: based on level performance
    const level = LEVELS[s.levelIdx];
    const maxPossible = level.distance * 0.3 + 800;
    const ratio = s.levelScore / maxPossible;
    const stars = ratio >= 0.7 ? 3 : ratio >= 0.4 ? 2 : 1;
    setLevelStats({ score: s.levelScore, coins: s.levelCoins, stars, time: Math.round(s.levelTime) });
    if (s.levelIdx + 1 > maxLevel) {
      const newMax = s.levelIdx + 1;
      setMaxLevel(newMax);
      localStorage.setItem("ski2d-maxlvl", String(newMax));
    }
    if (s.levelIdx >= LEVELS.length - 1) {
      // Final victory
      if (s.score > best) {
        setBest(s.score);
        localStorage.setItem("ski2d-best", String(s.score));
      }
      setState("victory");
    } else {
      setState("levelComplete");
    }
  };

  const nextLevel = () => {
    g.current.levelIdx++;
    // Carry over 1 shield + slowmo as reward for completing level
    g.current.shields = Math.min(3, g.current.shields + 1);
    g.current.slowmo = Math.min(3, g.current.slowmo + 1);
    setState("intro");
    setTimeout(() => beginLevel(), 100);
  };

  const endGame = (msg: string) => {
    const s = g.current;
    s.running = false;
    s.score += s.levelScore;
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

    const update = (rawDt: number) => {
      const s = g.current;
      const level = LEVELS[s.levelIdx];
      // Slowmo affects effective dt
      const slowFactor = s.activeSlowmo > 0 ? 0.45 : 1;
      const dt = rawDt * slowFactor;
      s.levelTime += rawDt;

      // Decay powerup timers (in real time)
      if (s.activeShield > 0) s.activeShield = Math.max(0, s.activeShield - rawDt);
      if (s.activeSlowmo > 0) s.activeSlowmo = Math.max(0, s.activeSlowmo - rawDt);
      s.shieldFlash = Math.max(0, s.shieldFlash - rawDt * 2);
      s.slowmoFlash = Math.max(0, s.slowmoFlash - rawDt * 2);

      // ----- speed -----
      let accel = GRAVITY_ACCEL;
      if (s.keys.boost) { accel += BOOST_ACCEL; s.boostFlash = Math.min(1, s.boostFlash + dt * 3); }
      else s.boostFlash = Math.max(0, s.boostFlash - dt * 2);
      if (s.keys.brake && s.airTime <= 0) accel -= BRAKE_DECEL;
      s.speed += accel * dt;
      const maxSpd = s.keys.boost ? BOOST_SPEED : MAX_SPEED;
      s.speed = clamp(s.speed, 60, maxSpd);

      // ----- steering -----
      if (s.keys.left) s.svx -= STEER_ACCEL * dt;
      if (s.keys.right) s.svx += STEER_ACCEL * dt;
      // Wind effect (level-wide, gusts)
      if (level.windStrength !== 0) {
        const gust = Math.sin(s.t * 0.4) * 0.5 + 0.5; // 0..1
        s.svx += level.windStrength * gust * 200 * dt;
      }
      s.svx -= s.svx * STEER_DAMP * dt;
      s.svx = clamp(s.svx, -MAX_LATERAL, MAX_LATERAL);
      s.sx += s.svx * dt;
      if (s.sx > TRACK_HALF_WIDTH - 8) { s.sx = TRACK_HALF_WIDTH - 8; s.svx = -Math.abs(s.svx) * 0.3; }
      if (s.sx < -TRACK_HALF_WIDTH + 8) { s.sx = -TRACK_HALF_WIDTH + 8; s.svx = Math.abs(s.svx) * 0.3; }

      // ----- jump physics -----
      if (s.airTime > 0) {
        s.airTime -= rawDt;
        s.z += s.jumpVy * rawDt;
        s.jumpVy -= 320 * rawDt; // gravity
        if (s.airTime <= 0 || s.z <= 0) {
          s.z = 0;
          s.airTime = 0;
          s.jumpVy = 0;
          // landing puff
          for (let i = 0; i < 12; i++) {
            s.particles.push({
              x: s.sx + rand(-12, 12), y: s.sy,
              vx: rand(-120, 120), vy: -rand(40, 100),
              life: 0.5, maxLife: 0.5, size: rand(2, 5),
              color: "#ffffff", kind: "snow",
            });
          }
        }
      }

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

      // ----- boss update (level 5) -----
      if (s.bossActive) {
        s.bossAnim += rawDt;
        // Boss tries to catch up: closes distance unless player is boosting
        const closingRate = s.keys.boost ? -40 : 25;
        s.bossY = clamp(s.bossY + closingRate * rawDt, 200, 900);
        // Boss tracks player x slowly
        s.bossX += (s.sx - s.bossX) * 0.6 * rawDt;
        // Boss collision = game over
        const bossWorldY = s.sy - s.bossY;
        const dx = s.bossX - s.sx;
        const dy = bossWorldY - s.sy;
        if (Math.hypot(dx, dy) < 30) {
          if (s.activeShield > 0) {
            s.activeShield = 0;
            s.shieldFlash = 1;
            s.bossY = 800; // push boss back
            emitShieldBurst(s.sx, s.sy);
          } else {
            s.screenShake = 1.2;
            emitCrash(s.sx, s.sy);
            endGame("👹 أمسك بك الـ Yeti!");
            return;
          }
        }
      }

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
          // Skip ground collisions while jumping
          const isGroundOnly = o.kind === "tree" || o.kind === "rock" || o.kind === "bump" || o.kind === "iceCave";
          if (s.airTime > 0 && isGroundOnly) continue;

          if (o.kind === "coin") {
            o.taken = true;
            s.levelCoins++;
            s.levelScore += 50;
            s.flash = 0.4;
            emitCoinBurst(o.x, o.y);
          } else if (o.kind === "boost") {
            o.taken = true;
            s.speed = Math.min(BOOST_SPEED, s.speed + 180);
            s.boostFlash = 1;
            s.levelScore += 20;
          } else if (o.kind === "ramp") {
            o.taken = true;
            // Launch into the air
            s.airTime = 1.4;
            s.jumpVy = 220;
            s.z = 0.1;
            s.speed = Math.min(BOOST_SPEED, s.speed + 80);
            s.levelScore += 75;
            s.flash = 0.3;
          } else if (o.kind === "shield") {
            o.taken = true;
            s.shields = Math.min(3, s.shields + 1);
            s.flash = 0.4;
            s.shieldFlash = 1;
            emitShieldBurst(o.x, o.y);
            s.levelScore += 40;
          } else if (o.kind === "slowmo") {
            o.taken = true;
            s.slowmo = Math.min(3, s.slowmo + 1);
            s.flash = 0.4;
            s.slowmoFlash = 1;
            s.levelScore += 40;
          } else if (o.kind === "windL" || o.kind === "windR") {
            o.taken = true;
            // strong gust
            s.svx += (o.kind === "windL" ? -1 : 1) * 350;
            s.screenShake = 0.2;
          } else if (o.kind === "bump") {
            o.taken = true;
            s.speed *= 0.88;
            s.screenShake = 0.3;
          } else if (o.kind === "iceCave") {
            // Ice cave = slip, lose control briefly
            o.taken = true;
            s.svx += (Math.random() < 0.5 ? -1 : 1) * 280;
            s.screenShake = 0.4;
            s.speed *= 0.92;
          } else if (o.kind === "gateR" || o.kind === "gateB") {
            // handled by y-crossing
          } else {
            // tree / rock — crash (or shield save)
            if (s.activeShield > 0) {
              s.activeShield = 0;
              s.shieldFlash = 1;
              o.taken = true;
              emitShieldBurst(o.x, o.y);
            } else {
              s.screenShake = 1;
              emitCrash(o.x, o.y);
              endGame(o.kind === "tree" ? "💥 اصطدمت بشجرة!" : "💥 اصطدمت بصخرة!");
              return;
            }
          }
        }
      }

      // Gate passing
      for (const o of s.obstacles) {
        if (o.taken) continue;
        if (o.kind !== "gateR" && o.kind !== "gateB") continue;
        if (o.y <= s.sy && o.y > s.sy - s.speed * dt - 2) {
          const pair = s.obstacles.find((p) => !p.taken && p !== o && p.kind === o.kind && Math.abs(p.y - o.y) < 12);
          if (pair) {
            const gateMinX = Math.min(o.x, pair.x);
            const gateMaxX = Math.max(o.x, pair.x);
            if (s.sx > gateMinX && s.sx < gateMaxX) {
              s.gates++;
              s.levelScore += 30;
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
          p.vy += 200 * dt;
          p.vx *= 0.96;
        } else if (p.kind === "flake") {
          p.x += Math.sin(s.t * 1.2 + p.y * 0.01) * 8 * dt;
          if (p.y < s.sy - 300) p.y += 1200;
          if (p.y > s.sy + 900) p.y -= 1200;
        } else if (p.kind === "coin") {
          p.vy += 400 * dt;
        } else if (p.kind === "shield") {
          p.vx *= 0.9;
          p.vy *= 0.9;
        }
        if (p.kind !== "flake") p.life -= rawDt;
      }
      s.particles = s.particles.filter((p) => p.life > 0);

      // ----- finish level -----
      if (s.sy >= level.distance) {
        completeLevel();
        return;
      }

      // ----- HUD -----
      if (Math.floor(s.t * 10) !== Math.floor((s.t - rawDt) * 10)) {
        setHud({
          speed: s.speed,
          distance: s.sy,
          score: s.score + s.levelScore,
          coins: s.coins + s.levelCoins,
          gates: s.gates,
          shields: s.shields,
          slowmo: s.slowmo,
          level: s.levelIdx + 1,
        });
      }
    };

    // ============================================================
    // Rendering
    // ============================================================
    const render = (ctx: CanvasRenderingContext2D) => {
      const s = g.current;
      const { w, h, dpr } = s;
      const level = LEVELS[s.levelIdx];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const camY = s.sy - h * 0.62;
      const camX = s.sx * 0.35;
      const shakeX = s.screenShake > 0 ? (Math.random() - 0.5) * 8 * s.screenShake : 0;
      const shakeY = s.screenShake > 0 ? (Math.random() - 0.5) * 8 * s.screenShake : 0;
      const wx = (x: number) => (x - camX) + w / 2 + shakeX;
      const wy = (y: number) => (y - camY) + shakeY - (s.z * 30); // jump visual offset

      const horizonY = h * 0.28;

      // ---- Sky gradient (per-level theme) ----
      const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
      sky.addColorStop(0, level.bgTop);
      sky.addColorStop(0.6, level.bgMid);
      sky.addColorStop(1, level.bgBot);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, horizonY);

      // Sun (only for clear levels)
      if (level.fog < 0.3) {
        const sunG = ctx.createRadialGradient(w * 0.78, h * 0.1, 0, w * 0.78, h * 0.1, 220);
        sunG.addColorStop(0, "rgba(255,235,180,0.95)");
        sunG.addColorStop(0.4, "rgba(255,220,180,0.25)");
        sunG.addColorStop(1, "rgba(255,220,180,0)");
        ctx.fillStyle = sunG;
        ctx.fillRect(0, 0, w, horizonY);
      }

      // Mountains
      drawSkyline(ctx, w, horizonY, camY * 0.03, "#9cb4cc", 0.5, 0);
      drawSkyline(ctx, w, horizonY, camY * 0.08, "#b8c8dc", 0.35, 1);
      drawSkyline(ctx, w, horizonY, camY * 0.16, "#d4dde7", 0.22, 2);

      // Ground
      const ground = ctx.createLinearGradient(0, horizonY, 0, h);
      ground.addColorStop(0, level.groundTint);
      ground.addColorStop(0.4, "#f2f7fb");
      ground.addColorStop(1, "#ffffff");
      ctx.fillStyle = ground;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      drawSlope(ctx, s, wx, wy, w, h, horizonY);
      drawForestSides(ctx, s, wx, wy, w, h, horizonY);
      drawTrailStreaks(ctx, s, wx, wy);

      // Boss (drawn behind player but in front of slope)
      if (s.bossActive) {
        const bossWorldY = s.sy - s.bossY;
        drawYeti(ctx, wx(s.bossX), wy(bossWorldY), s.bossAnim);
      }

      // Obstacles
      const visible = s.obstacles
        .filter((o) => o.y > s.sy - 300 && o.y < s.sy + 900)
        .sort((a, b) => a.y - b.y);
      for (const o of visible) drawObstacle(ctx, o, wx, wy, s);

      // Skier
      drawSkier(ctx, s, wx, wy);

      // Particles
      drawParticles(ctx, s, wx, wy);

      // Fog overlay (per level)
      if (level.fog > 0) {
        const fogGrad = ctx.createLinearGradient(0, 0, 0, h);
        fogGrad.addColorStop(0, `rgba(220,230,240,${level.fog * 0.5})`);
        fogGrad.addColorStop(0.4, `rgba(220,230,240,${level.fog * 0.3})`);
        fogGrad.addColorStop(1, `rgba(220,230,240,${level.fog * 0.15})`);
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // Boost overlay
      if (s.boostFlash > 0.01) drawBoostOverlay(ctx, w, h, s.boostFlash);

      // Slowmo overlay
      if (s.activeSlowmo > 0) {
        ctx.fillStyle = `rgba(120,80,200,${0.12 + Math.sin(s.t * 4) * 0.04})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Shield active aura around screen edge
      if (s.activeShield > 0) {
        const pulse = 0.4 + Math.sin(s.t * 8) * 0.15;
        ctx.strokeStyle = `rgba(56,189,248,${pulse})`;
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, w - 8, h - 8);
      }

      // Wind direction indicator
      if (level.windStrength !== 0) {
        const gust = Math.sin(s.t * 0.4) * 0.5 + 0.5;
        const arrowAlpha = 0.3 + gust * 0.4;
        ctx.save();
        ctx.globalAlpha = arrowAlpha;
        ctx.fillStyle = "#cbd5e1";
        const dir = Math.sign(level.windStrength);
        for (let i = 0; i < 3; i++) {
          const ax = w / 2 + dir * (60 + i * 30);
          const ay = 50;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - dir * 14, ay - 6);
          ctx.lineTo(ax - dir * 14, ay + 6);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      if (s.flash > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.25})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Vignette
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

  // ============================================================
  // Mobile touch controls
  // ============================================================
  const touchRef = useRef<{
    active: boolean;
    startX: number; startY: number; startT: number;
    lastX: number; lastY: number; lastT: number;
    vx: number; vy: number;
    pointers: number;
    boostHeld: boolean;
    brakeHeld: boolean;
  }>({
    active: false, startX: 0, startY: 0, startT: 0,
    lastX: 0, lastY: 0, lastT: 0, vx: 0, vy: 0,
    pointers: 0, boostHeld: false, brakeHeld: false,
  });

  const onTouchStart = (e: React.TouchEvent) => {
    if (state !== "playing") return;
    const t = touchRef.current;
    t.pointers = e.touches.length;
    if (e.touches.length >= 2) {
      g.current.keys.brake = true;
      t.brakeHeld = true;
      return;
    }
    const p = e.touches[0];
    t.active = true;
    t.startX = t.lastX = p.clientX;
    t.startY = t.lastY = p.clientY;
    t.startT = t.lastT = performance.now();
    t.vx = 0; t.vy = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (state !== "playing" || !touchRef.current.active) return;
    const t = touchRef.current;
    const p = e.touches[0];
    const now = performance.now();
    const dt = Math.max(1, now - t.lastT);
    const dx = p.clientX - t.lastX;
    const dy = p.clientY - t.lastY;
    g.current.svx += dx * 6;
    g.current.svx = clamp(g.current.svx, -MAX_LATERAL, MAX_LATERAL);
    t.vx = dx / dt * 1000;
    t.vy = dy / dt * 1000;
    t.lastX = p.clientX; t.lastY = p.clientY; t.lastT = now;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touchRef.current;
    if (t.brakeHeld && e.touches.length < 2) {
      g.current.keys.brake = false;
      t.brakeHeld = false;
    }
    if (!t.active) return;
    if (e.touches.length > 0) return;
    t.active = false;
    const dx = t.lastX - t.startX;
    const dy = t.lastY - t.startY;
    const dur = performance.now() - t.startT;
    const dist = Math.hypot(dx, dy);
    if (dur < 350 && dist > 50) {
      const angle = Math.atan2(dy, dx);
      const absA = Math.abs(angle);
      if (absA > Math.PI * 0.66) {
        g.current.svx -= STEER_IMPULSE * 1.5;
      } else if (absA < Math.PI * 0.34) {
        g.current.svx += STEER_IMPULSE * 1.5;
      } else if (angle < -Math.PI * 0.34 && angle > -Math.PI * 0.66) {
        g.current.speed = Math.min(BOOST_SPEED, g.current.speed + 120);
        g.current.boostFlash = 1;
      } else if (angle > Math.PI * 0.34 && angle < Math.PI * 0.66) {
        g.current.speed *= 0.85;
      }
    } else if (dur < 200 && dist < 12) {
      g.current.speed = Math.min(BOOST_SPEED, g.current.speed + 60);
      g.current.boostFlash = Math.max(g.current.boostFlash, 0.6);
    }
  };

  const currentLevel = LEVELS[g.current.levelIdx] || LEVELS[0];
  const levelProgress = currentLevel ? Math.min(100, (hud.distance / currentLevel.distance) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-night overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ imageRendering: "auto" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      />

      {/* HUD */}
      {state === "playing" && (
        <>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
            <HudChip label="السرعة" value={`${Math.round(hud.speed * 0.6)}`} unit="km/h" accent="ice" />
            <HudChip label="النقاط" value={`${hud.score}`} accent="gold" />
            <HudChip label="المرحلة" value={`${hud.level}/${LEVELS.length}`} accent="frost" />
          </div>

          <div className="absolute top-3 right-3 glass-strong rounded-xl px-3 py-1.5 text-frost text-xs flex gap-2 font-bold">
            <span>🪙 {hud.coins}</span>
            <span className="text-border">|</span>
            <span>🚩 {hud.gates}</span>
          </div>

          {/* Level name + progress */}
          <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-1.5">
            <div className="glass-strong rounded-full px-3 py-1 text-[10px] sm:text-xs text-frost font-bold flex items-center gap-1.5">
              <span className="text-base">{currentLevel.emoji}</span>
              <span>{currentLevel.name}</span>
            </div>
            <div className="w-56 sm:w-72 h-1.5 rounded-full bg-frost/15 overflow-hidden">
              <div
                className="h-full bg-gradient-aurora"
                style={{ width: `${levelProgress}%`, transition: "width .1s linear" }}
              />
            </div>
          </div>

          {/* Powerup buttons (right side) */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-auto">
            <button
              onClick={activateShield}
              disabled={hud.shields <= 0 || g.current.activeShield > 0}
              className="h-14 w-14 rounded-2xl glass-strong border-2 border-ice/40 disabled:opacity-30 disabled:border-frost/20 grid place-items-center text-2xl hover:scale-105 transition-spring relative"
              aria-label="درع"
            >
              🛡️
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-ice text-night text-[10px] font-black grid place-items-center">
                {hud.shields}
              </span>
              {g.current.activeShield > 0 && (
                <div className="absolute inset-0 rounded-2xl border-2 border-ice animate-pulse" />
              )}
            </button>
            <button
              onClick={activateSlowmo}
              disabled={hud.slowmo <= 0 || g.current.activeSlowmo > 0}
              className="h-14 w-14 rounded-2xl glass-strong border-2 border-purple-400/40 disabled:opacity-30 disabled:border-frost/20 grid place-items-center text-2xl hover:scale-105 transition-spring relative"
              aria-label="بطء الوقت"
            >
              ⏱️
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-purple-400 text-night text-[10px] font-black grid place-items-center">
                {hud.slowmo}
              </span>
              {g.current.activeSlowmo > 0 && (
                <div className="absolute inset-0 rounded-2xl border-2 border-purple-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Pause button */}
          <button
            onClick={() => { g.current.paused = true; setState("paused"); }}
            className="absolute top-3 left-3 h-10 w-10 rounded-full glass-strong text-frost grid place-items-center hover:bg-night/80 transition-smooth"
            aria-label="إيقاف"
          >
            <Pause className="h-4 w-4" />
          </button>

          {/* Mobile hint */}
          <div className="absolute bottom-6 inset-x-0 sm:hidden flex justify-center pointer-events-none">
            <div className="glass-strong rounded-full px-4 py-2 text-frost/80 text-[11px] font-bold flex items-center gap-2 animate-pulse-soft">
              <span className="text-base">👆</span>
              اسحب للتوجيه • فوق=سرعة • إصبعين=فرامل
            </div>
          </div>
        </>
      )}

      {/* Menu */}
      {state === "menu" && <Menu onStart={startGame} onSelectLevel={startFromLevel} best={best} maxLevel={maxLevel} />}

      {/* Level intro */}
      {state === "intro" && (
        <LevelIntro level={currentLevel} onStart={() => beginLevel()} />
      )}

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

      {/* Level complete */}
      {state === "levelComplete" && (
        <LevelComplete
          level={currentLevel}
          stats={levelStats}
          totalScore={g.current.score}
          onNext={nextLevel}
          onMenu={() => setState("menu")}
        />
      )}

      {/* Final victory */}
      {state === "victory" && (
        <VictoryScreen
          totalScore={g.current.score}
          best={best}
          onPlayAgain={startGame}
          onMenu={() => setState("menu")}
        />
      )}

      {/* Game over */}
      {state === "over" && (() => {
        const earnedReward = [...REWARD_TIERS].reverse().find((t) => g.current.score >= t.score);
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-night/70 backdrop-blur-sm animate-fade-in p-4 overflow-auto">
            <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-md w-full text-center animate-scale-in my-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-frost mb-2">{overMsg}</h2>
              <div className="text-sm text-muted-foreground mb-4">
                وصلت للمرحلة <span className="text-ice font-black">{currentLevel.emoji} {currentLevel.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 my-5">
                <Stat label="النقاط الكلية" value={g.current.score} color="gold" />
                <Stat label="عملات" value={hud.coins} color="gold" />
                <Stat label="بوابات" value={hud.gates} color="ice" />
              </div>
              {g.current.score >= best && g.current.score > 0 && (
                <div className="text-gold font-black mb-3 flex items-center justify-center gap-2 animate-fade-in text-sm">
                  <Trophy className="h-4 w-4" /> رقم قياسي جديد!
                </div>
              )}

              {earnedReward ? (
                <div className="mb-5 rounded-2xl bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border-2 border-gold/40 p-4 animate-scale-in">
                  <div className="text-3xl mb-1">🎁</div>
                  <div className="text-gold font-black text-lg mb-1">مبروك! فزت بجائزة</div>
                  <div className="text-frost font-bold text-xl mb-2">{earnedReward.label}</div>
                  <div className="flex justify-center gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < earnedReward.stars ? "fill-gold text-gold" : "text-frost/20"}`} />
                    ))}
                  </div>
                  <div className="bg-night/60 rounded-xl py-2 px-3 border border-gold/30">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">كود الخصم</div>
                    <div className="text-gold font-black text-lg tracking-widest font-mono">{earnedReward.code}</div>
                  </div>
                </div>
              ) : (
                <div className="mb-5 rounded-2xl bg-night/40 border border-border/50 p-3 text-xs text-muted-foreground">
                  <div className="text-frost font-bold mb-1">🎯 اقترب من الجائزة!</div>
                  <div>اجمع <span className="text-gold font-black">{REWARD_TIERS[0].score - g.current.score}</span> نقطة إضافية للفوز بـ {REWARD_TIERS[0].label}</div>
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
const HudChip = ({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent: "ice" | "gold" | "frost" }) => {
  const colorMap = { ice: "text-ice", gold: "text-gold", frost: "text-frost" } as const;
  return (
    <div className="glass-strong rounded-2xl px-3 py-1.5">
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

// ============================================================
// Menu — with level select
// ============================================================
const Menu = ({ onStart, onSelectLevel, best, maxLevel }: { onStart: () => void; onSelectLevel: (i: number) => void; best: number; maxLevel: number }) => {
  const [showLevels, setShowLevels] = useState(false);
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-night via-deep to-night overflow-auto animate-fade-in p-4">
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
      <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-md w-full text-center relative animate-scale-in my-auto">
        <div className="text-6xl sm:text-7xl mb-2 float-y">⛷️</div>
        <h1 className="text-3xl sm:text-4xl font-black text-gradient-frost mb-1">تحدي وادي الراحة</h1>
        <p className="text-sm text-muted-foreground mb-5">٥ مراحل، تحديات متنوعة، وجوائز حقيقية!</p>

        {!showLevels ? (
          <>
            {/* Quick rules */}
            <div className="text-right text-xs text-frost/80 space-y-1 mb-4 bg-night/40 rounded-2xl p-3.5">
              <div className="flex justify-between"><span>للتوجيه</span> <span><kbd className="px-1.5 py-0.5 rounded bg-mid text-[10px]">◀ ▶</kbd> / سحب</span></div>
              <div className="flex justify-between"><span>تسريع</span> <kbd className="px-1.5 py-0.5 rounded bg-mid text-[10px]">Space</kbd></div>
              <div className="flex justify-between"><span>درع</span> <kbd className="px-1.5 py-0.5 rounded bg-mid text-[10px]">Q</kbd></div>
              <div className="flex justify-between"><span>بطء الوقت</span> <kbd className="px-1.5 py-0.5 rounded bg-mid text-[10px]">E</kbd></div>
            </div>

            {/* Rewards */}
            <div className="text-right text-xs space-y-1 mb-4 bg-gradient-to-br from-gold/10 to-transparent border border-gold/30 rounded-2xl p-3.5">
              <div className="text-gold font-black text-center mb-2 text-sm">🎁 جوائز حقيقية في المركز</div>
              {REWARD_TIERS.map((t) => (
                <div key={t.code} className="flex justify-between items-center text-frost/90">
                  <span className="text-gold font-bold flex items-center gap-1">
                    {Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="h-2.5 w-2.5 fill-gold text-gold" />)}
                    <span className="ml-1">{t.score}+</span>
                  </span>
                  <span className="text-xs">{t.label}</span>
                </div>
              ))}
            </div>

            {best > 0 && (
              <div className="flex items-center justify-center gap-2 text-gold mb-4 font-bold text-sm">
                <Trophy className="h-4 w-4" /> أفضل: <span className="font-black">{best}</span>
              </div>
            )}

            <Button
              size="lg"
              onClick={onStart}
              className="bg-gradient-ice text-night font-black h-14 px-10 text-lg shadow-ice hover:shadow-lift hover:-translate-y-1 transition-spring w-full mb-2"
            >
              <Play className="h-5 w-5 ml-2 fill-current" />
              ابدأ من البداية
            </Button>
            {maxLevel > 1 && (
              <button
                onClick={() => setShowLevels(true)}
                className="w-full text-frost/80 hover:text-ice text-sm font-bold py-2 transition-smooth"
              >
                اختر مرحلة ▾
              </button>
            )}
          </>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {LEVELS.map((lvl, i) => {
                const unlocked = i < maxLevel;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => unlocked && onSelectLevel(i)}
                    disabled={!unlocked}
                    className={`w-full rounded-2xl p-3 text-right flex items-center gap-3 transition-spring ${
                      unlocked
                        ? "bg-night/50 hover:bg-night/80 border border-ice/30 hover:border-ice/60 hover:scale-[1.02]"
                        : "bg-night/30 border border-border/30 opacity-50"
                    }`}
                  >
                    <div className="text-3xl">{unlocked ? lvl.emoji : "🔒"}</div>
                    <div className="flex-1 text-right">
                      <div className="text-frost font-black text-sm">المرحلة {lvl.id} • {lvl.name}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{lvl.description}</div>
                    </div>
                    {unlocked && <ChevronRight className="h-4 w-4 text-ice rotate-180" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowLevels(false)}
              className="w-full text-frost/80 hover:text-ice text-sm font-bold py-2 transition-smooth"
            >
              ← رجوع
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Level Intro
// ============================================================
const LevelIntro = ({ level, onStart }: { level: LevelConfig; onStart: () => void }) => {
  useEffect(() => {
    const id = setTimeout(onStart, 2200);
    return () => clearTimeout(id);
  }, [onStart]);
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-night via-deep to-night animate-fade-in z-10">
      <div className="text-center px-6 animate-scale-in">
        <div className="text-[10px] text-ice font-black tracking-[0.3em] uppercase mb-3">المرحلة {level.id} / {LEVELS.length}</div>
        <div className="text-8xl mb-4 animate-bounce-soft">{level.emoji}</div>
        <h2 className="text-4xl sm:text-5xl font-black text-gradient-frost mb-3">{level.name}</h2>
        <p className="text-frost/80 text-base sm:text-lg max-w-md mx-auto mb-2">{level.description}</p>
        <p className="text-ice text-sm sm:text-base max-w-md mx-auto font-bold">{level.intro}</p>
        <div className="mt-8 flex justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-ice animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-ice animate-pulse" style={{ animationDelay: "0.2s" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-ice animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Level Complete
// ============================================================
const LevelComplete = ({
  level, stats, totalScore, onNext, onMenu,
}: {
  level: LevelConfig;
  stats: { score: number; coins: number; stars: number; time: number };
  totalScore: number;
  onNext: () => void;
  onMenu: () => void;
}) => (
  <div className="absolute inset-0 flex items-center justify-center bg-night/80 backdrop-blur-sm animate-fade-in p-4">
    <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-md w-full text-center animate-scale-in">
      <div className="text-5xl mb-2 animate-bounce-soft">{level.emoji}</div>
      <div className="text-xs text-ice font-bold tracking-widest uppercase mb-1">المرحلة {level.id} مكتملة!</div>
      <h2 className="text-3xl font-black text-frost mb-4">{level.name}</h2>

      {/* Stars */}
      <div className="flex justify-center gap-2 mb-5">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            className={`h-12 w-12 transition-spring ${
              i <= stats.stars ? "fill-gold text-gold animate-scale-in" : "text-frost/20"
            }`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 my-4">
        <Stat label="نقاط المرحلة" value={`+${stats.score}`} color="gold" />
        <Stat label="عملات" value={stats.coins} color="gold" />
        <Stat label="الوقت" value={`${stats.time}s`} color="ice" />
      </div>

      <div className="bg-gradient-to-br from-ice/15 to-transparent border border-ice/30 rounded-2xl p-3 mb-4">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">المجموع الكلي</div>
        <div className="text-2xl font-black text-gradient-aurora">{totalScore}</div>
      </div>

      <div className="bg-night/50 rounded-xl p-2 mb-4 text-xs text-frost/80">
        🎁 مكافأة المرحلة: <span className="text-ice font-black">+1 درع</span> • <span className="text-purple-300 font-black">+1 بطء وقت</span>
      </div>

      <div className="flex gap-3">
        <Button onClick={onNext} className="flex-1 bg-gradient-ice text-night font-black h-12 shadow-ice hover:-translate-y-0.5 transition-spring">
          المرحلة التالية <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
        </Button>
        <Button onClick={onMenu} variant="outline" className="h-12 border-frost/25 text-frost">
          <Home className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
);

// ============================================================
// Victory Screen — All 5 levels complete!
// ============================================================
const VictoryScreen = ({ totalScore, best, onPlayAgain, onMenu }: { totalScore: number; best: number; onPlayAgain: () => void; onMenu: () => void }) => {
  const earnedReward = [...REWARD_TIERS].reverse().find((t) => totalScore >= t.score);
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-night/85 backdrop-blur animate-fade-in p-4 overflow-auto">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-2xl"
            style={{
              left: `${(i * 13) % 100}%`,
              top: `-10%`,
              animation: `confetti-fall ${3 + (i % 4)}s linear ${(i * 0.1) % 2}s infinite`,
            }}
          >{["🎉", "⭐", "🏆", "🎊", "❄️"][i % 5]}</span>
        ))}
      </div>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-md w-full text-center animate-scale-in relative my-auto">
        <div className="text-7xl mb-3 animate-bounce-soft">🏆</div>
        <div className="text-xs text-gold font-black tracking-widest uppercase mb-1">انتصار كامل!</div>
        <h2 className="text-3xl sm:text-4xl font-black text-gradient-aurora mb-2">أكملت كل المراحل!</h2>
        <p className="text-frost/80 text-sm mb-5">قهرت قمة سانت كاترين 👑</p>

        <div className="bg-gradient-to-br from-gold/20 to-transparent border-2 border-gold/40 rounded-2xl p-4 mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">النقاط الكلية</div>
          <div className="text-4xl font-black text-gradient-aurora">{totalScore}</div>
          {totalScore >= best && totalScore > 0 && (
            <div className="text-gold text-xs font-black mt-1 flex items-center justify-center gap-1">
              <Trophy className="h-3 w-3" /> رقم قياسي جديد!
            </div>
          )}
        </div>

        {earnedReward && (
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border-2 border-gold/40 p-4">
            <div className="text-3xl mb-1">🎁</div>
            <div className="text-gold font-black text-lg">{earnedReward.label}</div>
            <div className="flex justify-center gap-0.5 my-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < earnedReward.stars ? "fill-gold text-gold" : "text-frost/20"}`} />
              ))}
            </div>
            <div className="bg-night/60 rounded-xl py-2 px-3 border border-gold/30">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">كود الخصم</div>
              <div className="text-gold font-black text-lg tracking-widest font-mono">{earnedReward.code}</div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={onPlayAgain} className="flex-1 bg-gradient-ice text-night font-black h-12 shadow-ice">
            <RotateCcw className="h-4 w-4 ml-2" /> العب مجدداً
          </Button>
          <Button onClick={onMenu} variant="outline" className="h-12 border-frost/25 text-frost">
            <Home className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

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
  const spacing = 55;
  const startY = Math.floor((s.sy - 200) / spacing) * spacing;
  for (let y = startY; y < s.sy + 1000; y += spacing) {
    for (const side of [-1, 1]) {
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
        const depth = clamp((ty - s.sy + 300) / 1300, 0.4, 1);
        drawMiniTree(ctx, sx, sy, depth);
      }
    }
  }
}

function drawMiniTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  const s = scale;
  ctx.fillStyle = "rgba(30,50,80,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y + 4 * s, 14 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5a3a20";
  ctx.fillRect(x - 2 * s, y - 4 * s, 4 * s, 10 * s);
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
  const leftEdge = wx(-TRACK_HALF_WIDTH);
  const rightEdge = wx(TRACK_HALF_WIDTH);
  const topY = Math.max(horizonY, wy(s.sy + 1200));
  const botY = wy(s.sy - 300);

  const slopeGrad = ctx.createLinearGradient(0, topY, 0, botY);
  slopeGrad.addColorStop(0, "#e8f1f9");
  slopeGrad.addColorStop(0.5, "#fafdff");
  slopeGrad.addColorStop(1, "#ffffff");
  ctx.fillStyle = slopeGrad;
  ctx.fillRect(leftEdge, topY, rightEdge - leftEdge, botY - topY);

  ctx.strokeStyle = "rgba(80,110,150,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(leftEdge, topY);
  ctx.lineTo(leftEdge, botY);
  ctx.moveTo(rightEdge, topY);
  ctx.lineTo(rightEdge, botY);
  ctx.stroke();

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

  ctx.strokeStyle = "rgba(180,200,220,0.35)";
  ctx.lineWidth = 2;
  const spacing = 120;
  const offset = s.sy % spacing;
  for (let y = s.sy - 300; y < s.sy + 1200; y += spacing) {
    const yy = wy(y - (offset - s.sy % spacing));
    ctx.beginPath();
    const centerX = wx(0);
    const half = (rightEdge - leftEdge) / 2;
    const bulge = ((y - s.sy) / 1200) * 8;
    ctx.moveTo(centerX - half, yy + bulge);
    ctx.quadraticCurveTo(centerX, yy - bulge * 0.3, centerX + half, yy + bulge);
    ctx.stroke();
  }

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
  if (s.airTime > 0) return;
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
      const y = wy(s.sy - dy) + (s.z * 30); // anchor trail to ground even when jumping
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
  // Obstacles stay at ground level (don't move with player jump z)
  const y = wy(o.y) + (s.z * 30);
  const bob = Math.sin(s.t * 4 + (o.seed || 0) * 10) * 2;

  ctx.fillStyle = "rgba(30,50,80,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y + 6, o.r * 0.9, o.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (o.kind) {
    case "tree": {
      ctx.fillStyle = "#5a3a20";
      ctx.fillRect(x - 3, y - 4, 6, 12);
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
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.beginPath();
        ctx.moveTo(x - L.w * 0.7, y - L.off + 4);
        ctx.lineTo(x - L.w * 0.3, y - L.off - L.h * 0.5);
        ctx.lineTo(x - L.w * 0.1, y - L.off - L.h * 0.4);
        ctx.lineTo(x + L.w * 0.1, y - L.off + 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y - 52, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "rock": {
      ctx.fillStyle = "#3d2f24";
      ctx.beginPath();
      ctx.ellipse(x, y + 2, o.r + 2, (o.r + 2) * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6b4f3a";
      ctx.beginPath();
      ctx.ellipse(x, y, o.r, o.r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8a6e54";
      ctx.beginPath();
      ctx.ellipse(x - 2, y - 2, o.r - 3, (o.r - 3) * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#a89178";
      ctx.beginPath();
      ctx.ellipse(x - 5, y - 5, o.r - 9, (o.r - 9) * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(45,30,20,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - o.r * 0.3, y - o.r * 0.1);
      ctx.lineTo(x + o.r * 0.2, y + o.r * 0.3);
      ctx.moveTo(x + o.r * 0.1, y - o.r * 0.4);
      ctx.lineTo(x + o.r * 0.4, y);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(x - o.r * 0.7, y - o.r * 0.35);
      ctx.quadraticCurveTo(x - o.r * 0.4, y - o.r * 0.85, x - o.r * 0.1, y - o.r * 0.75);
      ctx.quadraticCurveTo(x + o.r * 0.3, y - o.r * 0.95, x + o.r * 0.65, y - o.r * 0.55);
      ctx.quadraticCurveTo(x + o.r * 0.5, y - o.r * 0.3, x + o.r * 0.2, y - o.r * 0.4);
      ctx.quadraticCurveTo(x - o.r * 0.2, y - o.r * 0.25, x - o.r * 0.7, y - o.r * 0.35);
      ctx.closePath();
      ctx.fill();
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
      const glow = ctx.createRadialGradient(x, y - 8 + float, 0, x, y - 8 + float, 22);
      glow.addColorStop(0, "rgba(251,191,36,0.55)");
      glow.addColorStop(1, "rgba(251,191,36,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y - 8 + float, 22, 0, Math.PI * 2);
      ctx.fill();
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
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x - 4, y - 12 + float, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "gateR":
    case "gateB": {
      const color = o.kind === "gateR" ? "#ef4444" : "#3b82f6";
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x - 1, y - 42, 3, 42);
      ctx.fillStyle = color;
      ctx.fillRect(x - 2, y - 46, 4, 46);
      const wave = Math.sin(s.t * 6 + (o.seed || 0) * 5) * 4;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 42);
      ctx.quadraticCurveTo(x + 14 + wave, y - 40, x + 22 + wave, y - 36);
      ctx.lineTo(x + 22 + wave, y - 26);
      ctx.quadraticCurveTo(x + 14 + wave, y - 24, x + 2, y - 28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y - 48, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "boost": {
      const float = bob * 0.5;
      const glow = ctx.createRadialGradient(x, y - 6 + float, 0, x, y - 6 + float, 30);
      glow.addColorStop(0, "rgba(56,189,248,0.7)");
      glow.addColorStop(1, "rgba(56,189,248,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 30, y - 36 + float, 60, 60);
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
    case "ramp": {
      // Snow ramp — angled wedge with stripe markers
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.moveTo(x - 32, y + 8);
      ctx.lineTo(x + 32, y + 8);
      ctx.lineTo(x + 32, y - 4);
      ctx.lineTo(x - 32, y - 28);
      ctx.closePath();
      ctx.fill();
      // Front face (lighter)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(x - 32, y + 8);
      ctx.lineTo(x + 32, y + 8);
      ctx.lineTo(x + 32, y - 4);
      ctx.lineTo(x - 32, y - 28);
      ctx.closePath();
      ctx.fill();
      // Hazard stripes on top
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - 32, y - 28);
      ctx.lineTo(x + 32, y - 4);
      ctx.lineTo(x + 32, y + 4);
      ctx.lineTo(x - 32, y - 20);
      ctx.closePath();
      ctx.clip();
      for (let i = -4; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#fbbf24" : "#1e293b";
        ctx.fillRect(x - 32 + i * 10, y - 32, 6, 50);
      }
      ctx.restore();
      // Up arrow on top
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("↑", x, y - 12);
      break;
    }
    case "shield": {
      const float = bob;
      const glow = ctx.createRadialGradient(x, y - 8 + float, 0, x, y - 8 + float, 28);
      glow.addColorStop(0, "rgba(56,189,248,0.7)");
      glow.addColorStop(1, "rgba(56,189,248,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y - 8 + float, 28, 0, Math.PI * 2);
      ctx.fill();
      // Shield shape
      ctx.fillStyle = "#0ea5e9";
      ctx.beginPath();
      ctx.moveTo(x, y - 22 + float);
      ctx.quadraticCurveTo(x + 14, y - 18 + float, x + 14, y - 4 + float);
      ctx.quadraticCurveTo(x + 14, y + 10 + float, x, y + 14 + float);
      ctx.quadraticCurveTo(x - 14, y + 10 + float, x - 14, y - 4 + float);
      ctx.quadraticCurveTo(x - 14, y - 18 + float, x, y - 22 + float);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#7dd3fc";
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 16 + float);
      ctx.quadraticCurveTo(x - 8, y - 8 + float, x - 4, y + 2 + float);
      ctx.lineTo(x - 2, y + 2 + float);
      ctx.quadraticCurveTo(x - 4, y - 8 + float, x - 2, y - 16 + float);
      ctx.closePath();
      ctx.fill();
      // Plus icon
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 1.5, y - 8 + float, 3, 10);
      ctx.fillRect(x - 5, y - 4.5 + float, 10, 3);
      break;
    }
    case "slowmo": {
      const float = bob;
      const glow = ctx.createRadialGradient(x, y - 8 + float, 0, x, y - 8 + float, 28);
      glow.addColorStop(0, "rgba(168,85,247,0.7)");
      glow.addColorStop(1, "rgba(168,85,247,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y - 8 + float, 28, 0, Math.PI * 2);
      ctx.fill();
      // Clock face
      ctx.fillStyle = "#7e22ce";
      ctx.beginPath();
      ctx.arc(x, y - 8 + float, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e9d5ff";
      ctx.beginPath();
      ctx.arc(x, y - 8 + float, 11, 0, Math.PI * 2);
      ctx.fill();
      // Clock hands
      ctx.strokeStyle = "#581c87";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      const handAngle = s.t * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 8 + float);
      ctx.lineTo(x + Math.cos(handAngle) * 7, y - 8 + float + Math.sin(handAngle) * 7);
      ctx.moveTo(x, y - 8 + float);
      ctx.lineTo(x, y - 14 + float);
      ctx.stroke();
      ctx.fillStyle = "#581c87";
      ctx.beginPath();
      ctx.arc(x, y - 8 + float, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "windL":
    case "windR": {
      const dir = o.kind === "windL" ? -1 : 1;
      const wave = Math.sin(s.t * 8 + (o.seed || 0) * 5) * 6;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        const yo = y - 16 + i * 8;
        ctx.beginPath();
        ctx.moveTo(x - dir * 18, yo);
        ctx.quadraticCurveTo(x + dir * wave, yo - 4, x + dir * 18, yo);
        ctx.stroke();
      }
      ctx.restore();
      // Arrow indicator
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.moveTo(x + dir * 22, y);
      ctx.lineTo(x + dir * 14, y - 6);
      ctx.lineTo(x + dir * 14, y + 6);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "iceCave": {
      // Ice patch / slippery zone
      ctx.save();
      ctx.globalAlpha = 0.85;
      const grad = ctx.createRadialGradient(x, y, 4, x, y, o.r + 6);
      grad.addColorStop(0, "rgba(186,230,253,0.9)");
      grad.addColorStop(0.6, "rgba(125,211,252,0.5)");
      grad.addColorStop(1, "rgba(56,189,248,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x, y, o.r + 4, (o.r + 4) * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Crystalline highlights
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2 + (o.seed || 0);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * o.r * 0.7, y + Math.sin(ang) * o.r * 0.35);
        ctx.stroke();
      }
      ctx.restore();
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
  const lean = clamp(s.svx / MAX_LATERAL, -1, 1);
  const tilt = lean * 0.35 + (s.airTime > 0 ? Math.sin(s.t * 4) * 0.15 : 0);
  const crouch = s.keys.boost ? 3 : s.keys.brake ? -2 : Math.sin(s.skierAnim) * 0.6;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  // Shadow on ground (independent of jump z)
  ctx.fillStyle = `rgba(30,50,80,${0.25 - s.z * 0.1})`;
  ctx.beginPath();
  ctx.ellipse(0, 10 + s.z * 30, 16 * (1 - s.z * 0.3), 5 * (1 - s.z * 0.3), 0, 0, Math.PI * 2);
  ctx.fill();

  const skiAngle = lean * 0.2;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 6, 6);
    ctx.rotate(skiAngle);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-3, -22, 6, 32);
    ctx.fillStyle = "#b91c1c";
    ctx.beginPath();
    ctx.moveTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.lineTo(2, -26);
    ctx.lineTo(-2, -26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-3, -6, 6, 4);
    ctx.restore();
  }

  ctx.fillStyle = "#1e293b";
  ctx.fillRect(-8, -8 + crouch * 0.5, 6, 14);
  ctx.fillRect(2, -8 + crouch * 0.5, 6, 14);

  ctx.fillStyle = "#ea580c";
  roundRect(ctx, -11, -22 + crouch, 22, 18, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  roundRect(ctx, -10, -21 + crouch, 8, 14, 3);
  ctx.fill();

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

  ctx.fillStyle = "#1f2937";
  ctx.beginPath();
  ctx.arc(-14 + lean * 3, -8 + crouch, 3, 0, Math.PI * 2);
  ctx.arc(14 + lean * 3, -8 + crouch, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(0, -28 + crouch, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.arc(-2, -30 + crouch, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#38bdf8";
  roundRect(ctx, -5, -28 + crouch, 10, 3, 1.5);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-4, -27.5 + crouch, 2, 1);

  // Active shield bubble around player
  if (s.activeShield > 0) {
    const pulse = 0.5 + Math.sin(s.t * 8) * 0.2;
    const bubbleGrad = ctx.createRadialGradient(0, -10, 0, 0, -10, 32);
    bubbleGrad.addColorStop(0, `rgba(56,189,248,0)`);
    bubbleGrad.addColorStop(0.7, `rgba(56,189,248,${pulse * 0.15})`);
    bubbleGrad.addColorStop(1, `rgba(56,189,248,${pulse * 0.6})`);
    ctx.fillStyle = bubbleGrad;
    ctx.beginPath();
    ctx.arc(0, -10, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(125,211,252,${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -10, 32, 0, Math.PI * 2);
    ctx.stroke();
  }

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

function drawYeti(ctx: CanvasRenderingContext2D, x: number, y: number, anim: number) {
  ctx.save();
  ctx.translate(x, y);
  // Lumbering bob
  const bob = Math.sin(anim * 6) * 4;
  // Shadow
  ctx.fillStyle = "rgba(20,30,50,0.4)";
  ctx.beginPath();
  ctx.ellipse(0, 16, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.ellipse(0, -8 + bob, 24, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  // Belly
  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath();
  ctx.ellipse(0, 0 + bob, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Arms (swinging)
  ctx.fillStyle = "#e2e8f0";
  const armSwing = Math.sin(anim * 6) * 0.5;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 22, -10 + bob);
    ctx.rotate(armSwing * side);
    ctx.beginPath();
    ctx.ellipse(0, 8, 7, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Claws
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(0, 22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.restore();
  }
  // Head
  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath();
  ctx.arc(0, -32 + bob, 16, 0, Math.PI * 2);
  ctx.fill();
  // Glowing red eyes
  ctx.fillStyle = "#dc2626";
  ctx.shadowColor = "#dc2626";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(-6, -34 + bob, 2.5, 0, Math.PI * 2);
  ctx.arc(6, -34 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Mouth / fangs
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.ellipse(0, -26 + bob, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-3, -27 + bob);
  ctx.lineTo(-1.5, -23 + bob);
  ctx.lineTo(0, -27 + bob);
  ctx.moveTo(0, -27 + bob);
  ctx.lineTo(1.5, -23 + bob);
  ctx.lineTo(3, -27 + bob);
  ctx.fill();
  // Horns
  ctx.fillStyle = "#475569";
  ctx.beginPath();
  ctx.moveTo(-10, -42 + bob);
  ctx.lineTo(-6, -48 + bob);
  ctx.lineTo(-4, -42 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, -42 + bob);
  ctx.lineTo(6, -48 + bob);
  ctx.lineTo(4, -42 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
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
    } else if (p.kind === "shield") {
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = `rgba(56,189,248,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBoostOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
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
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, `rgba(56,189,248,${intensity * 0.15})`);
  grad.addColorStop(1, `rgba(56,189,248,0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

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
