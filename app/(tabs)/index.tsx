import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TrackCard } from "@/components/track-card";
import { MiniPlayer } from "@/components/mini-player";
import { useLibrary } from "@/lib/store/library-context";
import { usePlayer } from "@/lib/store/player-context";

const QUICK_ACTIONS = [
  { icon: "arrow.up.circle.fill" as const, label: "Upload", color: "#C41E3A", bg: "#C41E3A22", route: "/(tabs)/upload" },
  { icon: "headphones" as const,           label: "Jamy Room", color: "#FFD700", bg: "#FFD70022", route: "/(tabs)/jamy" },
  { icon: "slider.horizontal.3" as const,  label: "AI Master", color: "#FF4D6D", bg: "#FF4D6D22", route: "/(tabs)/library" },
  { icon: "person.2.fill" as const,        label: "Collab",    color: "#34D399", bg: "#34D39922", route: "/(tabs)/collab" },
];

const ACTIVITY_FEED = [
  { id: "1", icon: "checkmark.circle.fill" as const, color: "#C41E3A", text: "AI mastering complete — \"Neon Pressure\" at −14.1 LUFS", time: "2m ago" },
  { id: "2", icon: "headphones" as const, color: "#FFD700", text: "Jamy Room invite from GuitarKing_AU", time: "18m ago" },
  { id: "3", icon: "star.fill" as const, color: "#FF4D6D", text: "\"Deep Frequency\" hit 189 plays", time: "1h ago" },
  { id: "4", icon: "bolt.fill" as const, color: "#34D399", text: "\"Raw Signal\" is ready to master — tap to drop it", time: "3h ago" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { tracks, loading } = useLibrary();
  const { currentTrack } = usePlayer();

  const recentTracks = useMemo(() => tracks.slice(0, 5), [tracks]);

  const stats = useMemo(() => ({
    total: tracks.length,
    plays: tracks.reduce((sum, t) => sum + t.plays, 0),
    mastered: tracks.filter((t) => t.masteringStatus !== "unmastered").length,
    studio: tracks.filter((t) => t.quality === "studio").length,
  }), [tracks]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, currentTrack && { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Image
                source={{ uri: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031066747/XeAMyfRc4h26zCyFrpMbAT/dropai-icon-P2Yo7dETtHLi7A8cVTAhUq.png" }}
                style={styles.logoImg}
              />
            </View>
            <View>
              <Text style={styles.appName}>
                DROP<Text style={styles.appNameAi}>Ai</Text>
              </Text>
              <Text style={styles.tagline}>Studio quality. Every drop.</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.7 }]}
            onPress={() => (router as any).push("/settings")}
          >
            <IconSymbol name="gear" size={22} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsStrip}>
          <StatItem value={stats.total} label="Tracks" color="#C41E3A" />
          <View style={styles.statDivider} />
          <StatItem value={stats.plays} label="Plays" color="#FFD700" />
          <View style={styles.statDivider} />
          <StatItem value={stats.mastered} label="Mastered" color="#34D399" />
          <View style={styles.statDivider} />
          <StatItem value={stats.studio} label="Studio HD" color="#FF4D6D" />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.75 }]}
              onPress={() => (router as any).push(action.route)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <IconSymbol name={action.icon} size={26} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Drops */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Drops</Text>
          <Pressable onPress={() => (router as any).push("/(tabs)/library")}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <Text style={styles.mutedText}>Loading library...</Text>
          </View>
        ) : recentTracks.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="music.note.list" size={44} color="#2A2A35" />
            <Text style={styles.emptyTitle}>No tracks yet</Text>
            <Text style={styles.mutedText}>Upload your first drop to get started</Text>
          </View>
        ) : (
          recentTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onPress={() => (router as any).push({ pathname: "/track/[id]", params: { id: track.id } })}
              onMaster={() => (router as any).push({ pathname: "/mastering/[id]", params: { id: track.id } })}
            />
          ))
        )}

        {/* Activity Feed */}
        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Activity</Text>
        {ACTIVITY_FEED.map((item) => (
          <View key={item.id} style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: item.color + "22" }]}>
              <IconSymbol name={item.icon} size={16} color={item.color} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText}>{item.text}</Text>
              <Text style={styles.activityTime}>{item.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <MiniPlayer />
    </ScreenContainer>
  );
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 24 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  logoImg: { width: 44, height: 44 },
  appName: {
    color: "#F5F5F5",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  appNameAi: { color: "#FFD700" },
  tagline: { color: "#6B7280", fontSize: 11, marginTop: 1 },
  settingsBtn: { padding: 8 },

  statsStrip: {
    flexDirection: "row",
    backgroundColor: "#111118",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { color: "#6B7280", fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#2A2A35", marginHorizontal: 4 },

  sectionTitle: { color: "#F5F5F5", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAll: { color: "#C41E3A", fontSize: 13, fontWeight: "600" },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionBtn: { alignItems: "center", gap: 8, flex: 1 },
  actionIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { color: "#9CA3AF", fontSize: 11, fontWeight: "600" },

  center: { alignItems: "center", padding: 20 },
  emptyState: { alignItems: "center", padding: 32, gap: 10 },
  emptyTitle: { color: "#F5F5F5", fontSize: 16, fontWeight: "600" },
  mutedText: { color: "#6B7280", fontSize: 13, textAlign: "center" },

  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
    backgroundColor: "#111118",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activityInfo: { flex: 1 },
  activityText: { color: "#F5F5F5", fontSize: 13, lineHeight: 18 },
  activityTime: { color: "#6B7280", fontSize: 11, marginTop: 2 },
});
