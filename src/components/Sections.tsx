import type { ReactNode } from "react";
import { bio, links, payment, projects } from "../content";

export function Glass({ className = "", children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`glass relative rounded-[28px] ${className}`} {...rest}>
      {children}
    </section>
  );
}

function Eyebrow({ index, children }: { index: string; children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.28em] text-cyan-200/90 uppercase">
      <span className="tabular-nums text-white/50">{index}</span>
      <span className="h-px w-8 bg-gradient-to-r from-cyan-200/70 to-transparent" />
      {children}
    </p>
  );
}

const Arrow = () => (
  <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
    <path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Bio() {
  return (
    <Glass id="bio" aria-labelledby="bio-title" className="mx-auto w-full max-w-3xl p-7 sm:p-10">
      <Eyebrow index="01">{bio.eyebrow}</Eyebrow>
      <h2 id="bio-title" className="font-display mt-5 text-[2.6rem] leading-[1.02] text-white sm:text-6xl">
        {bio.title}
        <span className="text-cyan-200">.</span>
      </h2>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-white/85 sm:text-[17px]">
        {bio.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <ul className="mt-7 flex flex-wrap gap-2">
        {bio.facts.map((f) => (
          <li key={f} className="chip">
            {f}
          </li>
        ))}
      </ul>
    </Glass>
  );
}

export function Projects() {
  return (
    <Glass id="projects" aria-labelledby="projects-title" className="w-full p-7 sm:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow index="02">Projects</Eyebrow>
          <h2 id="projects-title" className="font-display mt-5 text-[2.6rem] leading-none text-white sm:text-6xl">
            My Projects
          </h2>
        </div>
        <p className="max-w-xs text-sm text-white/70">What's above the waterline. More is always being built underneath.</p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {projects.map((p, i) => {
          const Tag = p.href ? "a" : "article";
          return (
            <Tag
              key={p.title}
              {...(p.href ? { href: p.href, target: "_blank", rel: "noreferrer" } : {})}
              className="tile group flex flex-col rounded-2xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs font-semibold tabular-nums tracking-widest text-cyan-200/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p.href && (
                  <span className="text-white/60 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white">
                    <Arrow />
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">{p.title}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-white/75">{p.blurb}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <li key={t} className="chip chip-sm">
                    {t}
                  </li>
                ))}
              </ul>
            </Tag>
          );
        })}
      </div>
    </Glass>
  );
}

const CardIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 10h18M7 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const SparkIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
    <path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M18.5 16.5v4M16.5 18.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export function Payment() {
  const items = [
    { ...payment.lava, href: links.lavaPay, icon: <CardIcon />, primary: true },
    { ...payment.boosty, href: links.boosty, icon: <SparkIcon />, primary: false },
  ];
  return (
    <Glass id="payment" aria-labelledby="payment-title" className="w-full p-7 sm:p-10">
      <Eyebrow index="03">{payment.eyebrow}</Eyebrow>
      <h2 id="payment-title" className="font-display mt-5 text-[2.6rem] leading-none text-white sm:text-6xl">
        {payment.title}
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <div key={it.name} className="tile flex flex-col rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-cyan-100">{it.icon}</span>
              <div>
                <p className="font-semibold text-white">{it.name}</p>
                <p className="text-xs text-white/55">{it.host}</p>
              </div>
            </div>
            <p className="mt-4 flex-1 text-[15px] leading-relaxed text-white/75">{it.text}</p>
            <a href={it.href} target="_blank" rel="noreferrer" className={`btn mt-6 justify-center ${it.primary ? "btn-primary" : "btn-glass"}`}>
              {it.cta}
              <Arrow />
            </a>
          </div>
        ))}
      </div>
    </Glass>
  );
}
