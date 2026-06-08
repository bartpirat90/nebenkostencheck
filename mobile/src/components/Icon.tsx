import Svg, { Path, Rect, Circle } from "react-native-svg";
import { colors } from "../theme";

export type IconName = "document" | "image" | "camera" | "close";

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * Schlanke Line-Icons im Feather-Stil – konsistent zum Schild-Logo (beide
 * react-native-svg, gleicher Strich). Bewusst statt System-Emojis, damit das
 * Erscheinungsbild auf allen Geräten/OS identisch und markentreu ist.
 */
export function Icon({ name, size = 24, color = colors.text, strokeWidth = 2 }: Props) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === "document" && (
        <>
          <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" {...stroke} />
          <Path d="M14 3v5h5" {...stroke} />
          <Path d="M9 13h6" {...stroke} />
          <Path d="M9 17h6" {...stroke} />
        </>
      )}

      {name === "image" && (
        <>
          <Rect x={3} y={3} width={18} height={18} rx={2.5} ry={2.5} {...stroke} />
          <Circle cx={8.5} cy={8.5} r={1.6} {...stroke} />
          <Path d="M21 15l-4.5-4.5L5 21" {...stroke} />
        </>
      )}

      {name === "camera" && (
        <>
          <Path
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h6l2 3h3a2 2 0 0 1 2 2z"
            {...stroke}
          />
          <Circle cx={12} cy={13} r={3.5} {...stroke} />
        </>
      )}

      {name === "close" && (
        <>
          <Path d="M18 6L6 18" {...stroke} />
          <Path d="M6 6l12 12" {...stroke} />
        </>
      )}
    </Svg>
  );
}
