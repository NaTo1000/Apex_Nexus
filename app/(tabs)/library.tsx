import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TrackCard } from "@/components/track-card";
import { MiniPlayer } from "@/components/mini-player";
import { useLibrary } from "@/lib/store/library-context";
import { usePlayer } from "@/lib/store/player-context";
import { Track, AudioFormat } from "@/lib/store/library-store";

type FilterType = "All" | AudioFormat | "Mastered" | "Studio HD";
const FILTERS: FilterType[] = ["All", "Studio HD", "WAV_HD", "WAV", "MP3", "Mastered"];
const FILTER_LABELS: Record<FilterType, string> = {
  All: "All",
  "Studio HD": "Studio HD",
  WAV_HD: "WAV HD",
  WAV: "WAV",
  MP3: "MP3",
  FLAC: "FLAC",
  AAC: "AAC",
  Mastered: "Mastered",
};

type SortType = "date" | "name" | "duration" | "plays";

export default function LibraryScreen() {
  const router = useRouter();
  const { tracks, loading, deleteTrack } = useLibrary();
  const { currentTrack } = usePlayer();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [sort, setSort] = useState<SortType>("date");
  const [showSort, setShowSort] = useState(false);

  const filtered = useMemo(() => {
    let result = tracks;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.genre.toLowerCase().includes(q)
      );
    }
    if (activeFilter !== "All") {
      if (activeFilter === "Mastered") {
        result = result.filter((t) => t.masteringStatus !== "unmastered");
      } else if (activeFilter === "Studio HD") {
        result = result.filter((t) => t.quality === "studio");
      } else {
        result = result.filter((t) => t.format === (activeFilter as AudioFormat));
      }
    }
    switch (sort) {
      case "name":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "duration":
        result = [...result].sort((a, b) => b.duration - a.duration);
        break;
      case "plays":
        result = [...result].sort((a, b) => b.plays - a.plays);
        break;
      default:
        result = [...result].sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
    }
    return result;
  }, [tracks, search, activeFilter, sort]);

  const handleDelete = useCallback(
    (track: Track) => {
      Alert.alert("Remove Track", `Remove "${track.title}" from your library?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => deleteTrack(track.id) },
      ]);
    },
    [deleteTrack]
  );

  const renderItem = useCallback(
    ({ item }: { item: Track }) => (
      <TrackCard
        track={item}
        onPress={() =>
          (router as any).push({ pathname: "/track/[id]", params: { id: item.id } })
        }
        onMaster={() =>
          (router as any).push({ pathname: "/mastering/[id]", params: { id: item.id } })
        }
        onDelete={() => handleDelete(item)}
      />
    ),
    [router, handleDelete]
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
          <Pressable
            style={({ pressed }) => [styles.sortBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setShowSort(!showSort)}
          >
            <IconSymbol name="list.bullet" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Sort dropdown */}
        {showSort && (
          <View style={styles.sortMenu}>
            {(["date", "name", "duration", "plays"] as SortType[]).map((s) => (
              <Pressable
                key={s}
                style={[styles.sortOption, sort === s && styles.sortOptionActive]}
                onPress={() => { setSort(s); setShowSort(false); }}
              >
                <Text style={[styles.sortText, sort === s && styles.sortTextActive]}>
                  {s === "date" ? "Date Added" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
                {sort === s && <IconSymbol name="checkmark.circle.fill" size={14} color="#C41E3A" />}
              </Pressable>
            ))}
          </View>
        )}

        {/* Search */}
        <View style={styles.searchRow}>
          <IconSymbol name="magnifyingglass" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search drops, artists, genres..."
            placeholderTextColor="#6B7280"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <IconSymbol name="xmark" size={16} color="#6B7280" />
            </Pressable>
          )}
        </View>

        {/* Filter chips */}
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.chip, activeFilter === item && styles.chipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.chipText, activeFilter === item && styles.chipTextActive]}>
                {FILTER_LABELS[item]}
              </Text>
            </Pressable>
          )}
        />

        {/* Count */}
        <Text style={styles.countText}>
          {filtered.length} {filtered.length === 1 ? "track" : "tracks"}
        </Text>

        {/* List */}
        {loading ? (
          <View style={styles.center}>
            <Text style={styles.mutedText}>Loading library...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <IconSymbol name="music.note.list" size={48} color="#2A2A35" />
            <Text style={styles.emptyTitle}>No tracks found</Text>
            <Text style={styles.mutedText}>
              {search ? "Try a different search" : "Upload your first drop to get started"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              currentTrack && { paddingBottom: 80 },
            ]}
          />
        )}
      </View>

      <MiniPlayer />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { color: "#F5F5F5", fontSize: 26, fontWeight: "800" },
  sortBtn: { padding: 8 },
  sortMenu: {
    backgroundColor: "#111118",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A35",
    marginBottom: 12,
    overflow: "hidden",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A35",
  },
  sortOptionActive: { backgroundColor: "#1A0A0E" },
  sortText: { color: "#9CA3AF", fontSize: 14 },
  sortTextActive: { color: "#C41E3A", fontWeight: "600" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111118",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "#2A2A35",
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: "#F5F5F5", fontSize: 14 },
  filterList: { flexGrow: 0, marginBottom: 12 },
  filterContent: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#111118",
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  chipActive: { backgroundColor: "#C41E3A", borderColor: "#C41E3A" },
  chipText: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#F5F5F5" },
  countText: { color: "#6B7280", fontSize: 12, marginBottom: 10 },
  listContent: { paddingBottom: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { color: "#F5F5F5", fontSize: 16, fontWeight: "600" },
  mutedText: { color: "#6B7280", fontSize: 13, textAlign: "center" },
});
