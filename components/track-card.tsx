import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Track, formatDuration, formatFileSize, formatSampleRate } from "@/lib/store/library-store";
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
  unmastered:      { label: "Raw",        color: "#6B7280" },
  ai_mastered:     { label: "AI ✓",       color: "#C41E3A" },
  manual_mastered: { label: "Manual ✓",   color: "#FF4D6D" },
  processing:      { label: "Processing", color: "#FBBF24" },
};

const QUALITY_LABELS: Record<string, { label: string; color: string }> = {
  studio:   { label: "STUDIO HD", color: "#FFD700" },
  high:     { label: "HI-RES",    color: "#FF4D6D" },
  standard: { label: "STD",       color: "#6B7280" },
};

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

  const handlePlayPress = () => {
    if (isCurrentTrack) {
      isPlaying ? pause() : resume();
    } else {
      play(track);
    }
  };

  const formatColor = FORMAT_COLORS[track.format] ?? "#9CA3AF";
  const mastering = MASTERING_LABELS[track.masteringStatus];
  const quality = QUALITY_LABELS[track.quality ?? "standard"];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85 },
        isCurrentTrack && styles.activeCard,
      ]}
      onPress={onPress}
    >
      {/* Artwork / Waveform indicator */}
      <View style={[styles.artwork, isCurrentTrack && styles.activeArtwork]}>
        {isCurrentTrack && isPlaying ? (
          <View style={styles.waveIndicator}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.waveBar, { height: 6 + i * 3 }]} />
            ))}
          </View>
        ) : (
          <IconSymbol
            name="music.note"
            size={20}
            color={isCurrentTrack ? "#FFD700" : "#6B7280"}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[styles.title, isCurrentTrack && styles.activeTitle]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
          {!compact && (
            <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
          )}
        </View>
        {!compact && (
          <View style={styles.badges}>
            {/* Quality badge */}
            <View style={[styles.badge, { borderColor: quality.color }]}>
              <Text style={[styles.badgeText, { color: quality.color }]}>{quality.label}</Text>
            </View>
            {/* Format badge */}
            <View style={[styles.badge, { borderColor: formatColor }]}>
              <Text style={[styles.badgeText, { color: formatColor }]}>
                {track.format.replace("_", " ")}
              </Text>
            </View>
            {/* Mastering badge */}
            <View style={[styles.badge, { borderColor: mastering.color }]}>
              <Text style={[styles.badgeText, { color: mastering.color }]}>{mastering.label}</Text>
            </View>
            {/* LUFS if mastered */}
            {track.lufsAchieved != null && (
              <Text style={styles.lufsText}>{track.lufsAchieved} LUFS</Text>
            )}
          </View>
        )}
      </View>

      {/* Play button */}
      <Pressable
        style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.7 }]}
        onPress={handlePlayPress}
      >
        <IconSymbol
          name={isCurrentTrack && isPlaying ? "pause.fill" : "play.fill"}
          size={22}
          color={isCurrentTrack ? "#FFD700" : "#9CA3AF"}
        />
      </Pressable>

      {/* Master button — only for unmastered tracks */}
      {onMaster && track.masteringStatus === "unmastered" && (
        <Pressable
          style={({ pressed }) => [styles.masterBtn, pressed && { opacity: 0.7 }]}
          onPress={onMaster}
        >
          <IconSymbol name="bolt.fill" size={16} color="#C41E3A" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111118",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A35",
    gap: 12,
  },
  activeCard: {
    borderColor: "#C41E3A",
    backgroundColor: "#1A0A0E",
  },
  artwork: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#1A1A24",
    alignItems: "center",
    justifyContent: "center",
  },
  activeArtwork: {
    backgroundColor: "#3A0A14",
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
  info: { flex: 1, gap: 3 },
  title: { color: "#F5F5F5", fontSize: 14, fontWeight: "600" },
  activeTitle: { color: "#FFD700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  artist: { color: "#9CA3AF", fontSize: 12, flex: 1 },
  duration: { color: "#6B7280", fontSize: 11 },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
    flexWrap: "wrap",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  lufsText: { color: "#6B7280", fontSize: 10 },
  playBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  masterBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C41E3A22",
    borderRadius: 8,
  },
});
