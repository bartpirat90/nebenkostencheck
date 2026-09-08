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
  "inline-flex items-center justify-center gap-2 rounded-xl transition-colors duration-150 " +
  // Active-Scale gibt haptisches Feedback; im deaktivierten Zustand
  // zurückgenommen, sonst „wackelt“ ein Button, der nichts tut.
  "active:scale-[0.97] disabled:active:scale-100 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  // Haupt-CTA auf Papier: dunkle Fläche, Blattfarbe als Text (15,7:1).
  // Das Akzentgrün bleibt den Beträgen und dem Berichts-Button vorbehalten,
  // damit auf einer Seite nur ein Element „grün ruft“.
  primary: "bg-fg hover:bg-fg-hover text-paper",
  // line-control statt line-strong: der Rahmen ist hier das einzige Merkmal des
  // Bedienelements und braucht deshalb 3:1 gegen Papier und Dokumentfläche.
  secondary: "border border-paper-line-control text-fg hover:border-accent hover:text-accent",
  ghost: "text-muted hover:text-fg",
  // Akzent-Umriss auf Dokumentfläche: für nachgeordnete Aktionen, die trotzdem
  // zum Kern gehören (kombiniertes Schreiben, PDF im Bericht).
  accent: "bg-doc border border-accent-border text-accent hover:bg-accent-soft",
};

// Beide Größen erfüllen die 44-px-Mindestfläche auch dann, wenn der Text
// kleiner wird oder das Label umbricht – deshalb zusätzlich min-h.
// lg trägt exakt die 15/26 px Innenabstand aus Spec 5.1 (Hero-CTA).
const SIZES: Record<Size, string> = {
  md: "min-h-11 py-3 px-5 text-sm",
  lg: "min-h-12 py-[15px] px-[26px] text-base",
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
