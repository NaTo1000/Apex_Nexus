import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { usePlayer } from "@/lib/store/player-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatDuration } from "@/lib/store/library-store";

export function MiniPlayer() {
  const { currentTrack, isPlaying, position, duration, pause, resume } = usePlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        {/* Artwork placeholder */}
        <View style={styles.artwork}>
          <IconSymbol name="music.note" size={18} color="#C41E3A" />
        </View>

        {/* Track info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Quality badge */}
        {currentTrack.quality === "studio" && (
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityText}>HD</Text>
          </View>
        )}

        {/* Time */}
        <Text style={styles.time}>
          {formatDuration(Math.floor(position))}
        </Text>

        {/* Play/Pause */}
        <Pressable
          style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.7 }]}
          onPress={isPlaying ? pause : resume}
        >
          <IconSymbol
            name={isPlaying ? "pause.fill" : "play.fill"}
            size={24}
            color="#F5F5F5"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111118",
    borderTopWidth: 0.5,
    borderTopColor: "#2A2A35",
  },
  progressBar: {
    height: 2,
    backgroundColor: "#2A2A35",
  },
  progressFill: {
    height: 2,
    backgroundColor: "#C41E3A",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  artwork: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#1A1A24",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C41E3A44",
  },
  info: { flex: 1 },
  title: { color: "#F5F5F5", fontSize: 14, fontWeight: "600" },
  artist: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  qualityBadge: {
    backgroundColor: "#FFD70022",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  qualityText: { color: "#FFD700", fontSize: 9, fontWeight: "800" },
  time: { color: "#6B7280", fontSize: 11 },
  playBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
