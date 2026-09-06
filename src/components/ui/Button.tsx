import { forwardRef, ButtonHTMLAttributes, HTMLAttributes, Ref } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Eine Quelle für alle Buttons und Button-artigen Links.
 *
 * Bewusst OHNE "use client": die Komponente hält keinen State, Event-Handler
 * kommen von außen. So bleibt sie auch in Server-Komponenten (404-Seiten,
 * LandingHero) nutzbar, ohne dort eine Client-Grenze aufzuziehen.
 *
 * Kein Fokus-Ring in den Klassen: der kommt global aus globals.css
 * (:focus-visible), damit er überall identisch aussieht.
 */

type Variant = "primary" | "secondary" | "ghost" | "accent";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  // Haupt-CTA. active:scale gibt haptisches Feedback, wird im deaktivierten
  // Zustand zurückgenommen (sonst "wackelt" ein Button, der nichts tut).
  primary:
    "bg-accent hover:bg-accent-hover text-white active:scale-[0.98] disabled:active:scale-100",
  secondary:
    "border border-line-strong text-muted hover:border-accent hover:text-accent-bright",
  ghost: "text-muted hover:text-fg",
  // Akzent-Umriss: für nachgeordnete Aktionen, die trotzdem zum Kern gehören
  // (kombiniertes Schreiben) – sichtbar hervorgehoben, aber nicht als zweiter Haupt-CTA.
  accent: "border border-accent-border text-accent-bright hover:bg-accent-bg/40",
};

// Beide Größen erfüllen die 44-px-Mindestfläche aus Task 2 auch dann, wenn der
// Text kleiner wird oder das Label umbricht – deshalb zusätzlich min-h.
const SIZES: Record<Size, string> = {
  md: "min-h-11 py-3 px-5 text-sm",
  lg: "min-h-12 py-3.5 px-7 text-base",
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: Variant;
  size?: Size;
  /** Rendert einen Link statt eines Buttons. */
  href?: string;
  /**
   * Erzwingt ein rohes <a> statt des next-intl-Link (z. B. auf der Root-404,
   * die außerhalb des [locale]-Segments und damit ohne Locale-Kontext läuft).
   */
  external?: boolean;
  /** Deaktiviert den Button und zeigt einen Spinner an Stelle des Icons. */
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    href,
    external,
    loading = false,
    type = "button",
    disabled,
    className,
    children,
    ...rest
  },
  ref
) {
  const classes = cx(BASE, VARIANTS[variant], SIZES[size], className);

  if (href) {
    // Anker, mailto:, tel: und absolute URLs dürfen nicht durch das
    // Locale-Routing laufen – sonst würde aus "#upload" ein "/de/#upload".
    const useAnchor = external || !href.startsWith("/");
    const anchorProps = rest as HTMLAttributes<HTMLAnchorElement>;
    if (useAnchor) {
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...anchorProps}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        {...anchorProps}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="w-4 h-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
});

export default Button;
