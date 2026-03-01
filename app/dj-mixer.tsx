import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLibrary } from "@/lib/store/library-context";
import { formatDuration } from "@/lib/store/library-store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeckState {
  trackId: string | null;
  trackTitle: string;
  bpm: number;
  pitch: number;        // semitones, -6 to +6
  tempo: number;        // %, -8 to +8
  volume: number;       // 0-100
  eqBass: number;       // -12 to +12 dB
  eqMid: number;
  eqHigh: number;
  eqBassKill: boolean;
  eqMidKill: boolean;
  eqHighKill: boolean;
  isPlaying: boolean;
  position: number;     // seconds
  duration: number;
  loopActive: boolean;
  loopSize: number;     // bars: 1, 2, 4, 8
  hotCues: (number | null)[];  // 4 hot cues, seconds
  fxEnabled: boolean;
}

const DEFAULT_DECK = (side: "A" | "B"): DeckState => ({
  trackId: null,
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
  fxEnabled: false,
});

const FX_OPTIONS = ["Reverb", "Delay", "Filter", "Flanger", "Echo", "Stutter"];
const LOOP_SIZES = [1, 2, 4, 8];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DJMixerScreen() {
  const router = useRouter();
  const { tracks } = useLibrary();

  const [deckA, setDeckA] = useState<DeckState>(DEFAULT_DECK("A"));
  const [deckB, setDeckB] = useState<DeckState>(DEFAULT_DECK("B"));
  const [crossfader, setCrossfader] = useState(50);   // 0=A, 100=B
  const [masterVolume, setMasterVolume] = useState(85);
  const [headphonesCue, setHeadphonesCue] = useState<"A" | "B" | "both">("A");
  const [activeFx, setActiveFx] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [bpmSync, setBpmSync] = useState(false);

  const updateDeck = useCallback((side: "A" | "B", updates: Partial<DeckState>) => {
    if (side === "A") setDeckA((prev) => ({ ...prev, ...updates }));
    else setDeckB((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleFx = useCallback((fx: string) => {
    setActiveFx((prev) =>
      prev.includes(fx) ? prev.filter((f) => f !== fx) : [...prev, fx]
    );
  }, []);

  const handleBpmSync = useCallback(() => {
    if (!bpmSync) {
      // Sync deck B BPM to deck A
      const syncedBpm = deckA.bpm;
      const tempoDiff = ((syncedBpm - deckB.bpm) / deckB.bpm) * 100;
      setDeckB((prev) => ({ ...prev, bpm: syncedBpm, tempo: parseFloat(tempoDiff.toFixed(1)) }));
      setBpmSync(true);
    } else {
      setBpmSync(false);
    }
  }, [bpmSync, deckA.bpm, deckB.bpm]);

  const handleHotCue = useCallback((side: "A" | "B", cueIdx: number) => {
    const deck = side === "A" ? deckA : deckB;
    const newCues = [...deck.hotCues];
    if (newCues[cueIdx] === null) {
      newCues[cueIdx] = deck.position;
    } else {
      // Jump to cue
      updateDeck(side, { position: newCues[cueIdx]! });
      return;
    }
    updateDeck(side, { hotCues: newCues });
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
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="arrow.left" size={22} color="#F5F5F5" />
          </Pressable>
          <Text style={styles.pageTitle}>DJ Mixer</Text>
          <View style={styles.headerRight}>
            {recording && (
              <View style={styles.recBadge}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>REC</Text>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.recordBtn,
                recording && styles.recordBtnActive,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => setRecording(!recording)}
            >
              <IconSymbol name="record.circle" size={20} color={recording ? "#C41E3A" : "#9CA3AF"} />
            </Pressable>
          </View>
        </View>

        {/* Dual Decks */}
        <View style={styles.decksRow}>
          <DeckPanel
            side="A"
            deck={deckA}
            effectiveVolume={Math.round(deckAVol)}
            onUpdate={(u) => updateDeck("A", u)}
            onHotCue={(i) => handleHotCue("A", i)}
            headphonesCue={headphonesCue === "A" || headphonesCue === "both"}
            onHeadphones={() => setHeadphonesCue(headphonesCue === "A" ? "both" : "A")}
          />
          <DeckPanel
            side="B"
            deck={deckB}
            effectiveVolume={Math.round(deckBVol)}
            onUpdate={(u) => updateDeck("B", u)}
            onHotCue={(i) => handleHotCue("B", i)}
            headphonesCue={headphonesCue === "B" || headphonesCue === "both"}
            onHeadphones={() => setHeadphonesCue(headphonesCue === "B" ? "both" : "B")}
          />
        </View>

        {/* BPM Sync */}
        <View style={styles.bpmSyncRow}>
          <View style={styles.bpmDisplay}>
            <Text style={styles.bpmValue}>{deckA.bpm}</Text>
            <Text style={styles.bpmLabel}>BPM A</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.syncBtn, bpmSync && styles.syncBtnActive, pressed && { opacity: 0.8 }]}
            onPress={handleBpmSync}
          >
            <IconSymbol name="arrow.left.arrow.right" size={18} color={bpmSync ? "#FFD700" : "#9CA3AF"} />
            <Text style={[styles.syncBtnText, bpmSync && { color: "#FFD700" }]}>
              {bpmSync ? "SYNC ON" : "SYNC"}
            </Text>
          </Pressable>
          <View style={[styles.bpmDisplay, { alignItems: "flex-end" }]}>
            <Text style={[styles.bpmValue, { color: bpmSync ? "#FFD700" : "#F5F5F5" }]}>{deckB.bpm}</Text>
            <Text style={styles.bpmLabel}>BPM B</Text>
          </View>
        </View>

        {/* Crossfader */}
        <View style={styles.crossfaderSection}>
          <Text style={styles.deckLabel}>A</Text>
          <View style={styles.crossfaderTrack}>
            <View style={[styles.crossfaderFillA, { width: `${crossfader}%` }]} />
            <View style={[styles.crossfaderThumb, { left: `${crossfader}%` }]} />
          </View>
          <Text style={styles.deckLabel}>B</Text>
        </View>
        <View style={styles.crossfaderBtns}>
          <Pressable style={styles.cfBtn} onPress={() => setCrossfader((v) => Math.max(0, v - 5))}>
            <Text style={styles.cfBtnText}>◀</Text>
          </Pressable>
          <Text style={styles.cfValue}>{crossfader}%</Text>
          <Pressable style={styles.cfBtn} onPress={() => setCrossfader((v) => Math.min(100, v + 5))}>
            <Text style={styles.cfBtnText}>▶</Text>
          </Pressable>
        </View>

        {/* Master Volume */}
        <View style={styles.masterRow}>
          <Text style={styles.masterLabel}>Master</Text>
          <View style={styles.masterTrack}>
            <View style={[styles.masterFill, { width: `${masterVolume}%` }]} />
          </View>
          <View style={styles.masterBtns}>
            <Pressable style={styles.volBtn} onPress={() => setMasterVolume((v) => Math.max(0, v - 5))}>
              <Text style={styles.volBtnText}>−</Text>
            </Pressable>
            <Text style={styles.masterValue}>{masterVolume}%</Text>
            <Pressable style={styles.volBtn} onPress={() => setMasterVolume((v) => Math.min(100, v + 5))}>
              <Text style={styles.volBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* FX Rack */}
        <View style={styles.fxSection}>
          <Text style={styles.sectionTitle}>FX Rack</Text>
          <View style={styles.fxGrid}>
            {FX_OPTIONS.map((fx) => (
              <Pressable
                key={fx}
                style={[styles.fxBtn, activeFx.includes(fx) && styles.fxBtnActive]}
                onPress={() => toggleFx(fx)}
              >
                <Text style={[styles.fxBtnText, activeFx.includes(fx) && styles.fxBtnTextActive]}>
                  {fx}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
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
  const accentColor = isA ? "#C41E3A" : "#60A5FA";
  const progress = deck.duration > 0 ? deck.position / deck.duration : 0;

  return (
    <View style={[deckStyles.container, { borderColor: accentColor + "44" }]}>
      {/* Deck label */}
      <View style={deckStyles.deckHeader}>
        <View style={[deckStyles.deckBadge, { backgroundColor: accentColor }]}>
          <Text style={deckStyles.deckBadgeText}>DECK {side}</Text>
        </View>
        <Pressable onPress={onHeadphones}>
          <IconSymbol name="headphones" size={16} color={headphonesCue ? "#FFD700" : "#6B7280"} />
        </Pressable>
      </View>

      {/* Track name */}
      <Text style={deckStyles.trackTitle} numberOfLines={1}>{deck.trackTitle}</Text>

      {/* Waveform / progress */}
      <View style={deckStyles.waveform}>
        <View style={[deckStyles.waveProgress, { width: `${progress * 100}%`, backgroundColor: accentColor }]} />
        <View style={deckStyles.waveformBars}>
          {Array.from({ length: 30 }).map((_, i) => (
            <View
              key={i}
              style={[
                deckStyles.waveBar,
                {
                  height: 4 + Math.sin(i * 0.7) * 8 + 8,
                  backgroundColor: i / 30 <= progress ? accentColor : "#2A2A35",
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Position / Duration */}
      <View style={deckStyles.timeRow}>
        <Text style={deckStyles.timeText}>{formatDuration(Math.floor(deck.position))}</Text>
        <Text style={[deckStyles.bpmBadge, { color: accentColor }]}>{deck.bpm} BPM</Text>
        <Text style={deckStyles.timeText}>−{formatDuration(Math.floor(deck.duration - deck.position))}</Text>
      </View>

      {/* Play / Cue */}
      <View style={deckStyles.playRow}>
        <Pressable
          style={[deckStyles.cueBtn, { borderColor: accentColor }]}
          onPress={() => onUpdate({ position: 0 })}
        >
          <Text style={[deckStyles.cueBtnText, { color: accentColor }]}>CUE</Text>
        </Pressable>
        <Pressable
          style={[deckStyles.playBtn, { backgroundColor: deck.isPlaying ? accentColor : accentColor + "33", borderColor: accentColor }]}
          onPress={() => onUpdate({ isPlaying: !deck.isPlaying })}
        >
          <IconSymbol
            name={deck.isPlaying ? "pause.fill" : "play.fill"}
            size={22}
            color={deck.isPlaying ? "#F5F5F5" : accentColor}
          />
        </Pressable>
      </View>

      {/* Hot Cues */}
      <View style={deckStyles.hotCueRow}>
        {deck.hotCues.map((cue, i) => (
          <Pressable
            key={i}
            style={[deckStyles.hotCueBtn, cue !== null && { backgroundColor: accentColor }]}
            onPress={() => onHotCue(i)}
          >
            <Text style={[deckStyles.hotCueBtnText, cue !== null && { color: "#F5F5F5" }]}>
              {cue !== null ? formatDuration(Math.floor(cue)) : `H${i + 1}`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Loop */}
      <View style={deckStyles.loopRow}>
        <Pressable
          style={[deckStyles.loopToggle, deck.loopActive && { backgroundColor: accentColor }]}
          onPress={() => onUpdate({ loopActive: !deck.loopActive })}
        >
          <Text style={[deckStyles.loopToggleText, deck.loopActive && { color: "#F5F5F5" }]}>LOOP</Text>
        </Pressable>
        {LOOP_SIZES.map((s) => (
          <Pressable
            key={s}
            style={[deckStyles.loopSizeBtn, deck.loopSize === s && deck.loopActive && { backgroundColor: accentColor + "33", borderColor: accentColor }]}
            onPress={() => onUpdate({ loopSize: s, loopActive: true })}
          >
            <Text style={[deckStyles.loopSizeBtnText, deck.loopSize === s && deck.loopActive && { color: accentColor }]}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* EQ */}
      <View style={deckStyles.eqRow}>
        <EQKill label="HI" value={deck.eqHigh} killed={deck.eqHighKill} color={accentColor}
          onDec={() => onUpdate({ eqHigh: Math.max(-12, deck.eqHigh - 1) })}
          onInc={() => onUpdate({ eqHigh: Math.min(12, deck.eqHigh + 1) })}
          onKill={() => onUpdate({ eqHighKill: !deck.eqHighKill })} />
        <EQKill label="MID" value={deck.eqMid} killed={deck.eqMidKill} color={accentColor}
          onDec={() => onUpdate({ eqMid: Math.max(-12, deck.eqMid - 1) })}
          onInc={() => onUpdate({ eqMid: Math.min(12, deck.eqMid + 1) })}
          onKill={() => onUpdate({ eqMidKill: !deck.eqMidKill })} />
        <EQKill label="LO" value={deck.eqBass} killed={deck.eqBassKill} color={accentColor}
          onDec={() => onUpdate({ eqBass: Math.max(-12, deck.eqBass - 1) })}
          onInc={() => onUpdate({ eqBass: Math.min(12, deck.eqBass + 1) })}
          onKill={() => onUpdate({ eqBassKill: !deck.eqBassKill })} />
      </View>

      {/* Volume */}
      <View style={deckStyles.volRow}>
        <Text style={deckStyles.volLabel}>VOL</Text>
        <View style={deckStyles.volTrack}>
          <View style={[deckStyles.volFill, { width: `${effectiveVolume}%`, backgroundColor: accentColor }]} />
        </View>
        <View style={deckStyles.volBtns}>
          <Pressable style={deckStyles.volBtn} onPress={() => onUpdate({ volume: Math.max(0, deck.volume - 5) })}>
            <Text style={deckStyles.volBtnText}>−</Text>
          </Pressable>
          <Text style={[deckStyles.volValue, { color: accentColor }]}>{deck.volume}%</Text>
          <Pressable style={deckStyles.volBtn} onPress={() => onUpdate({ volume: Math.min(100, deck.volume + 5) })}>
            <Text style={deckStyles.volBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Pitch / Tempo */}
      <View style={deckStyles.pitchRow}>
        <View style={deckStyles.pitchControl}>
          <Text style={deckStyles.pitchLabel}>Pitch</Text>
          <View style={deckStyles.pitchBtns}>
            <Pressable style={deckStyles.pitchBtn} onPress={() => onUpdate({ pitch: Math.max(-6, deck.pitch - 1) })}>
              <Text style={deckStyles.pitchBtnText}>−</Text>
            </Pressable>
            <Text style={deckStyles.pitchValue}>{deck.pitch > 0 ? "+" : ""}{deck.pitch}st</Text>
            <Pressable style={deckStyles.pitchBtn} onPress={() => onUpdate({ pitch: Math.min(6, deck.pitch + 1) })}>
              <Text style={deckStyles.pitchBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
        <View style={deckStyles.pitchControl}>
          <Text style={deckStyles.pitchLabel}>Tempo</Text>
          <View style={deckStyles.pitchBtns}>
            <Pressable style={deckStyles.pitchBtn} onPress={() => onUpdate({ tempo: parseFloat(Math.max(-8, deck.tempo - 0.5).toFixed(1)) })}>
              <Text style={deckStyles.pitchBtnText}>−</Text>
            </Pressable>
            <Text style={deckStyles.pitchValue}>{deck.tempo > 0 ? "+" : ""}{deck.tempo}%</Text>
            <Pressable style={deckStyles.pitchBtn} onPress={() => onUpdate({ tempo: parseFloat(Math.min(8, deck.tempo + 0.5).toFixed(1)) })}>
              <Text style={deckStyles.pitchBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function EQKill({
  label, value, killed, color, onDec, onInc, onKill,
}: {
  label: string; value: number; killed: boolean; color: string;
  onDec: () => void; onInc: () => void; onKill: () => void;
}) {
  return (
    <View style={eqStyles.container}>
      <Pressable style={[eqStyles.killBtn, killed && { backgroundColor: color }]} onPress={onKill}>
        <Text style={[eqStyles.killBtnText, killed && { color: "#F5F5F5" }]}>KILL</Text>
      </Pressable>
      <Text style={[eqStyles.label, killed && { color: "#C41E3A" }]}>{label}</Text>
      <View style={eqStyles.track}>
        <View style={[eqStyles.fill, {
          height: `${((value + 12) / 24) * 100}%`,
          backgroundColor: killed ? "#C41E3A" : color,
        }]} />
      </View>
      <Text style={[eqStyles.value, { color }]}>{value > 0 ? "+" : ""}{value}</Text>
      <Pressable style={eqStyles.btn} onPress={onInc}><Text style={eqStyles.btnText}>+</Text></Pressable>
      <Pressable style={eqStyles.btn} onPress={onDec}><Text style={eqStyles.btnText}>−</Text></Pressable>
    </View>
  );
}

const eqStyles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", gap: 3 },
  killBtn: {
    paddingHorizontal: 4, paddingVertical: 3, borderRadius: 4,
    backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A35",
  },
  killBtnText: { color: "#6B7280", fontSize: 8, fontWeight: "700" },
  label: { color: "#9CA3AF", fontSize: 9, fontWeight: "700" },
  track: {
    width: 8, height: 40, backgroundColor: "#2A2A35",
    borderRadius: 4, overflow: "hidden", justifyContent: "flex-end",
  },
  fill: { width: 8, borderRadius: 4 },
  value: { fontSize: 9, fontWeight: "700" },
  btn: {
    width: 22, height: 22, backgroundColor: "#1A1A24",
    borderRadius: 5, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2A2A35",
  },
  btnText: { color: "#F5F5F5", fontSize: 14, fontWeight: "700", lineHeight: 18 },
});

const deckStyles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#111118", borderRadius: 12,
    padding: 10, borderWidth: 1, gap: 8,
  },
  deckHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  deckBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  deckBadgeText: { color: "#F5F5F5", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  trackTitle: { color: "#F5F5F5", fontSize: 11, fontWeight: "600" },
  waveform: {
    height: 40, backgroundColor: "#0D0D14", borderRadius: 6,
    overflow: "hidden", position: "relative",
  },
  waveProgress: { position: "absolute", top: 0, bottom: 0, left: 0, opacity: 0.15 },
  waveformBars: { flexDirection: "row", alignItems: "center", height: 40, gap: 1, paddingHorizontal: 2 },
  waveBar: { flex: 1, borderRadius: 1 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timeText: { color: "#6B7280", fontSize: 10 },
  bpmBadge: { fontSize: 11, fontWeight: "700" },
  playRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cueBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, alignItems: "center",
  },
  cueBtnText: { fontSize: 11, fontWeight: "800" },
  playBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  hotCueRow: { flexDirection: "row", gap: 4 },
  hotCueBtn: {
    flex: 1, paddingVertical: 6, borderRadius: 6,
    backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A35",
    alignItems: "center",
  },
  hotCueBtnText: { color: "#6B7280", fontSize: 8, fontWeight: "700" },
  loopRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  loopToggle: {
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6,
    backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A35",
  },
  loopToggleText: { color: "#6B7280", fontSize: 9, fontWeight: "700" },
  loopSizeBtn: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A35",
    alignItems: "center", justifyContent: "center",
  },
  loopSizeBtnText: { color: "#6B7280", fontSize: 10, fontWeight: "700" },
  eqRow: { flexDirection: "row", gap: 4 },
  volRow: { gap: 4 },
  volLabel: { color: "#9CA3AF", fontSize: 10, fontWeight: "700" },
  volTrack: { height: 4, backgroundColor: "#2A2A35", borderRadius: 2, overflow: "hidden" },
  volFill: { height: 4, borderRadius: 2 },
  volBtns: { flexDirection: "row", alignItems: "center", gap: 6 },
  volBtn: {
    width: 24, height: 24, backgroundColor: "#1A1A24",
    borderRadius: 6, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2A2A35",
  },
  volBtnText: { color: "#F5F5F5", fontSize: 14, fontWeight: "700", lineHeight: 18 },
  volValue: { fontSize: 11, fontWeight: "700" },
  pitchRow: { flexDirection: "row", gap: 8 },
  pitchControl: { flex: 1 },
  pitchLabel: { color: "#9CA3AF", fontSize: 9, marginBottom: 3 },
  pitchBtns: { flexDirection: "row", alignItems: "center", gap: 4 },
  pitchBtn: {
    width: 22, height: 22, backgroundColor: "#1A1A24",
    borderRadius: 5, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2A2A35",
  },
  pitchBtnText: { color: "#F5F5F5", fontSize: 13, fontWeight: "700", lineHeight: 17 },
  pitchValue: { color: "#F5F5F5", fontSize: 10, fontWeight: "700", flex: 1, textAlign: "center" },
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: { padding: 4 },
  pageTitle: { flex: 1, color: "#F5F5F5", fontSize: 24, fontWeight: "800" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  recBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#C41E3A22", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: "#C41E3A",
  },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#C41E3A" },
  recText: { color: "#C41E3A", fontSize: 10, fontWeight: "800" },
  recordBtn: { padding: 8 },
  recordBtnActive: { backgroundColor: "#C41E3A22", borderRadius: 8 },

  decksRow: { flexDirection: "row", gap: 8, marginBottom: 12 },

  bpmSyncRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#111118", borderRadius: 12, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: "#2A2A35",
  },
  bpmDisplay: { alignItems: "flex-start" },
  bpmValue: { color: "#F5F5F5", fontSize: 20, fontWeight: "900" },
  bpmLabel: { color: "#6B7280", fontSize: 10 },
  syncBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A35",
  },
  syncBtnActive: { backgroundColor: "#FFD70022", borderColor: "#FFD700" },
  syncBtnText: { color: "#9CA3AF", fontSize: 12, fontWeight: "700" },

  crossfaderSection: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#111118", borderRadius: 12, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: "#2A2A35",
  },
  deckLabel: { color: "#F5F5F5", fontSize: 14, fontWeight: "800", width: 16 },
  crossfaderTrack: {
    flex: 1, height: 8, backgroundColor: "#2A2A35",
    borderRadius: 4, overflow: "visible", position: "relative",
  },
  crossfaderFillA: { height: 8, backgroundColor: "#C41E3A", borderRadius: 4 },
  crossfaderThumb: {
    position: "absolute", top: -6, width: 20, height: 20,
    borderRadius: 10, backgroundColor: "#F5F5F5",
    borderWidth: 2, borderColor: "#C41E3A",
    marginLeft: -10,
  },
  crossfaderBtns: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 16, marginBottom: 12,
  },
  cfBtn: {
    width: 36, height: 36, backgroundColor: "#111118",
    borderRadius: 8, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2A2A35",
  },
  cfBtnText: { color: "#F5F5F5", fontSize: 16 },
  cfValue: { color: "#9CA3AF", fontSize: 13, fontWeight: "700", minWidth: 40, textAlign: "center" },

  masterRow: {
    backgroundColor: "#111118", borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: "#2A2A35", gap: 8,
  },
  masterLabel: { color: "#F5F5F5", fontSize: 13, fontWeight: "700" },
  masterTrack: { height: 6, backgroundColor: "#2A2A35", borderRadius: 3, overflow: "hidden" },
  masterFill: { height: 6, backgroundColor: "#FFD700", borderRadius: 3 },
  masterBtns: { flexDirection: "row", alignItems: "center", gap: 10 },
  volBtn: {
    width: 32, height: 32, backgroundColor: "#1A1A24",
    borderRadius: 8, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2A2A35",
  },
  volBtnText: { color: "#F5F5F5", fontSize: 18, fontWeight: "700", lineHeight: 22 },
  masterValue: { color: "#FFD700", fontSize: 14, fontWeight: "700", flex: 1, textAlign: "center" },

  fxSection: { marginBottom: 8 },
  sectionTitle: { color: "#F5F5F5", fontSize: 14, fontWeight: "700", marginBottom: 10 },
  fxGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fxBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#111118", borderWidth: 1, borderColor: "#2A2A35",
  },
  fxBtnActive: { backgroundColor: "#A78BFA22", borderColor: "#A78BFA" },
  fxBtnText: { color: "#9CA3AF", fontSize: 13, fontWeight: "600" },
  fxBtnTextActive: { color: "#A78BFA" },
});
