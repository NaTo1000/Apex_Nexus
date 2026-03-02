import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonText } from "@/components/ui/neon-text";
import { AIAssistantButton } from "@/components/ai-assistant";
import { useAssistant } from "@/lib/store/assistant-context";
import { useLibrary } from "@/lib/store/library-context";
import { formatDuration } from "@/lib/store/library-store";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeckState {
  trackTitle: string;
  bpm: number;
  pitch: number;
  tempo: number;
  volume: number;
  eqBass: number;
  eqMid: number;
  eqHigh: number;
  eqBassKill: boolean;
  eqMidKill: boolean;
  eqHighKill: boolean;
  isPlaying: boolean;
  position: number;
  duration: number;
  loopActive: boolean;
  loopSize: number;
  hotCues: (number | null)[];
}

const DEFAULT_DECK = (side: "A" | "B"): DeckState => ({
  trackTitle: side === "A" ? "Neon Pressure" : "Deep Frequency",
  bpm: side === "A" ? 128 : 140,
  pitch: 0,
  tempo: 0,
  volume: 80,
  eqBass: 0,
  eqMid: 0,
  eqHigh: 0,
  eqBassKill: false,
  eqMidKill: false,
  eqHighKill: false,
  isPlaying: false,
  position: side === "A" ? 0 : 45,
  duration: side === "A" ? 245 : 312,
  loopActive: false,
  loopSize: 4,
  hotCues: [null, null, null, null],
});

const FX_OPTIONS = [
  { name: "Reverb", color: "#A78BFA" },
  { name: "Delay",  color: "#60A5FA" },
  { name: "Filter", color: "#34D399" },
  { name: "Flanger",color: "#F97316" },
  { name: "Echo",   color: "#F59E0B" },
  { name: "Stutter",color: "#EC4899" },
];
const LOOP_SIZES = [1, 2, 4, 8];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DJMixerScreen() {
  const router = useRouter();
  const { setCurrentScreen } = useAssistant();

  React.useEffect(() => { setCurrentScreen("dj-mixer"); }, [setCurrentScreen]);

  const [deckA, setDeckA] = useState<DeckState>(DEFAULT_DECK("A"));
  const [deckB, setDeckB] = useState<DeckState>(DEFAULT_DECK("B"));
  const [crossfader, setCrossfader] = useState(50);
  const [masterVolume, setMasterVolume] = useState(85);
  const [headphonesCue, setHeadphonesCue] = useState<"A" | "B" | "both">("A");
  const [activeFx, setActiveFx] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [bpmSync, setBpmSync] = useState(false);

  const updateDeck = useCallback((side: "A" | "B", updates: Partial<DeckState>) => {
    if (side === "A") setDeckA((p) => ({ ...p, ...updates }));
    else setDeckB((p) => ({ ...p, ...updates }));
  }, []);

  const toggleFx = useCallback((fx: string) => {
    setActiveFx((p) => p.includes(fx) ? p.filter((f) => f !== fx) : [...p, fx]);
  }, []);

  const handleBpmSync = useCallback(() => {
    if (!bpmSync) {
      const diff = ((deckA.bpm - deckB.bpm) / deckB.bpm) * 100;
      setDeckB((p) => ({ ...p, bpm: deckA.bpm, tempo: parseFloat(diff.toFixed(1)) }));
      setBpmSync(true);
    } else {
      setBpmSync(false);
    }
  }, [bpmSync, deckA.bpm, deckB.bpm]);

  const handleHotCue = useCallback((side: "A" | "B", idx: number) => {
    const deck = side === "A" ? deckA : deckB;
    const cues = [...deck.hotCues];
    if (cues[idx] === null) {
      cues[idx] = deck.position;
      updateDeck(side, { hotCues: cues });
    } else {
      updateDeck(side, { position: cues[idx]! });
    }
  }, [deckA, deckB, updateDeck]);

  const deckAVol = crossfader <= 50 ? deckA.volume : deckA.volume * (1 - (crossfader - 50) / 50);
  const deckBVol = crossfader >= 50 ? deckB.volume : deckB.volume * (crossfader / 50);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="arrow.left" size={22} color="#F5F5F5" />
          </Pressable>
          <NeonText color="#C41E3A" size={22} weight="900">DJ Mixer</NeonText>
          <View style={styles.headerRight}>
            {recording && (
              <View style={styles.recBadge}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>REC</Text>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [styles.recordBtn, recording && styles.recordBtnActive, pressed && { opacity: 0.8 }]}
              onPress={() => setRecording(!recording)}
            >
              <IconSymbol name="record.circle" size={22} color={recording ? "#C41E3A" : "#6B7280"} />
            </Pressable>
          </View>
        </View>

        {/* ── BPM Sync Bar ── */}
        <GlassCard style={styles.bpmSyncRow} glowColor={bpmSync ? "#FFD700" : "#2A2A35"} elevation={2}>
          <View style={styles.bpmBlock}>
            <NeonText color="#C41E3A" size={24} weight="900">{deckA.bpm}</NeonText>
            <Text style={styles.bpmLabel}>BPM A</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.syncBtn, bpmSync && styles.syncBtnActive, pressed && { opacity: 0.8 }]}
            onPress={handleBpmSync}
          >
            <IconSymbol name="arrow.left.arrow.right" size={16} color={bpmSync ? "#FFD700" : "#9CA3AF"} />
            <Text style={[styles.syncBtnText, bpmSync && { color: "#FFD700" }]}>
              {bpmSync ? "SYNC ON" : "SYNC"}
            </Text>
          </Pressable>
          <View style={[styles.bpmBlock, { alignItems: "flex-end" }]}>
            <NeonText color="#60A5FA" size={24} weight="900">{deckB.bpm}</NeonText>
            <Text style={styles.bpmLabel}>BPM B</Text>
          </View>
        </GlassCard>

        {/* ── Deck A ── */}
        <DeckPanel
          side="A"
          deck={deckA}
          effectiveVolume={Math.round(deckAVol)}
          onUpdate={(u) => updateDeck("A", u)}
          onHotCue={(i) => handleHotCue("A", i)}
          headphonesCue={headphonesCue === "A" || headphonesCue === "both"}
          onHeadphones={() => setHeadphonesCue(headphonesCue === "A" ? "both" : "A")}
        />

        {/* ── Crossfader ── */}
        <GlassCard style={styles.crossfaderCard} glowColor="#C41E3A" elevation={3}>
          <View style={styles.crossfaderHeader}>
            <Text style={[styles.cfDeckLabel, { color: "#C41E3A" }]}>A</Text>
            <Text style={styles.cfTitle}>CROSSFADER</Text>
            <Text style={[styles.cfDeckLabel, { color: "#60A5FA" }]}>B</Text>
          </View>
          <View style={styles.crossfaderTrackWrap}>
            <View style={styles.crossfaderTrack}>
              {/* A side fill */}
              <View style={[styles.cfFillA, { width: `${100 - crossfader}%` }]} />
              {/* B side fill */}
              <View style={[styles.cfFillB, { width: `${crossfader}%`, position: "absolute", right: 0 }]} />
              {/* Thumb */}
              <View style={[styles.cfThumb, { left: `${crossfader}%` }]} />
            </View>
          </View>
          <View style={styles.cfBtnsRow}>
            <Pressable style={styles.cfBtn} onPress={() => setCrossfader(0)}>
              <Text style={[styles.cfBtnText, { color: "#C41E3A" }]}>◀◀ A</Text>
            </Pressable>
            <Pressable style={styles.cfBtn} onPress={() => setCrossfader((v) => Math.max(0, v - 5))}>
              <Text style={styles.cfBtnText}>◀</Text>
            </Pressable>
            <View style={styles.cfValueWrap}>
              <Text style={styles.cfValue}>{crossfader}%</Text>
            </View>
            <Pressable style={styles.cfBtn} onPress={() => setCrossfader((v) => Math.min(100, v + 5))}>
              <Text style={styles.cfBtnText}>▶</Text>
            </Pressable>
            <Pressable style={styles.cfBtn} onPress={() => setCrossfader(100)}>
              <Text style={[styles.cfBtnText, { color: "#60A5FA" }]}>B ▶▶</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* ── Deck B ── */}
        <DeckPanel
          side="B"
          deck={deckB}
          effectiveVolume={Math.round(deckBVol)}
          onUpdate={(u) => updateDeck("B", u)}
          onHotCue={(i) => handleHotCue("B", i)}
          headphonesCue={headphonesCue === "B" || headphonesCue === "both"}
          onHeadphones={() => setHeadphonesCue(headphonesCue === "B" ? "both" : "B")}
        />

        {/* ── Master Volume ── */}
        <GlassCard style={styles.masterCard} glowColor="#FFD700" elevation={2}>
          <View style={styles.masterHeader}>
            <IconSymbol name="speaker.wave.3.fill" size={16} color="#FFD700" />
            <Text style={styles.masterLabel}>MASTER OUTPUT</Text>
            <NeonText color="#FFD700" size={16} weight="900">{masterVolume}%</NeonText>
          </View>
          <View style={styles.masterTrack}>
            <View style={[styles.masterFill, { width: `${masterVolume}%` }]} />
            <View style={[styles.masterPeak, { left: `${Math.min(masterVolume + 2, 100)}%` }]} />
          </View>
          <View style={styles.masterBtns}>
            <Pressable style={styles.masterBtn} onPress={() => setMasterVolume((v) => Math.max(0, v - 5))}>
              <Text style={styles.masterBtnText}>−</Text>
            </Pressable>
            <View style={styles.masterMeter}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.meterBar,
                    {
                      backgroundColor: i < masterVolume / 5
                        ? i < 14 ? "#34D399" : i < 18 ? "#FFD700" : "#C41E3A"
                        : "#1A1A24",
                    },
                  ]}
                />
              ))}
            </View>
            <Pressable style={styles.masterBtn} onPress={() => setMasterVolume((v) => Math.min(100, v + 5))}>
              <Text style={styles.masterBtnText}>+</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* ── FX Rack ── */}
        <GlassCard style={styles.fxCard} glowColor="#A78BFA" elevation={2}>
          <Text style={styles.sectionTitle}>FX RACK</Text>
          <View style={styles.fxGrid}>
            {FX_OPTIONS.map((fx) => {
              const on = activeFx.includes(fx.name);
              return (
                <Pressable
                  key={fx.name}
                  style={({ pressed }) => [
                    styles.fxBtn,
                    on && { backgroundColor: fx.color + "22", borderColor: fx.color },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => toggleFx(fx.name)}
                >
                  <View style={[styles.fxLed, { backgroundColor: on ? fx.color : "#2A2A35" }]} />
                  <Text style={[styles.fxBtnText, on && { color: fx.color }]}>{fx.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>
      </ScrollView>

      <AIAssistantButton />
    </ScreenContainer>
  );
}

// ─── Deck Panel ───────────────────────────────────────────────────────────────

function DeckPanel({
  side, deck, effectiveVolume, onUpdate, onHotCue, headphonesCue, onHeadphones,
}: {
  side: "A" | "B";
  deck: DeckState;
  effectiveVolume: number;
  onUpdate: (u: Partial<DeckState>) => void;
  onHotCue: (i: number) => void;
  headphonesCue: boolean;
  onHeadphones: () => void;
}) {
  const isA = side === "A";
  const accent = isA ? "#C41E3A" : "#60A5FA";
  const progress = deck.duration > 0 ? deck.position / deck.duration : 0;

  return (
    <GlassCard style={[dp.card]} glowColor={accent} elevation={3}>
      {/* Deck header row */}
      <View style={dp.headerRow}>
        <View style={[dp.deckBadge, { backgroundColor: accent }]}>
          <Text style={dp.deckBadgeText}>DECK {side}</Text>
        </View>
        <Text style={dp.trackTitle} numberOfLines={1}>{deck.trackTitle}</Text>
        <Pressable
          style={[dp.hpBtn, headphonesCue && dp.hpBtnActive]}
          onPress={onHeadphones}
        >
          <IconSymbol name="headphones" size={18} color={headphonesCue ? "#FFD700" : "#6B7280"} />
        </Pressable>
      </View>

      {/* Waveform */}
      <View style={dp.waveform}>
        <View style={[dp.waveProgress, { width: `${progress * 100}%`, backgroundColor: accent + "30" }]} />
        <View style={dp.waveBars}>
          {Array.from({ length: 48 }).map((_, i) => {
            const h = 6 + Math.abs(Math.sin(i * 0.45 + 1.2) * 14 + Math.cos(i * 0.9) * 8);
            return (
              <View
                key={i}
                style={[
                  dp.waveBar,
                  {
                    height: h,
                    backgroundColor: i / 48 <= progress ? accent : "#2A2A35",
                    opacity: i / 48 <= progress ? 1 : 0.5,
                  },
                ]}
              />
            );
          })}
        </View>
        {/* Playhead */}
        <View style={[dp.playhead, { left: `${progress * 100}%`, borderColor: accent }]} />
      </View>

      {/* Time row */}
      <View style={dp.timeRow}>
        <Text style={dp.timeText}>{formatDuration(Math.floor(deck.position))}</Text>
        <View style={[dp.bpmPill, { borderColor: accent + "66" }]}>
          <Text style={[dp.bpmText, { color: accent }]}>{deck.bpm} BPM</Text>
        </View>
        <Text style={dp.timeText}>−{formatDuration(Math.floor(deck.duration - deck.position))}</Text>
      </View>

      {/* Play / Cue row */}
      <View style={dp.playRow}>
        <Pressable
          style={({ pressed }) => [dp.cueBtn, { borderColor: accent }, pressed && { opacity: 0.75 }]}
          onPress={() => onUpdate({ position: 0 })}
        >
          <Text style={[dp.cueBtnText, { color: accent }]}>◀ CUE</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            dp.playBtn,
            { borderColor: accent, backgroundColor: deck.isPlaying ? accent : accent + "22" },
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
          onPress={() => onUpdate({ isPlaying: !deck.isPlaying })}
        >
          <IconSymbol
            name={deck.isPlaying ? "pause.fill" : "play.fill"}
            size={26}
            color={deck.isPlaying ? "#F5F5F5" : accent}
          />
        </Pressable>
        <Pressable
          style={({ pressed }) => [dp.cueBtn, { borderColor: "#2A2A35" }, pressed && { opacity: 0.75 }]}
          onPress={() => onUpdate({ position: deck.duration })}
        >
          <Text style={dp.cueBtnText}>END ▶</Text>
        </Pressable>
      </View>

      {/* Hot Cues */}
      <View style={dp.hotCueRow}>
        {deck.hotCues.map((cue, i) => {
          const cueColors = ["#C41E3A", "#FFD700", "#34D399", "#A78BFA"];
          const c = cueColors[i];
          return (
            <Pressable
              key={i}
              style={({ pressed }) => [
                dp.hotCueBtn,
                cue !== null && { backgroundColor: c + "22", borderColor: c },
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => onHotCue(i)}
            >
              <View style={[dp.hotCueLed, { backgroundColor: cue !== null ? c : "#2A2A35" }]} />
              <Text style={[dp.hotCueBtnText, cue !== null && { color: c }]}>
                {cue !== null ? formatDuration(Math.floor(cue)) : `H${i + 1}`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Loop controls */}
      <View style={dp.loopRow}>
        <Pressable
          style={[dp.loopToggle, deck.loopActive && { backgroundColor: accent + "22", borderColor: accent }]}
          onPress={() => onUpdate({ loopActive: !deck.loopActive })}
        >
          <IconSymbol name="arrow.2.circlepath" size={14} color={deck.loopActive ? accent : "#6B7280"} />
          <Text style={[dp.loopToggleText, deck.loopActive && { color: accent }]}>LOOP</Text>
        </Pressable>
        {LOOP_SIZES.map((s) => {
          const active = deck.loopSize === s && deck.loopActive;
          return (
            <Pressable
              key={s}
              style={[dp.loopSizeBtn, active && { backgroundColor: accent + "22", borderColor: accent }]}
              onPress={() => onUpdate({ loopSize: s, loopActive: true })}
            >
              <Text style={[dp.loopSizeBtnText, active && { color: accent }]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* EQ + Volume row */}
      <View style={dp.eqVolRow}>
        {/* 3-band EQ */}
        <View style={dp.eqSection}>
          <Text style={dp.eqTitle}>EQ</Text>
          <View style={dp.eqBands}>
            {[
              { label: "HI", val: deck.eqHigh, kill: deck.eqHighKill, onDec: () => onUpdate({ eqHigh: Math.max(-12, deck.eqHigh - 1) }), onInc: () => onUpdate({ eqHigh: Math.min(12, deck.eqHigh + 1) }), onKill: () => onUpdate({ eqHighKill: !deck.eqHighKill }) },
              { label: "MID", val: deck.eqMid, kill: deck.eqMidKill, onDec: () => onUpdate({ eqMid: Math.max(-12, deck.eqMid - 1) }), onInc: () => onUpdate({ eqMid: Math.min(12, deck.eqMid + 1) }), onKill: () => onUpdate({ eqMidKill: !deck.eqMidKill }) },
              { label: "LO", val: deck.eqBass, kill: deck.eqBassKill, onDec: () => onUpdate({ eqBass: Math.max(-12, deck.eqBass - 1) }), onInc: () => onUpdate({ eqBass: Math.min(12, deck.eqBass + 1) }), onKill: () => onUpdate({ eqBassKill: !deck.eqBassKill }) },
            ].map((band) => (
              <View key={band.label} style={dp.eqBand}>
                <Pressable
                  style={[dp.killBtn, band.kill && { backgroundColor: "#C41E3A", borderColor: "#C41E3A" }]}
                  onPress={band.onKill}
                >
                  <Text style={[dp.killBtnText, band.kill && { color: "#F5F5F5" }]}>KILL</Text>
                </Pressable>
                <Text style={[dp.eqBandLabel, band.kill && { color: "#C41E3A" }]}>{band.label}</Text>
                <View style={dp.eqFaderTrack}>
                  <View style={[dp.eqFaderFill, {
                    height: `${((band.val + 12) / 24) * 100}%`,
                    backgroundColor: band.kill ? "#C41E3A" : accent,
                  }]} />
                </View>
                <Text style={[dp.eqBandVal, { color: band.kill ? "#C41E3A" : accent }]}>
                  {band.val > 0 ? "+" : ""}{band.val}
                </Text>
                <Pressable style={dp.eqBtn} onPress={band.onInc}><Text style={dp.eqBtnText}>+</Text></Pressable>
                <Pressable style={dp.eqBtn} onPress={band.onDec}><Text style={dp.eqBtnText}>−</Text></Pressable>
              </View>
            ))}
          </View>
        </View>

        {/* Volume fader */}
        <View style={dp.volSection}>
          <Text style={dp.eqTitle}>VOL</Text>
          <View style={dp.volFaderTrack}>
            <View style={[dp.volFaderFill, { height: `${effectiveVolume}%`, backgroundColor: accent }]} />
          </View>
          <Text style={[dp.volValue, { color: accent }]}>{deck.volume}%</Text>
          <Pressable style={dp.eqBtn} onPress={() => onUpdate({ volume: Math.min(100, deck.volume + 5) })}>
            <Text style={dp.eqBtnText}>+</Text>
          </Pressable>
          <Pressable style={dp.eqBtn} onPress={() => onUpdate({ volume: Math.max(0, deck.volume - 5) })}>
            <Text style={dp.eqBtnText}>−</Text>
          </Pressable>
        </View>
      </View>

      {/* Pitch / Tempo */}
      <View style={dp.pitchRow}>
        {[
          { label: "Pitch", unit: "st", val: deck.pitch, min: -6, max: 6, step: 1, onDec: () => onUpdate({ pitch: Math.max(-6, deck.pitch - 1) }), onInc: () => onUpdate({ pitch: Math.min(6, deck.pitch + 1) }) },
          { label: "Tempo", unit: "%", val: deck.tempo, min: -8, max: 8, step: 0.5, onDec: () => onUpdate({ tempo: parseFloat(Math.max(-8, deck.tempo - 0.5).toFixed(1)) }), onInc: () => onUpdate({ tempo: parseFloat(Math.min(8, deck.tempo + 0.5).toFixed(1)) }) },
        ].map((ctrl) => (
          <View key={ctrl.label} style={dp.pitchControl}>
            <Text style={dp.pitchLabel}>{ctrl.label}</Text>
            <View style={dp.pitchBtns}>
              <Pressable style={dp.pitchBtn} onPress={ctrl.onDec}>
                <Text style={dp.pitchBtnText}>−</Text>
              </Pressable>
              <Text style={[dp.pitchValue, { color: ctrl.val !== 0 ? accent : "#9CA3AF" }]}>
                {ctrl.val > 0 ? "+" : ""}{ctrl.val}{ctrl.unit}
              </Text>
              <Pressable style={dp.pitchBtn} onPress={ctrl.onInc}>
                <Text style={dp.pitchBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

// ─── Deck Styles ──────────────────────────────────────────────────────────────

const dp = StyleSheet.create({
  card: { marginBottom: 12, padding: 14, gap: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  deckBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  deckBadgeText: { color: "#F5F5F5", fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  trackTitle: { flex: 1, color: "#E5E7EB", fontSize: 13, fontWeight: "700" },
  hpBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A35",
    alignItems: "center", justifyContent: "center",
  },
  hpBtnActive: { backgroundColor: "#FFD70022", borderColor: "#FFD700" },
  // Waveform
  waveform: {
    height: 52, backgroundColor: "#0A0A12", borderRadius: 8,
    overflow: "hidden", position: "relative",
  },
  waveProgress: { position: "absolute", top: 0, bottom: 0, left: 0 },
  waveBars: { flexDirection: "row", alignItems: "center", height: 52, gap: 1, paddingHorizontal: 4 },
  waveBar: { flex: 1, borderRadius: 1 },
  playhead: {
    position: "absolute", top: 4, bottom: 4,
    width: 2, borderRadius: 1,
    borderLeftWidth: 2, marginLeft: -1,
  },
  // Time
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timeText: { color: "#6B7280", fontSize: 11, fontWeight: "600", fontVariant: ["tabular-nums"] },
  bpmPill: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  bpmText: { fontSize: 12, fontWeight: "800" },
  // Play
  playRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cueBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: "#2A2A35",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#111118",
  },
  cueBtnText: { color: "#6B7280", fontSize: 12, fontWeight: "800" },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#C41E3A", shadowRadius: 12, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 },
  },
  // Hot cues
  hotCueRow: { flexDirection: "row", gap: 6 },
  hotCueBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: "#111118", borderWidth: 1, borderColor: "#2A2A35",
    alignItems: "center", gap: 3,
  },
  hotCueLed: { width: 6, height: 6, borderRadius: 3 },
  hotCueBtnText: { color: "#6B7280", fontSize: 9, fontWeight: "700" },
  // Loop
  loopRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  loopToggle: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8,
    backgroundColor: "#111118", borderWidth: 1, borderColor: "#2A2A35",
  },
  loopToggleText: { color: "#6B7280", fontSize: 10, fontWeight: "800" },
  loopSizeBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "#111118", borderWidth: 1, borderColor: "#2A2A35",
    alignItems: "center", justifyContent: "center",
  },
  loopSizeBtnText: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  // EQ + Volume
  eqVolRow: { flexDirection: "row", gap: 8 },
  eqSection: { flex: 1 },
  eqTitle: { color: "#9CA3AF", fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  eqBands: { flexDirection: "row", gap: 6 },
  eqBand: { flex: 1, alignItems: "center", gap: 3 },
  killBtn: {
    paddingHorizontal: 4, paddingVertical: 3, borderRadius: 4,
    backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A35",
  },
  killBtnText: { color: "#6B7280", fontSize: 8, fontWeight: "800" },
  eqBandLabel: { color: "#9CA3AF", fontSize: 9, fontWeight: "700" },
  eqFaderTrack: {
    width: 10, height: 50, backgroundColor: "#1A1A24",
    borderRadius: 5, overflow: "hidden", justifyContent: "flex-end",
  },
  eqFaderFill: { width: 10, borderRadius: 5 },
  eqBandVal: { fontSize: 9, fontWeight: "700" },
  eqBtn: {
    width: 26, height: 26, backgroundColor: "#1A1A24",
    borderRadius: 6, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2A2A35",
  },
  eqBtnText: { color: "#F5F5F5", fontSize: 15, fontWeight: "700", lineHeight: 19 },
  // Volume fader
  volSection: { width: 48, alignItems: "center", gap: 4 },
  volFaderTrack: {
    width: 14, height: 80, backgroundColor: "#1A1A24",
    borderRadius: 7, overflow: "hidden", justifyContent: "flex-end",
  },
  volFaderFill: { width: 14, borderRadius: 7 },
  volValue: { fontSize: 10, fontWeight: "700" },
  // Pitch
  pitchRow: { flexDirection: "row", gap: 12 },
  pitchControl: { flex: 1 },
  pitchLabel: { color: "#9CA3AF", fontSize: 10, fontWeight: "700", marginBottom: 4 },
  pitchBtns: { flexDirection: "row", alignItems: "center", gap: 6 },
  pitchBtn: {
    width: 32, height: 32, backgroundColor: "#1A1A24",
    borderRadius: 8, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2A2A35",
  },
  pitchBtnText: { color: "#F5F5F5", fontSize: 16, fontWeight: "700", lineHeight: 20 },
  pitchValue: { flex: 1, fontSize: 12, fontWeight: "800", textAlign: "center" },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  backBtn: { padding: 4 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: "auto" },
  recBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#C41E3A22", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: "#C41E3A",
  },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#C41E3A" },
  recText: { color: "#C41E3A", fontSize: 10, fontWeight: "800" },
  recordBtn: { padding: 8, borderRadius: 8 },
  recordBtnActive: { backgroundColor: "#C41E3A22" },
  // BPM sync
  bpmSyncRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12, padding: 14,
  },
  bpmBlock: { alignItems: "flex-start" },
  bpmLabel: { color: "#6B7280", fontSize: 10, fontWeight: "600", marginTop: 2 },
  syncBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A35",
  },
  syncBtnActive: { backgroundColor: "#FFD70022", borderColor: "#FFD700" },
  syncBtnText: { color: "#9CA3AF", fontSize: 12, fontWeight: "800" },
  // Crossfader
  crossfaderCard: { marginBottom: 12, padding: 16, gap: 12 },
  crossfaderHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  cfDeckLabel: { fontSize: 18, fontWeight: "900" },
  cfTitle: { color: "#9CA3AF", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  crossfaderTrackWrap: { paddingVertical: 8 },
  crossfaderTrack: {
    height: 12, backgroundColor: "#1A1A24",
    borderRadius: 6, overflow: "visible", position: "relative",
  },
  cfFillA: { position: "absolute", left: 0, top: 0, height: 12, backgroundColor: "#C41E3A", borderRadius: 6 },
  cfFillB: { height: 12, backgroundColor: "#60A5FA", borderRadius: 6 },
  cfThumb: {
    position: "absolute", top: -6, width: 24, height: 24,
    borderRadius: 12, backgroundColor: "#F5F5F5",
    borderWidth: 3, borderColor: "#C41E3A",
    marginLeft: -12,
    shadowColor: "#C41E3A", shadowRadius: 8, shadowOpacity: 0.6, shadowOffset: { width: 0, height: 0 },
  },
  cfBtnsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cfBtn: {
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8,
    backgroundColor: "#111118", borderWidth: 1, borderColor: "#2A2A35",
  },
  cfBtnText: { color: "#9CA3AF", fontSize: 12, fontWeight: "700" },
  cfValueWrap: { flex: 1, alignItems: "center" },
  cfValue: { color: "#F5F5F5", fontSize: 16, fontWeight: "900" },
  // Master
  masterCard: { marginBottom: 12, padding: 14, gap: 10 },
  masterHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  masterLabel: { flex: 1, color: "#9CA3AF", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  masterTrack: {
    height: 8, backgroundColor: "#1A1A24",
    borderRadius: 4, overflow: "visible", position: "relative",
  },
  masterFill: { height: 8, backgroundColor: "#FFD700", borderRadius: 4 },
  masterPeak: {
    position: "absolute", top: -2, width: 3, height: 12,
    backgroundColor: "#F5F5F5", borderRadius: 2,
  },
  masterBtns: { flexDirection: "row", alignItems: "center", gap: 10 },
  masterBtn: {
    width: 36, height: 36, backgroundColor: "#1A1A24",
    borderRadius: 10, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2A2A35",
  },
  masterBtnText: { color: "#F5F5F5", fontSize: 20, fontWeight: "700", lineHeight: 24 },
  masterMeter: { flex: 1, flexDirection: "row", gap: 2, alignItems: "center" },
  meterBar: { flex: 1, height: 16, borderRadius: 2 },
  // FX
  fxCard: { padding: 14, gap: 10 },
  sectionTitle: { color: "#9CA3AF", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  fxGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fxBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#111118", borderWidth: 1, borderColor: "#2A2A35",
  },
  fxLed: { width: 7, height: 7, borderRadius: 4 },
  fxBtnText: { color: "#9CA3AF", fontSize: 13, fontWeight: "700" },
});
