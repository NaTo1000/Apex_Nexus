import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

// ─── Options ─────────────────────────────────────────────────────────────────

const GENRES = ["Hip-Hop", "R&B", "Pop", "Rock", "Country", "Electronic", "Jazz", "Blues", "Reggae", "Metal", "Folk", "Soul", "Punk", "Indie", "Classical"];
const MOODS = ["Uplifting", "Melancholic", "Angry", "Romantic", "Nostalgic", "Euphoric", "Dark", "Hopeful", "Chill", "Intense", "Playful", "Spiritual"];
const STRUCTURES = [
  { id: "verse_chorus_bridge" as const, label: "Verse / Chorus / Bridge", desc: "Classic pop/rock structure" },
  { id: "verse_chorus" as const, label: "Verse / Chorus", desc: "Streamlined hit structure" },
  { id: "aaba" as const, label: "AABA", desc: "Jazz / Tin Pan Alley standard" },
  { id: "through_composed" as const, label: "Through-Composed", desc: "No repeating sections" },
];
const RHYME_SCHEMES = [
  { id: "ABAB" as const, label: "ABAB", desc: "Alternating rhyme" },
  { id: "AABB" as const, label: "AABB", desc: "Couplet rhyme" },
  { id: "ABCB" as const, label: "ABCB", desc: "Ballad rhyme" },
  { id: "free_verse" as const, label: "Free Verse", desc: "No strict rhyme" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LyricistScreen() {
  const router = useRouter();

  // Form state
  const [genre, setGenre] = useState("Hip-Hop");
  const [mood, setMood] = useState("Uplifting");
  const [theme, setTheme] = useState("");
  const [title, setTitle] = useState("");
  const [structure, setStructure] = useState<"verse_chorus_bridge" | "aaba" | "through_composed" | "verse_chorus">("verse_chorus_bridge");
  const [rhymeScheme, setRhymeScheme] = useState<"ABAB" | "AABB" | "ABCB" | "free_verse">("ABAB");
  const [extraContext, setExtraContext] = useState("");

  // Result state
  const [sections, setSections] = useState<Array<{ label: string; content: string }>>([]);
  const [fullLyrics, setFullLyrics] = useState("");
  const [activeView, setActiveView] = useState<"form" | "result">("form");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState("");

  const generateMutation = trpc.lyrics.generate.useMutation({
    onSuccess: (data) => {
      setSections(data.sections);
      setFullLyrics(data.fullLyrics);
      setActiveView("result");
    },
    onError: (err) => {
      Alert.alert("Generation Failed", err.message || "Could not generate lyrics. Please try again.");
    },
  });

  const regenerateMutation = trpc.lyrics.regenerateSection.useMutation({
    onSuccess: (data, variables) => {
      setSections((prev) =>
        prev.map((s) =>
          s.label === variables.sectionLabel ? { ...s, content: data.content } : s
        )
      );
      setEditingSection(null);
      setEditInstruction("");
    },
    onError: (err) => {
      Alert.alert("Regeneration Failed", err.message || "Could not regenerate section.");
    },
  });

  const handleGenerate = useCallback(() => {
    if (!theme.trim()) {
      Alert.alert("Missing Theme", "Please enter a theme or topic for your song.");
      return;
    }
    generateMutation.mutate({ genre, mood, theme, structure, rhymeScheme, title: title || undefined, extraContext: extraContext || undefined });
  }, [genre, mood, theme, structure, rhymeScheme, title, extraContext, generateMutation]);

  const handleRegenerate = useCallback((sectionLabel: string, currentContent: string) => {
    regenerateMutation.mutate({
      sectionLabel,
      currentContent,
      genre,
      mood,
      theme,
      instruction: editInstruction || undefined,
    });
  }, [genre, mood, theme, editInstruction, regenerateMutation]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: title || "My DROPAi Song",
        message: `${title ? `"${title}"\n\n` : ""}${fullLyrics}\n\n— Created with DROPAi`,
      });
    } catch {}
  }, [title, fullLyrics]);

  const sectionColors: Record<string, string> = {
    "Verse": "#C41E3A", "Verse 1": "#C41E3A", "Verse 2": "#C41E3A", "Verse 3": "#C41E3A",
    "Chorus": "#FFD700", "Final Chorus": "#FFD700",
    "Pre-Chorus": "#FF4D6D",
    "Bridge": "#A78BFA",
    "Outro": "#34D399",
    "Intro": "#60A5FA",
    "Hook": "#F97316",
  };
  const getSectionColor = (label: string) => {
    for (const key of Object.keys(sectionColors)) {
      if (label.toLowerCase().includes(key.toLowerCase())) return sectionColors[key];
    }
    return "#9CA3AF";
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={22} color="#F5F5F5" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>AI Lyricist Booth</Text>
            <Text style={styles.headerSub}>Studio-quality songwriting AI</Text>
          </View>
          {activeView === "result" && (
            <Pressable style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]} onPress={handleShare}>
              <IconSymbol name="square.and.arrow.up" size={20} color="#FFD700" />
            </Pressable>
          )}
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabBar}>
          <Pressable style={[styles.tab, activeView === "form" && styles.activeTab]} onPress={() => setActiveView("form")}>
            <Text style={[styles.tabText, activeView === "form" && styles.activeTabText]}>Write</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeView === "result" && styles.activeTab, !fullLyrics && styles.tabDisabled]}
            onPress={() => fullLyrics && setActiveView("result")}
          >
            <Text style={[styles.tabText, activeView === "result" && styles.activeTabText]}>Lyrics</Text>
          </Pressable>
        </View>

        {/* ── FORM VIEW ── */}
        {activeView === "form" && (
          <>
            {/* Genre */}
            <Text style={styles.sectionLabel}>Genre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipRow}>
                {GENRES.map((g) => (
                  <Pressable key={g} style={[styles.chip, genre === g && styles.chipActive]} onPress={() => setGenre(g)}>
                    <Text style={[styles.chipText, genre === g && styles.chipTextActive]}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Mood */}
            <Text style={styles.sectionLabel}>Mood</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipRow}>
                {MOODS.map((m) => (
                  <Pressable key={m} style={[styles.chip, mood === m && styles.chipMoodActive]} onPress={() => setMood(m)}>
                    <Text style={[styles.chipText, mood === m && styles.chipTextActive]}>{m}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Theme */}
            <Text style={styles.sectionLabel}>Theme / Topic *</Text>
            <TextInput
              style={styles.input}
              value={theme}
              onChangeText={setTheme}
              placeholder="e.g. Rising from nothing, lost love, city nights..."
              placeholderTextColor="#4B5563"
              multiline
              numberOfLines={2}
              returnKeyType="done"
            />

            {/* Title */}
            <Text style={styles.sectionLabel}>Working Title (optional)</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Broken Crown"
              placeholderTextColor="#4B5563"
              returnKeyType="done"
            />

            {/* Song Structure */}
            <Text style={styles.sectionLabel}>Song Structure</Text>
            {STRUCTURES.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.optionCard, structure === s.id && styles.optionCardActive]}
                onPress={() => setStructure(s.id)}
              >
                <View style={styles.optionRadio}>
                  {structure === s.id && <View style={styles.optionRadioDot} />}
                </View>
                <View>
                  <Text style={styles.optionLabel}>{s.label}</Text>
                  <Text style={styles.optionDesc}>{s.desc}</Text>
                </View>
              </Pressable>
            ))}

            {/* Rhyme Scheme */}
            <Text style={styles.sectionLabel}>Rhyme Scheme</Text>
            <View style={styles.rhymeGrid}>
              {RHYME_SCHEMES.map((r) => (
                <Pressable
                  key={r.id}
                  style={[styles.rhymeCard, rhymeScheme === r.id && styles.rhymeCardActive]}
                  onPress={() => setRhymeScheme(r.id)}
                >
                  <Text style={[styles.rhymeLabel, rhymeScheme === r.id && { color: "#FFD700" }]}>{r.label}</Text>
                  <Text style={styles.rhymeDesc}>{r.desc}</Text>
                </Pressable>
              ))}
            </View>

            {/* Extra Context */}
            <Text style={styles.sectionLabel}>Extra Direction (optional)</Text>
            <TextInput
              style={styles.input}
              value={extraContext}
              onChangeText={setExtraContext}
              placeholder="e.g. Include references to the ocean, make the bridge more aggressive..."
              placeholderTextColor="#4B5563"
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />

            {/* Generate Button */}
            <Pressable
              style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.85 }, generateMutation.isPending && { opacity: 0.7 }]}
              onPress={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#0A0A0F" />
                  <Text style={styles.generateBtnText}>Writing your song...</Text>
                </View>
              ) : (
                <>
                  <IconSymbol name="sparkles" size={20} color="#0A0A0F" />
                  <Text style={styles.generateBtnText}>Generate Lyrics</Text>
                </>
              )}
            </Pressable>
          </>
        )}

        {/* ── RESULT VIEW ── */}
        {activeView === "result" && sections.length > 0 && (
          <>
            {title && <Text style={styles.songTitle}>"{title}"</Text>}
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}><Text style={styles.metaBadgeText}>{genre}</Text></View>
              <View style={styles.metaBadge}><Text style={styles.metaBadgeText}>{mood}</Text></View>
              <View style={styles.metaBadge}><Text style={styles.metaBadgeText}>{rhymeScheme}</Text></View>
            </View>

            {sections.map((section) => {
              const color = getSectionColor(section.label);
              const isEditing = editingSection === section.label;
              return (
                <View key={section.label} style={[styles.sectionCard, { borderLeftColor: color }]}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionLabelBadge, { backgroundColor: color + "22", borderColor: color }]}>
                      <Text style={[styles.sectionLabelText, { color }]}>{section.label}</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.regenBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => setEditingSection(isEditing ? null : section.label)}
                    >
                      <IconSymbol name="arrow.clockwise" size={14} color="#9CA3AF" />
                      <Text style={styles.regenBtnText}>Rewrite</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.lyricsText}>{section.content}</Text>

                  {isEditing && (
                    <View style={styles.regenPanel}>
                      <TextInput
                        style={styles.regenInput}
                        value={editInstruction}
                        onChangeText={setEditInstruction}
                        placeholder="Direction for rewrite (optional)..."
                        placeholderTextColor="#4B5563"
                        returnKeyType="done"
                      />
                      <Pressable
                        style={({ pressed }) => [styles.regenConfirmBtn, pressed && { opacity: 0.85 }]}
                        onPress={() => handleRegenerate(section.label, section.content)}
                        disabled={regenerateMutation.isPending}
                      >
                        {regenerateMutation.isPending ? (
                          <ActivityIndicator color="#F5F5F5" size="small" />
                        ) : (
                          <Text style={styles.regenConfirmText}>Rewrite Section</Text>
                        )}
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Actions */}
            <View style={styles.actionRow}>
              <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]} onPress={handleShare}>
                <IconSymbol name="square.and.arrow.up" size={18} color="#F5F5F5" />
                <Text style={styles.actionBtnText}>Share</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.8 }]}
                onPress={() => { setActiveView("form"); setSections([]); setFullLyrics(""); }}
              >
                <IconSymbol name="plus.circle" size={18} color="#0A0A0F" />
                <Text style={[styles.actionBtnText, { color: "#0A0A0F" }]}>New Song</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#F5F5F5", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "#6B7280", fontSize: 11, marginTop: 1 },
  shareBtn: { padding: 4 },
  tabBar: { flexDirection: "row", backgroundColor: "#111118", borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: "#2A2A35" },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#C41E3A" },
  tabDisabled: { opacity: 0.4 },
  tabText: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  activeTabText: { color: "#F5F5F5" },
  sectionLabel: { color: "#9CA3AF", fontSize: 12, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  chipScroll: { marginBottom: 16 },
  chipRow: { flexDirection: "row", gap: 8, paddingRight: 20 },
  chip: { borderWidth: 1, borderColor: "#2A2A35", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: "#111118" },
  chipActive: { backgroundColor: "#C41E3A", borderColor: "#C41E3A" },
  chipMoodActive: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  chipText: { color: "#9CA3AF", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#F5F5F5" },
  input: { backgroundColor: "#111118", borderRadius: 12, borderWidth: 1, borderColor: "#2A2A35", color: "#F5F5F5", fontSize: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, textAlignVertical: "top" },
  optionCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#111118", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2A2A35" },
  optionCardActive: { borderColor: "#C41E3A", backgroundColor: "#1A0A0E" },
  optionRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#2A2A35", alignItems: "center", justifyContent: "center" },
  optionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#C41E3A" },
  optionLabel: { color: "#F5F5F5", fontSize: 14, fontWeight: "600" },
  optionDesc: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  rhymeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  rhymeCard: { width: "47%", backgroundColor: "#111118", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#2A2A35" },
  rhymeCardActive: { borderColor: "#FFD700", backgroundColor: "#1A1500" },
  rhymeLabel: { color: "#F5F5F5", fontSize: 15, fontWeight: "800" },
  rhymeDesc: { color: "#6B7280", fontSize: 11, marginTop: 3 },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#FFD700", borderRadius: 16, paddingVertical: 18, marginTop: 8 },
  generateBtnText: { color: "#0A0A0F", fontSize: 16, fontWeight: "900" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  songTitle: { color: "#FFD700", fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 10 },
  metaRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 },
  metaBadge: { backgroundColor: "#111118", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#2A2A35" },
  metaBadgeText: { color: "#9CA3AF", fontSize: 11, fontWeight: "600" },
  sectionCard: { backgroundColor: "#111118", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2A2A35", borderLeftWidth: 3 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionLabelBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  sectionLabelText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  regenBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  regenBtnText: { color: "#9CA3AF", fontSize: 12 },
  lyricsText: { color: "#E5E7EB", fontSize: 14, lineHeight: 24, fontFamily: "System" },
  regenPanel: { marginTop: 12, gap: 8 },
  regenInput: { backgroundColor: "#0A0A0F", borderRadius: 10, borderWidth: 1, borderColor: "#2A2A35", color: "#F5F5F5", fontSize: 13, paddingHorizontal: 12, paddingVertical: 10 },
  regenConfirmBtn: { backgroundColor: "#C41E3A", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  regenConfirmText: { color: "#F5F5F5", fontSize: 13, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#111118", borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: "#2A2A35" },
  actionBtnPrimary: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  actionBtnText: { color: "#F5F5F5", fontSize: 14, fontWeight: "700" },
});
