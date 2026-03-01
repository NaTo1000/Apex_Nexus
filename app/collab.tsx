import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface Artist {
  id: string;
  name: string;
  role: string;
  instruments: string[];
  genres: string[];
  location: string;
  openToCollab: boolean;
  jamSessions: number;
  tracks: number;
  color: string;
}

const DEMO_ARTISTS: Artist[] = [
  { id: "a1", name: "GuitarKing_AU",  role: "Artist",           instruments: ["Guitar", "Bass"],     genres: ["Rock", "Metal"],       location: "Sydney, AU",    openToCollab: true,  jamSessions: 24, tracks: 18, color: "#C41E3A" },
  { id: "a2", name: "BeatDroppr",     role: "Producer",         instruments: ["Keys", "Drums"],      genres: ["Electronic", "Hip-Hop"], location: "Melbourne, AU", openToCollab: true,  jamSessions: 41, tracks: 63, color: "#FFD700" },
  { id: "a3", name: "JazzCat_Sydney", role: "Session Musician", instruments: ["Saxophone", "Piano"], genres: ["Jazz", "R&B"],          location: "Sydney, AU",    openToCollab: true,  jamSessions: 12, tracks: 9,  color: "#60A5FA" },
  { id: "a4", name: "TechnoViking",   role: "DJ",               instruments: ["DJ/Producer"],        genres: ["Techno", "House"],      location: "Berlin, DE",    openToCollab: false, jamSessions: 88, tracks: 120, color: "#A78BFA" },
  { id: "a5", name: "VocalDrop",      role: "Artist",           instruments: ["Vocals"],             genres: ["Pop", "R&B"],           location: "Brisbane, AU",  openToCollab: true,  jamSessions: 7,  tracks: 14, color: "#FF4D6D" },
  { id: "a6", name: "DrummerX",       role: "Session Musician", instruments: ["Drums"],              genres: ["Rock", "Electronic"],   location: "Perth, AU",     openToCollab: true,  jamSessions: 33, tracks: 5,  color: "#34D399" },
];

const ROLE_FILTERS = ["All", "Artist", "Producer", "DJ", "Session Musician"];
const GENRE_FILTERS = ["All", "Electronic", "Hip-Hop", "Rock", "Jazz", "Techno", "Pop"];

export default function CollabScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const filtered = DEMO_ARTISTS.filter((a) => {
    const matchSearch =
      !search.trim() ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.genres.some((g) => g.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "All" || a.role === roleFilter;
    const matchGenre = genreFilter === "All" || a.genres.includes(genreFilter);
    return matchSearch && matchRole && matchGenre;
  });

  const handleInvite = (artist: Artist) => {
    if (sentRequests.includes(artist.id)) {
      Alert.alert("Request Sent", `You already sent a collab request to ${artist.name}.`);
      return;
    }
    Alert.alert(
      "Send Collab Request",
      `Invite ${artist.name} to collaborate?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Invite",
          onPress: () => {
            setSentRequests((prev) => [...prev, artist.id]);
            Alert.alert("Invite Sent!", `${artist.name} will be notified.`);
          },
        },
      ]
    );
  };

  const handleJamInvite = (artist: Artist) => {
    Alert.alert(
      "Jamy Room Invite",
      `Invite ${artist.name} to join your Jamy Room session?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Invite to Jamy",
          onPress: () => Alert.alert("Jamy Invite Sent!", `${artist.name} will receive your session link.`),
        },
      ]
    );
  };

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
          <Text style={styles.pageTitle}>Collab</Text>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <IconSymbol name="magnifyingglass" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search artists, genres..."
            placeholderTextColor="#6B7280"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* Role Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {ROLE_FILTERS.map((r) => (
              <Pressable
                key={r}
                style={[styles.chip, roleFilter === r && styles.chipActive]}
                onPress={() => setRoleFilter(r)}
              >
                <Text style={[styles.chipText, roleFilter === r && styles.chipTextActive]}>{r}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Genre Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {GENRE_FILTERS.map((g) => (
              <Pressable
                key={g}
                style={[styles.chip, genreFilter === g && styles.chipGold]}
                onPress={() => setGenreFilter(g)}
              >
                <Text style={[styles.chipText, genreFilter === g && styles.chipTextGold]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.countText}>{filtered.length} artists found</Text>

        {/* Artist Cards */}
        {filtered.map((artist) => (
          <View key={artist.id} style={[styles.artistCard, { borderLeftColor: artist.color }]}>
            <View style={styles.artistHeader}>
              <View style={[styles.artistAvatar, { backgroundColor: artist.color + "22" }]}>
                <Text style={[styles.artistInitial, { color: artist.color }]}>
                  {artist.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.artistInfo}>
                <View style={styles.artistNameRow}>
                  <Text style={styles.artistName}>{artist.name}</Text>
                  {artist.openToCollab && (
                    <View style={styles.openBadge}>
                      <Text style={styles.openBadgeText}>Open</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.artistRole}>{artist.role} · {artist.location}</Text>
              </View>
            </View>

            {/* Genre tags */}
            <View style={styles.tagRow}>
              {artist.genres.map((g) => (
                <View key={g} style={styles.genreTag}>
                  <Text style={styles.genreTagText}>{g}</Text>
                </View>
              ))}
              {artist.instruments.map((i) => (
                <View key={i} style={styles.instrumentTag}>
                  <Text style={styles.instrumentTagText}>{i}</Text>
                </View>
              ))}
            </View>

            {/* Stats */}
            <View style={styles.artistStats}>
              <View style={styles.artistStat}>
                <Text style={styles.artistStatValue}>{artist.tracks}</Text>
                <Text style={styles.artistStatLabel}>Tracks</Text>
              </View>
              <View style={styles.artistStat}>
                <Text style={[styles.artistStatValue, { color: "#FFD700" }]}>{artist.jamSessions}</Text>
                <Text style={styles.artistStatLabel}>Jamy Sessions</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.artistActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.inviteBtn,
                  sentRequests.includes(artist.id) && styles.inviteBtnSent,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => handleInvite(artist)}
              >
                <IconSymbol
                  name={sentRequests.includes(artist.id) ? "checkmark.circle.fill" : "person.badge.plus"}
                  size={16}
                  color={sentRequests.includes(artist.id) ? "#34D399" : "#F5F5F5"}
                />
                <Text style={[styles.inviteBtnText, sentRequests.includes(artist.id) && { color: "#34D399" }]}>
                  {sentRequests.includes(artist.id) ? "Request Sent" : "Collab Invite"}
                </Text>
              </Pressable>
              {artist.openToCollab && (
                <Pressable
                  style={({ pressed }) => [styles.jamBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => handleJamInvite(artist)}
                >
                  <IconSymbol name="headphones" size={16} color="#FFD700" />
                  <Text style={styles.jamBtnText}>Jamy</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: { padding: 4 },
  pageTitle: { color: "#F5F5F5", fontSize: 26, fontWeight: "800" },

  searchRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#111118", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
    borderWidth: 1, borderColor: "#2A2A35", marginBottom: 12,
  },
  searchInput: { flex: 1, color: "#F5F5F5", fontSize: 14 },

  filterScroll: { flexGrow: 0, marginBottom: 8 },
  filterRow: { flexDirection: "row", gap: 8, paddingRight: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#111118", borderWidth: 1, borderColor: "#2A2A35",
  },
  chipActive: { backgroundColor: "#C41E3A", borderColor: "#C41E3A" },
  chipGold: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  chipText: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#F5F5F5" },
  chipTextGold: { color: "#080808" },

  countText: { color: "#6B7280", fontSize: 12, marginBottom: 12 },

  artistCard: {
    backgroundColor: "#111118", borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: "#2A2A35",
    borderLeftWidth: 3,
  },
  artistHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  artistAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  artistInitial: { fontSize: 20, fontWeight: "800" },
  artistInfo: { flex: 1 },
  artistNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  artistName: { color: "#F5F5F5", fontSize: 15, fontWeight: "700" },
  openBadge: {
    backgroundColor: "#34D39922", borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: "#34D399",
  },
  openBadgeText: { color: "#34D399", fontSize: 10, fontWeight: "700" },
  artistRole: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  genreTag: {
    backgroundColor: "#C41E3A22", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "#C41E3A44",
  },
  genreTagText: { color: "#C41E3A", fontSize: 10, fontWeight: "600" },
  instrumentTag: {
    backgroundColor: "#FFD70022", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "#FFD70044",
  },
  instrumentTagText: { color: "#FFD700", fontSize: 10, fontWeight: "600" },

  artistStats: { flexDirection: "row", gap: 20, marginBottom: 12 },
  artistStat: { alignItems: "center" },
  artistStatValue: { color: "#F5F5F5", fontSize: 16, fontWeight: "800" },
  artistStatLabel: { color: "#6B7280", fontSize: 10 },

  artistActions: { flexDirection: "row", gap: 8 },
  inviteBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#C41E3A", borderWidth: 1, borderColor: "#C41E3A",
  },
  inviteBtnSent: { backgroundColor: "#34D39922", borderColor: "#34D399" },
  inviteBtnText: { color: "#F5F5F5", fontSize: 13, fontWeight: "600" },
  jamBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: "#FFD70022", borderWidth: 1, borderColor: "#FFD700",
  },
  jamBtnText: { color: "#FFD700", fontSize: 13, fontWeight: "600" },
});
