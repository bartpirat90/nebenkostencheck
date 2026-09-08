import { forwardRef, AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from "react";
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
  "inline-flex items-center justify-center gap-2 rounded-xl transition-colors " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  // Haupt-CTA. active:scale gibt haptisches Feedback, wird im deaktivierten
  // Zustand zurückgenommen (sonst "wackelt" ein Button, der nichts tut).
  primary:
    "bg-accent hover:bg-accent-hover text-white active:scale-[0.98] disabled:active:scale-100",
  secondary:
    "border border-line-strong text-muted hover:border-accent hover:text-accent",
  ghost: "text-muted hover:text-fg",
  // Akzent-Umriss: für nachgeordnete Aktionen, die trotzdem zum Kern gehören
  // (kombiniertes Schreiben) – sichtbar hervorgehoben, aber nicht als zweiter Haupt-CTA.
  accent: "border border-accent-border text-accent-bright hover:bg-accent-soft",
};

// Beide Größen erfüllen die 44-px-Mindestfläche aus Task 2 auch dann, wenn der
// Text kleiner wird oder das Label umbricht – deshalb zusätzlich min-h.
const SIZES: Record<Size, string> = {
  md: "min-h-11 py-3 px-5 text-sm",
  lg: "min-h-12 py-3.5 px-7 text-base",
};

// Schriftgewicht kommt aus genau einer Quelle: Tailwind sortiert font-*-Utilities
// alphabetisch ins Stylesheet, ein `className="font-bold"` von außen würde gegen
// ein `font-semibold` in BASE verlieren. lg (= die beiden Conversion-CTAs) bleibt
// fett wie vor dem Refactoring, ghost als zurückgenommene Nebenaktion normal.
function weightFor(variant: Variant, size: Size): string {
  if (variant === "ghost") return "font-normal";
  return size === "lg" ? "font-bold" : "font-semibold";
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Deaktiviert den Button und zeigt einen Spinner an Stelle des Icons. */
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

/** Link-Form: `href` gesetzt, Anchor-Attribute (target, rel, download …) erlaubt. */
export interface ButtonLinkProps
  extends CommonProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> {
  href: string;
  /**
   * Erzwingt ein rohes <a> statt des next-intl-Link (z. B. auf der Root-404,
   * die außerhalb des [locale]-Segments und damit ohne Locale-Kontext läuft).
   */
  external?: boolean;
}

/** Button-Form: kein `href`, Button-Attribute (type, form, onClick …) erlaubt. */
export interface ButtonElementProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps | "type"> {
  href?: undefined;
  external?: undefined;
  type?: "button" | "submit" | "reset";
}

export type ButtonProps = ButtonLinkProps | ButtonElementProps;

// Eigene Props dürfen nicht ins DOM durchgereicht werden (React warnt, ESLint
// würde bei einer Destrukturierung ungenutzte Variablen anmahnen).
const OWN_KEYS = [
  "variant", "size", "loading", "disabled", "className", "children", "href", "external", "type",
] as const;
type OwnKey = (typeof OWN_KEYS)[number];

function domProps<T extends object>(props: T): Omit<T, OwnKey> {
  const copy = { ...props } as Record<string, unknown>;
  for (const key of OWN_KEYS) delete copy[key];
  return copy as Omit<T, OwnKey>;
}

const Spinner = () => (
  <span
    aria-hidden
    className="w-4 h-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
  />
);

const Button = forwardRef<HTMLAnchorElement | HTMLButtonElement, ButtonProps>(function Button(
  props,
  ref
) {
  const { variant = "primary", size = "md", loading = false, disabled, className, children } = props;
  const inactive = Boolean(disabled || loading);
  const classes = cx(
    BASE,
    VARIANTS[variant],
    SIZES[size],
    weightFor(variant, size),
    // <a> kennt kein disabled: Klicks und Tab-Fokus per Klassen/Attributen sperren.
    props.href !== undefined && inactive && "opacity-60 cursor-not-allowed pointer-events-none",
    className
  );

  if (props.href !== undefined) {
    const { href, external } = props;
    const anchorRest = domProps(props);
    // Eigene Attribute NACH dem Spread: ein von außen übergebenes tabIndex darf
    // die Sperre im inaktiven Zustand nicht wieder aufheben.
    const linkProps = {
      ...anchorRest,
      className: classes,
      "aria-disabled": inactive || undefined,
      "aria-busy": loading || undefined,
      tabIndex: inactive ? -1 : anchorRest.tabIndex,
    };
    const content = (
      <>
        {loading && <Spinner />}
        {children}
      </>
    );
    // Anker, mailto:, tel: und absolute URLs dürfen nicht durch das
    // Locale-Routing laufen – sonst würde aus "#upload" ein "/de/#upload".
    if (external || !href.startsWith("/")) {
      return (
        <a ref={ref as Ref<HTMLAnchorElement>} href={href} {...linkProps}>
          {content}
        </a>
      );
    }
    return (
      <Link ref={ref as Ref<HTMLAnchorElement>} href={href} {...linkProps}>
        {content}
      </Link>
    );
  }

  const { type = "button" } = props;
  const buttonRest = domProps(props);
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      disabled={inactive}
      aria-busy={loading || undefined}
      className={classes}
      {...buttonRest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

export default Button;
