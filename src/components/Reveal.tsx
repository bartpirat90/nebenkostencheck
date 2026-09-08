"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

/**
 * Dezenter Scroll-Reveal: blendet Inhalt beim Eintreten in den Viewport
 * gestaffelt ein (nur Opacity). Respektiert `prefers-reduced-motion`
 * (dann sofort sichtbar, ohne Transition).
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        // Bewusst nur Opacity: ein zusätzliches Verschieben lässt die Seite
        // beim Scrollen „arbeiten“ und passt nicht zu einer Vertrauensmarke.
        opacity: shown ? 1 : 0,
        transition: "opacity 250ms cubic-bezier(0.23, 1, 0.32, 1)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
