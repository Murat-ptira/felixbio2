import { BEAR, pointer, toPage, world } from "./world";

/** Damped spring toward a target; returns updated [value, velocity]. */
export function spring(v: number, vel: number, target: number, dt: number, k: number, c: number) {
  vel += (k * (target - v) - c * vel) * dt;
  return [v + vel * dt, vel] as const;
}

/**
 * Turns the isolated bear head toward the cursor: Math.atan2 gives the direction from
 * the neck pivot to the pointer, a spring smooths yaw (left/right) and pitch (up/down).
 */
export function createBear(head: HTMLElement) {
  let yaw = 0, yawV = 0, pitch = 0, pitchV = 0;
  let t = 0;

  return function update(dt: number) {
    t += dt;
    const p = toPage(BEAR.pivot.x, BEAR.pivot.y);
    const px = p.x, py = p.y - world.scrollY;
    // Skip work while the bear is far off screen.
    if (py < -400 || py > world.vh + 400) return;

    let ty = Math.sin(t * 0.35) * 0.25, tp = Math.sin(t * 0.5) * 0.15; // idle glance
    const idle = !pointer.active || performance.now() - pointer.lastMove > 6000;
    if (!idle) {
      const dx = pointer.x - px, dy = pointer.y - py;
      const theta = Math.atan2(dy, dx);
      const reach = Math.min(Math.hypot(dx, dy) / (420 * Math.max(world.scale, 0.6)), 1);
      ty = Math.cos(theta) * reach;
      tp = Math.sin(theta) * reach;
    }
    [yaw, yawV] = spring(yaw, yawV, ty, dt, 70, 12);
    [pitch, pitchV] = spring(pitch, pitchV, tp, dt, 70, 12);

    const s = world.scale;
    head.style.transform =
      `translate3d(${(yaw * 4 * s).toFixed(2)}px, ${(pitch * 2.2 * s).toFixed(2)}px, 0) ` +
      `rotate(${(yaw * 3.5).toFixed(2)}deg) perspective(${(260 * s).toFixed(0)}px) ` +
      `rotateY(${(yaw * 13).toFixed(2)}deg) rotateX(${(-pitch * 10).toFixed(2)}deg)`;
  };
}
