import { useRef } from "react";
import { Dock } from "./components/Dock";
import { MotionLayers } from "./components/MotionLayers";
import { Scene } from "./components/Scene";
import { Bio, Payment, Projects } from "./components/Sections";

export default function App() {
  const bearHead = useRef<HTMLImageElement>(null);
  return (
    <main>
      <Scene bearHead={bearHead}>
        <Bio />
        <Projects />
        <Payment />
      </Scene>
      <a href="#bio" className="dive-cue" aria-label="Scroll down to the bio">
        <span>Dive in</span>
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
          <path d="M8 3v10m-4-4 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <MotionLayers bearHead={bearHead} />
      <Dock />
    </main>
  );
}
