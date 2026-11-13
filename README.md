# felixbio2

Felix's portfolio: the original iceberg artwork as a single scrolling scene, with frosted-glass Bio / Projects / Payment cards over the submerged iceberg and live motion built from the real photos.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Edit content

All copy and links live in `src/content.ts`. Set `links.lavaPay` and `links.boosty` to your real Lava.top and Boosty pages.

## Assets

`public/assets/` is generated from the original images in the repo root by `scripts/prep_assets.py`:

| File | Source | What it is |
| --- | --- | --- |
| `scene.webp` | `Untitled (2).png` | The original scene, pixel-for-pixel, except that the sky behind the bear's head is filled in |
| `bear-head.png` | `Untitled (2).png` | The isolated bear head (feathered alpha, fur extended under the ridge) |
| `bear-ridge.png` | `Untitled (2).png` | The original ice ridge in front of the head, so the neck stays hidden while the head turns |
| `owl.png` / `owl.webp` | `Gemini_Generated_Image_ylfv…jfif` | Background removed (rembg ISNet + white-fringe cleanup) |
| `fish.png` / `fish.webp` | `Gemini_Generated_Image_ptn1…jfif` | Background removed (rembg ISNet + white-fringe cleanup) |

The script also writes `src/sceneMeta.json` (waterline, bear head box and pivot, sprite sizes). To regenerate:

```bash
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/prep_assets.py
```

## Motion

- **Bear** (`src/motion/bear.ts`): the angle from the bear's neck to the cursor (`Math.atan2`) drives spring-damped yaw/pitch, so the head turns and tilts toward the cursor.
- **Cursor companion** (`src/motion/creature.ts`): an owl above the waterline that banks with its flight direction and pulses its wings. When it crosses the waterline you get a splash ring, droplets and a burst of bubbles, and it morphs into the fish, whose tail is sine-wave warped as it swims. On mouse devices it replaces the system cursor; a small ring still marks the exact click point, and the companion fades over buttons.
- **School** (`src/motion/school.ts`): 15–18 fish at four blurred, tinted depths swimming behind the glass cards and scattering away from the cursor.

Touch devices get the bear and the school but no cursor companion. `prefers-reduced-motion` turns all motion off.
