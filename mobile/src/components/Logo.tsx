import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="nk-grad" x1="0" y1="0" x2="24" y2="24">
          <Stop offset="0" stopColor="#6366F1" />
          <Stop offset="1" stopColor="#8B5CF6" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"
        fill="url(#nk-grad)"
      />
      <Path
        d="M8.5 12l2.5 2.5 4.5-4.5"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
