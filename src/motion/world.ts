import meta from "../sceneMeta.json";

export const SCENE = meta.scene;
export const BEAR = meta.bear;
export const ASSETS = { owl: meta.owl, fish: meta.fish };
/** Scene-pixel row where the glass content column starts (just under the waterline). */
export const CONTENT_TOP = meta.waterlineY + 64;

/** Live page geometry shared by the scene layout and the motion layers. */
export const world = {
  vw: 0,
  vh: 0,
  scrollY: 0,
  sceneH: 0,
  scale: 1,
  artLeft: 0,
  /** Waterline in page coordinates. */
  waterY: 0,
};

export const pointer = {
  x: -9999,
  y: -9999,
  /** True while a mouse/pen is over the page (touch never drives the cursor creature). */
  active: false,
  overInteractive: false,
  lastMove: 0,
};

/** Scene pixels -> page coordinates. */
export const toPage = (sx: number, sy: number) => ({
  x: world.artLeft + sx * world.scale,
  y: sy * world.scale,
});

export function setSceneHeight(h: number) {
  world.vw = document.documentElement.clientWidth;
  world.vh = window.innerHeight;
  world.sceneH = h;
  world.scale = h / SCENE.h;
  world.artLeft = (world.vw - SCENE.w * world.scale) / 2;
  world.waterY = meta.waterlineY * world.scale;
}

let listening = false;
export function listenPointer() {
  if (listening) return;
  listening = true;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      pointer.active = false;
      return;
    }
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    pointer.lastMove = performance.now();
    const el = e.target as Element | null;
    pointer.overInteractive = !!el?.closest?.("a,button,[role=button]");
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => (pointer.active = false));
  window.addEventListener("blur", () => (pointer.active = false));
  const onScroll = () => (world.scrollY = window.scrollY);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
