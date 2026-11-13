import { useEffect, useRef, useState } from "react";
import { links } from "../content";

const NAV = [
  { id: "top", label: "Top" },
  { id: "bio", label: "Bio" },
  { id: "projects", label: "Projects" },
  { id: "payment", label: "Payment" },
];

function scrollToId(id: string) {
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (id === "top") window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  else document.getElementById(id)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
}

/** Frosted bottom dock: payment/order actions + an expandable section menu. */
export function Dock() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 sm:bottom-6">
      <nav
        id="dock-menu"
        aria-label="Sections"
        className={`glass-strong absolute right-0 bottom-full mb-3 w-48 origin-bottom-right rounded-3xl p-2 transition duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
          open ? "visible translate-y-0 scale-100 opacity-100" : "invisible translate-y-2 scale-95 opacity-0"
        }`}
      >
        <ul>
          {NAV.map((n, i) => (
            <li key={n.id}>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  setOpen(false);
                  scrollToId(n.id);
                }}
                className="menu-item flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-left text-[15px] font-medium text-white"
              >
                {n.label}
                <span className="text-[11px] tabular-nums text-cyan-200/70">{String(i).padStart(2, "0")}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="glass-strong flex items-center gap-1 rounded-full p-1.5 sm:gap-1.5">
        <a href={links.lavaPay} target="_blank" rel="noreferrer" className="btn btn-primary btn-dock">
          <span className="sm:hidden">Lava Pay</span>
          <span className="hidden sm:inline">Pay via Lava Pay</span>
        </a>
        <a href={links.boosty} target="_blank" rel="noreferrer" className="btn btn-glass btn-dock">
          <span className="sm:hidden">Boosty</span>
          <span className="hidden sm:inline">Order via Boosty</span>
        </a>
        <button type="button" onClick={() => scrollToId("projects")} className="btn btn-glass btn-dock">
          Projects
        </button>
        <button
          type="button"
          aria-label={open ? "Close section menu" : "Open section menu"}
          aria-expanded={open}
          aria-controls="dock-menu"
          onClick={() => setOpen((o) => !o)}
          className="btn btn-glass grid size-10 shrink-0 place-items-center rounded-full p-0"
        >
          <svg viewBox="0 0 16 16" className={`size-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden>
            <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
