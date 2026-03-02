import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLibrary } from "@/lib/store/library-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Platform Data ────────────────────────────────────────────────────────────

interface Platform {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  icon: string;         // emoji icon
  description: string;
  monthlyListeners: string;
  royaltyRate: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "spotify",
    name: "Spotify",
    color: "#1DB954",
    bgColor: "#1DB95422",
    icon: "🎵",
    description: "World's largest music streaming platform",
    monthlyListeners: "600M+ users",
    royaltyRate: "$0.003–0.005 per stream",
  },
  {
    id: "youtube",
    name: "YouTube Music",
    color: "#FF0000",
    bgColor: "#FF000022",
    icon: "▶️",
    description: "YouTube's dedicated music streaming service",
    monthlyListeners: "80M+ subscribers",
    royaltyRate: "$0.002–0.004 per stream",
  },
  {
    id: "apple",
    name: "Apple Music",
    color: "#FC3C44",
    bgColor: "#FC3C4422",
    icon: "🍎",
    description: "Apple's premium music streaming platform",
    monthlyListeners: "100M+ subscribers",
    royaltyRate: "$0.007–0.010 per stream",
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    color: "#FF5500",
    bgColor: "#FF550022",
    icon: "☁️",
    description: "Independent artist & DJ platform",
    monthlyListeners: "175M+ users",
    royaltyRate: "$0.0025–0.004 per stream",
  },
  {
    id: "beatport",
    name: "Beatport",
    color: "#00C8FF",
    bgColor: "#00C8FF22",
    icon: "🎧",
    description: "Premier platform for electronic & DJ music",
    monthlyListeners: "10M+ DJs & producers",
    royaltyRate: "70% of sale price",
  },
  {
    id: "facebook",
    name: "Facebook / Meta",
    color: "#1877F2",
    bgColor: "#1877F222",
    icon: "📘",
    description: "Music licensing across Facebook & Instagram",
    monthlyListeners: "3B+ users",
    royaltyRate: "Content ID licensing",
  },
];

// ─── Pricing Tiers ────────────────────────────────────────────────────────────

interface DistributionTier {
  id: string;
  name: string;
  price: number;
  description: string;
  tracks: string;
  royalty: string;
  features: string[];
  color: string;
  popular?: boolean;
}

const DISTRIBUTION_TIERS: DistributionTier[] = [
  {
    id: "single",
    name: "Single Drop",
    price: 12,
    description: "One-time fee — yours forever",
    tracks: "1 track",
    royalty: "DROPAi keeps 10%",
    features: [
      "1 single track",
      "All 6 platforms",
      "One-time fee — no annual renewals",
      "10% royalty to DROPAi",
      "ISRC code included",
      "Distribution within 24–48 hrs",
    ],
    color: "#C41E3A",
  },
  {
    id: "album",
    name: "Album Drop",
    price: 45,
    description: "Up to 10 tracks — one-time fee",
    tracks: "Up to 10 tracks",
    royalty: "DROPAi keeps 10%",
    features: [
      "Up to 10 tracks",
      "All 6 platforms",
      "One-time fee — no annual renewals",
      "10% royalty to DROPAi",
      "UPC + ISRC codes included",
      "Album artwork upload",
      "Distribution within 48–72 hrs",
    ],
    color: "#FFD700",
    popular: true,
  },
  {
    id: "double_album",
    name: "Double Album",
    price: 70,
    description: "Up to 20 tracks — one-time fee",
    tracks: "Up to 20 tracks",
    royalty: "DROPAi keeps 10%",
    features: [
      "Up to 20 tracks (2 discs)",
      "All 6 platforms",
      "One-time fee — no annual renewals",
      "10% royalty to DROPAi",
      "UPC + ISRC codes included",
      "Album artwork upload",
      "Priority distribution within 24 hrs",
      "Dedicated support",
    ],
    color: "#A78BFA",
  },
];

// ─── Distribution Status ──────────────────────────────────────────────────────

interface DistributionRecord {
  id: string;
  tierId: string;
  trackIds: string[];
  platforms: string[];
  status: "pending_payment" | "submitted" | "processing" | "live" | "rejected";
  submittedAt: string;
  liveAt?: string;
  earnings: Record<string, number>; // platformId -> cents
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Pending Payment", color: "#6B7280" },
  submitted:       { label: "Submitted",        color: "#FFD700" },
  processing:      { label: "Processing",        color: "#FF4D6D" },
  live:            { label: "Live ✓",            color: "#34D399" },
  rejected:        { label: "Rejected",          color: "#C41E3A" },
};

const STORAGE_KEY = "@dropai_distributions_v1";

async function loadDistributions(): Promise<DistributionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveDistribution(record: DistributionRecord): Promise<void> {
  try {
    const existing = await loadDistributions();
    const updated = [record, ...existing.filter((r) => r.id !== record.id)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DistributionScreen() {
  const router = useRouter();
  const { tracks } = useLibrary();
  const [activeTab, setActiveTab] = useState<"distribute" | "platforms" | "earnings">("distribute");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(PLATFORMS.map((p) => p.id))
  );
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    loadDistributions().then(setDistributions);
  }, []);

  const togglePlatform = useCallback((id: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleTrack = useCallback((id: string) => {
    setSelectedTracks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const tier = DISTRIBUTION_TIERS.find((t) => t.id === selectedTier);

  const handleDistribute = useCallback(async () => {
    if (!selectedTier) {
      Alert.alert("Select a Plan", "Please choose a distribution plan first.");
      return;
    }
    if (selectedTracks.size === 0) {
      Alert.alert("Select Tracks", "Please select at least one track to distribute.");
      return;
    }
    if (selectedPlatforms.size === 0) {
      Alert.alert("Select Platforms", "Please select at least one platform.");
      return;
    }

    const maxTracks = selectedTier === "single" ? 1 : selectedTier === "album" ? 10 : 20;
    if (selectedTracks.size > maxTracks) {
      Alert.alert(
        "Too Many Tracks",
        `The ${tier?.name} plan supports up to ${maxTracks} track${maxTracks > 1 ? "s" : ""}. Please deselect some tracks.`
      );
      return;
    }

    Alert.alert(
      "Confirm Distribution",
      `Distribute ${selectedTracks.size} track${selectedTracks.size > 1 ? "s" : ""} to ${selectedPlatforms.size} platform${selectedPlatforms.size > 1 ? "s" : ""} for $${tier?.price}?\n\nDROPAi retains 10% of royalties. This is a one-time fee — your music stays up forever.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Pay $${tier?.price}`,
          onPress: async () => {
            setLoading(true);
            // Route to payment screen
            (router as any).push({
              pathname: "/payments",
              params: {
                tierId: selectedTier,
                price: tier?.price,
                trackCount: selectedTracks.size,
                platformCount: selectedPlatforms.size,
                context: "distribution",
              },
            });
            setLoading(false);
          },
        },
      ]
    );
  }, [selectedTier, selectedTracks, selectedPlatforms, tier, router]);

  const totalEarnings = distributions.reduce((sum, d) => {
    return sum + Object.values(d.earnings).reduce((s, v) => s + v, 0);
  }, 0);

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
          <View>
            <Text style={styles.headerTitle}>Distribution Hub</Text>
            <Text style={styles.headerSub}>One-time fee · Yours forever</Text>
          </View>
          <View style={styles.earningsBadge}>
            <Text style={styles.earningsValue}>${(totalEarnings / 100).toFixed(2)}</Text>
            <Text style={styles.earningsLabel}>Earned</Text>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {(["distribute", "platforms", "earnings"] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── DISTRIBUTE TAB ── */}
        {activeTab === "distribute" && (
          <>
            {/* Pricing Tiers */}
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            {DISTRIBUTION_TIERS.map((t) => (
              <Pressable
                key={t.id}
                style={({ pressed }) => [
                  styles.tierCard,
                  selectedTier === t.id && { borderColor: t.color },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setSelectedTier(t.id)}
              >
                {t.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: t.color }]}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                <View style={styles.tierHeader}>
                  <View>
                    <Text style={styles.tierName}>{t.name}</Text>
                    <Text style={styles.tierDesc}>{t.description}</Text>
                  </View>
                  <View style={styles.tierPriceBlock}>
                    <Text style={[styles.tierPrice, { color: t.color }]}>${t.price}</Text>
                    <Text style={styles.tierPriceSub}>one-time</Text>
                  </View>
                </View>
                <View style={styles.tierMeta}>
                  <View style={[styles.tierBadge, { borderColor: t.color }]}>
                    <Text style={[styles.tierBadgeText, { color: t.color }]}>{t.tracks}</Text>
                  </View>
                  <View style={[styles.tierBadge, { borderColor: "#6B7280" }]}>
                    <Text style={[styles.tierBadgeText, { color: "#9CA3AF" }]}>{t.royalty}</Text>
                  </View>
                </View>
                <View style={styles.tierFeatures}>
                  {t.features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Text style={[styles.featureCheck, { color: t.color }]}>✓</Text>
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
                {selectedTier === t.id && (
                  <View style={[styles.selectedIndicator, { backgroundColor: t.color }]}>
                    <Text style={styles.selectedText}>Selected</Text>
                  </View>
                )}
              </Pressable>
            ))}

            {/* Platform Selection */}
            <Text style={styles.sectionTitle}>Select Platforms</Text>
            <View style={styles.platformGrid}>
              {PLATFORMS.map((p) => (
                <Pressable
                  key={p.id}
                  style={({ pressed }) => [
                    styles.platformChip,
                    selectedPlatforms.has(p.id) && { borderColor: p.color, backgroundColor: p.bgColor },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => togglePlatform(p.id)}
                >
                  <Text style={styles.platformIcon}>{p.icon}</Text>
                  <Text style={[styles.platformChipName, selectedPlatforms.has(p.id) && { color: p.color }]}>
                    {p.name}
                  </Text>
                  {selectedPlatforms.has(p.id) && (
                    <Text style={[styles.platformCheck, { color: p.color }]}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Track Selection */}
            <Text style={styles.sectionTitle}>Select Tracks to Distribute</Text>
            {tracks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No tracks in library. Upload tracks first.</Text>
              </View>
            ) : (
              tracks.map((track) => (
                <Pressable
                  key={track.id}
                  style={({ pressed }) => [
                    styles.trackRow,
                    selectedTracks.has(track.id) && styles.trackRowSelected,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => toggleTrack(track.id)}
                >
                  <View style={[styles.trackCheckbox, selectedTracks.has(track.id) && styles.trackCheckboxChecked]}>
                    {selectedTracks.has(track.id) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.trackMeta}>{track.artist} · {track.format.replace("_", " ")}</Text>
                  </View>
                  <View style={[styles.masteringDot, {
                    backgroundColor: track.masteringStatus === "unmastered" ? "#6B7280" : "#34D399"
                  }]} />
                </Pressable>
              ))
            )}

            {/* Royalty Info */}
            <View style={styles.royaltyInfo}>
              <IconSymbol name="info.circle" size={16} color="#FFD700" />
              <Text style={styles.royaltyText}>
                DROPAi retains 10% of all royalties earned. You keep 90%. This is a one-time distribution fee — your music remains on all platforms indefinitely with no annual renewal fees.
              </Text>
            </View>

            {/* Distribute Button */}
            <Pressable
              style={({ pressed }) => [
                styles.distributeBtn,
                (!selectedTier || selectedTracks.size === 0) && styles.distributeBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleDistribute}
              disabled={loading || !selectedTier || selectedTracks.size === 0}
            >
              <IconSymbol name="arrow.right.square" size={20} color="#F5F5F5" />
              <Text style={styles.distributeBtnText}>
                {selectedTier && tier
                  ? `Distribute for $${tier.price}`
                  : "Select a Plan to Continue"}
              </Text>
            </Pressable>
          </>
        )}

        {/* ── PLATFORMS TAB ── */}
        {activeTab === "platforms" && (
          <>
            <Text style={styles.sectionTitle}>Supported Platforms</Text>
            {PLATFORMS.map((p) => (
              <View key={p.id} style={styles.platformCard}>
                <View style={[styles.platformIconLarge, { backgroundColor: p.bgColor }]}>
                  <Text style={styles.platformIconEmoji}>{p.icon}</Text>
                </View>
                <View style={styles.platformDetails}>
                  <Text style={[styles.platformName, { color: p.color }]}>{p.name}</Text>
                  <Text style={styles.platformDesc}>{p.description}</Text>
                  <View style={styles.platformStats}>
                    <View style={styles.platformStat}>
                      <Text style={styles.platformStatLabel}>Audience</Text>
                      <Text style={styles.platformStatValue}>{p.monthlyListeners}</Text>
                    </View>
                    <View style={styles.platformStat}>
                      <Text style={styles.platformStatLabel}>Royalty Rate</Text>
                      <Text style={[styles.platformStatValue, { color: p.color }]}>{p.royaltyRate}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── EARNINGS TAB ── */}
        {activeTab === "earnings" && (
          <>
            <View style={styles.earningsHeader}>
              <Text style={styles.earningsTotalLabel}>Total Royalties Earned</Text>
              <Text style={styles.earningsTotalValue}>${(totalEarnings / 100).toFixed(2)}</Text>
              <Text style={styles.earningsTotalSub}>After DROPAi 10% fee</Text>
            </View>

            {distributions.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="music.note.list" size={44} color="#2A2A35" />
                <Text style={styles.emptyTitle}>No distributions yet</Text>
                <Text style={styles.emptyText}>Distribute your first track to start earning royalties.</Text>
              </View>
            ) : (
              distributions.map((d) => {
                const statusInfo = STATUS_LABELS[d.status];
                const tierInfo = DISTRIBUTION_TIERS.find((t) => t.id === d.tierId);
                const dEarnings = Object.values(d.earnings).reduce((s, v) => s + v, 0);
                return (
                  <View key={d.id} style={styles.distributionCard}>
                    <View style={styles.distributionHeader}>
                      <Text style={styles.distributionTier}>{tierInfo?.name ?? d.tierId}</Text>
                      <View style={[styles.statusBadge, { borderColor: statusInfo.color }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.distributionMeta}>
                      {d.trackIds.length} track{d.trackIds.length > 1 ? "s" : ""} · {d.platforms.length} platform{d.platforms.length > 1 ? "s" : ""}
                    </Text>
                    <Text style={styles.distributionDate}>
                      Submitted {new Date(d.submittedAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.distributionEarnings}>
                      ${(dEarnings / 100).toFixed(2)} earned
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#F5F5F5", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "#6B7280", fontSize: 11, marginTop: 1 },
  earningsBadge: { alignItems: "center" },
  earningsValue: { color: "#34D399", fontSize: 18, fontWeight: "800" },
  earningsLabel: { color: "#6B7280", fontSize: 10 },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#111118",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#C41E3A" },
  tabText: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  activeTabText: { color: "#F5F5F5" },

  sectionTitle: { color: "#F5F5F5", fontSize: 15, fontWeight: "700", marginBottom: 12, marginTop: 4 },

  tierCard: {
    backgroundColor: "#111118",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#2A2A35",
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  popularText: { color: "#0A0A0F", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  tierHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  tierName: { color: "#F5F5F5", fontSize: 17, fontWeight: "800" },
  tierDesc: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  tierPriceBlock: { alignItems: "flex-end" },
  tierPrice: { fontSize: 28, fontWeight: "900" },
  tierPriceSub: { color: "#6B7280", fontSize: 10 },
  tierMeta: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tierBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tierBadgeText: { fontSize: 11, fontWeight: "600" },
  tierFeatures: { gap: 5 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureCheck: { fontSize: 13, fontWeight: "700", width: 16 },
  featureText: { color: "#9CA3AF", fontSize: 12, flex: 1 },
  selectedIndicator: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  selectedText: { color: "#0A0A0F", fontSize: 13, fontWeight: "800" },

  platformGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  platformChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#2A2A35",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#111118",
  },
  platformIcon: { fontSize: 16 },
  platformChipName: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" },
  platformCheck: { fontSize: 12, fontWeight: "800" },

  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#111118",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  trackRowSelected: { borderColor: "#C41E3A", backgroundColor: "#1A0A0E" },
  trackCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#2A2A35",
    alignItems: "center",
    justifyContent: "center",
  },
  trackCheckboxChecked: { backgroundColor: "#C41E3A", borderColor: "#C41E3A" },
  checkmark: { color: "#F5F5F5", fontSize: 12, fontWeight: "800" },
  trackInfo: { flex: 1 },
  trackTitle: { color: "#F5F5F5", fontSize: 13, fontWeight: "600" },
  trackMeta: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  masteringDot: { width: 8, height: 8, borderRadius: 4 },

  royaltyInfo: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFD70011",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFD70033",
    alignItems: "flex-start",
  },
  royaltyText: { color: "#9CA3AF", fontSize: 12, lineHeight: 18, flex: 1 },

  distributeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#C41E3A",
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 8,
  },
  distributeBtnDisabled: { backgroundColor: "#2A2A35" },
  distributeBtnText: { color: "#F5F5F5", fontSize: 16, fontWeight: "800" },

  platformCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#111118",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  platformIconLarge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  platformIconEmoji: { fontSize: 26 },
  platformDetails: { flex: 1 },
  platformName: { fontSize: 16, fontWeight: "800", marginBottom: 3 },
  platformDesc: { color: "#9CA3AF", fontSize: 12, marginBottom: 8 },
  platformStats: { flexDirection: "row", gap: 16 },
  platformStat: {},
  platformStatLabel: { color: "#6B7280", fontSize: 10 },
  platformStatValue: { color: "#F5F5F5", fontSize: 12, fontWeight: "600" },

  earningsHeader: {
    alignItems: "center",
    backgroundColor: "#111118",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  earningsTotalLabel: { color: "#9CA3AF", fontSize: 13 },
  earningsTotalValue: { color: "#34D399", fontSize: 40, fontWeight: "900", marginVertical: 4 },
  earningsTotalSub: { color: "#6B7280", fontSize: 11 },

  distributionCard: {
    backgroundColor: "#111118",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  distributionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  distributionTier: { color: "#F5F5F5", fontSize: 14, fontWeight: "700" },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  distributionMeta: { color: "#9CA3AF", fontSize: 12 },
  distributionDate: { color: "#6B7280", fontSize: 11, marginTop: 3 },
  distributionEarnings: { color: "#34D399", fontSize: 13, fontWeight: "700", marginTop: 6 },

  emptyState: { alignItems: "center", padding: 32, gap: 10 },
  emptyTitle: { color: "#F5F5F5", fontSize: 16, fontWeight: "600" },
  emptyText: { color: "#6B7280", fontSize: 13, textAlign: "center" },
});
