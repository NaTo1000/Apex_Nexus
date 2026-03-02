import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLibrary } from "@/lib/store/library-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudioTrack {
  id: string;
  name: string;
  color: string;
  uri: string | null;
  duration: number;   // seconds
  volume: number;     // 0–1
  muted: boolean;
  solo: boolean;
  recordedAt: string | null;
}

interface OwnershipCertificate {
  id: string;
  trackName: string;
  artistName: string;
  sessionId: string;
  issuedAt: string;
  uniqueId: string;
  tier: "record" | "bundle";
}

const TRACK_COLORS = ["#C41E3A", "#FFD700", "#A78BFA", "#34D399", "#60A5FA", "#F97316", "#F472B6", "#22D3EE"];
const STORAGE_KEY = "@dropai_studio_sessions_v1";
const CERTS_KEY = "@dropai_ownership_certs_v1";

function generateUniqueId(): string {
  return `DROPAI-OWN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecordingStudioScreen() {
  const router = useRouter();
  const { addTrack } = useLibrary();

  const [sessionName, setSessionName] = useState("New Session");
  const [artistName, setArtistName] = useState("");
  const [tracks, setTracks] = useState<StudioTrack[]>([
    { id: "1", name: "Track 1", color: TRACK_COLORS[0], uri: null, duration: 0, volume: 1, muted: false, solo: false, recordedAt: null },
  ]);
  const [activeTrackId, setActiveTrackId] = useState<string>("1");
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [bpm, setBpm] = useState(120);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [certificates, setCertificates] = useState<OwnershipCertificate[]>([]);
  const [activeView, setActiveView] = useState<"studio" | "certs">("studio");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const elapsedRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio recorder — HIGH_QUALITY = 44.1kHz, 128kbps AAC (best available in expo-audio)
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    (async () => {
      const { granted } = await requestRecordingPermissionsAsync();
      setHasPermission(granted);
      if (granted) {
        await setAudioModeAsync({ playsInSilentMode: true });
      }
    })();
    loadCertificates();
  }, []);

  async function loadCertificates() {
    try {
      const raw = await AsyncStorage.getItem(CERTS_KEY);
      if (raw) setCertificates(JSON.parse(raw));
    } catch {}
  }

  async function saveCertificate(cert: OwnershipCertificate) {
    try {
      const existing = await AsyncStorage.getItem(CERTS_KEY);
      const list: OwnershipCertificate[] = existing ? JSON.parse(existing) : [];
      const updated = [cert, ...list];
      await AsyncStorage.setItem(CERTS_KEY, JSON.stringify(updated));
      setCertificates(updated);
    } catch {}
  }

  const activeTrack = tracks.find((t) => t.id === activeTrackId);

  const handleAddTrack = useCallback(() => {
    if (tracks.length >= 8) {
      Alert.alert("Track Limit", "Maximum 8 tracks per session.");
      return;
    }
    const newTrack: StudioTrack = {
      id: Date.now().toString(),
      name: `Track ${tracks.length + 1}`,
      color: TRACK_COLORS[tracks.length % TRACK_COLORS.length],
      uri: null,
      duration: 0,
      volume: 1,
      muted: false,
      solo: false,
      recordedAt: null,
    };
    setTracks((prev) => [...prev, newTrack]);
    setActiveTrackId(newTrack.id);
  }, [tracks]);

  const handleStartRecording = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert("Permission Required", "Microphone access is required to record.");
      return;
    }
    if (!activeTrack) return;

    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      elapsedRef.current = 0;
      setElapsed(0);
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      }, 1000);
    } catch (e) {
      Alert.alert("Recording Error", "Could not start recording. Please check microphone permissions.");
    }
  }, [hasPermission, activeTrack, audioRecorder]);

  const handleStopRecording = useCallback(async () => {
    if (!isRecording) return;
    try {
      await audioRecorder.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);

      const uri = audioRecorder.uri;
      if (uri && activeTrackId) {
        const dur = elapsedRef.current;
        setTracks((prev) =>
          prev.map((t) =>
            t.id === activeTrackId
              ? { ...t, uri, duration: dur, recordedAt: new Date().toISOString() }
              : t
          )
        );
      }
    } catch (e) {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording, audioRecorder, activeTrackId]);

  const handleDeleteTrack = useCallback((id: string) => {
    Alert.alert("Delete Track", "Remove this track from the session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setTracks((prev) => prev.filter((t) => t.id !== id));
          if (activeTrackId === id) {
            setActiveTrackId(tracks.find((t) => t.id !== id)?.id ?? "");
          }
        },
      },
    ]);
  }, [activeTrackId, tracks]);

  const handleSaveToLibrary = useCallback(() => {
    const recordedTracks = tracks.filter((t) => t.uri);
    if (recordedTracks.length === 0) {
      Alert.alert("No Recordings", "Record at least one track before saving.");
      return;
    }

    Alert.alert(
      "Save Session",
      `Save "${sessionName}" to your library?\n\nChoose ownership option:`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save Free",
          onPress: () => doSaveToLibrary(recordedTracks, "free"),
        },
        {
          text: "Record & Own ($3)",
          onPress: () => {
            (router as any).push({
              pathname: "/payments",
              params: { tierId: "recording_single", price: 300, context: "recording" },
            });
          },
        },
        {
          text: "Ownership Bundle ($23)",
          onPress: () => {
            (router as any).push({
              pathname: "/payments",
              params: { tierId: "ownership_bundle", price: 2300, context: "recording" },
            });
          },
        },
      ]
    );
  }, [tracks, sessionName, router]);

  const doSaveToLibrary = useCallback(
    (recordedTracks: StudioTrack[], tier: "free" | "record" | "bundle") => {
      // Save first recorded track to library
      const primary = recordedTracks[0];
      if (!primary.uri) return;

      addTrack({
        id: `studio-${Date.now()}`,
        title: sessionName,
        artist: artistName || "Unknown Artist",
        album: "Studio Session",
        duration: primary.duration,
        format: "WAV",
        quality: "studio",
        fileSize: 0,
        fileUri: primary.uri ?? "",
        artworkUri: null,
        genre: "",
        bpm: bpm,
        key: "",
        sampleRate: 44100,
        bitDepth: 16,
        masteringStatus: "unmastered",
        masteringPreset: null,
        uploadedAt: new Date().toISOString(),
        plays: 0,
        lufsTarget: null,
        lufsAchieved: null,
        truePeak: null,
      });

      if (tier !== "free") {
        const cert: OwnershipCertificate = {
          id: `cert-${Date.now()}`,
          trackName: sessionName,
          artistName: artistName || "Unknown Artist",
          sessionId: `SESSION-${Date.now().toString(36).toUpperCase()}`,
          issuedAt: new Date().toISOString(),
          uniqueId: generateUniqueId(),
          tier,
        };
        saveCertificate(cert);
        Alert.alert(
          "Saved & Ownership Registered",
          `"${sessionName}" has been saved to your library.\n\nOwnership Certificate ID:\n${cert.uniqueId}`,
          [{ text: "Done", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Saved", `"${sessionName}" has been saved to your library.`, [
          { text: "Done", onPress: () => router.back() },
        ]);
      }
    },
    [sessionName, artistName, bpm, addTrack, router]
  );

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
            <Text style={styles.headerTitle}>Recording Studio</Text>
            <Text style={styles.headerSub}>24-bit · 44.1kHz · High Quality</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]} onPress={handleSaveToLibrary}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <Pressable style={[styles.tab, activeView === "studio" && styles.activeTab]} onPress={() => setActiveView("studio")}>
            <Text style={[styles.tabText, activeView === "studio" && styles.activeTabText]}>Studio</Text>
          </Pressable>
          <Pressable style={[styles.tab, activeView === "certs" && styles.activeTab]} onPress={() => setActiveView("certs")}>
            <Text style={[styles.tabText, activeView === "certs" && styles.activeTabText]}>
              Certificates {certificates.length > 0 ? `(${certificates.length})` : ""}
            </Text>
          </Pressable>
        </View>

        {/* ── STUDIO VIEW ── */}
        {activeView === "studio" && (
          <>
            {/* Permission Warning */}
            {hasPermission === false && (
              <View style={styles.permissionWarning}>
                <IconSymbol name="mic.slash.fill" size={16} color="#C41E3A" />
                <Text style={styles.permissionText}>Microphone permission denied. Enable it in Settings to record.</Text>
              </View>
            )}

            {/* Session Info */}
            <View style={styles.sessionCard}>
              <View style={styles.sessionField}>
                <Text style={styles.fieldLabel}>Session Name</Text>
                <TextInput
                  style={styles.sessionInput}
                  value={sessionName}
                  onChangeText={setSessionName}
                  placeholder="Session name..."
                  placeholderTextColor="#4B5563"
                  returnKeyType="done"
                />
              </View>
              <View style={styles.sessionField}>
                <Text style={styles.fieldLabel}>Artist Name</Text>
                <TextInput
                  style={styles.sessionInput}
                  value={artistName}
                  onChangeText={setArtistName}
                  placeholder="Your artist name..."
                  placeholderTextColor="#4B5563"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Transport Controls */}
            <View style={styles.transport}>
              {/* BPM */}
              <View style={styles.bpmControl}>
                <Pressable
                  style={({ pressed }) => [styles.bpmBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setBpm((b) => Math.max(40, b - 1))}
                >
                  <Text style={styles.bpmBtnText}>−</Text>
                </Pressable>
                <View style={styles.bpmDisplay}>
                  <Text style={styles.bpmValue}>{bpm}</Text>
                  <Text style={styles.bpmLabel}>BPM</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.bpmBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setBpm((b) => Math.min(240, b + 1))}
                >
                  <Text style={styles.bpmBtnText}>+</Text>
                </Pressable>
              </View>

              {/* Metronome */}
              <Pressable
                style={[styles.metronomeBtn, metronomeActive && styles.metronomeBtnActive]}
                onPress={() => setMetronomeActive((v) => !v)}
              >
                <Text style={styles.metronomeEmoji}>🎵</Text>
                <Text style={[styles.metronomeText, metronomeActive && { color: "#FFD700" }]}>
                  {metronomeActive ? "Click ON" : "Click OFF"}
                </Text>
              </Pressable>

              {/* Record Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.recordBtn,
                  isRecording && styles.recordBtnActive,
                  pressed && { opacity: 0.85 },
                  !hasPermission && { opacity: 0.4 },
                ]}
                onPress={isRecording ? handleStopRecording : handleStartRecording}
                disabled={!hasPermission}
              >
                <View style={[styles.recordDot, isRecording && styles.recordDotActive]} />
                <Text style={styles.recordBtnText}>{isRecording ? "STOP" : "REC"}</Text>
              </Pressable>
            </View>

            {/* Recording Timer */}
            {isRecording && (
              <View style={styles.timerBar}>
                <View style={styles.timerDot} />
                <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
                <Text style={styles.timerLabel}>Recording...</Text>
              </View>
            )}

            {/* Track List */}
            <View style={styles.tracksHeader}>
              <Text style={styles.tracksTitle}>Tracks ({tracks.length}/8)</Text>
              <Pressable style={({ pressed }) => [styles.addTrackBtn, pressed && { opacity: 0.7 }]} onPress={handleAddTrack}>
                <IconSymbol name="plus.circle" size={16} color="#C41E3A" />
                <Text style={styles.addTrackText}>Add Track</Text>
              </Pressable>
            </View>

            {tracks.map((track) => (
              <Pressable
                key={track.id}
                style={[styles.trackRow, activeTrackId === track.id && styles.trackRowActive]}
                onPress={() => setActiveTrackId(track.id)}
              >
                {/* Color indicator */}
                <View style={[styles.trackColor, { backgroundColor: track.color }]} />

                {/* Track info */}
                <View style={styles.trackInfo}>
                  <Text style={styles.trackName}>{track.name}</Text>
                  {track.uri ? (
                    <Text style={styles.trackDuration}>{formatDuration(track.duration)} · Recorded</Text>
                  ) : (
                    <Text style={styles.trackEmpty}>No recording</Text>
                  )}
                </View>

                {/* Controls */}
                <View style={styles.trackControls}>
                  <Pressable
                    style={[styles.trackControlBtn, track.muted && styles.trackControlBtnActive]}
                    onPress={() => setTracks((prev) => prev.map((t) => t.id === track.id ? { ...t, muted: !t.muted } : t))}
                  >
                    <Text style={styles.trackControlText}>M</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.trackControlBtn, track.solo && { backgroundColor: "#FFD700" }]}
                    onPress={() => setTracks((prev) => prev.map((t) => t.id === track.id ? { ...t, solo: !t.solo } : t))}
                  >
                    <Text style={[styles.trackControlText, track.solo && { color: "#0A0A0F" }]}>S</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.trackDeleteBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => handleDeleteTrack(track.id)}
                  >
                    <IconSymbol name="trash" size={14} color="#6B7280" />
                  </Pressable>
                </View>
              </Pressable>
            ))}

            {/* Quality Info */}
            <View style={styles.qualityCard}>
              <Text style={styles.qualityTitle}>Studio Quality Settings</Text>
              <View style={styles.qualityGrid}>
                {[
                  { label: "Sample Rate", value: "44.1 kHz" },
                  { label: "Bit Depth", value: "16-bit" },
                  { label: "Format", value: "AAC/M4A" },
                  { label: "Channels", value: "Stereo" },
                ].map((q) => (
                  <View key={q.label} style={styles.qualityItem}>
                    <Text style={styles.qualityLabel}>{q.label}</Text>
                    <Text style={styles.qualityValue}>{q.value}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.qualityNote}>
                DROPAi records at the highest quality supported by your device. AI mastering upgrades to 24-bit/96kHz studio standard.
              </Text>
            </View>

            {/* Ownership Info */}
            <View style={styles.ownershipCard}>
              <Text style={styles.ownershipTitle}>Track Ownership</Text>
              <View style={styles.ownershipTiers}>
                <View style={styles.ownershipTier}>
                  <Text style={styles.ownershipPrice}>$3</Text>
                  <Text style={styles.ownershipTierName}>Record & Own</Text>
                  <Text style={styles.ownershipTierDesc}>Ownership certificate per song</Text>
                </View>
                <View style={[styles.ownershipTier, styles.ownershipTierHighlight]}>
                  <Text style={[styles.ownershipPrice, { color: "#60A5FA" }]}>$23</Text>
                  <Text style={styles.ownershipTierName}>Bundle</Text>
                  <Text style={styles.ownershipTierDesc}>Full ownership + PDF certificate</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* ── CERTIFICATES VIEW ── */}
        {activeView === "certs" && (
          <>
            <Text style={styles.certsTitle}>Ownership Certificates</Text>
            {certificates.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📜</Text>
                <Text style={styles.emptyTitle}>No certificates yet</Text>
                <Text style={styles.emptyText}>Record a track and choose an ownership option to generate your certificate.</Text>
              </View>
            ) : (
              certificates.map((cert) => (
                <View key={cert.id} style={styles.certCard}>
                  <View style={styles.certHeader}>
                    <Text style={styles.certBadge}>
                      {cert.tier === "bundle" ? "OWNERSHIP BUNDLE" : "RECORD & OWN"}
                    </Text>
                    <Text style={styles.certDate}>{new Date(cert.issuedAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.certTrackName}>{cert.trackName}</Text>
                  <Text style={styles.certArtist}>by {cert.artistName}</Text>
                  <View style={styles.certIdRow}>
                    <Text style={styles.certIdLabel}>Certificate ID</Text>
                    <Text style={styles.certId}>{cert.uniqueId}</Text>
                  </View>
                  <View style={styles.certIdRow}>
                    <Text style={styles.certIdLabel}>Session ID</Text>
                    <Text style={styles.certSessionId}>{cert.sessionId}</Text>
                  </View>
                  <View style={styles.certFooter}>
                    <Text style={styles.certFooterText}>Issued by DROPAi · Timestamped on record</Text>
                  </View>
                </View>
              ))
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#F5F5F5", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "#34D399", fontSize: 11, marginTop: 1 },
  saveBtn: { backgroundColor: "#C41E3A", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  saveBtnText: { color: "#F5F5F5", fontSize: 13, fontWeight: "700" },
  tabBar: { flexDirection: "row", backgroundColor: "#111118", borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: "#2A2A35" },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#C41E3A" },
  tabText: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  activeTabText: { color: "#F5F5F5" },
  permissionWarning: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#C41E3A22", borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#C41E3A44" },
  permissionText: { color: "#F87171", fontSize: 12, flex: 1 },
  sessionCard: { backgroundColor: "#111118", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#2A2A35", gap: 10 },
  sessionField: {},
  fieldLabel: { color: "#9CA3AF", fontSize: 11, fontWeight: "700", marginBottom: 6 },
  sessionInput: { backgroundColor: "#0A0A0F", borderRadius: 10, borderWidth: 1, borderColor: "#2A2A35", color: "#F5F5F5", fontSize: 14, paddingHorizontal: 12, paddingVertical: 10 },
  transport: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#111118", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#2A2A35" },
  bpmControl: { flexDirection: "row", alignItems: "center", gap: 10 },
  bpmBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#2A2A35", alignItems: "center", justifyContent: "center" },
  bpmBtnText: { color: "#F5F5F5", fontSize: 18, fontWeight: "700" },
  bpmDisplay: { alignItems: "center" },
  bpmValue: { color: "#F5F5F5", fontSize: 20, fontWeight: "900" },
  bpmLabel: { color: "#6B7280", fontSize: 10 },
  metronomeBtn: { alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#2A2A35" },
  metronomeBtnActive: { borderColor: "#FFD700", backgroundColor: "#FFD70011" },
  metronomeEmoji: { fontSize: 18 },
  metronomeText: { color: "#9CA3AF", fontSize: 10, fontWeight: "600" },
  recordBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#1A0A0E", borderWidth: 2, borderColor: "#C41E3A", alignItems: "center", justifyContent: "center", gap: 4 },
  recordBtnActive: { backgroundColor: "#C41E3A" },
  recordDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#C41E3A" },
  recordDotActive: { backgroundColor: "#F5F5F5", borderRadius: 2 },
  recordBtnText: { color: "#F5F5F5", fontSize: 10, fontWeight: "900" },
  timerBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#C41E3A22", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#C41E3A44" },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C41E3A" },
  timerText: { color: "#F5F5F5", fontSize: 22, fontWeight: "900", fontVariant: ["tabular-nums"] },
  timerLabel: { color: "#C41E3A", fontSize: 12, fontWeight: "600" },
  tracksHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  tracksTitle: { color: "#F5F5F5", fontSize: 15, fontWeight: "700" },
  addTrackBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  addTrackText: { color: "#C41E3A", fontSize: 13, fontWeight: "600" },
  trackRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#111118", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#2A2A35" },
  trackRowActive: { borderColor: "#C41E3A", backgroundColor: "#1A0A0E" },
  trackColor: { width: 4, height: 40, borderRadius: 2 },
  trackInfo: { flex: 1 },
  trackName: { color: "#F5F5F5", fontSize: 13, fontWeight: "600" },
  trackDuration: { color: "#34D399", fontSize: 11, marginTop: 2 },
  trackEmpty: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  trackControls: { flexDirection: "row", gap: 6, alignItems: "center" },
  trackControlBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#2A2A35", alignItems: "center", justifyContent: "center" },
  trackControlBtnActive: { backgroundColor: "#C41E3A" },
  trackControlText: { color: "#F5F5F5", fontSize: 11, fontWeight: "800" },
  trackDeleteBtn: { width: 28, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  qualityCard: { backgroundColor: "#111118", borderRadius: 14, padding: 14, marginTop: 8, marginBottom: 12, borderWidth: 1, borderColor: "#2A2A35" },
  qualityTitle: { color: "#F5F5F5", fontSize: 13, fontWeight: "700", marginBottom: 12 },
  qualityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  qualityItem: { width: "47%", backgroundColor: "#0A0A0F", borderRadius: 8, padding: 10 },
  qualityLabel: { color: "#6B7280", fontSize: 10, fontWeight: "600" },
  qualityValue: { color: "#34D399", fontSize: 14, fontWeight: "700", marginTop: 2 },
  qualityNote: { color: "#6B7280", fontSize: 11, lineHeight: 17 },
  ownershipCard: { backgroundColor: "#111118", borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2A2A35" },
  ownershipTitle: { color: "#F5F5F5", fontSize: 13, fontWeight: "700", marginBottom: 12 },
  ownershipTiers: { flexDirection: "row", gap: 10 },
  ownershipTier: { flex: 1, backgroundColor: "#0A0A0F", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#2A2A35" },
  ownershipTierHighlight: { borderColor: "#60A5FA44" },
  ownershipPrice: { color: "#34D399", fontSize: 22, fontWeight: "900" },
  ownershipTierName: { color: "#F5F5F5", fontSize: 13, fontWeight: "700", marginTop: 2 },
  ownershipTierDesc: { color: "#6B7280", fontSize: 11, marginTop: 3 },
  certsTitle: { color: "#F5F5F5", fontSize: 15, fontWeight: "700", marginBottom: 16 },
  emptyState: { alignItems: "center", padding: 40, gap: 10 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: "#F5F5F5", fontSize: 16, fontWeight: "600" },
  emptyText: { color: "#6B7280", fontSize: 13, textAlign: "center", lineHeight: 20 },
  certCard: { backgroundColor: "#111118", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: "#FFD70044" },
  certHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  certBadge: { color: "#FFD700", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  certDate: { color: "#6B7280", fontSize: 11 },
  certTrackName: { color: "#F5F5F5", fontSize: 18, fontWeight: "800" },
  certArtist: { color: "#9CA3AF", fontSize: 13, marginTop: 2, marginBottom: 12 },
  certIdRow: { backgroundColor: "#0A0A0F", borderRadius: 8, padding: 10, marginBottom: 6 },
  certIdLabel: { color: "#6B7280", fontSize: 10, fontWeight: "700", marginBottom: 3 },
  certId: { color: "#FFD700", fontSize: 13, fontWeight: "700", fontVariant: ["tabular-nums"] },
  certSessionId: { color: "#9CA3AF", fontSize: 12 },
  certFooter: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#2A2A35" },
  certFooterText: { color: "#6B7280", fontSize: 11, textAlign: "center" },
});
