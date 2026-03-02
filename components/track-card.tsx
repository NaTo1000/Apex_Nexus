import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Track, formatDuration } from "@/lib/store/library-store";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { usePlayer } from "@/lib/store/player-context";

const FORMAT_COLORS: Record<string, string> = {
  WAV_HD: "#FFD700",
  WAV:    "#FF4D6D",
  MP3:    "#34D399",
  FLAC:   "#FBBF24",
  AAC:    "#9CA3AF",
};

const MASTERING_LABELS: Record<string, { label: string; color: string }> = {
  unmastered:      { label: "Raw",        color: "#4B5563" },
  ai_mastered:     { label: "AI ✓",       color: "#C41E3A" },
  manual_mastered: { label: "Manual ✓",   color: "#FF4D6D" },
  processing:      { label: "Processing", color: "#FBBF24" },
};

const QUALITY_LABELS: Record<string, { label: string; color: string }> = {
  studio:   { label: "STUDIO HD", color: "#FFD700" },
  high:     { label: "HI-RES",    color: "#FF4D6D" },
  standard: { label: "STD",       color: "#4B5563" },
};

// Wave bar heights for the "playing" animation (static but varied)
const WAVE_HEIGHTS = [8, 14, 10, 16, 12, 18, 9, 15, 11, 17];

interface TrackCardProps {
  track: Track;
  onPress?: () => void;
  onMaster?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function TrackCard({ track, onPress, onMaster, compact = false }: TrackCardProps) {
  const { currentTrack, isPlaying, play, pause, resume } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isActiveAndPlaying = isCurrentTrack && isPlaying;

  const handlePlayPress = () => {
    if (isCurrentTrack) {
      isPlaying ? pause() : resume();
    } else {
      play(track);
    }
  };

  const formatColor = FORMAT_COLORS[track.format] ?? "#9CA3AF";
  const mastering = MASTERING_LABELS[track.masteringStatus] ?? MASTERING_LABELS.unmastered;
  const quality = QUALITY_LABELS[track.quality ?? "standard"] ?? QUALITY_LABELS.standard;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isCurrentTrack && styles.activeCard,
        pressed && { opacity: 0.82, transform: [{ scale: 0.99 }] },
      ]}
      onPress={onPress}
    >
      {/* Active indicator strip */}
      {isCurrentTrack && <View style={[styles.activeStrip, { backgroundColor: isActiveAndPlaying ? "#C41E3A" : "#C41E3A66" }]} />}

      {/* Artwork */}
      <View style={[styles.artwork, isCurrentTrack && styles.activeArtwork]}>
        {isActiveAndPlaying ? (
          <View style={styles.waveIndicator}>
            {WAVE_HEIGHTS.slice(0, 6).map((h, i) => (
              <View key={i} style={[styles.waveBar, { height: h }]} />
            ))}
          </View>
        ) : (
          <IconSymbol
            name="music.note"
            size={22}
            color={isCurrentTrack ? "#FFD700" : "#374151"}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, isCurrentTrack && styles.activeTitle]} numberOfLines={1}>
          {track.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
          {!compact && <Text style={styles.duration}>{formatDuration(track.duration)}</Text>}
        </View>
        {!compact && (
          <View style={styles.badges}>
            <View style={[styles.badge, { borderColor: quality.color + "88", backgroundColor: quality.color + "11" }]}>
              <Text style={[styles.badgeText, { color: quality.color }]}>{quality.label}</Text>
            </View>
            <View style={[styles.badge, { borderColor: formatColor + "88", backgroundColor: formatColor + "11" }]}>
              <Text style={[styles.badgeText, { color: formatColor }]}>
                {track.format.replace("_", " ")}
              </Text>
            </View>
            <View style={[styles.badge, { borderColor: mastering.color + "88", backgroundColor: mastering.color + "11" }]}>
              <Text style={[styles.badgeText, { color: mastering.color }]}>{mastering.label}</Text>
            </View>
            {track.lufsAchieved != null && (
              <View style={styles.lufsBadge}>
                <Text style={styles.lufsText}>{track.lufsAchieved} LUFS</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Right actions */}
      <View style={styles.actions}>
        {onMaster && track.masteringStatus === "unmastered" && (
          <Pressable
            style={({ pressed }) => [styles.masterBtn, pressed && { opacity: 0.7 }]}
            onPress={onMaster}
          >
            <IconSymbol name="bolt.fill" size={14} color="#C41E3A" />
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.playBtn,
            isCurrentTrack && styles.playBtnActive,
            pressed && { opacity: 0.75, transform: [{ scale: 0.93 }] },
          ]}
          onPress={handlePlayPress}
        >
          <IconSymbol
            name={isActiveAndPlaying ? "pause.fill" : "play.fill"}
            size={20}
            color={isCurrentTrack ? "#0A0A12" : "#9CA3AF"}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D0D18",
    borderRadius: 16,
    padding: 12,
    paddingLeft: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1E1E2E",
    gap: 12,
    overflow: "hidden",
    // Subtle elevation
    shadowColor: "#000",
    shadowRadius: 6,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
  },
  activeCard: {
    borderColor: "#C41E3A55",
    backgroundColor: "#130810",
    shadowColor: "#C41E3A",
    shadowOpacity: 0.25,
  },
  activeStrip: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#151520",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1E1E2E",
  },
  activeArtwork: {
    backgroundColor: "#2A0A14",
    borderColor: "#C41E3A44",
  },
  waveIndicator: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  waveBar: {
    width: 3,
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  info: { flex: 1, gap: 4 },
  title: { color: "#E5E7EB", fontSize: 14, fontWeight: "700", lineHeight: 18 },
  activeTitle: { color: "#FFD700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  artist: { color: "#6B7280", fontSize: 12, flex: 1, lineHeight: 16 },
  duration: { color: "#4B5563", fontSize: 11, fontVariant: ["tabular-nums"] },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    flexWrap: "wrap",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  lufsBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  lufsText: { color: "#4B5563", fontSize: 9, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A28",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A3A",
  },
  playBtnActive: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowRadius: 8,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
  },
  masterBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C41E3A18",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C41E3A44",
  },
});
