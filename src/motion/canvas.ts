/** Shared canvas helpers. */

export function fitCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth, h = window.innerHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const scratch = document.createElement("canvas");
const sctx = scratch.getContext("2d")!;

/**
 * Draws the fish (head on the left of the source image) with a travelling sine wave
 * whose amplitude grows toward the tail. Slices are warped 1:1 on integer columns in a
 * scratch canvas first, so there are no seams or double-alpha stripes, then the result
 * is scaled onto ctx centred on the current origin at size w x h.
 */
export function drawSwimmingFish(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { width: number; height: number },
  w: number,
  h: number,
  phase: number,
  ampFrac: number,
  slices: number,
) {
  const iw = img.width, ih = img.height;
  const amp = ih * ampFrac;
  const pad = Math.ceil(amp) + 2;
  if (scratch.width < iw || scratch.height < ih + pad * 2) {
    scratch.width = Math.max(scratch.width, iw);
    scratch.height = Math.max(scratch.height, ih + pad * 2);
  }
  sctx.clearRect(0, 0, iw, ih + pad * 2);
  const step = Math.max(1, Math.ceil(iw / slices));
  for (let sx = 0; sx < iw; sx += step) {
    const sw = Math.min(step, iw - sx);
    const u = (sx + sw / 2) / iw;
    const body = Math.max(0, (u - 0.16) / 0.84);
    const dy = amp * Math.pow(body, 1.6) * Math.sin(phase - u * 4.6);
    sctx.drawImage(img, sx, 0, sw, ih, sx, pad + dy, sw, ih);
  }
  const k = w / iw;
  ctx.drawImage(scratch, 0, 0, iw, ih + pad * 2, -w / 2, -h / 2 - pad * k, w, h + pad * 2 * k);
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
