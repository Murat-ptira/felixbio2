import { pointer, world } from "./world";
import { clamp, drawSwimmingFish, fitCanvas, rand } from "./canvas";

type Tier = { size: number; blur: number; alpha: number; tint: number; speed: number; sprite?: HTMLCanvasElement };
type Swimmer = {
  x: number; y: number; vx: number; vy: number; dir: number;
  tier: Tier; size: number; phase: number; drift: number; fear: number;
};

// Far -> near. Far fish are smaller, bluer, softer and slower.
const TIERS: Tier[] = [
  { size: 34, blur: 3.2, alpha: 0.3, tint: 0.7, speed: 26 },
  { size: 48, blur: 2.2, alpha: 0.4, tint: 0.58, speed: 36 },
  { size: 62, blur: 1.3, alpha: 0.5, tint: 0.45, speed: 46 },
  { size: 78, blur: 0.6, alpha: 0.6, tint: 0.32, speed: 58 },
];
const TIER_WEIGHTS = [0.34, 0.3, 0.22, 0.14];
const SPRITE_DPR = Math.min(window.devicePixelRatio || 1, 2);

/** Bakes a tinted, blurred sprite per depth tier once, so each frame is just drawImage. */
function bake(fish: HTMLImageElement, tier: Tier) {
  const ratio = fish.height / fish.width;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(tier.size * 1.6 * dpr), h = Math.round(w * ratio);
  const pad = Math.ceil(tier.blur * 3 * dpr);
  const tinted = document.createElement("canvas");
  tinted.width = w; tinted.height = h;
  const t = tinted.getContext("2d")!;
  t.drawImage(fish, 0, 0, w, h);
  t.globalCompositeOperation = "source-atop";
  t.fillStyle = `rgba(14,70,104,${tier.tint})`;
  t.fillRect(0, 0, w, h);
  const out = document.createElement("canvas");
  out.width = w + pad * 2; out.height = h + pad * 2;
  const o = out.getContext("2d")!;
  if (tier.blur > 0 && "filter" in o) o.filter = `blur(${tier.blur * dpr}px)`;
  o.drawImage(tinted, pad, pad);
  return out;
}

/**
 * Background school (15–18 fish) living in page space below the waterline.
 * Drawn on a fixed canvas that sits under the frosted cards, so the glass blurs them.
 */
export function createSchool(canvas: HTMLCanvasElement, fish: HTMLImageElement) {
  TIERS.forEach((tier) => (tier.sprite = bake(fish, tier)));
  const count = window.innerWidth < 640 ? 15 : 18;
  const fishes: Swimmer[] = [];

  const pickTier = () => {
    let r = Math.random();
    for (let i = 0; i < TIERS.length; i++) if ((r -= TIER_WEIGHTS[i]) <= 0) return TIERS[i];
    return TIERS[0];
  };
  const bounds = () => ({ top: world.waterY + 70, bottom: world.sceneH - 90 });

  for (let i = 0; i < count; i++) {
    const tier = pickTier();
    const dir = Math.random() < 0.5 ? -1 : 1;
    const b = bounds();
    fishes.push({
      x: rand(0, world.vw), y: rand(b.top, Math.max(b.top + 1, b.bottom)),
      vx: dir * tier.speed, vy: 0, dir, tier, size: tier.size * rand(0.85, 1.15),
      phase: rand(0, 10), drift: rand(0, 10), fear: 0,
    });
  }
  fishes.sort((a, b) => a.tier.size - b.tier.size);

  let lastSceneH = world.sceneH;

  return function update(dt: number, t: number) {
    const ctx = fitCanvas(canvas);
    const vw = window.innerWidth, vh = window.innerHeight;
    ctx.clearRect(0, 0, vw, vh);
    const b = bounds();

    // Keep fish proportionally placed if the scene is resized.
    if (lastSceneH && world.sceneH !== lastSceneH) {
      const k = world.sceneH / lastSceneH;
      fishes.forEach((f) => (f.y *= k));
      lastSceneH = world.sceneH;
    }

    const waterClientY = world.waterY - world.scrollY;
    const px = pointer.x, py = pointer.y + world.scrollY;
    const cursorInWater = pointer.active && py > world.waterY;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, Math.max(0, waterClientY + 6), vw, vh);
    ctx.clip();

    for (const f of fishes) {
      const cruise = f.dir * f.tier.speed;
      let ax = (cruise - f.vx) * 0.9;
      let ay = (Math.sin(t * 0.45 + f.drift) * 10 - f.vy) * 1.4;

      if (cursorInWater) {
        const dx = f.x - px, dy = f.y - py;
        const d = Math.hypot(dx, dy);
        const R = 150 + f.size * 1.4;
        if (d < R && d > 0.01) {
          const push = Math.pow(1 - d / R, 2) * 2600;
          ax += (dx / d) * push;
          ay += (dy / d) * push;
          f.fear = 1;
        }
      }
      f.fear = Math.max(0, f.fear - dt * 0.7);
      f.vx += ax * dt; f.vy += ay * dt;
      const max = f.tier.speed * (1 + f.fear * 5);
      const sp = Math.hypot(f.vx, f.vy);
      if (sp > max) { f.vx *= max / sp; f.vy *= max / sp; }
      // After a scare, keep swimming the way it fled.
      if (f.fear > 0.3 && Math.abs(f.vx) > 15) f.dir = Math.sign(f.vx);
      f.x += f.vx * dt; f.y += f.vy * dt;

      if (f.y < b.top) f.vy += (b.top - f.y) * 4 * dt;
      if (f.y > b.bottom) f.vy -= (f.y - b.bottom) * 4 * dt;
      const margin = f.size * 1.2;
      if (f.x < -margin) f.x = vw + margin;
      if (f.x > vw + margin) f.x = -margin;

      const sy = f.y - world.scrollY;
      if (sy < -f.size || sy > vh + f.size) continue;

      f.phase += dt * (4 + f.fear * 9);
      const sprite = f.tier.sprite!;
      const w = (sprite.width * f.size) / (f.tier.size * SPRITE_DPR);
      const h = (w * sprite.height) / sprite.width;
      const face = f.vx > 0 ? -1 : 1; // sprite head points left
      const pitch = clamp(Math.atan2(f.vy, Math.abs(f.vx) + 20), -0.5, 0.5);
      ctx.save();
      ctx.globalAlpha = f.tier.alpha;
      ctx.translate(f.x, sy);
      ctx.rotate(pitch * -face);
      ctx.scale(face, 1);
      drawSwimmingFish(ctx, sprite, w, h, f.phase, 0.06, 16);
      ctx.restore();
    }
    ctx.restore();
  };
}
