import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  elevation?: 1 | 2 | 3 | 4 | 5;
  noBorder?: boolean;
  /** Show a subtle inner glow on the bottom edge (depth effect) */
  innerGlow?: boolean;
}

/**
 * GlassCard — premium frosted glass surface with neon border glow, specular
 * top highlight, inner depth shadow, and 5-level elevation system.
 *
 * Elevation 1 = flat card, 5 = floating modal-level depth.
 */
export function GlassCard({
  children,
  style,
  glowColor = "#C41E3A",
  elevation = 2,
  noBorder = false,
  innerGlow = false,
}: GlassCardProps) {
  // Surface background gets slightly lighter at higher elevations (light source above)
  const surfaceBg = ["#0A0A12", "#0D0D18", "#0F0F1C", "#111120", "#131324"][elevation - 1];

  // Shadow depth per elevation level
  const shadowProps: ViewStyle = {
    shadowColor: glowColor,
    shadowRadius: [4, 9, 16, 22, 30][elevation - 1],
    shadowOpacity: [0.18, 0.28, 0.40, 0.52, 0.62][elevation - 1],
    shadowOffset: { width: 0, height: [2, 4, 7, 10, 14][elevation - 1] },
  };

  // Border: subtle at low elevation, vivid at high elevation
  const borderAlpha = Math.round(([0.10, 0.14, 0.20, 0.28, 0.38][elevation - 1]) * 255)
    .toString(16).padStart(2, "0");
  const borderColor = glowColor + borderAlpha;

  return (
    <View
      style={[
        styles.base,
        shadowProps,
        { backgroundColor: surfaceBg },
        !noBorder && { borderColor, borderWidth: 1 },
        style,
      ]}
    >
      {/* Top specular highlight — simulates light source from above */}
      <View style={styles.topHighlight} pointerEvents="none" />

      {/* Left edge micro-highlight — adds 3D depth */}
      <View style={styles.leftHighlight} pointerEvents="none" />

      {/* Inner bottom glow — optional warm depth */}
      {innerGlow && (
        <View
          style={[styles.innerGlow, { shadowColor: glowColor }]}
          pointerEvents="none"
        />
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.09)",
    zIndex: 10,
  },
  leftHighlight: {
    position: "absolute",
    top: 12,
    bottom: 12,
    left: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    zIndex: 10,
  },
  innerGlow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    shadowRadius: 20,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -4 },
    zIndex: 0,
  },
});
