import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { usePlayer } from "@/lib/store/player-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatDuration } from "@/lib/store/library-store";
import { NeonText } from "@/components/ui/neon-text";

export function MiniPlayer() {
  const router = useRouter();
  const { currentTrack, isPlaying, position, duration, pause, resume, stop } = usePlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;

  const handleTapInfo = () => {
    (router as any).push(`/track/${currentTrack.id}`);
  };

  return (
    <View style={styles.container}>
      {/* Progress bar — full width, above content */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        {/* Playhead dot */}
        <View style={[styles.playhead, { left: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        {/* Artwork — tappable to open track detail */}
        <Pressable
          style={({ pressed }) => [styles.artwork, pressed && { opacity: 0.75 }]}
          onPress={handleTapInfo}
        >
          <IconSymbol name="music.note" size={18} color="#C41E3A" />
          {isPlaying && (
            <View style={styles.playingDot} />
          )}
        </Pressable>

        {/* Track info — tappable to open track detail */}
        <Pressable style={styles.info} onPress={handleTapInfo}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
            {currentTrack.quality === "studio" && (
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityText}>HD</Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Time */}
        <Text style={styles.time}>{formatDuration(Math.floor(position))}</Text>

        {/* Play/Pause */}
        <Pressable
          style={({ pressed }) => [
            styles.playBtn,
            pressed && { opacity: 0.75, transform: [{ scale: 0.92 }] },
          ]}
          onPress={isPlaying ? pause : resume}
        >
          <IconSymbol
            name={isPlaying ? "pause.fill" : "play.fill"}
            size={22}
            color="#F5F5F5"
          />
        </Pressable>

        {/* Stop / dismiss */}
        <Pressable
          style={({ pressed }) => [styles.stopBtn, pressed && { opacity: 0.7 }]}
          onPress={stop}
        >
          <IconSymbol name="xmark" size={14} color="#6B7280" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0D0D18",
    borderTopWidth: 1,
    borderTopColor: "#1E1E2E",
    shadowColor: "#000",
    shadowRadius: 12,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: -4 },
  },
  progressBar: {
    height: 3,
    backgroundColor: "#1A1A28",
    position: "relative",
    overflow: "visible",
  },
  progressFill: {
    height: 3,
    backgroundColor: "#C41E3A",
    shadowColor: "#C41E3A",
    shadowRadius: 4,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
  },
  playhead: {
    position: "absolute",
    top: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#F5F5F5",
    marginLeft: -4,
    borderWidth: 1.5,
    borderColor: "#C41E3A",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#151520",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C41E3A44",
    position: "relative",
  },
  playingDot: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#C41E3A",
    borderWidth: 1,
    borderColor: "#0D0D18",
  },
  info: { flex: 1, gap: 2 },
  title: { color: "#E5E7EB", fontSize: 13, fontWeight: "700", lineHeight: 17 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  artist: { color: "#6B7280", fontSize: 11, flex: 1 },
  qualityBadge: {
    backgroundColor: "#FFD70018",
    borderWidth: 1,
    borderColor: "#FFD70066",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  qualityText: { color: "#FFD700", fontSize: 8, fontWeight: "800" },
  time: { color: "#4B5563", fontSize: 11, fontVariant: ["tabular-nums"] },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#C41E3A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C41E3A",
    shadowRadius: 8,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
  },
  stopBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#151520",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1E1E2E",
  },
});
