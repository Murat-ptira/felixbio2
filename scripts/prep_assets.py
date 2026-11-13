"""Prepare web assets from the original artwork.

Outputs (public/assets/):
  scene.webp       original iceberg scene, untouched except the bear head area
                   (inpainted so the head layer can move without exposing a hole)
  bear-head.png    isolated bear head with feathered alpha
  bear-ridge.png   original ice ridge in front of the head (occludes the neck)
  owl.png/.webp    background-removed owl
  fish.png/.webp   background-removed fish
and src/sceneMeta.json with the coordinates the page needs.

Run:  python scripts/prep_assets.py   (needs: pillow numpy opencv-python-headless rembg[cpu])
"""

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

SCENE_SRC = ROOT / "Untitled (2).png"
OWL_SRC = ROOT / "Gemini_Generated_Image_ylfvfylfvfylfvfy.jfif"
FISH_SRC = ROOT / "Gemini_Generated_Image_ptn1n6ptn1n6ptn1.jfif"

# Measured on the 1440x4096 scene: the underwater meniscus line.
WATERLINE_Y = 2136

# Bear head outline, traced on a 6x zoom of the crop starting at (630, 1490).
# The bottom edge follows the ice ridge the bear peeks over.
CROP_ORIGIN = (630, 1490)
HEAD_POLY = [
    (20, 47), (23, 38), (30, 35), (41, 35), (52, 38), (58, 30), (66, 23),
    (80, 20), (100, 19), (116, 21), (126, 27), (136, 33), (148, 40),
    (157, 38), (165, 40), (168, 48), (165, 60), (158, 70), (150, 75),
    (140, 77), (120, 79), (100, 80), (80, 81), (60, 83), (45, 84),
    (35, 81), (28, 72), (22, 60),
]
# Ridge line (left to right) = the bottom part of the outline, extended sideways.
RIDGE = [(-10, 86), (35, 84), (45, 84), (60, 83), (80, 81), (100, 80),
         (120, 79), (140, 77), (150, 75), (158, 72), (175, 74), (220, 76)]


def unpremultiply_white(rgba: Image.Image) -> Image.Image:
    """Remove the white-background fringe from semi-transparent edge pixels."""
    a = np.asarray(rgba).astype(np.float32)
    alpha = a[..., 3:4] / 255.0
    rgb = a[..., :3]
    safe = np.clip(alpha, 0.08, 1.0)
    fixed = (rgb - (1.0 - safe) * 255.0) / safe
    edge = (alpha > 0) & (alpha < 0.98)
    rgb = np.where(edge, np.clip(fixed, 0, 255), rgb)
    return Image.fromarray(np.concatenate([rgb, a[..., 3:4]], -1).astype(np.uint8), "RGBA")


def cutout(src: Path, name: str, session) -> dict:
    from rembg import remove

    im = Image.open(src).convert("RGB")
    out = remove(im, session=session, post_process_mask=True)
    out = unpremultiply_white(out)
    # Drop stray near-invisible specks, then crop to content with a small margin.
    a = np.asarray(out)[..., 3]
    ys, xs = np.where(a > 12)
    pad = 24
    box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0),
           min(xs.max() + pad, out.width), min(ys.max() + pad, out.height))
    out = out.crop(box)
    big = out.copy()
    big.thumbnail((1024, 1024), Image.LANCZOS)
    big.save(OUT / f"{name}.png", optimize=True)
    small = out.copy()
    small.thumbnail((512, 512), Image.LANCZOS)
    small.save(OUT / f"{name}.webp", quality=90, method=6)
    return {"w": small.width, "h": small.height}


def upscale2x(rgba: np.ndarray) -> Image.Image:
    """2x upscale in premultiplied space so transparent pixels never bleed colour."""
    img = Image.fromarray(rgba, "RGBA").convert("RGBa")
    img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
    return img.convert("RGBA")


def ridge_y(x: np.ndarray) -> np.ndarray:
    xs, ys = zip(*RIDGE)
    return np.interp(x, xs, ys)


def bear_layers(scene: Image.Image) -> dict:
    ox, oy = CROP_ORIGIN
    W, H = 200, 135
    region = np.asarray(scene.crop((ox, oy, ox + W, oy + H)).convert("RGB")).copy()

    # Supersampled polygon mask -> smooth, anti-aliased edge.
    S = 8
    m = np.zeros((H * S, W * S), np.uint8)
    cv2.fillPoly(m, [np.array([(x * S, y * S) for x, y in HEAD_POLY], np.int32)], 255)
    mask = cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0

    # Background plate: the sky/horizon behind the head is a smooth, horizontally
    # uniform gradient, so fill each row by interpolating between clean samples
    # taken just outside the head's soft-focus halo.
    yy, xx = np.mgrid[0:H, 0:W]
    ridge = ridge_y(xx)
    hole = cv2.dilate((mask > 0.02).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    hole &= yy < ridge + 1  # the ridge itself stays original
    src = region.astype(np.float32)
    filled = src.copy()
    for y in range(H):
        xs = np.where(hole[y])[0]
        if xs.size == 0:
            continue
        xl, xr = xs.min(), xs.max()
        left = src[y, max(xl - 8, 0):max(xl - 2, 1)].mean(0)
        right = src[y, min(xr + 3, W - 1):min(xr + 9, W)].mean(0)
        t = np.linspace(0, 1, xr - xl + 1)[:, None]
        filled[y, xl:xr + 1] = left * (1 - t) + right * t
    # Soften inside the hole only, then add faint grain so it matches the photo.
    soft = cv2.GaussianBlur(filled, (0, 0), 1.6)
    rng = np.random.default_rng(7)
    soft += rng.normal(0, 0.9, soft.shape)
    base_region = np.where(hole[..., None], soft, src).clip(0, 255)

    # Head layer: original pixels with feathered alpha. Below the ridge the fur is
    # extended downward so a tilted head never shows a hard bottom edge; the ridge
    # occluder hides that extension at rest.
    EXT = 16
    head_rgb = region.copy()
    head_a = cv2.GaussianBlur(mask, (0, 0), 0.9)
    cols = np.where(mask.max(0) > 0.5)[0]
    for x in cols:
        ry = int(round(ridge_y(np.array([x]))[0]))
        sample_y = ry - 5
        if mask[sample_y, x] < 0.5:
            continue
        head_a[ry - 3:ry + 1, x] = 1.0  # solid down to the ridge: no light seam
        head_rgb[ry - 1:ry + EXT, x] = region[sample_y, x]
        head_a[ry + 1:ry + EXT, x] = 1.0
    # Feather the extension's sides horizontally only.
    band = slice(int(ridge_y(np.arange(W)).min()), H)
    head_a[band] = np.minimum(head_a[band], cv2.GaussianBlur(head_a[band], (0, 0), sigmaX=1.2, sigmaY=0.01) * 1.25)
    head_a = head_a.clip(0, 1)

    ys, xs = np.where(head_a > 0.01)
    hx0, hx1, hy0, hy1 = xs.min() - 2, xs.max() + 3, ys.min() - 2, ys.max() + 1
    head = np.dstack([head_rgb, (head_a * 255).astype(np.uint8)])[hy0:hy1, hx0:hx1]
    # Ship it at 2x so the tiny head stays crisp when the scene is upscaled.
    upscale2x(head).save(OUT / "bear-head.png", optimize=True)

    # Ridge occluder: original pixels below the ridge line, feathered top edge.
    occ_a = np.clip((yy - ridge_y(xx) + 0.5) / 1.5, 0, 1).astype(np.float32)
    ry0 = int(ridge_y(np.arange(W)).min()) - 2
    occ_rgb = region.copy()
    for x in range(W):  # bleed colour upward into the fully transparent rows only
        first_visible = int(np.floor(ridge_y(np.array([x]))[0] - 0.5)) + 1
        occ_rgb[:first_visible, x] = region[first_visible, x]
    occ = np.dstack([occ_rgb, (occ_a * 255).astype(np.uint8)])[ry0:H]
    upscale2x(occ).save(OUT / "bear-ridge.png", optimize=True)

    plate = scene.copy()
    plate.paste(Image.fromarray(base_region.astype(np.uint8), "RGB"), (ox, oy))

    pivot = (ox + 95, oy + 80)  # neck, on the ridge
    return {
        "plate": plate,
        "head": {"x": int(ox + hx0), "y": int(oy + hy0), "w": int(hx1 - hx0), "h": int(hy1 - hy0)},
        "ridge": {"x": ox, "y": int(oy + ry0), "w": W, "h": int(H - ry0)},
        "pivot": {"x": pivot[0], "y": pivot[1]},
    }


def main() -> None:
    from rembg import new_session

    scene = Image.open(SCENE_SRC).convert("RGB")
    bear = bear_layers(scene)
    bear.pop("plate").save(OUT / "scene.webp", quality=92, method=6)

    session = new_session("isnet-general-use")
    owl = cutout(OWL_SRC, "owl", session)
    fish = cutout(FISH_SRC, "fish", session)

    meta = {
        "scene": {"w": scene.width, "h": scene.height},
        "waterlineY": WATERLINE_Y,
        "bear": bear,
        "owl": owl,
        "fish": fish,
    }
    (ROOT / "src").mkdir(exist_ok=True)
    (ROOT / "src" / "sceneMeta.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
