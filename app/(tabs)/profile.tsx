import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLibrary } from "@/lib/store/library-context";

const INSTRUMENT_OPTIONS = [
  "Guitar", "Bass", "Drums", "Keys/Piano", "Vocals",
  "DJ/Producer", "Saxophone", "Trumpet", "Violin", "Other",
];

const GENRE_OPTIONS = [
  "Electronic", "Hip-Hop", "Techno", "House", "Drum & Bass",
  "Rock", "Jazz", "Classical", "Pop", "R&B", "Metal", "Ambient",
];

const ROLE_OPTIONS = ["Artist", "Producer", "DJ", "Mixing Engineer", "Session Musician", "Songwriter"];

const QUALITY_SETTINGS = [
  { id: "standard", label: "Standard",  desc: "44.1 kHz / 16-bit",  color: "#9CA3AF" },
  { id: "high",     label: "High",      desc: "48 kHz / 24-bit",    color: "#FF4D6D" },
  { id: "studio",   label: "Studio HD", desc: "96 kHz / 24-bit",    color: "#FFD700" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { tracks } = useLibrary();

  const [displayName, setDisplayName] = useState("DROPAi Artist");
  const [bio, setBio] = useState("Independent artist. Dropping heat since day one.");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(["Guitar"]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Rock", "Electronic"]);
  const [selectedRole, setSelectedRole] = useState("Artist");
  const [defaultQuality, setDefaultQuality] = useState("studio");
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [collaborationOpen, setCollaborationOpen] = useState(true);
  const [editing, setEditing] = useState(false);

  const stats = {
    tracks: tracks.length,
    plays: tracks.reduce((s, t) => s + t.plays, 0),
    mastered: tracks.filter((t) => t.masteringStatus !== "unmastered").length,
    studioHD: tracks.filter((t) => t.quality === "studio").length,
    collabs: 3,
    jamSessions: 7,
  };

  const toggleInstrument = (inst: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroGradient} />
          <View style={styles.heroContent}>
            <View style={styles.avatar}>
              <IconSymbol name="person.fill" size={36} color="#C41E3A" />
            </View>
            {editing ? (
              <TextInput
                style={styles.nameInput}
                value={displayName}
                onChangeText={setDisplayName}
                returnKeyType="done"
                onSubmitEditing={() => setEditing(false)}
              />
            ) : (
              <Text style={styles.displayName}>{displayName}</Text>
            )}
            <Text style={styles.roleText}>{selectedRole}</Text>
            <View style={styles.genreTagsRow}>
              {selectedGenres.slice(0, 3).map((g) => (
                <View key={g} style={styles.genreTag}>
                  <Text style={styles.genreTagText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setEditing(!editing)}
          >
            <IconSymbol name={editing ? "checkmark" : "pencil"} size={16} color="#F5F5F5" />
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard value={stats.tracks}     label="Tracks"      color="#C41E3A" />
          <StatCard value={stats.plays}      label="Plays"       color="#FFD700" />
          <StatCard value={stats.mastered}   label="Mastered"    color="#34D399" />
          <StatCard value={stats.studioHD}   label="Studio HD"   color="#FF4D6D" />
          <StatCard value={stats.collabs}    label="Collabs"     color="#60A5FA" />
          <StatCard value={stats.jamSessions} label="Jamy Sessions" color="#A78BFA" />
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            placeholder="Tell the world about your sound..."
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Role */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role</Text>
          <View style={styles.chipGrid}>
            {ROLE_OPTIONS.map((r) => (
              <Pressable
                key={r}
                style={[styles.chip, selectedRole === r && styles.chipActive]}
                onPress={() => setSelectedRole(r)}
              >
                <Text style={[styles.chipText, selectedRole === r && styles.chipTextActive]}>{r}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Instruments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instruments</Text>
          <View style={styles.chipGrid}>
            {INSTRUMENT_OPTIONS.map((inst) => (
              <Pressable
                key={inst}
                style={[styles.chip, selectedInstruments.includes(inst) && styles.chipActive]}
                onPress={() => toggleInstrument(inst)}
              >
                <Text style={[styles.chipText, selectedInstruments.includes(inst) && styles.chipTextActive]}>
                  {inst}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Genres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genres</Text>
          <View style={styles.chipGrid}>
            {GENRE_OPTIONS.map((g) => (
              <Pressable
                key={g}
                style={[styles.chip, selectedGenres.includes(g) && styles.chipGold]}
                onPress={() => toggleGenre(g)}
              >
                <Text style={[styles.chipText, selectedGenres.includes(g) && styles.chipTextGold]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Default Audio Quality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Recording Quality</Text>
          {QUALITY_SETTINGS.map((q) => (
            <Pressable
              key={q.id}
              style={[styles.qualityRow, defaultQuality === q.id && { borderColor: q.color, backgroundColor: q.color + "11" }]}
              onPress={() => setDefaultQuality(q.id)}
            >
              <View style={[styles.qualityDot, { backgroundColor: q.color }]} />
              <View style={styles.qualityInfo}>
                <Text style={[styles.qualityLabel, defaultQuality === q.id && { color: q.color }]}>{q.label}</Text>
                <Text style={styles.qualityDesc}>{q.desc}</Text>
              </View>
              {defaultQuality === q.id && (
                <IconSymbol name="checkmark.circle.fill" size={18} color={q.color} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.prefRow}>
            <View>
              <Text style={styles.prefLabel}>Open to Collaboration</Text>
              <Text style={styles.prefDesc}>Let other artists invite you to sessions</Text>
            </View>
            <Switch
              value={collaborationOpen}
              onValueChange={setCollaborationOpen}
              trackColor={{ false: "#2A2A35", true: "#34D39988" }}
              thumbColor={collaborationOpen ? "#34D399" : "#6B7280"}
            />
          </View>
          <View style={styles.prefRow}>
            <View>
              <Text style={styles.prefLabel}>Notifications</Text>
              <Text style={styles.prefDesc}>Jamy invites, mastering complete, collabs</Text>
            </View>
            <Switch
              value={notificationsOn}
              onValueChange={setNotificationsOn}
              trackColor={{ false: "#2A2A35", true: "#C41E3A88" }}
              thumbColor={notificationsOn ? "#C41E3A" : "#6B7280"}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
            onPress={() => Alert.alert("Share Profile", "Your DROPAi profile link has been copied.")}
          >
            <IconSymbol name="square.and.arrow.up" size={18} color="#9CA3AF" />
            <Text style={styles.actionText}>Share Profile</Text>
            <IconSymbol name="chevron.right" size={14} color="#6B7280" />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
            onPress={() => (router as any).push("/dj-mixer")}
          >
            <IconSymbol name="slider.horizontal.3" size={18} color="#9CA3AF" />
            <Text style={styles.actionText}>Open DJ Mixer</Text>
            <IconSymbol name="chevron.right" size={14} color="#6B7280" />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
            onPress={() => (router as any).push("/collab")}
          >
            <IconSymbol name="person.2.fill" size={18} color="#9CA3AF" />
            <Text style={styles.actionText}>Find Collaborators</Text>
            <IconSymbol name="chevron.right" size={14} color="#6B7280" />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionRow, styles.actionRowDanger, pressed && { opacity: 0.7 }]}
            onPress={() =>
              Alert.alert("Sign Out", "Sign out of DROPAi?", [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Out", style: "destructive", onPress: () => {} },
              ])
            }
          >
            <IconSymbol name="arrow.right.square" size={18} color="#C41E3A" />
            <Text style={[styles.actionText, { color: "#C41E3A" }]}>Sign Out</Text>
          </Pressable>
        </View>

        <Text style={styles.versionText}>DROPAi v1.0.0 · Studio quality. Every drop.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={[statStyles.card, { borderColor: color + "44" }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    width: "30%",
    backgroundColor: "#111118",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  value: { fontSize: 22, fontWeight: "900" },
  label: { color: "#6B7280", fontSize: 10, marginTop: 2, textAlign: "center" },
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },

  heroBanner: {
    backgroundColor: "#111118",
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A35",
    position: "relative",
  },
  heroGradient: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#C41E3A08",
  },
  heroContent: { alignItems: "center", gap: 8 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#1A0A0E",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#C41E3A",
  },
  displayName: { color: "#F5F5F5", fontSize: 22, fontWeight: "800" },
  nameInput: {
    color: "#F5F5F5", fontSize: 22, fontWeight: "800",
    borderBottomWidth: 1, borderBottomColor: "#C41E3A",
    paddingBottom: 4, minWidth: 200, textAlign: "center",
  },
  roleText: { color: "#9CA3AF", fontSize: 13 },
  genreTagsRow: { flexDirection: "row", gap: 6 },
  genreTag: {
    backgroundColor: "#C41E3A22", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: "#C41E3A44",
  },
  genreTagText: { color: "#C41E3A", fontSize: 11, fontWeight: "600" },
  editBtn: {
    position: "absolute", top: 16, right: 16,
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#1A1A24", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2A2A35",
  },

  statsGrid: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between",
    padding: 16, gap: 0,
  },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { color: "#F5F5F5", fontSize: 14, fontWeight: "700", marginBottom: 10 },

  bioInput: {
    backgroundColor: "#111118", borderWidth: 1, borderColor: "#2A2A35",
    borderRadius: 12, padding: 14, color: "#F5F5F5", fontSize: 14,
    lineHeight: 20, minHeight: 80, textAlignVertical: "top",
  },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#111118", borderWidth: 1, borderColor: "#2A2A35",
  },
  chipActive: { backgroundColor: "#C41E3A22", borderColor: "#C41E3A" },
  chipGold: { backgroundColor: "#FFD70022", borderColor: "#FFD700" },
  chipText: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#C41E3A" },
  chipTextGold: { color: "#FFD700" },

  qualityRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#111118", borderRadius: 12, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: "#2A2A35",
  },
  qualityDot: { width: 10, height: 10, borderRadius: 5 },
  qualityInfo: { flex: 1 },
  qualityLabel: { color: "#F5F5F5", fontSize: 14, fontWeight: "600" },
  qualityDesc: { color: "#6B7280", fontSize: 12, marginTop: 2 },

  prefRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#111118", borderRadius: 12, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: "#2A2A35",
  },
  prefLabel: { color: "#F5F5F5", fontSize: 14, fontWeight: "600" },
  prefDesc: { color: "#6B7280", fontSize: 12, marginTop: 2 },

  actionRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#111118", borderRadius: 12, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: "#2A2A35",
  },
  actionRowDanger: { borderColor: "#C41E3A22" },
  actionText: { flex: 1, color: "#F5F5F5", fontSize: 14 },

  versionText: { color: "#6B7280", fontSize: 11, textAlign: "center", paddingBottom: 16 },
});
