import Svg, { Path } from "react-native-svg";

// Outline-Schild mit echter Lücke oben rechts, durch die der Haken bricht –
// gespiegelt aus dem Web (src/lib/logo.ts). Kein Knockout, hintergrundunabhängig.
const SHIELD = "M12 2l6 2.25 M20 6v5c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3";
const CHECK = "M7.8 11.5l3.4 3.4L21.5 2.8";
const GREEN = "#10B981";

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={SHIELD}
        stroke={GREEN}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d={CHECK}
        stroke={GREEN}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
