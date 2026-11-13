import { useEffect, useRef } from "react";
import { createBear } from "../motion/bear";
import { loadImage } from "../motion/canvas";
import { createCreature } from "../motion/creature";
import { createSchool } from "../motion/school";
import { listenPointer } from "../motion/world";

/**
 * Mounts the fixed canvases and drives everything from one requestAnimationFrame loop.
 * Honors prefers-reduced-motion: no cursor creature, no swimming school, still bear.
 */
export function MotionLayers({ bearHead }: { bearHead: React.RefObject<HTMLImageElement | null> }) {
  const schoolRef = useRef<HTMLCanvasElement>(null);
  const creatureRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    listenPointer();
    const fine = window.matchMedia("(pointer: fine)").matches;

    let raf = 0, last = 0, t = 0, cancelled = false;
    const updaters: ((dt: number, t: number) => void)[] = [];
    if (bearHead.current) updaters.push(createBear(bearHead.current));

    Promise.all([loadImage("/assets/owl.webp"), loadImage("/assets/fish.webp")]).then(([owl, fish]) => {
      if (cancelled) return;
      if (schoolRef.current) updaters.push(createSchool(schoolRef.current, fish));
      if (fine && creatureRef.current) {
        updaters.push(createCreature(creatureRef.current, owl, fish));
        document.documentElement.classList.add("creature-cursor");
      }
    });

    const frame = (now: number) => {
      const dt = Math.min((now - (last || now)) / 1000, 1 / 20);
      last = now;
      t += dt;
      for (const u of updaters) u(dt, t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("creature-cursor");
    };
  }, [bearHead]);

  return (
    <>
      <canvas ref={schoolRef} aria-hidden className="pointer-events-none fixed inset-0 z-10 h-full w-full" />
      <canvas ref={creatureRef} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />
    </>
  );
}
