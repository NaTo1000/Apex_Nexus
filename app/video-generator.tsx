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
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLibrary } from "@/lib/store/library-context";
import { trpc } from "@/lib/trpc";

// ─── Visual Styles ────────────────────────────────────────────────────────────

const VISUAL_STYLES = [
  { id: "cinematic" as const, label: "Cinematic", emoji: "🎬", desc: "Narrative film aesthetic" },
  { id: "lyric_video" as const, label: "Lyric Video", emoji: "✍️", desc: "Kinetic typography" },
  { id: "abstract" as const, label: "Abstract", emoji: "🌀", desc: "Visual art & particles" },
  { id: "performance" as const, label: "Performance", emoji: "🎸", desc: "Live stage footage" },
  { id: "animated" as const, label: "Animated", emoji: "🎨", desc: "2D/3D animation" },
  { id: "documentary" as const, label: "Documentary", emoji: "📹", desc: "Real-world footage" },
];

const COLOR_PALETTES = [
  { name: "Midnight", colors: ["#0A0A0F", "#1A1A2E", "#C41E3A", "#FFD700"] },
  { name: "Neon City", colors: ["#0D0D0D", "#00FFFF", "#FF00FF", "#FFFF00"] },
  { name: "Golden Hour", colors: ["#FF6B35", "#F7931E", "#FFD700", "#FFF9C4"] },
  { name: "Ocean Deep", colors: ["#001F3F", "#0074D9", "#7FDBFF", "#FFFFFF"] },
  { name: "Forest", colors: ["#1A2F1A", "#2D5A27", "#6DB33F", "#C8E6C9"] },
  { name: "Monochrome", colors: ["#000000", "#333333", "#888888", "#FFFFFF"] },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Scene {
  number: number;
  timestamp: string;
  description: string;
  cameraWork: string;
  lighting: string;
  keyVisual: string;
  storyboardUrl?: string;
}

interface VideoConcept {
  logline: string;
  colorPalette: string[];
  visualTheme: string;
  scenes: Scene[];
  productionNotes: string;
  estimatedBudget: string;
}

export default function VideoGeneratorScreen() {
  const router = useRouter();
  const { tracks } = useLibrary();

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [visualStyle, setVisualStyle] = useState<typeof VISUAL_STYLES[0]["id"]>("cinematic");
  const [selectedPalette, setSelectedPalette] = useState<string>("Midnight");
  const [scenePrompt, setScenePrompt] = useState("");
  const [concept, setConcept] = useState<VideoConcept | null>(null);
  const [activeView, setActiveView] = useState<"form" | "concept">("form");
  const [generatingFrameFor, setGeneratingFrameFor] = useState<number | null>(null);

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);

  const generateMutation = trpc.videoConcept.generate.useMutation({
    onSuccess: (data) => {
      setConcept(data as VideoConcept);
      setActiveView("concept");
    },
    onError: (err) => {
      Alert.alert("Generation Failed", err.message || "Could not generate video concept. Please try again.");
    },
  });

  const storyboardMutation = trpc.videoConcept.generateStoryboardFrame.useMutation({
    onSuccess: (data, variables) => {
      // Find which scene this was for by matching description
      setConcept((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          scenes: prev.scenes.map((s) =>
            s.description === variables.sceneDescription
              ? { ...s, storyboardUrl: data.imageUrl }
              : s
          ),
        };
      });
      setGeneratingFrameFor(null);
    },
    onError: () => {
      setGeneratingFrameFor(null);
      Alert.alert("Frame Generation Failed", "Could not generate storyboard frame.");
    },
  });

  const handleGenerate = useCallback(() => {
    if (!selectedTrackId || !selectedTrack) {
      Alert.alert("Select a Track", "Please select a track from your library.");
      return;
    }
    const palette = COLOR_PALETTES.find((p) => p.name === selectedPalette);
    generateMutation.mutate({
      trackTitle: selectedTrack.title,
      artist: selectedTrack.artist,
      genre: selectedTrack.genre || "Pop",
      mood: "Energetic",
      visualStyle,
      colorPalette: palette ? palette.colors.join(", ") : undefined,
      scenePrompt: scenePrompt || undefined,
    });
  }, [selectedTrackId, selectedTrack, visualStyle, selectedPalette, scenePrompt, generateMutation]);

  const handleGenerateFrame = useCallback((scene: Scene, index: number) => {
    if (!concept) return;
    const palette = concept.colorPalette?.join(", ") ?? "";
    setGeneratingFrameFor(index);
    storyboardMutation.mutate({
      sceneDescription: scene.description,
      visualStyle: VISUAL_STYLES.find((s) => s.id === visualStyle)?.label ?? visualStyle,
      colorPalette: palette,
    });
  }, [concept, visualStyle, storyboardMutation]);

  const handleShare = useCallback(async () => {
    if (!concept) return;
    const text = [
      `🎬 Music Video Concept: "${selectedTrack?.title}"`,
      `\nLogline: ${concept.logline}`,
      `\nVisual Theme: ${concept.visualTheme}`,
      `\nScenes:`,
      ...concept.scenes.map((s) => `\n[${s.timestamp}] ${s.description}`),
      `\nProduction Notes: ${concept.productionNotes}`,
      `\nBudget: ${concept.estimatedBudget}`,
      `\n\n— Created with DROPAi`,
    ].join("");
    try {
      await Share.share({ title: `Video Concept: ${selectedTrack?.title}`, message: text });
    } catch {}
  }, [concept, selectedTrack]);

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
            <Text style={styles.headerTitle}>Video Clip Generator</Text>
            <Text style={styles.headerSub}>AI-powered music video concepts</Text>
          </View>
          {concept && (
            <Pressable style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]} onPress={handleShare}>
              <IconSymbol name="square.and.arrow.up" size={20} color="#FFD700" />
            </Pressable>
          )}
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabBar}>
          <Pressable style={[styles.tab, activeView === "form" && styles.activeTab]} onPress={() => setActiveView("form")}>
            <Text style={[styles.tabText, activeView === "form" && styles.activeTabText]}>Setup</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeView === "concept" && styles.activeTab, !concept && styles.tabDisabled]}
            onPress={() => concept && setActiveView("concept")}
          >
            <Text style={[styles.tabText, activeView === "concept" && styles.activeTabText]}>Concept</Text>
          </Pressable>
        </View>

        {/* ── FORM VIEW ── */}
        {activeView === "form" && (
          <>
            {/* Track Selection */}
            <Text style={styles.sectionLabel}>Select Track</Text>
            {tracks.length === 0 ? (
              <View style={styles.emptyTracks}>
                <Text style={styles.emptyTracksText}>Upload tracks to your library first.</Text>
              </View>
            ) : (
              tracks.map((track) => (
                <Pressable
                  key={track.id}
                  style={[styles.trackRow, selectedTrackId === track.id && styles.trackRowSelected]}
                  onPress={() => setSelectedTrackId(track.id)}
                >
                  <View style={[styles.trackRadio, selectedTrackId === track.id && styles.trackRadioActive]}>
                    {selectedTrackId === track.id && <View style={styles.trackRadioDot} />}
                  </View>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.trackMeta}>{track.artist} · {track.genre || "Unknown genre"}</Text>
                  </View>
                </Pressable>
              ))
            )}

            {/* Visual Style */}
            <Text style={styles.sectionLabel}>Visual Style</Text>
            <View style={styles.styleGrid}>
              {VISUAL_STYLES.map((s) => (
                <Pressable
                  key={s.id}
                  style={[styles.styleCard, visualStyle === s.id && styles.styleCardActive]}
                  onPress={() => setVisualStyle(s.id)}
                >
                  <Text style={styles.styleEmoji}>{s.emoji}</Text>
                  <Text style={[styles.styleLabel, visualStyle === s.id && { color: "#FFD700" }]}>{s.label}</Text>
                  <Text style={styles.styleDesc}>{s.desc}</Text>
                </Pressable>
              ))}
            </View>

            {/* Colour Palette */}
            <Text style={styles.sectionLabel}>Colour Palette</Text>
            <View style={styles.paletteGrid}>
              {COLOR_PALETTES.map((p) => (
                <Pressable
                  key={p.name}
                  style={[styles.paletteCard, selectedPalette === p.name && styles.paletteCardActive]}
                  onPress={() => setSelectedPalette(p.name)}
                >
                  <View style={styles.paletteSwatches}>
                    {p.colors.map((c) => (
                      <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
                    ))}
                  </View>
                  <Text style={[styles.paletteName, selectedPalette === p.name && { color: "#FFD700" }]}>{p.name}</Text>
                </Pressable>
              ))}
            </View>

            {/* Scene Direction */}
            <Text style={styles.sectionLabel}>Scene Direction (optional)</Text>
            <TextInput
              style={styles.input}
              value={scenePrompt}
              onChangeText={setScenePrompt}
              placeholder="e.g. Open with a rooftop at dawn, include rain scenes, end with a crowd..."
              placeholderTextColor="#4B5563"
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />

            {/* Generate Button */}
            <Pressable
              style={({ pressed }) => [
                styles.generateBtn,
                pressed && { opacity: 0.85 },
                (generateMutation.isPending || !selectedTrackId) && { opacity: 0.6 },
              ]}
              onPress={handleGenerate}
              disabled={generateMutation.isPending || !selectedTrackId}
            >
              {generateMutation.isPending ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#0A0A0F" />
                  <Text style={styles.generateBtnText}>Generating concept...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.generateBtnEmoji}>🎬</Text>
                  <Text style={styles.generateBtnText}>Generate Video Concept</Text>
                </>
              )}
            </Pressable>
          </>
        )}

        {/* ── CONCEPT VIEW ── */}
        {activeView === "concept" && concept && (
          <>
            {/* Logline */}
            <View style={styles.loglineCard}>
              <Text style={styles.loglineLabel}>CONCEPT</Text>
              <Text style={styles.loglineText}>{concept.logline}</Text>
            </View>

            {/* Visual Theme */}
            <View style={styles.themeCard}>
              <Text style={styles.themeLabel}>Visual Theme</Text>
              <Text style={styles.themeText}>{concept.visualTheme}</Text>
            </View>

            {/* Colour Palette */}
            {concept.colorPalette && concept.colorPalette.length > 0 && (
              <View style={styles.paletteDisplay}>
                <Text style={styles.themeLabel}>Colour Palette</Text>
                <View style={styles.paletteSwatchRow}>
                  {concept.colorPalette.map((c: string, i: number) => (
                    <View key={i} style={styles.paletteSwatchLarge}>
                      <View style={[styles.swatchLarge, { backgroundColor: c }]} />
                      <Text style={styles.swatchHex}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Scenes */}
            <Text style={styles.scenesTitle}>Scene Breakdown</Text>
            {concept.scenes?.map((scene: Scene, index: number) => (
              <View key={index} style={styles.sceneCard}>
                <View style={styles.sceneHeader}>
                  <View style={styles.sceneNumberBadge}>
                    <Text style={styles.sceneNumber}>Scene {scene.number}</Text>
                  </View>
                  <Text style={styles.sceneTimestamp}>{scene.timestamp}</Text>
                </View>

                {/* Storyboard Frame */}
                {scene.storyboardUrl ? (
                  <Image
                    source={{ uri: scene.storyboardUrl }}
                    style={styles.storyboardImage}
                    contentFit="cover"
                  />
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.generateFrameBtn, pressed && { opacity: 0.85 }]}
                    onPress={() => handleGenerateFrame(scene, index)}
                    disabled={generatingFrameFor !== null}
                  >
                    {generatingFrameFor === index ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator color="#9CA3AF" size="small" />
                        <Text style={styles.generateFrameText}>Generating frame...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.generateFrameEmoji}>🖼</Text>
                        <Text style={styles.generateFrameText}>Generate Storyboard Frame</Text>
                      </>
                    )}
                  </Pressable>
                )}

                <Text style={styles.sceneDesc}>{scene.description}</Text>

                <View style={styles.sceneDetails}>
                  <View style={styles.sceneDetail}>
                    <Text style={styles.sceneDetailLabel}>📷 Camera</Text>
                    <Text style={styles.sceneDetailText}>{scene.cameraWork}</Text>
                  </View>
                  <View style={styles.sceneDetail}>
                    <Text style={styles.sceneDetailLabel}>💡 Lighting</Text>
                    <Text style={styles.sceneDetailText}>{scene.lighting}</Text>
                  </View>
                  <View style={[styles.sceneDetail, styles.keyVisualRow]}>
                    <Text style={styles.sceneDetailLabel}>⭐ Key Visual</Text>
                    <Text style={[styles.sceneDetailText, { color: "#FFD700" }]}>{scene.keyVisual}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Production Notes */}
            <View style={styles.productionCard}>
              <Text style={styles.productionLabel}>Production Notes</Text>
              <Text style={styles.productionText}>{concept.productionNotes}</Text>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Estimated Budget</Text>
                <Text style={styles.budgetValue}>{concept.estimatedBudget}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]} onPress={handleShare}>
                <IconSymbol name="square.and.arrow.up" size={18} color="#F5F5F5" />
                <Text style={styles.actionBtnText}>Share</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.8 }]}
                onPress={() => { setActiveView("form"); setConcept(null); }}
              >
                <Text style={styles.actionBtnTextDark}>New Concept</Text>
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
  sectionLabel: { color: "#9CA3AF", fontSize: 12, fontWeight: "700", letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  emptyTracks: { backgroundColor: "#111118", borderRadius: 12, padding: 20, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#2A2A35" },
  emptyTracksText: { color: "#6B7280", fontSize: 13 },
  trackRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#111118", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#2A2A35" },
  trackRowSelected: { borderColor: "#C41E3A", backgroundColor: "#1A0A0E" },
  trackRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#2A2A35", alignItems: "center", justifyContent: "center" },
  trackRadioActive: { borderColor: "#C41E3A" },
  trackRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#C41E3A" },
  trackInfo: { flex: 1 },
  trackTitle: { color: "#F5F5F5", fontSize: 13, fontWeight: "600" },
  trackMeta: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  styleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  styleCard: { width: "30%", backgroundColor: "#111118", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#2A2A35", alignItems: "center" },
  styleCardActive: { borderColor: "#FFD700", backgroundColor: "#1A1500" },
  styleEmoji: { fontSize: 22, marginBottom: 4 },
  styleLabel: { color: "#F5F5F5", fontSize: 12, fontWeight: "700", textAlign: "center" },
  styleDesc: { color: "#6B7280", fontSize: 10, textAlign: "center", marginTop: 2 },
  paletteGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  paletteCard: { width: "30%", backgroundColor: "#111118", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#2A2A35", alignItems: "center" },
  paletteCardActive: { borderColor: "#FFD700" },
  paletteSwatches: { flexDirection: "row", gap: 3, marginBottom: 6 },
  swatch: { width: 14, height: 14, borderRadius: 3 },
  paletteName: { color: "#9CA3AF", fontSize: 11, fontWeight: "600" },
  input: { backgroundColor: "#111118", borderRadius: 12, borderWidth: 1, borderColor: "#2A2A35", color: "#F5F5F5", fontSize: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, textAlignVertical: "top" },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#FFD700", borderRadius: 16, paddingVertical: 18, marginTop: 8 },
  generateBtnEmoji: { fontSize: 20 },
  generateBtnText: { color: "#0A0A0F", fontSize: 16, fontWeight: "900" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loglineCard: { backgroundColor: "#111118", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: "#C41E3A" },
  loglineLabel: { color: "#C41E3A", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 8 },
  loglineText: { color: "#F5F5F5", fontSize: 16, fontWeight: "700", lineHeight: 24 },
  themeCard: { backgroundColor: "#111118", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#2A2A35" },
  themeLabel: { color: "#9CA3AF", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 },
  themeText: { color: "#E5E7EB", fontSize: 13, lineHeight: 20 },
  paletteDisplay: { backgroundColor: "#111118", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#2A2A35" },
  paletteSwatchRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  paletteSwatchLarge: { alignItems: "center", gap: 4 },
  swatchLarge: { width: 36, height: 36, borderRadius: 8 },
  swatchHex: { color: "#6B7280", fontSize: 9 },
  scenesTitle: { color: "#F5F5F5", fontSize: 15, fontWeight: "700", marginBottom: 12, marginTop: 4 },
  sceneCard: { backgroundColor: "#111118", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#2A2A35" },
  sceneHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sceneNumberBadge: { backgroundColor: "#C41E3A22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#C41E3A" },
  sceneNumber: { color: "#C41E3A", fontSize: 12, fontWeight: "800" },
  sceneTimestamp: { color: "#6B7280", fontSize: 12 },
  storyboardImage: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
  generateFrameBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#0A0A0F", borderRadius: 10, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: "#2A2A35", borderStyle: "dashed" },
  generateFrameEmoji: { fontSize: 16 },
  generateFrameText: { color: "#6B7280", fontSize: 12 },
  sceneDesc: { color: "#E5E7EB", fontSize: 13, lineHeight: 20, marginBottom: 10 },
  sceneDetails: { gap: 8 },
  sceneDetail: { backgroundColor: "#0A0A0F", borderRadius: 8, padding: 10 },
  keyVisualRow: { borderColor: "#FFD70033", borderWidth: 1 },
  sceneDetailLabel: { color: "#6B7280", fontSize: 11, fontWeight: "700", marginBottom: 3 },
  sceneDetailText: { color: "#9CA3AF", fontSize: 12, lineHeight: 18 },
  productionCard: { backgroundColor: "#111118", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#2A2A35" },
  productionLabel: { color: "#9CA3AF", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8 },
  productionText: { color: "#E5E7EB", fontSize: 13, lineHeight: 20, marginBottom: 12 },
  budgetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#2A2A35" },
  budgetLabel: { color: "#9CA3AF", fontSize: 13 },
  budgetValue: { color: "#34D399", fontSize: 14, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#111118", borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: "#2A2A35" },
  actionBtnPrimary: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  actionBtnText: { color: "#F5F5F5", fontSize: 14, fontWeight: "700" },
  actionBtnTextDark: { color: "#0A0A0F", fontSize: 14, fontWeight: "700" },
});
