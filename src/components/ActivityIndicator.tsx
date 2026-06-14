"use client";

import { useState, useEffect } from "react";

/** Slim indeterminate progress bar with a continuously moving highlight. */
export function ProgressBar() {
  return (
    <div className="relative w-full h-1 rounded-full overflow-hidden bg-line">
      <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-accent animate-[neko-progress_1.5s_ease-in-out_infinite]" />
      <style jsx>{`
        @keyframes neko-progress {
          0% {
            left: -35%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Sequential phase list. Advances through `phases` on an interval and stays on
 * the last phase (does not loop) so it never implies "done" while a real call runs.
 */
export function PhaseList({
  phases,
  intervalMs = 4000,
}: {
  phases: string[];
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= phases.length - 1) return;
    const t = setInterval(() => {
      setActive((i) => (i < phases.length - 1 ? i + 1 : i));
    }, intervalMs);
    return () => clearInterval(t);
  }, [active, phases.length, intervalMs]);

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-xs text-xs">
      {phases.map((phase, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <div
            key={phase}
            className={`flex items-center gap-2 transition-colors ${
              done ? "text-muted" : current ? "text-fg" : "text-faint"
            }`}
          >
            {done ? (
              <svg className="w-3.5 h-3.5 shrink-0 text-accent-bright" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : current ? (
              <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-accent-soft animate-ping" />
                <span className="absolute w-2 h-2 rounded-full bg-accent-soft" />
              </span>
            ) : (
              <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-line" />
              </span>
            )}
            <span>{phase}</span>
          </div>
        );
      })}
    </div>
  );
}
