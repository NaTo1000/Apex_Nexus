import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLibrary } from "@/lib/store/library-context";
import { usePlayer } from "@/lib/store/player-context";
import {
  formatDuration,
  formatFileSize,
  formatSampleRate,
  getQualityLabel,
} from "@/lib/store/library-store";

const MASTERING_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unmastered:     { label: "Unmastered",      color: "#6B7280" },
  ai_mastered:    { label: "AI Mastered",     color: "#34D399" },
  manual_mastered: { label: "Manual Mastered", color: "#60A5FA" },
  processing:     { label: "Processing…",     color: "#FFD700" },
};

const QUALITY_COLORS: Record<string, string> = {
  standard: "#9CA3AF",
  high:     "#FF4D6D",
  studio:   "#FFD700",
};

export default function TrackDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tracks, deleteTrack, incrementPlays } = useLibrary();
  const { play, currentTrack, isPlaying, pause, resume } = usePlayer();

  const track = tracks.find((t) => t.id === id);

  const handlePlay = useCallback(() => {
    if (!track) return;
    if (currentTrack?.id === track.id) {
      isPlaying ? pause() : resume();
    } else {
      play(track);
      incrementPlays(track.id);
    }
  }, [track, currentTrack, isPlaying, play, pause, resume, incrementPlays]);

  const handleDelete = useCallback(() => {
    if (!track) return;
    Alert.alert(
      "Delete Track",
      `Delete "${track.title}" from your library?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTrack(track.id);
            router.back();
          },
        },
      ]
    );
  }, [track, deleteTrack, router]);

  if (!track) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.errorText}>Track not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Go Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const masterStatus = MASTERING_STATUS_LABELS[track.masteringStatus] ?? MASTERING_STATUS_LABELS.unmastered;
  const qualityColor = QUALITY_COLORS[track.quality] ?? "#9CA3AF";
  const isCurrentTrack = currentTrack?.id === track.id;

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="arrow.left" size={22} color="#F5F5F5" />
          </Pressable>
          <Text style={styles.headerTitle}>Track Details</Text>
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
            onPress={handleDelete}
          >
            <IconSymbol name="trash.fill" size={20} color="#C41E3A" />
          </Pressable>
        </View>

        {/* Artwork / Waveform */}
        <View style={styles.artworkSection}>
          <View style={styles.artwork}>
            <IconSymbol name="music.note" size={52} color="#C41E3A" />
          </View>
          <View style={styles.qualityBadgeRow}>
            <View style={[styles.qualityBadge, { borderColor: qualityColor }]}>
              <Text style={[styles.qualityBadgeText, { color: qualityColor }]}>
                {getQualityLabel(track.quality)}
              </Text>
            </View>
            <View style={[styles.formatBadge, { borderColor: "#A78BFA" }]}>
              <Text style={[styles.formatBadgeText, { color: "#A78BFA" }]}>
                {track.format.replace("_", " ")}
              </Text>
            </View>
          </View>
        </View>

        {/* Title / Artist */}
        <View style={styles.titleSection}>
          <Text style={styles.trackTitle}>{track.title}</Text>
          <Text style={styles.trackArtist}>{track.artist}</Text>
          {track.album ? <Text style={styles.trackAlbum}>{track.album}</Text> : null}
        </View>

        {/* Play Button */}
        <Pressable
          style={({ pressed }) => [
            styles.playBtn,
            isCurrentTrack && isPlaying && styles.playBtnActive,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handlePlay}
        >
          <IconSymbol
            name={isCurrentTrack && isPlaying ? "pause.fill" : "play.fill"}
            size={22}
            color="#F5F5F5"
          />
          <Text style={styles.playBtnText}>
            {isCurrentTrack && isPlaying ? "Pause" : "Play"}
          </Text>
        </Pressable>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDuration(track.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{track.plays}</Text>
            <Text style={styles.statLabel}>Plays</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatFileSize(track.fileSize)}</Text>
            <Text style={styles.statLabel}>File Size</Text>
          </View>
        </View>

        {/* Audio Specs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Specifications</Text>
          <InfoRow label="Sample Rate" value={formatSampleRate(track.sampleRate)} />
          <InfoRow label="Bit Depth" value={`${track.bitDepth}-bit`} />
          <InfoRow label="Format" value={track.format.replace("_", " ")} />
          <InfoRow label="Quality Tier" value={getQualityLabel(track.quality)} valueColor={qualityColor} />
          {track.bpm && <InfoRow label="BPM" value={`${track.bpm} BPM`} />}
          {track.key && <InfoRow label="Key" value={track.key} />}
          {track.genre && <InfoRow label="Genre" value={track.genre} />}
        </View>

        {/* Mastering */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mastering</Text>
          <InfoRow
            label="Status"
            value={masterStatus.label}
            valueColor={masterStatus.color}
          />
          {track.masteringPreset && (
            <InfoRow label="Preset" value={track.masteringPreset} />
          )}
          {track.lufsAchieved !== null && (
            <InfoRow label="Integrated LUFS" value={`${track.lufsAchieved} LUFS`} />
          )}
          {track.lufsTarget !== null && (
            <InfoRow label="LUFS Target" value={`${track.lufsTarget} LUFS`} />
          )}
          {track.truePeak !== null && (
            <InfoRow label="True Peak" value={`${track.truePeak} dBTP`} />
          )}

          {track.masteringStatus === "unmastered" && (
            <Pressable
              style={({ pressed }) => [styles.masterBtn, pressed && { opacity: 0.85 }]}
              onPress={() => (router as any).push({ pathname: "/mastering/[id]", params: { id: track.id } })}
            >
              <IconSymbol name="bolt.fill" size={18} color="#F5F5F5" />
              <Text style={styles.masterBtnText}>Master This Track</Text>
            </Pressable>
          )}
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <InfoRow label="Uploaded" value={new Date(track.uploadedAt).toLocaleDateString()} />
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
            onPress={() => Alert.alert("Share", "Share link copied to clipboard.")}
          >
            <IconSymbol name="square.and.arrow.up" size={18} color="#9CA3AF" />
            <Text style={styles.actionBtnText}>Share</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
            onPress={() => (router as any).push({ pathname: "/mastering/[id]", params: { id: track.id } })}
          >
            <IconSymbol name="slider.horizontal.3" size={18} color="#9CA3AF" />
            <Text style={styles.actionBtnText}>Mastering</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, pressed && { opacity: 0.8 }]}
            onPress={handleDelete}
          >
            <IconSymbol name="trash.fill" size={18} color="#C41E3A" />
            <Text style={[styles.actionBtnText, { color: "#C41E3A" }]}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A24",
  },
  label: { color: "#9CA3AF", fontSize: 13 },
  value: { color: "#F5F5F5", fontSize: 13, fontWeight: "600" },
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#F5F5F5", fontSize: 17, fontWeight: "700" },
  deleteBtn: { padding: 4 },

  artworkSection: { alignItems: "center", marginBottom: 20, gap: 12 },
  artwork: {
    width: 140,
    height: 140,
    borderRadius: 20,
    backgroundColor: "#111118",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  qualityBadgeRow: { flexDirection: "row", gap: 8 },
  qualityBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    backgroundColor: "#111118",
  },
  qualityBadgeText: { fontSize: 12, fontWeight: "700" },
  formatBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    backgroundColor: "#111118",
  },
  formatBadgeText: { fontSize: 12, fontWeight: "700" },

  titleSection: { alignItems: "center", marginBottom: 20, gap: 4 },
  trackTitle: { color: "#F5F5F5", fontSize: 22, fontWeight: "800", textAlign: "center" },
  trackArtist: { color: "#9CA3AF", fontSize: 15 },
  trackAlbum: { color: "#6B7280", fontSize: 13 },

  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#C41E3A",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  playBtnActive: { backgroundColor: "#8B0000" },
  playBtnText: { color: "#F5F5F5", fontSize: 16, fontWeight: "700" },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#111118",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#F5F5F5", fontSize: 16, fontWeight: "800" },
  statLabel: { color: "#6B7280", fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#2A2A35" },

  section: {
    backgroundColor: "#111118",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  sectionTitle: { color: "#F5F5F5", fontSize: 14, fontWeight: "700", marginBottom: 8 },

  masterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C41E3A",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  masterBtnText: { color: "#F5F5F5", fontSize: 14, fontWeight: "700" },

  actionsSection: { flexDirection: "row", gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#111118",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  actionBtnDanger: { borderColor: "#C41E3A22" },
  actionBtnText: { color: "#9CA3AF", fontSize: 13, fontWeight: "600" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { color: "#F5F5F5", fontSize: 16 },
  backLink: { color: "#C41E3A", fontSize: 14 },
});
