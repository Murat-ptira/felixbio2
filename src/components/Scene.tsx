import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { BEAR, CONTENT_TOP, SCENE, setSceneHeight } from "../motion/world";

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/**
 * The original artwork at its native aspect ratio. The scene is at least as tall as the
 * artwork at full width; if the content needs more room (narrow screens) it grows taller
 * and the art scales by height, cropping only the sides — vertical composition stays 1:1.
 */
export function Scene({ bearHead, children }: { bearHead: RefObject<HTMLImageElement | null>; children: ReactNode }) {
  const sceneRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scene = sceneRef.current!, content = contentRef.current!;
    const layout = () => {
      const vw = document.documentElement.clientWidth;
      const byWidth = (vw * SCENE.h) / SCENE.w;
      const needed = (content.offsetHeight + 200) / (1 - CONTENT_TOP / SCENE.h);
      const h = Math.max(byWidth, needed);
      scene.style.setProperty("--scene-h", `${h}px`);
      setSceneHeight(h);
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(content);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  const head = BEAR.head, ridge = BEAR.ridge, pivot = BEAR.pivot;

  return (
    <section id="top" ref={sceneRef} className="scene relative w-full overflow-hidden" aria-label="Iceberg scene">
      <div className="art pointer-events-none absolute top-0 left-1/2 h-full -translate-x-1/2 select-none" aria-hidden>
        <img src="/assets/scene.webp" alt="" className="absolute inset-0 h-full w-full" fetchPriority="high" />
        <img
          ref={bearHead}
          src="/assets/bear-head.png"
          alt=""
          className="absolute will-change-transform"
          style={{
            left: pct(head.x, SCENE.w),
            top: pct(head.y, SCENE.h),
            width: pct(head.w, SCENE.w),
            height: pct(head.h, SCENE.h),
            transformOrigin: `${pct(pivot.x - head.x, head.w)} ${pct(pivot.y - head.y, head.h)}`,
          }}
        />
        <img
          src="/assets/bear-ridge.png"
          alt=""
          className="absolute"
          style={{
            left: pct(ridge.x, SCENE.w),
            top: pct(ridge.y, SCENE.h),
            width: pct(ridge.w, SCENE.w),
            height: pct(ridge.h, SCENE.h),
          }}
        />
      </div>

      <div
        ref={contentRef}
        className="relative z-20 mx-auto flex w-full max-w-5xl flex-col items-stretch gap-10 px-4 sm:gap-14 sm:px-6"
        style={{ position: "absolute", left: 0, right: 0, top: `calc(var(--scene-h) * ${CONTENT_TOP / SCENE.h})` }}
      >
        {children}
      </div>
    </section>
  );
}
