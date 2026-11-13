import { ASSETS, pointer, world } from "./world";
import { clamp, drawSwimmingFish, fitCanvas, lerp, rand } from "./canvas";

type Particle = {
  kind: "bubble" | "drop" | "ring";
  x: number; y: number; vx: number; vy: number;
  r: number; life: number; age: number; wobble: number;
};

/**
 * Cursor companion: an owl above the waterline, a fish below it.
 * Coordinates are viewport (client) pixels; the waterline moves with scroll.
 */
export function createCreature(canvas: HTMLCanvasElement, owl: HTMLImageElement, fish: HTMLImageElement) {
  let x = window.innerWidth / 2, y = window.innerHeight / 2, vx = 0, vy = 0;
  let morph = 0; // 0 = owl, 1 = fish
  let underwater = false;
  let facing = 1, face = 1; // owl image faces right, fish image faces left
  let tilt = 0;
  let flap = 0, swim = 0, ring = 9, visible = 0, bubbleDebt = 0;
  let seen = false;
  let hoverFade = 1; // dim the companion over buttons/links so it never hides a click target
  const parts: Particle[] = [];

  const owlW = 96, owlH = (owlW * ASSETS.owl.h) / ASSETS.owl.w;
  const fishW = 112, fishH = (fishW * ASSETS.fish.h) / ASSETS.fish.w;

  function splash(cx: number, wy: number, intoWater: boolean, speed: number) {
    const power = clamp(speed / 900, 0.5, 1.4);
    for (let i = 0; i < 3; i++)
      parts.push({ kind: "ring", x: cx, y: wy, vx: 0, vy: 0, r: 4, life: 0.9 + i * 0.25, age: -i * 0.12, wobble: 0 });
    for (let i = 0; i < 16; i++)
      parts.push({
        kind: "drop", x: cx + rand(-14, 14), y: wy - 2,
        vx: rand(-170, 170) * power, vy: -rand(220, 520) * power,
        r: rand(1.2, 3.2), life: 1.2, age: 0, wobble: 0,
      });
    const n = intoWater ? 22 : 10;
    for (let i = 0; i < n; i++)
      parts.push({
        kind: "bubble", x: cx + rand(-26, 26), y: wy + rand(8, intoWater ? 70 : 24),
        vx: rand(-30, 30), vy: -rand(50, 170), r: rand(1.8, 6.5), life: rand(1.2, 2.4), age: 0, wobble: rand(0, 6),
      });
  }

  return function update(dt: number, t: number) {
    const ctx = fitCanvas(canvas);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const waterY = world.waterY - world.scrollY;

    if (pointer.active && !seen) {
      x = pointer.x; y = pointer.y; seen = true;
      underwater = y > waterY;
      morph = underwater ? 1 : 0;
    }
    visible = clamp(visible + (pointer.active ? dt * 5 : -dt * 3), 0, 1);
    hoverFade = lerp(hoverFade, pointer.overInteractive ? 0.28 : 1, 1 - Math.exp(-dt * 12));

    // Spring-follow the pointer.
    if (pointer.active) {
      vx += (190 * (pointer.x - x) - 22 * vx) * dt;
      vy += (190 * (pointer.y - y) - 22 * vy) * dt;
      x += vx * dt; y += vy * dt;
    }
    const speed = Math.hypot(vx, vy);

    // Waterline crossing (small hysteresis so hovering on the line doesn't flicker).
    if (seen && !underwater && y > waterY + 4) {
      underwater = true;
      splash(x, waterY, true, speed);
    } else if (seen && underwater && y < waterY - 4) {
      underwater = false;
      splash(x, waterY, false, speed);
    }
    morph = clamp(morph + (underwater ? dt : -dt) / 0.35, 0, 1);
    const m = morph * morph * (3 - 2 * morph); // smoothstep

    if (Math.abs(vx) > 28) facing = vx > 0 ? 1 : -1;
    face = lerp(face, facing, 1 - Math.exp(-dt * 9));

    // Trail of bubbles while swimming.
    if (underwater && visible > 0.5) {
      bubbleDebt += dt * clamp(speed / 160, 0, 6);
      while (bubbleDebt > 1) {
        bubbleDebt -= 1;
        parts.push({
          kind: "bubble", x: x - facing * fishW * 0.35 + rand(-6, 6), y: y + rand(-8, 8),
          vx: rand(-12, 12), vy: -rand(30, 90), r: rand(1.2, 3.6), life: rand(0.9, 1.8), age: 0, wobble: rand(0, 6),
        });
      }
    }

    // Particles.
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age > p.life) { parts.splice(i, 1); continue; }
      if (p.age < 0) continue;
      const k = p.age / p.life;
      if (p.kind === "ring") {
        const R = 6 + k * 120;
        ctx.strokeStyle = `rgba(235,250,255,${(1 - k) * 0.7})`;
        ctx.lineWidth = 1.6 * (1 - k) + 0.4;
        ctx.beginPath();
        ctx.ellipse(p.x, waterY, R, R * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "drop") {
        p.vy += 1500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.vy > 0 && p.y > waterY) { p.age = p.life; continue; }
        ctx.fillStyle = `rgba(240,252,255,${0.85 * (1 - k)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      } else {
        p.vy -= 40 * dt; p.x += (p.vx + Math.sin(t * 5 + p.wobble) * 22) * dt; p.y += p.vy * dt;
        if (p.y < waterY + p.r) { p.age = p.life; continue; }
        const a = Math.min(1, (1 - k) * 1.6) * 0.75;
        ctx.strokeStyle = `rgba(215,245,255,${a})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${a * 0.7})`;
        ctx.beginPath(); ctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.3, 0, Math.PI * 2); ctx.fill();
      }
    }

    if (visible <= 0) return;

    // Banking: nose follows the vertical component of the travel vector.
    const targetTilt = speed > 30 ? clamp(Math.atan2(vy, Math.abs(vx) + 60), -0.6, 0.6) : 0;
    tilt = lerp(tilt, targetTilt, 1 - Math.exp(-dt * 8));

    // Owl: banking + wing "breathing" (scale pulse speeds up with flight speed).
    if (m < 1) {
      flap += dt * (4.2 + Math.min(speed, 1600) * 0.006);
      const breathe = Math.sin(flap);
      ctx.save();
      ctx.globalAlpha = (1 - m) * visible * hoverFade;
      ctx.translate(x, y + breathe * 2.5);
      ctx.rotate(tilt * 0.8 * Math.sign(face || 1) + clamp(vx / 4000, -0.12, 0.12));
      const sc = 1 - 0.45 * m;
      ctx.scale(face * sc * (1 - 0.025 * breathe), sc * (1 + 0.065 * breathe));
      ctx.shadowColor = "rgba(10,30,50,0.25)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 8;
      ctx.drawImage(owl, -owlW / 2, -owlH / 2, owlW, owlH);
      ctx.restore();
    }

    // Fish: heading along the travel vector, sine-warped tail.
    if (m > 0) {
      swim += dt * (5 + Math.min(speed, 1600) * 0.012);
      const amp = 0.04 + Math.min(speed / 1400, 1) * 0.06;
      ctx.save();
      ctx.globalAlpha = m * visible * hoverFade;
      ctx.translate(x, y);
      ctx.rotate(tilt * Math.sign(face || 1));
      const sc = 0.55 + 0.45 * m;
      ctx.scale(-face * sc, sc);
      drawSwimmingFish(ctx, fish, fishW, fishH, swim, amp, 64);
      ctx.restore();
    }

    // Precise pointer marker so clicking stays accurate.
    if (pointer.active) {
      ring = lerp(ring, pointer.overInteractive ? 15 : 8, 1 - Math.exp(-dt * 14));
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = underwater ? "rgba(140,235,255,0.9)" : "rgba(255,255,255,0.95)";
      ctx.beginPath(); ctx.arc(pointer.x, pointer.y, ring, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = underwater ? "rgba(180,245,255,1)" : "rgba(255,255,255,1)";
      ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(6,30,48,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(pointer.x, pointer.y, ring + 1.5, 0, Math.PI * 2); ctx.stroke();
    }
  };
}
