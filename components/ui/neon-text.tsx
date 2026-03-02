import React from "react";
import { Text, TextStyle, StyleProp, StyleSheet } from "react-native";

interface NeonTextProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  weight?: TextStyle["fontWeight"];
  style?: StyleProp<TextStyle>;
  intensity?: "low" | "medium" | "high";
  /** Optional letter spacing override */
  tracking?: number;
}

/**
 * NeonText — premium text with multi-layer colour-matched glow.
 *
 * Intensity levels:
 * - low:    subtle ambient glow (labels, secondary text)
 * - medium: standard neon effect (headings, values)
 * - high:   vivid beacon glow (hero titles, active states)
 */
export function NeonText({
  children,
  color = "#C41E3A",
  size = 16,
  weight = "800",
  style,
  intensity = "medium",
  tracking,
}: NeonTextProps) {
  // Glow radius per intensity — tuned for iOS rendering
  const glowRadius = { low: 3, medium: 7, high: 14 }[intensity];

  // Line height: 1.25× font size ensures descenders never clip
  const lineHeight = Math.round(size * 1.3);

  // Default letter spacing scales with size for large headings
  const defaultTracking = size >= 20 ? 0.5 : size >= 14 ? 0.3 : 0.1;

  return (
    <Text
      style={[
        styles.base,
        {
          color,
          fontSize: size,
          fontWeight: weight,
          lineHeight,
          letterSpacing: tracking ?? defaultTracking,
          textShadowColor: color,
          textShadowRadius: glowRadius,
          textShadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
