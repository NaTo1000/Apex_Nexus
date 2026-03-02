import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonText } from "@/components/ui/neon-text";
import { TrackCard } from "@/components/track-card";
import { MiniPlayer } from "@/components/mini-player";
import { AIAssistantButton, AIModeHeaderBadge } from "@/components/ai-assistant";
import { useLibrary } from "@/lib/store/library-context";
import { usePlayer } from "@/lib/store/player-context";
import { useAssistant } from "@/lib/store/assistant-context";

// ─── Quick Actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: "arrow.up.circle.fill" as const, label: "Upload",      color: "#C41E3A", bg: "#C41E3A18", route: "/(tabs)/upload" },
  { icon: "headphones" as const,           label: "Jamy Room",   color: "#FFD700", bg: "#FFD70018", route: "/(tabs)/jamy" },
  { icon: "slider.horizontal.3" as const,  label: "AI Master",   color: "#FF4D6D", bg: "#FF4D6D18", route: "/(tabs)/library" },
  { icon: "person.2.fill" as const,        label: "Collab",      color: "#34D399", bg: "#34D39918", route: "/collab" },
  { icon: "music.note.list" as const,      label: "Lyricist",    color: "#A78BFA", bg: "#A78BFA18", route: "/lyricist" },
  { icon: "video.fill" as const,           label: "Video Clip",  color: "#60A5FA", bg: "#60A5FA18", route: "/video-generator" },
  { icon: "mic.fill" as const,             label: "Studio",      color: "#F97316", bg: "#F9731618", route: "/recording-studio" },
  { icon: "globe" as const,                label: "Distribute",  color: "#22D3EE", bg: "#22D3EE18", route: "/distribution" },
];

const ACTIVITY_FEED = [
  { id: "1", icon: "checkmark.circle.fill" as const, color: "#C41E3A", text: "AI mastering complete — \"Neon Pressure\" at −14.1 LUFS", time: "2m ago" },
  { id: "2", icon: "headphones" as const,            color: "#FFD700", text: "Jamy Room invite from GuitarKing_AU", time: "18m ago" },
  { id: "3", icon: "star.fill" as const,             color: "#FF4D6D", text: "\"Deep Frequency\" hit 189 plays", time: "1h ago" },
  { id: "4", icon: "wand.and.stars" as const,        color: "#A78BFA", text: "AI Lyricist generated 3 new song concepts", time: "2h ago" },
  { id: "5", icon: "globe" as const,                 color: "#22D3EE", text: "\"Raw Signal\" is live on Spotify & Apple Music", time: "3h ago" },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <NeonText color={color} size={22} weight="900">{String(value)}</NeonText>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickActionButton({ item, onPress }: { item: typeof QUICK_ACTIONS[0]; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.qaBtn, pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] }]}
      onPress={onPress}
    >
      <GlassCard style={styles.qaCard} glowColor={item.color} elevation={3}>
        <View style={[styles.qaIconWrap, { backgroundColor: item.bg }]}>
          <IconSymbol name={item.icon} size={26} color={item.color} />
        </View>
        <Text style={styles.qaLabel}>{item.label}</Text>
      </GlassCard>
    </Pressable>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { tracks } = useLibrary();
  const { currentTrack } = usePlayer();
  const { setCurrentScreen } = useAssistant();

  React.useEffect(() => { setCurrentScreen("home"); }, [setCurrentScreen]);

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
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Image
                source={{ uri: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031066747/XeAMyfRc4h26zCyFrpMbAT/dropai-icon-P2Yo7dETtHLi7A8cVTAhUq.png" }}
                style={styles.logoImg}
              />
            </View>
            <View>
              <NeonText color="#C41E3A" size={26} weight="900" intensity="high">
                DROP<Text style={{ color: "#FFD700" }}>Ai</Text>
              </NeonText>
              <Text style={styles.tagline}>Studio quality. Every drop.</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <AIModeHeaderBadge />
            <Pressable
              style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.7 }]}
              onPress={() => (router as any).push("/settings")}
            >
              <IconSymbol name="gear" size={22} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        {/* ── Stats Strip ── */}
        <GlassCard style={styles.statsCard} glowColor="#C41E3A" elevation={2}>
          <StatItem value={stats.total} label="Tracks" color="#C41E3A" />
          <View style={styles.statDivider} />
          <StatItem value={stats.plays} label="Plays" color="#FFD700" />
          <View style={styles.statDivider} />
          <StatItem value={stats.mastered} label="Mastered" color="#FF4D6D" />
          <View style={styles.statDivider} />
          <StatItem value={stats.studio} label="Studio HD" color="#34D399" />
        </GlassCard>

        {/* ── Membership Banner ── */}
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          onPress={() => (router as any).push("/payments")}
        >
          <GlassCard style={styles.memberBanner} glowColor="#FFD700" elevation={3}>
            <View style={styles.memberLeft}>
              <View style={styles.memberIconWrap}>
                <IconSymbol name="star.fill" size={18} color="#FFD700" />
              </View>
              <View>
                <NeonText color="#FFD700" size={13} weight="800">DROPAi Pro Membership</NeonText>
                <Text style={styles.memberSub}>$20/week · Full Jamy, Collab, DJ Booth & Studio</Text>
              </View>
            </View>
            <View style={styles.memberCta}>
              <Text style={styles.memberCtaText}>Join</Text>
            </View>
          </GlassCard>
        </Pressable>

        {/* ── Quick Actions ── */}
        <View style={styles.sectionHeader}>
          <NeonText color="#F5F5F5" size={16} weight="800">Quick Actions</NeonText>
        </View>
        <View style={styles.qaGrid}>
          {QUICK_ACTIONS.map((item) => (
            <QuickActionButton
              key={item.label}
              item={item}
              onPress={() => (router as any).push(item.route)}
            />
          ))}
        </View>

        {/* ── Recent Drops ── */}
        {recentTracks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <NeonText color="#F5F5F5" size={16} weight="800">Recent Drops</NeonText>
              <Pressable onPress={() => router.push("/(tabs)/library")}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.trackList}>
              {recentTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onPress={() => (router as any).push(`/track/${track.id}`)}
                />
              ))}
            </View>
          </>
        )}

        {recentTracks.length === 0 && (
          <GlassCard style={styles.emptyCard} glowColor="#C41E3A" elevation={2}>
            <IconSymbol name="arrow.up.circle.fill" size={40} color="#C41E3A" />
            <NeonText color="#C41E3A" size={18} weight="800" style={{ marginTop: 12 }}>Drop your first track</NeonText>
            <Text style={styles.emptyText}>Upload a WAV, MP3, or Studio HD file to get started</Text>
            <Pressable
              style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push("/(tabs)/upload")}
            >
              <Text style={styles.emptyBtnText}>Upload Now</Text>
            </Pressable>
          </GlassCard>
        )}

        {/* ── Activity Feed ── */}
        <View style={styles.sectionHeader}>
          <NeonText color="#F5F5F5" size={16} weight="800">Activity</NeonText>
        </View>
        <GlassCard style={styles.activityCard} glowColor="#2A2A35" elevation={1} noBorder>
          {ACTIVITY_FEED.map((item, idx) => (
            <View key={item.id} style={[styles.activityItem, idx < ACTIVITY_FEED.length - 1 && styles.activityBorder]}>
              <View style={[styles.activityIcon, { backgroundColor: item.color + "22" }]}>
                <IconSymbol name={item.icon} size={16} color={item.color} />
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityMsg}>{item.text}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </GlassCard>
      </ScrollView>

      {/* ── Persistent AI Assistant Button ── */}
      <AIAssistantButton />

      {/* ── Mini Player ── */}
      {currentTrack && <MiniPlayer />}
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoMark: {
    width: 44, height: 44, borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5, borderColor: "#C41E3A55",
    shadowColor: "#C41E3A", shadowRadius: 8, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 0 },
  },
  logoImg: { width: 44, height: 44 },
  tagline: { color: "#4B5563", fontSize: 11, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingsBtn: { padding: 6 },
  // Stats
  statsCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 16, paddingHorizontal: 8 },
  statItem: { alignItems: "center", gap: 4 },
  statLabel: { color: "#6B7280", fontSize: 11, fontWeight: "600" },
  statDivider: { width: 1, height: 32, backgroundColor: "#2A2A35" },
  // Membership
  memberBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  memberLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  memberIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFD70022", alignItems: "center", justifyContent: "center" },
  memberSub: { color: "#9CA3AF", fontSize: 11, marginTop: 2 },
  memberCta: { backgroundColor: "#FFD700", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  memberCtaText: { color: "#0A0A0F", fontSize: 12, fontWeight: "900" },
  // Section headers
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  seeAll: { color: "#C41E3A", fontSize: 13, fontWeight: "700" },
  // Quick actions
  qaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  qaBtn: { width: "22.5%" },
  qaCard: { alignItems: "center", paddingVertical: 14, paddingHorizontal: 4, gap: 8 },
  qaIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  qaLabel: { color: "#D1D5DB", fontSize: 10, fontWeight: "700", textAlign: "center" },
  // Track list
  trackList: { gap: 8 },
  // Empty state
  emptyCard: { alignItems: "center", padding: 32, gap: 4 },
  emptyText: { color: "#6B7280", fontSize: 13, textAlign: "center", marginTop: 4, lineHeight: 20 },
  emptyBtn: { marginTop: 16, backgroundColor: "#C41E3A", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  // Activity
  activityCard: { padding: 0, overflow: "hidden" },
  activityItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: "#1A1A25" },
  activityIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activityText: { flex: 1 },
  activityMsg: { color: "#D1D5DB", fontSize: 13, lineHeight: 18 },
  activityTime: { color: "#4B5563", fontSize: 11, marginTop: 3 },
});
