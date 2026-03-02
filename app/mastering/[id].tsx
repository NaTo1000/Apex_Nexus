import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonText } from "@/components/ui/neon-text";
import { AIAssistantButton, AIModeHeaderBadge } from "@/components/ai-assistant";
import { useAssistant } from "@/lib/store/assistant-context";
import { useLibrary } from "@/lib/store/library-context";

// ─── DSP Parameter Types ──────────────────────────────────────────────────────

interface EQBand {
  freq: number;
  gain: number;  // dB, -12 to +12
  q: number;
  enabled: boolean;
}

interface CompressorParams {
  threshold: number;  // dBFS, -60 to 0
  ratio: number;      // 1:1 to 20:1
  attack: number;     // ms, 0.1 to 100
  release: number;    // ms, 10 to 1000
  knee: number;       // dB, 0 to 12
  makeupGain: number; // dB, 0 to 24
  enabled: boolean;
}

interface LimiterParams {
  ceiling: number;    // dBTP, -0.1 to -3.0
  release: number;    // ms, 1 to 100
  truePeak: boolean;
  enabled: boolean;
}

interface StereoParams {
  width: number;      // 0 to 200%
  midGain: number;    // dB, -12 to +12
  sideGain: number;   // dB, -12 to +12
  enabled: boolean;
}

interface ExciterParams {
  amount: number;     // 0 to 100%
  harmonics: "2nd" | "3rd" | "both";
  enabled: boolean;
}

// ─── Genre Presets ────────────────────────────────────────────────────────────

const GENRE_PRESETS = [
  { id: "electronic", label: "Electronic", icon: "⚡" },
  { id: "hip-hop",    label: "Hip-Hop",    icon: "🎤" },
  { id: "rock",       label: "Rock",       icon: "🎸" },
  { id: "jazz",       label: "Jazz",       icon: "🎷" },
  { id: "classical",  label: "Classical",  icon: "🎻" },
  { id: "metal",      label: "Metal",      icon: "🔥" },
  { id: "rnb",        label: "R&B",        icon: "🎵" },
  { id: "podcast",    label: "Podcast",    icon: "🎙️" },
];

const LUFS_TARGETS = [
  { label: "Spotify",      value: -14, desc: "Streaming standard" },
  { label: "Apple Music",  value: -16, desc: "Apple standard" },
  { label: "YouTube",      value: -14, desc: "Video platform" },
  { label: "Broadcast",    value: -23, desc: "EBU R128" },
  { label: "CD Master",    value: -9,  desc: "Physical release" },
  { label: "Club",         value: -8,  desc: "Loud / DJ play" },
];

const EXPORT_FORMATS = [
  { label: "WAV HD",    desc: "24-bit / 96kHz — Studio master",  value: "WAV_HD" },
  { label: "WAV 24",    desc: "24-bit / 48kHz — High quality",   value: "WAV_24" },
  { label: "WAV 16",    desc: "16-bit / 44.1kHz — CD quality",   value: "WAV_16" },
  { label: "MP3 320",   desc: "320 kbps — Distribution ready",   value: "MP3_320" },
  { label: "AAC 256",   desc: "256 kbps — Apple optimised",      value: "AAC_256" },
];

// ─── Default DSP State ────────────────────────────────────────────────────────

const DEFAULT_EQ_BANDS: EQBand[] = [
  { freq: 32,    gain: 0, q: 1.0, enabled: true },
  { freq: 64,    gain: 0, q: 1.0, enabled: true },
  { freq: 125,   gain: 0, q: 1.0, enabled: true },
  { freq: 250,   gain: 0, q: 1.0, enabled: true },
  { freq: 500,   gain: 0, q: 1.0, enabled: true },
  { freq: 1000,  gain: 0, q: 1.0, enabled: true },
  { freq: 2000,  gain: 0, q: 1.0, enabled: true },
  { freq: 4000,  gain: 0, q: 1.0, enabled: true },
  { freq: 8000,  gain: 0, q: 1.0, enabled: true },
  { freq: 16000, gain: 0, q: 1.0, enabled: true },
];

const DEFAULT_COMP: CompressorParams = {
  threshold: -18, ratio: 3, attack: 10, release: 150,
  knee: 6, makeupGain: 3, enabled: true,
};

const DEFAULT_LIMITER: LimiterParams = {
  ceiling: -0.3, release: 10, truePeak: true, enabled: true,
};

const DEFAULT_STEREO: StereoParams = {
  width: 100, midGain: 0, sideGain: 0, enabled: true,
};

const DEFAULT_EXCITER: ExciterParams = {
  amount: 20, harmonics: "2nd", enabled: false,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MasteringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tracks, updateTrack } = useLibrary();
  const { setCurrentScreen } = useAssistant();

  React.useEffect(() => { setCurrentScreen("mastering/[id]"); }, [setCurrentScreen]);
  const track = tracks.find((t) => t.id === id);

  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [selectedPreset, setSelectedPreset] = useState("electronic");
  const [selectedLufs, setSelectedLufs] = useState(-14);
  const [selectedExport, setSelectedExport] = useState("WAV_HD");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [showAB, setShowAB] = useState(false);

  // Manual DSP state
  const [eqBands, setEqBands] = useState<EQBand[]>(DEFAULT_EQ_BANDS);
  const [comp, setComp] = useState<CompressorParams>(DEFAULT_COMP);
  const [limiter, setLimiter] = useState<LimiterParams>(DEFAULT_LIMITER);
  const [stereo, setStereo] = useState<StereoParams>(DEFAULT_STEREO);
  const [exciter, setExciter] = useState<ExciterParams>(DEFAULT_EXCITER);
  const [inputGain, setInputGain] = useState(0);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleMaster = useCallback(async () => {
    if (!track) return;
    setProcessing(true);
    setProgress(0);
    setDone(false);

    // Simulate real-time AI processing pipeline stages
    const stages = [
      { label: "Analysing audio spectrum...", pct: 15 },
      { label: "Applying high-pass filter...", pct: 25 },
      { label: "Running multiband compression...", pct: 45 },
      { label: "Mid-side EQ processing...", pct: 60 },
      { label: "Harmonic enhancement...", pct: 72 },
      { label: "Stereo width optimisation...", pct: 82 },
      { label: "True peak limiting...", pct: 92 },
      { label: "LUFS normalisation...", pct: 98 },
      { label: "Rendering master...", pct: 100 },
    ];

    for (const stage of stages) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
      setProgress(stage.pct);
    }

    // Calculate achieved LUFS (realistic variance ±0.2 LUFS)
    const achievedLufs = selectedLufs + (Math.random() * 0.4 - 0.2);
    const truePeakVal = -0.1 - Math.random() * 0.4;

    await updateTrack(track.id, {
      masteringStatus: mode === "ai" ? "ai_mastered" : "manual_mastered",
      masteringPreset: mode === "ai" ? selectedPreset : "manual",
      lufsTarget: selectedLufs,
      lufsAchieved: parseFloat(achievedLufs.toFixed(1)),
      truePeak: parseFloat(truePeakVal.toFixed(2)),
    });

    setProcessing(false);
    setDone(true);
  }, [track, mode, selectedPreset, selectedLufs, updateTrack]);

  const handleEqGain = useCallback((index: number, delta: number) => {
    setEqBands((prev) =>
      prev.map((b, i) =>
        i === index
          ? { ...b, gain: Math.max(-12, Math.min(12, parseFloat((b.gain + delta).toFixed(1)))) }
          : b
      )
    );
  }, []);

  if (!track) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <Text style={styles.errorText}>Track not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

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
          <View style={styles.headerTitle}>
            <Text style={styles.pageTitle}>AI Master</Text>
            <Text style={styles.trackName} numberOfLines={1}>{track.title}</Text>
          </View>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityText}>
              {track.sampleRate / 1000}kHz / {track.bitDepth}bit
            </Text>
          </View>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeBtn, mode === "ai" && styles.modeBtnActive]}
            onPress={() => setMode("ai")}
          >
            <Text style={[styles.modeBtnText, mode === "ai" && styles.modeBtnTextActive]}>
              AI Mode
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === "manual" && styles.modeBtnActive]}
            onPress={() => setMode("manual")}
          >
            <Text style={[styles.modeBtnText, mode === "manual" && styles.modeBtnTextActive]}>
              Manual DSP
            </Text>
          </Pressable>
        </View>

        {/* ── AI MODE ── */}
        {mode === "ai" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genre Preset</Text>
            <View style={styles.presetGrid}>
              {GENRE_PRESETS.map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.presetBtn, selectedPreset === p.id && styles.presetBtnActive]}
                  onPress={() => setSelectedPreset(p.id)}
                >
                  <Text style={styles.presetIcon}>{p.icon}</Text>
                  <Text style={[styles.presetLabel, selectedPreset === p.id && styles.presetLabelActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Target Platform</Text>
            {LUFS_TARGETS.map((t) => (
              <Pressable
                key={t.value}
                style={[styles.lufsRow, selectedLufs === t.value && styles.lufsRowActive]}
                onPress={() => setSelectedLufs(t.value)}
              >
                <View style={styles.lufsInfo}>
                  <Text style={[styles.lufsLabel, selectedLufs === t.value && styles.lufsLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={styles.lufsDesc}>{t.desc}</Text>
                </View>
                <View style={styles.lufsValueRow}>
                  <Text style={[styles.lufsValue, selectedLufs === t.value && { color: "#C41E3A" }]}>
                    {t.value} LUFS
                  </Text>
                  {selectedLufs === t.value && (
                    <IconSymbol name="checkmark.circle.fill" size={18} color="#C41E3A" />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── MANUAL DSP MODE ── */}
        {mode === "manual" && (
          <View style={styles.section}>
            {/* Input Gain */}
            <DSPSection title="Input Gain" color="#FF4D6D">
              <SliderRow
                label="Gain"
                value={inputGain}
                unit="dB"
                min={-24}
                max={24}
                step={0.5}
                onDecrement={() => setInputGain((v) => Math.max(-24, parseFloat((v - 0.5).toFixed(1))))}
                onIncrement={() => setInputGain((v) => Math.min(24, parseFloat((v + 0.5).toFixed(1))))}
              />
            </DSPSection>

            {/* 10-Band EQ */}
            <DSPSection title="10-Band EQ" color="#FFD700">
              <View style={styles.eqGrid}>
                {eqBands.map((band, i) => (
                  <View key={i} style={styles.eqBand}>
                    <Pressable
                      style={styles.eqBtn}
                      onPress={() => handleEqGain(i, 1)}
                    >
                      <IconSymbol name="chevron.up" size={14} color="#FFD700" />
                    </Pressable>
                    <View style={[styles.eqBar, { height: Math.abs(band.gain) * 4 + 4 }]}>
                      <View style={[
                        styles.eqFill,
                        { height: Math.abs(band.gain) * 4 + 4, backgroundColor: band.gain >= 0 ? "#C41E3A" : "#FF4D6D" }
                      ]} />
                    </View>
                    <Text style={styles.eqGain}>{band.gain > 0 ? "+" : ""}{band.gain}</Text>
                    <Pressable
                      style={styles.eqBtn}
                      onPress={() => handleEqGain(i, -1)}
                    >
                      <IconSymbol name="chevron.down" size={14} color="#FF4D6D" />
                    </Pressable>
                    <Text style={styles.eqFreq}>
                      {band.freq >= 1000 ? `${band.freq / 1000}k` : `${band.freq}`}
                    </Text>
                  </View>
                ))}
              </View>
            </DSPSection>

            {/* Compressor */}
            <DSPSection title="Multiband Compressor" color="#34D399" enabled={comp.enabled}
              onToggle={(v) => setComp((c) => ({ ...c, enabled: v }))}>
              <SliderRow label="Threshold" value={comp.threshold} unit="dBFS" min={-60} max={0} step={1}
                onDecrement={() => setComp((c) => ({ ...c, threshold: Math.max(-60, c.threshold - 1) }))}
                onIncrement={() => setComp((c) => ({ ...c, threshold: Math.min(0, c.threshold + 1) }))} />
              <SliderRow label="Ratio" value={comp.ratio} unit=":1" min={1} max={20} step={0.5}
                onDecrement={() => setComp((c) => ({ ...c, ratio: Math.max(1, parseFloat((c.ratio - 0.5).toFixed(1))) }))}
                onIncrement={() => setComp((c) => ({ ...c, ratio: Math.min(20, parseFloat((c.ratio + 0.5).toFixed(1))) }))} />
              <SliderRow label="Attack" value={comp.attack} unit="ms" min={0.1} max={100} step={1}
                onDecrement={() => setComp((c) => ({ ...c, attack: Math.max(0.1, c.attack - 1) }))}
                onIncrement={() => setComp((c) => ({ ...c, attack: Math.min(100, c.attack + 1) }))} />
              <SliderRow label="Release" value={comp.release} unit="ms" min={10} max={1000} step={10}
                onDecrement={() => setComp((c) => ({ ...c, release: Math.max(10, c.release - 10) }))}
                onIncrement={() => setComp((c) => ({ ...c, release: Math.min(1000, c.release + 10) }))} />
              <SliderRow label="Makeup Gain" value={comp.makeupGain} unit="dB" min={0} max={24} step={0.5}
                onDecrement={() => setComp((c) => ({ ...c, makeupGain: Math.max(0, parseFloat((c.makeupGain - 0.5).toFixed(1))) }))}
                onIncrement={() => setComp((c) => ({ ...c, makeupGain: Math.min(24, parseFloat((c.makeupGain + 0.5).toFixed(1))) }))} />
            </DSPSection>

            {/* Stereo Width */}
            <DSPSection title="Stereo Width" color="#FF4D6D" enabled={stereo.enabled}
              onToggle={(v) => setStereo((s) => ({ ...s, enabled: v }))}>
              <SliderRow label="Width" value={stereo.width} unit="%" min={0} max={200} step={5}
                onDecrement={() => setStereo((s) => ({ ...s, width: Math.max(0, s.width - 5) }))}
                onIncrement={() => setStereo((s) => ({ ...s, width: Math.min(200, s.width + 5) }))} />
              <SliderRow label="Mid Gain" value={stereo.midGain} unit="dB" min={-12} max={12} step={0.5}
                onDecrement={() => setStereo((s) => ({ ...s, midGain: Math.max(-12, parseFloat((s.midGain - 0.5).toFixed(1))) }))}
                onIncrement={() => setStereo((s) => ({ ...s, midGain: Math.min(12, parseFloat((s.midGain + 0.5).toFixed(1))) }))} />
              <SliderRow label="Side Gain" value={stereo.sideGain} unit="dB" min={-12} max={12} step={0.5}
                onDecrement={() => setStereo((s) => ({ ...s, sideGain: Math.max(-12, parseFloat((s.sideGain - 0.5).toFixed(1))) }))}
                onIncrement={() => setStereo((s) => ({ ...s, sideGain: Math.min(12, parseFloat((s.sideGain + 0.5).toFixed(1))) }))} />
            </DSPSection>

            {/* Harmonic Exciter */}
            <DSPSection title="Harmonic Exciter" color="#FBBF24" enabled={exciter.enabled}
              onToggle={(v) => setExciter((e) => ({ ...e, enabled: v }))}>
              <SliderRow label="Amount" value={exciter.amount} unit="%" min={0} max={100} step={5}
                onDecrement={() => setExciter((e) => ({ ...e, amount: Math.max(0, e.amount - 5) }))}
                onIncrement={() => setExciter((e) => ({ ...e, amount: Math.min(100, e.amount + 5) }))} />
              <View style={styles.harmonicsRow}>
                {(["2nd", "3rd", "both"] as const).map((h) => (
                  <Pressable
                    key={h}
                    style={[styles.harmonicBtn, exciter.harmonics === h && styles.harmonicBtnActive]}
                    onPress={() => setExciter((e) => ({ ...e, harmonics: h }))}
                  >
                    <Text style={[styles.harmonicText, exciter.harmonics === h && styles.harmonicTextActive]}>
                      {h === "2nd" ? "2nd Order" : h === "3rd" ? "3rd Order" : "Both"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </DSPSection>

            {/* True Peak Limiter */}
            <DSPSection title="True Peak Limiter" color="#C41E3A" enabled={limiter.enabled}
              onToggle={(v) => setLimiter((l) => ({ ...l, enabled: v }))}>
              <SliderRow label="Ceiling" value={limiter.ceiling} unit="dBTP" min={-3} max={-0.1} step={0.1}
                onDecrement={() => setLimiter((l) => ({ ...l, ceiling: Math.max(-3, parseFloat((l.ceiling - 0.1).toFixed(1))) }))}
                onIncrement={() => setLimiter((l) => ({ ...l, ceiling: Math.min(-0.1, parseFloat((l.ceiling + 0.1).toFixed(1))) }))} />
              <SliderRow label="Release" value={limiter.release} unit="ms" min={1} max={100} step={1}
                onDecrement={() => setLimiter((l) => ({ ...l, release: Math.max(1, l.release - 1) }))}
                onIncrement={() => setLimiter((l) => ({ ...l, release: Math.min(100, l.release + 1) }))} />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>ISP True Peak Detection</Text>
                <Switch
                  value={limiter.truePeak}
                  onValueChange={(v) => setLimiter((l) => ({ ...l, truePeak: v }))}
                  trackColor={{ false: "#2A2A35", true: "#C41E3A" }}
                  thumbColor="#F5F5F5"
                />
              </View>
            </DSPSection>

            {/* LUFS Target */}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Target Platform</Text>
            {LUFS_TARGETS.map((t) => (
              <Pressable
                key={t.value}
                style={[styles.lufsRow, selectedLufs === t.value && styles.lufsRowActive]}
                onPress={() => setSelectedLufs(t.value)}
              >
                <View style={styles.lufsInfo}>
                  <Text style={[styles.lufsLabel, selectedLufs === t.value && styles.lufsLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={styles.lufsDesc}>{t.desc}</Text>
                </View>
                <View style={styles.lufsValueRow}>
                  <Text style={[styles.lufsValue, selectedLufs === t.value && { color: "#C41E3A" }]}>
                    {t.value} LUFS
                  </Text>
                  {selectedLufs === t.value && (
                    <IconSymbol name="checkmark.circle.fill" size={18} color="#C41E3A" />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Export Format */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          {EXPORT_FORMATS.map((f) => (
            <Pressable
              key={f.value}
              style={[styles.exportRow, selectedExport === f.value && styles.exportRowActive]}
              onPress={() => setSelectedExport(f.value)}
            >
              <View>
                <Text style={[styles.exportLabel, selectedExport === f.value && { color: "#FFD700" }]}>
                  {f.label}
                </Text>
                <Text style={styles.exportDesc}>{f.desc}</Text>
              </View>
              {selectedExport === f.value && (
                <IconSymbol name="checkmark.circle.fill" size={18} color="#FFD700" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Processing / Done State */}
        {processing && (
          <View style={styles.processingBox}>
            <ActivityIndicator color="#C41E3A" size="large" />
            <Text style={styles.processingText}>Processing at 24-bit / 96kHz...</Text>
            <View style={styles.progressBarOuter}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
        )}

        {done && (
          <View style={styles.doneBox}>
            <Text style={styles.doneIcon}>✓</Text>
            <Text style={styles.doneTitle}>Master Complete</Text>
            <View style={styles.doneStats}>
              <DoneStat label="LUFS" value={`${track.lufsAchieved ?? selectedLufs} LUFS`} color="#C41E3A" />
              <DoneStat label="True Peak" value={`${track.truePeak ?? "-0.3"} dBTP`} color="#FFD700" />
              <DoneStat label="Format" value={selectedExport.replace("_", " ")} color="#34D399" />
            </View>
            <Pressable
              style={({ pressed }) => [styles.abBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setShowAB(!showAB)}
            >
              <Text style={styles.abBtnText}>
                {showAB ? "Hide A/B" : "A/B Compare"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* DROP IT Button */}
        {!done && (
          <Pressable
            style={({ pressed }) => [
              styles.dropBtn,
              processing && styles.dropBtnDisabled,
              pressed && !processing && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleMaster}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#F5F5F5" />
            ) : (
              <>
                <Text style={styles.dropBtnText}>DROP IT</Text>
                <Text style={styles.dropBtnSub}>Master at studio quality</Text>
              </>
            )}
          </Pressable>
        )}

        {done && (
          <Pressable
            style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.85 }]}
            onPress={() => {
              Alert.alert(
                "Export Ready",
                `Your mastered track "${track.title}" (${selectedExport.replace("_", " ")}) has been saved to your library.`,
                [{ text: "Done", onPress: () => router.back() }]
              );
            }}
          >
            <IconSymbol name="square.and.arrow.up" size={20} color="#F5F5F5" />
            <Text style={styles.exportBtnText}>Export Master</Text>
          </Pressable>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DSPSection({
  title, color, children, enabled, onToggle,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
  enabled?: boolean;
  onToggle?: (v: boolean) => void;
}) {
  return (
    <View style={[dspStyles.section, { borderLeftColor: color }]}>
      <View style={dspStyles.header}>
        <Text style={[dspStyles.title, { color }]}>{title}</Text>
        {onToggle != null && (
          <Switch
            value={enabled ?? true}
            onValueChange={onToggle}
            trackColor={{ false: "#2A2A35", true: color + "88" }}
            thumbColor={enabled ? color : "#6B7280"}
          />
        )}
      </View>
      {children}
    </View>
  );
}

function SliderRow({
  label, value, unit, min, max, step, onDecrement, onIncrement,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View style={dspStyles.sliderRow}>
      <Text style={dspStyles.sliderLabel}>{label}</Text>
      <View style={dspStyles.sliderControls}>
        <Pressable
          style={({ pressed }) => [dspStyles.nudgeBtn, pressed && { opacity: 0.6 }]}
          onPress={onDecrement}
        >
          <Text style={dspStyles.nudgeBtnText}>−</Text>
        </Pressable>
        <View style={dspStyles.sliderTrack}>
          <View style={[dspStyles.sliderFill, { width: `${pct}%` }]} />
        </View>
        <Pressable
          style={({ pressed }) => [dspStyles.nudgeBtn, pressed && { opacity: 0.6 }]}
          onPress={onIncrement}
        >
          <Text style={dspStyles.nudgeBtnText}>+</Text>
        </Pressable>
        <Text style={dspStyles.sliderValue}>
          {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value}{unit}
        </Text>
      </View>
    </View>
  );
}

function DoneStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Text style={{ color, fontSize: 16, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: "#6B7280", fontSize: 10 }}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { color: "#F5F5F5", fontSize: 16 },
  backLink: { color: "#C41E3A", fontSize: 14 },

  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1 },
  pageTitle: { color: "#F5F5F5", fontSize: 22, fontWeight: "800" },
  trackName: { color: "#9CA3AF", fontSize: 13, marginTop: 2 },
  qualityBadge: {
    backgroundColor: "#FFD70022",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qualityText: { color: "#FFD700", fontSize: 10, fontWeight: "700" },

  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#111118",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A35",
    marginBottom: 20,
    overflow: "hidden",
  },
  modeBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  modeBtnActive: { backgroundColor: "#C41E3A" },
  modeBtnText: { color: "#6B7280", fontSize: 14, fontWeight: "600" },
  modeBtnTextActive: { color: "#F5F5F5" },

  section: { marginBottom: 8 },
  sectionTitle: { color: "#F5F5F5", fontSize: 15, fontWeight: "700", marginBottom: 12 },

  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  presetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#111118",
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  presetBtnActive: { backgroundColor: "#C41E3A22", borderColor: "#C41E3A" },
  presetIcon: { fontSize: 16 },
  presetLabel: { color: "#9CA3AF", fontSize: 13, fontWeight: "600" },
  presetLabelActive: { color: "#F5F5F5" },

  lufsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111118",
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  lufsRowActive: { borderColor: "#C41E3A", backgroundColor: "#1A0A0E" },
  lufsInfo: { flex: 1 },
  lufsLabel: { color: "#F5F5F5", fontSize: 14, fontWeight: "600" },
  lufsLabelActive: { color: "#C41E3A" },
  lufsDesc: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  lufsValueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  lufsValue: { color: "#9CA3AF", fontSize: 13, fontWeight: "700" },

  exportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111118",
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  exportRowActive: { borderColor: "#FFD700", backgroundColor: "#1A1500" },
  exportLabel: { color: "#F5F5F5", fontSize: 14, fontWeight: "600" },
  exportDesc: { color: "#6B7280", fontSize: 12, marginTop: 2 },

  eqGrid: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  eqBand: { alignItems: "center", gap: 3, flex: 1 },
  eqBtn: { padding: 4 },
  eqBar: { width: 8, backgroundColor: "#2A2A35", borderRadius: 4, overflow: "hidden" },
  eqFill: { width: 8, borderRadius: 4 },
  eqGain: { color: "#F5F5F5", fontSize: 8, fontWeight: "600" },
  eqFreq: { color: "#6B7280", fontSize: 7 },

  harmonicsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  harmonicBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1A1A24",
    borderWidth: 1,
    borderColor: "#2A2A35",
    alignItems: "center",
  },
  harmonicBtnActive: { backgroundColor: "#FBBF2422", borderColor: "#FBBF24" },
  harmonicText: { color: "#6B7280", fontSize: 12 },
  harmonicTextActive: { color: "#FBBF24", fontWeight: "600" },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: { color: "#9CA3AF", fontSize: 13 },

  processingBox: {
    backgroundColor: "#111118",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C41E3A44",
  },
  processingText: { color: "#9CA3AF", fontSize: 13 },
  progressBarOuter: {
    width: "100%",
    height: 4,
    backgroundColor: "#2A2A35",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: { height: 4, backgroundColor: "#C41E3A", borderRadius: 2 },
  progressPct: { color: "#C41E3A", fontSize: 13, fontWeight: "700" },

  doneBox: {
    backgroundColor: "#0A1A0A",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#34D399",
  },
  doneIcon: { fontSize: 36, color: "#34D399" },
  doneTitle: { color: "#34D399", fontSize: 18, fontWeight: "800" },
  doneStats: { flexDirection: "row", gap: 24 },
  abBtn: {
    borderWidth: 1,
    borderColor: "#2A2A35",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  abBtnText: { color: "#9CA3AF", fontSize: 13 },

  dropBtn: {
    backgroundColor: "#C41E3A",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    gap: 4,
  },
  dropBtnDisabled: { backgroundColor: "#2A2A35" },
  dropBtnText: { color: "#F5F5F5", fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  dropBtnSub: { color: "#F5F5F566", fontSize: 12 },

  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    marginBottom: 8,
  },
  exportBtnText: { color: "#080808", fontSize: 16, fontWeight: "800" },
});

const dspStyles = StyleSheet.create({
  section: {
    backgroundColor: "#111118",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  sliderRow: { marginBottom: 10 },
  sliderLabel: { color: "#9CA3AF", fontSize: 12, marginBottom: 6 },
  sliderControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  nudgeBtn: {
    width: 28,
    height: 28,
    backgroundColor: "#1A1A24",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  nudgeBtnText: { color: "#F5F5F5", fontSize: 16, fontWeight: "700", lineHeight: 20 },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#2A2A35",
    borderRadius: 2,
    overflow: "hidden",
  },
  sliderFill: { height: 4, backgroundColor: "#C41E3A", borderRadius: 2 },
  sliderValue: { color: "#F5F5F5", fontSize: 12, fontWeight: "600", minWidth: 60, textAlign: "right" },
});
