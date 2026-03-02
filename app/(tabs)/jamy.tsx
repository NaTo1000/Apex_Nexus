import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
  Alert,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonText } from "@/components/ui/neon-text";
import { AIAssistantButton } from "@/components/ai-assistant";
import { useAssistant } from "@/lib/store/assistant-context";

// ─── Data Types ───────────────────────────────────────────────────────────────

interface AmpModel {
  id: string;
  name: string;
  basedOn: string;
  character: string;
  gainRange: string;
  color: string;
}

interface CabinetModel {
  id: string;
  name: string;
  config: string;
  speaker: string;
}

interface PedalDef {
  id: string;
  name: string;
  category: string;
  color: string;
  params: { label: string; value: number; min: number; max: number }[];
}

interface SessionParticipant {
  id: string;
  name: string;
  instrument: string;
  latency: number;
  muted: boolean;
}

// ─── Amp Models ───────────────────────────────────────────────────────────────

const AMP_MODELS: AmpModel[] = [
  { id: "clean-king",   name: "Clean King",   basedOn: "Fender Twin Reverb",       character: "Clean · Glassy · Warm",      gainRange: "0–4",   color: "#34D399" },
  { id: "brit-stack",   name: "Brit Stack",   basedOn: "Marshall JCM800",          character: "Classic Rock · Crunch",      gainRange: "4–8",   color: "#FBBF24" },
  { id: "mesa-recto",   name: "Mesa Recto",   basedOn: "Mesa Boogie Dual Rectifier", character: "Heavy · Tight Low End",   gainRange: "6–10",  color: "#C41E3A" },
  { id: "vox-top",      name: "Vox Top Boost", basedOn: "Vox AC30",               character: "Chime · Jangle · British",   gainRange: "2–6",   color: "#60A5FA" },
  { id: "orange-crush", name: "Orange Crush", basedOn: "Orange Rockerverb",        character: "Warm · Punchy · Natural OD", gainRange: "3–8",   color: "#F97316" },
  { id: "roland-jazz",  name: "Roland Jazz",  basedOn: "Roland JC-120",            character: "Ultra-Clean · Stereo Chorus", gainRange: "0–3",  color: "#A78BFA" },
  { id: "init-clean",   name: "Init Clean",   basedOn: "Transparent / Flat",       character: "No colouration",             gainRange: "0",     color: "#9CA3AF" },
];

const CABINET_MODELS: CabinetModel[] = [
  { id: "1x12-v30",  name: "1×12 Vintage",  config: "1×12",  speaker: "Celestion Vintage 30" },
  { id: "2x12-g12m", name: "2×12 Greenback", config: "2×12", speaker: "Celestion G12M" },
  { id: "4x12-v30",  name: "4×12 Standard", config: "4×12",  speaker: "Celestion Vintage 30" },
  { id: "1x12-jen",  name: "1×12 Jensen",   config: "1×12",  speaker: "Jensen C12N" },
  { id: "2x12-ev",   name: "2×12 EV",       config: "2×12",  speaker: "EV12L" },
];

const MIC_POSITIONS = ["Centre", "Edge", "Off-axis"];

// ─── Pedal Definitions ────────────────────────────────────────────────────────

const PEDAL_DEFS: PedalDef[] = [
  { id: "tuner",      name: "Tuner",       category: "Utility",    color: "#9CA3AF",
    params: [] },
  { id: "comp",       name: "Compressor",  category: "Dynamics",   color: "#34D399",
    params: [{ label: "Threshold", value: -20, min: -60, max: 0 }, { label: "Ratio", value: 4, min: 1, max: 20 }, { label: "Sustain", value: 50, min: 0, max: 100 }, { label: "Level", value: 0, min: -12, max: 12 }] },
  { id: "od",         name: "Overdrive",   category: "Gain",       color: "#FBBF24",
    params: [{ label: "Drive", value: 40, min: 0, max: 100 }, { label: "Tone", value: 50, min: 0, max: 100 }, { label: "Level", value: 50, min: 0, max: 100 }] },
  { id: "dist",       name: "Distortion",  category: "Gain",       color: "#C41E3A",
    params: [{ label: "Gain", value: 60, min: 0, max: 100 }, { label: "Tone", value: 50, min: 0, max: 100 }, { label: "Level", value: 50, min: 0, max: 100 }] },
  { id: "fuzz",       name: "Fuzz",        category: "Gain",       color: "#FF4D6D",
    params: [{ label: "Fuzz", value: 70, min: 0, max: 100 }, { label: "Volume", value: 50, min: 0, max: 100 }, { label: "Tone", value: 50, min: 0, max: 100 }] },
  { id: "wah",        name: "Wah",         category: "Filter",     color: "#A78BFA",
    params: [{ label: "Frequency", value: 50, min: 0, max: 100 }, { label: "Resonance", value: 50, min: 0, max: 100 }] },
  { id: "chorus",     name: "Chorus",      category: "Modulation", color: "#60A5FA",
    params: [{ label: "Rate", value: 40, min: 0, max: 100 }, { label: "Depth", value: 50, min: 0, max: 100 }, { label: "Mix", value: 50, min: 0, max: 100 }] },
  { id: "phaser",     name: "Phaser",      category: "Modulation", color: "#818CF8",
    params: [{ label: "Rate", value: 30, min: 0, max: 100 }, { label: "Depth", value: 60, min: 0, max: 100 }, { label: "Feedback", value: 40, min: 0, max: 100 }, { label: "Mix", value: 50, min: 0, max: 100 }] },
  { id: "flanger",    name: "Flanger",     category: "Modulation", color: "#6EE7B7",
    params: [{ label: "Rate", value: 25, min: 0, max: 100 }, { label: "Depth", value: 50, min: 0, max: 100 }, { label: "Feedback", value: 60, min: 0, max: 100 }, { label: "Mix", value: 40, min: 0, max: 100 }] },
  { id: "delay",      name: "Delay",       category: "Time",       color: "#FCD34D",
    params: [{ label: "Time (ms)", value: 250, min: 10, max: 2000 }, { label: "Feedback", value: 40, min: 0, max: 100 }, { label: "Mix", value: 30, min: 0, max: 100 }] },
  { id: "reverb",     name: "Reverb",      category: "Time",       color: "#93C5FD",
    params: [{ label: "Size", value: 50, min: 0, max: 100 }, { label: "Decay", value: 60, min: 0, max: 100 }, { label: "Mix", value: 35, min: 0, max: 100 }] },
  { id: "pitch",      name: "Pitch Shift", category: "Pitch",      color: "#F472B6",
    params: [{ label: "Semitones", value: 0, min: -12, max: 12 }, { label: "Mix", value: 50, min: 0, max: 100 }] },
  { id: "gate",       name: "Noise Gate",  category: "Dynamics",   color: "#6B7280",
    params: [{ label: "Threshold", value: -40, min: -80, max: 0 }, { label: "Release", value: 50, min: 0, max: 100 }] },
];

const BUFFER_SIZES = [64, 128, 256, 512];
const INPUT_SOURCES = ["Built-in Mic", "External Mic", "Guitar (Adapter)", "Line In"];

// ─── Demo Session Participants ────────────────────────────────────────────────

const DEMO_PARTICIPANTS: SessionParticipant[] = [
  { id: "p1", name: "GuitarKing_AU",  instrument: "Guitar",  latency: 12, muted: false },
  { id: "p2", name: "BassDropper",    instrument: "Bass",    latency: 18, muted: false },
  { id: "p3", name: "DrummerX",       instrument: "Drums",   latency: 24, muted: false },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function JamyScreen() {
  const router = useRouter();
  const { setCurrentScreen } = useAssistant();

  useEffect(() => { setCurrentScreen("jamy"); }, [setCurrentScreen]);

  const [inputSource, setInputSource] = useState("Guitar (Adapter)");
  const [inputGain, setInputGain] = useState(70);
  const [selectedAmp, setSelectedAmp] = useState("brit-stack");
  const [ampGain, setAmpGain] = useState(60);
  const [ampBass, setAmpBass] = useState(50);
  const [ampMid, setAmpMid] = useState(50);
  const [ampTreble, setAmpTreble] = useState(60);
  const [ampPresence, setAmpPresence] = useState(40);
  const [ampVolume, setAmpVolume] = useState(70);
  const [selectedCab, setSelectedCab] = useState("4x12-v30");
  const [micPosition, setMicPosition] = useState("Centre");
  const [roomMic, setRoomMic] = useState(20);
  const [pedalStates, setPedalStates] = useState<Record<string, boolean>>({
    comp: false, od: true, dist: false, fuzz: false, wah: false,
    chorus: false, phaser: false, flanger: false, delay: true, reverb: true,
    pitch: false, gate: true, tuner: false,
  });
  const [pedalParams, setPedalParams] = useState<Record<string, number[]>>(
    Object.fromEntries(PEDAL_DEFS.map((p) => [p.id, p.params.map((pp) => pp.value)]))
  );
  const [bpm, setBpm] = useState(120);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [bufferSize, setBufferSize] = useState(128);
  const [recording, setRecording] = useState(false);
  const [inSession, setInSession] = useState(false);
  const [participants, setParticipants] = useState<SessionParticipant[]>(DEMO_PARTICIPANTS);
  const [expandedPedal, setExpandedPedal] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"chain" | "amp" | "cab" | "session">("chain");

  const togglePedal = useCallback((id: string) => {
    setPedalStates((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const updatePedalParam = useCallback((pedalId: string, paramIdx: number, delta: number) => {
    setPedalParams((prev) => {
      const params = [...(prev[pedalId] ?? [])];
      const def = PEDAL_DEFS.find((p) => p.id === pedalId);
      if (!def) return prev;
      const pd = def.params[paramIdx];
      params[paramIdx] = Math.max(pd.min, Math.min(pd.max, params[paramIdx] + delta));
      return { ...prev, [pedalId]: params };
    });
  }, []);

  const handleStartSession = useCallback(() => {
    setInSession(true);
    Alert.alert(
      "Jamy Room Live",
      "You are now live. Other artists can join your session.",
      [{ text: "Let's Jam!" }]
    );
  }, []);

  const handleEndSession = useCallback(() => {
    Alert.alert("End Session", "End the live jam session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Session",
        style: "destructive",
        onPress: () => {
          setInSession(false);
          setRecording(false);
        },
      },
    ]);
  }, []);

  const amp = AMP_MODELS.find((a) => a.id === selectedAmp) ?? AMP_MODELS[0];
  const cab = CABINET_MODELS.find((c) => c.id === selectedCab) ?? CABINET_MODELS[0];

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>
              Jamy<Text style={styles.pageTitleAccent}> Room</Text>
            </Text>
            <Text style={styles.subtitle}>Live Jam · Amp Sim · Full FX Chain</Text>
          </View>
          {inSession && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Input Source */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Input Source</Text>
          <View style={styles.inputSourceRow}>
            {INPUT_SOURCES.map((src) => (
              <Pressable
                key={src}
                style={[styles.sourceBtn, inputSource === src && styles.sourceBtnActive]}
                onPress={() => setInputSource(src)}
              >
                <Text style={[styles.sourceBtnText, inputSource === src && styles.sourceBtnTextActive]}>
                  {src}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.gainRow}>
            <Text style={styles.paramLabel}>Input Gain</Text>
            <KnobRow
              value={inputGain}
              onDecrement={() => setInputGain((v) => Math.max(0, v - 5))}
              onIncrement={() => setInputGain((v) => Math.min(100, v + 5))}
              unit="%"
              color="#C41E3A"
            />
          </View>
          {/* Level meter simulation */}
          <View style={styles.levelMeter}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.levelBar,
                  {
                    backgroundColor:
                      i < Math.floor((inputGain / 100) * 20)
                        ? i > 16 ? "#C41E3A" : i > 13 ? "#FBBF24" : "#34D399"
                        : "#2A2A35",
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Section Nav */}
        <View style={styles.sectionNav}>
          {(["chain", "amp", "cab", "session"] as const).map((s) => (
            <Pressable
              key={s}
              style={[styles.sectionNavBtn, activeSection === s && styles.sectionNavBtnActive]}
              onPress={() => setActiveSection(s)}
            >
              <Text style={[styles.sectionNavText, activeSection === s && styles.sectionNavTextActive]}>
                {s === "chain" ? "Pedals" : s === "amp" ? "Amp" : s === "cab" ? "Cabinet" : "Session"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── PEDAL BOARD ── */}
        {activeSection === "chain" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Signal Chain</Text>
            <View style={styles.signalChain}>
              <Text style={styles.chainLabel}>IN</Text>
              <View style={styles.chainArrow} />
              <Text style={styles.chainLabel}>PEDALS</Text>
              <View style={styles.chainArrow} />
              <Text style={styles.chainLabel}>AMP</Text>
              <View style={styles.chainArrow} />
              <Text style={styles.chainLabel}>CAB</Text>
              <View style={styles.chainArrow} />
              <Text style={styles.chainLabel}>OUT</Text>
            </View>

            {PEDAL_DEFS.map((pedal) => (
              <View key={pedal.id}>
                <Pressable
                  style={[
                    styles.pedalRow,
                    pedalStates[pedal.id] && { borderColor: pedal.color },
                  ]}
                  onPress={() => setExpandedPedal(expandedPedal === pedal.id ? null : pedal.id)}
                >
                  <View style={[styles.pedalLED, { backgroundColor: pedalStates[pedal.id] ? pedal.color : "#2A2A35" }]} />
                  <View style={styles.pedalInfo}>
                    <Text style={[styles.pedalName, pedalStates[pedal.id] && { color: pedal.color }]}>
                      {pedal.name}
                    </Text>
                    <Text style={styles.pedalCategory}>{pedal.category}</Text>
                  </View>
                  <Switch
                    value={pedalStates[pedal.id] ?? false}
                    onValueChange={() => togglePedal(pedal.id)}
                    trackColor={{ false: "#2A2A35", true: pedal.color + "88" }}
                    thumbColor={pedalStates[pedal.id] ? pedal.color : "#6B7280"}
                  />
                </Pressable>

                {expandedPedal === pedal.id && pedal.params.length > 0 && (
                  <View style={[styles.pedalExpanded, { borderColor: pedal.color + "44" }]}>
                    {pedal.params.map((param, idx) => (
                      <View key={idx} style={styles.pedalParamRow}>
                        <Text style={styles.pedalParamLabel}>{param.label}</Text>
                        <KnobRow
                          value={pedalParams[pedal.id]?.[idx] ?? param.value}
                          onDecrement={() => updatePedalParam(pedal.id, idx, -(param.max - param.min) / 20)}
                          onIncrement={() => updatePedalParam(pedal.id, idx, (param.max - param.min) / 20)}
                          unit=""
                          color={pedal.color}
                          small
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── AMP SECTION ── */}
        {activeSection === "amp" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Amp Simulator</Text>
            {AMP_MODELS.map((a) => (
              <Pressable
                key={a.id}
                style={[styles.ampRow, selectedAmp === a.id && { borderColor: a.color, backgroundColor: a.color + "11" }]}
                onPress={() => setSelectedAmp(a.id)}
              >
                <View style={[styles.ampColorDot, { backgroundColor: a.color }]} />
                <View style={styles.ampInfo}>
                  <Text style={[styles.ampName, selectedAmp === a.id && { color: a.color }]}>{a.name}</Text>
                  <Text style={styles.ampBased}>Based on: {a.basedOn}</Text>
                  <Text style={styles.ampChar}>{a.character}</Text>
                </View>
                <Text style={styles.ampGainRange}>Gain {a.gainRange}</Text>
              </Pressable>
            ))}

            {/* Amp Controls */}
            <View style={[styles.ampControls, { borderColor: amp.color + "44" }]}>
              <Text style={[styles.ampControlsTitle, { color: amp.color }]}>{amp.name} Controls</Text>
              <AmpKnob label="Gain"     value={ampGain}     color={amp.color}
                onDec={() => setAmpGain((v) => Math.max(0, v - 5))}
                onInc={() => setAmpGain((v) => Math.min(100, v + 5))} />
              <AmpKnob label="Bass"     value={ampBass}     color={amp.color}
                onDec={() => setAmpBass((v) => Math.max(0, v - 5))}
                onInc={() => setAmpBass((v) => Math.min(100, v + 5))} />
              <AmpKnob label="Mid"      value={ampMid}      color={amp.color}
                onDec={() => setAmpMid((v) => Math.max(0, v - 5))}
                onInc={() => setAmpMid((v) => Math.min(100, v + 5))} />
              <AmpKnob label="Treble"   value={ampTreble}   color={amp.color}
                onDec={() => setAmpTreble((v) => Math.max(0, v - 5))}
                onInc={() => setAmpTreble((v) => Math.min(100, v + 5))} />
              <AmpKnob label="Presence" value={ampPresence} color={amp.color}
                onDec={() => setAmpPresence((v) => Math.max(0, v - 5))}
                onInc={() => setAmpPresence((v) => Math.min(100, v + 5))} />
              <AmpKnob label="Volume"   value={ampVolume}   color={amp.color}
                onDec={() => setAmpVolume((v) => Math.max(0, v - 5))}
                onInc={() => setAmpVolume((v) => Math.min(100, v + 5))} />
            </View>
          </View>
        )}

        {/* ── CABINET SECTION ── */}
        {activeSection === "cab" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cabinet</Text>
            {CABINET_MODELS.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.cabRow, selectedCab === c.id && styles.cabRowActive]}
                onPress={() => setSelectedCab(c.id)}
              >
                <View style={styles.cabInfo}>
                  <Text style={[styles.cabName, selectedCab === c.id && { color: "#FFD700" }]}>{c.name}</Text>
                  <Text style={styles.cabSpeaker}>{c.config} · {c.speaker}</Text>
                </View>
                {selectedCab === c.id && (
                  <IconSymbol name="checkmark.circle.fill" size={18} color="#FFD700" />
                )}
              </Pressable>
            ))}

            <Text style={[styles.cardTitle, { marginTop: 16 }]}>Mic Position</Text>
            <View style={styles.micRow}>
              {MIC_POSITIONS.map((pos) => (
                <Pressable
                  key={pos}
                  style={[styles.micBtn, micPosition === pos && styles.micBtnActive]}
                  onPress={() => setMicPosition(pos)}
                >
                  <Text style={[styles.micBtnText, micPosition === pos && styles.micBtnTextActive]}>
                    {pos}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.gainRow}>
              <Text style={styles.paramLabel}>Room Mic Blend</Text>
              <KnobRow
                value={roomMic}
                onDecrement={() => setRoomMic((v) => Math.max(0, v - 5))}
                onIncrement={() => setRoomMic((v) => Math.min(100, v + 5))}
                unit="%"
                color="#9CA3AF"
              />
            </View>
          </View>
        )}

        {/* ── SESSION SECTION ── */}
        {activeSection === "session" && (
          <View>
            {/* Metronome */}
            <View style={styles.card}>
              <View style={styles.metronomeHeader}>
                <Text style={styles.cardTitle}>Metronome</Text>
                <Switch
                  value={metronomeOn}
                  onValueChange={setMetronomeOn}
                  trackColor={{ false: "#2A2A35", true: "#FFD70088" }}
                  thumbColor={metronomeOn ? "#FFD700" : "#6B7280"}
                />
              </View>
              <View style={styles.bpmRow}>
                <Pressable
                  style={styles.bpmBtn}
                  onPress={() => setBpm((v) => Math.max(40, v - 1))}
                >
                  <Text style={styles.bpmBtnText}>−</Text>
                </Pressable>
                <View style={styles.bpmDisplay}>
                  <Text style={[styles.bpmValue, metronomeOn && { color: "#FFD700" }]}>{bpm}</Text>
                  <Text style={styles.bpmLabel}>BPM</Text>
                </View>
                <Pressable
                  style={styles.bpmBtn}
                  onPress={() => setBpm((v) => Math.min(300, v + 1))}
                >
                  <Text style={styles.bpmBtnText}>+</Text>
                </Pressable>
                <Pressable
                  style={styles.tapBtn}
                  onPress={() => {}}
                >
                  <Text style={styles.tapBtnText}>TAP</Text>
                </Pressable>
              </View>
            </View>

            {/* Buffer / Latency */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Audio Buffer</Text>
              <Text style={styles.cardSubtitle}>
                Lower buffer = less latency, more CPU. Recommended: 128 samples for live play.
              </Text>
              <View style={styles.bufferRow}>
                {BUFFER_SIZES.map((b) => (
                  <Pressable
                    key={b}
                    style={[styles.bufferBtn, bufferSize === b && styles.bufferBtnActive]}
                    onPress={() => setBufferSize(b)}
                  >
                    <Text style={[styles.bufferBtnText, bufferSize === b && styles.bufferBtnTextActive]}>
                      {b}
                    </Text>
                    <Text style={[styles.bufferBtnSub, bufferSize === b && { color: "#C41E3A" }]}>
                      {b === 64 ? "~1.5ms" : b === 128 ? "~3ms" : b === 256 ? "~6ms" : "~12ms"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Participants */}
            {inSession && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Session Participants</Text>
                {participants.map((p) => (
                  <View key={p.id} style={styles.participantRow}>
                    <View style={styles.participantAvatar}>
                      <IconSymbol name="person.fill" size={18} color="#9CA3AF" />
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{p.name}</Text>
                      <Text style={styles.participantInstrument}>{p.instrument}</Text>
                    </View>
                    <View style={styles.latencyBadge}>
                      <Text style={[
                        styles.latencyText,
                        { color: p.latency < 20 ? "#34D399" : p.latency < 40 ? "#FBBF24" : "#C41E3A" }
                      ]}>
                        {p.latency}ms
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setParticipants((prev) =>
                        prev.map((pp) => pp.id === p.id ? { ...pp, muted: !pp.muted } : pp)
                      )}
                    >
                      <IconSymbol
                        name={p.muted ? "mic.slash.fill" : "mic.fill"}
                        size={18}
                        color={p.muted ? "#C41E3A" : "#34D399"}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Recording */}
            <View style={styles.card}>
              <View style={styles.recordRow}>
                <View>
                  <Text style={styles.cardTitle}>Session Recording</Text>
                  <Text style={styles.cardSubtitle}>Captures all stems at 24-bit / 96kHz</Text>
                </View>
                <Switch
                  value={recording}
                  onValueChange={setRecording}
                  trackColor={{ false: "#2A2A35", true: "#C41E3A88" }}
                  thumbColor={recording ? "#C41E3A" : "#6B7280"}
                />
              </View>
              {recording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordDot} />
                  <Text style={styles.recordingText}>Recording in progress — 24-bit / 96kHz</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Session Controls */}
        <View style={styles.sessionControls}>
          {!inSession ? (
            <Pressable
              style={({ pressed }) => [styles.goLiveBtn, pressed && { opacity: 0.85 }]}
              onPress={handleStartSession}
            >
              <IconSymbol name="headphones" size={22} color="#F5F5F5" />
              <Text style={styles.goLiveBtnText}>Go Live — Start Jamy Session</Text>
            </Pressable>
          ) : (
            <View style={styles.liveControls}>
              <Pressable
                style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.8 }]}
                onPress={handleEndSession}
              >
                <Text style={styles.endBtnText}>End Session</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.inviteBtn, pressed && { opacity: 0.8 }]}
                onPress={() => Alert.alert("Invite", "Share your session link with other artists to join.")}
              >
                <IconSymbol name="person.badge.plus" size={18} color="#F5F5F5" />
                <Text style={styles.inviteBtnText}>Invite</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
      <AIAssistantButton />
    </ScreenContainer>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KnobRow({
  value, onDecrement, onIncrement, unit, color, small = false,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  unit: string;
  color: string;
  small?: boolean;
}) {
  return (
    <View style={knobStyles.row}>
      <Pressable
        style={({ pressed }) => [knobStyles.btn, small && knobStyles.btnSmall, pressed && { opacity: 0.6 }]}
        onPress={onDecrement}
      >
        <Text style={[knobStyles.btnText, small && knobStyles.btnTextSmall]}>−</Text>
      </Pressable>
      <Text style={[knobStyles.value, { color }, small && knobStyles.valueSmall]}>
        {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value}{unit}
      </Text>
      <Pressable
        style={({ pressed }) => [knobStyles.btn, small && knobStyles.btnSmall, pressed && { opacity: 0.6 }]}
        onPress={onIncrement}
      >
        <Text style={[knobStyles.btnText, small && knobStyles.btnTextSmall]}>+</Text>
      </Pressable>
    </View>
  );
}

function AmpKnob({
  label, value, color, onDec, onInc,
}: {
  label: string;
  value: number;
  color: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <View style={knobStyles.ampRow}>
      <Text style={knobStyles.ampLabel}>{label}</Text>
      <View style={knobStyles.ampTrack}>
        <View style={[knobStyles.ampFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <KnobRow value={value} onDecrement={onDec} onIncrement={onInc} unit="%" color={color} small />
    </View>
  );
}

const knobStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  btn: {
    width: 32, height: 32, backgroundColor: "#1A1A24",
    borderRadius: 8, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2A2A35",
  },
  btnSmall: { width: 24, height: 24, borderRadius: 6 },
  btnText: { color: "#F5F5F5", fontSize: 18, fontWeight: "700", lineHeight: 22 },
  btnTextSmall: { fontSize: 14, lineHeight: 18 },
  value: { fontSize: 14, fontWeight: "700", minWidth: 50, textAlign: "center" },
  valueSmall: { fontSize: 12, minWidth: 40 },
  ampRow: { marginBottom: 10 },
  ampLabel: { color: "#9CA3AF", fontSize: 12, marginBottom: 4 },
  ampTrack: { height: 4, backgroundColor: "#2A2A35", borderRadius: 2, overflow: "hidden", marginBottom: 6 },
  ampFill: { height: 4, borderRadius: 2 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  pageTitle: { color: "#F5F5F5", fontSize: 26, fontWeight: "900" },
  pageTitleAccent: { color: "#FFD700" },
  subtitle: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#C41E3A22", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "#C41E3A",
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C41E3A" },
  liveText: { color: "#C41E3A", fontSize: 12, fontWeight: "800", letterSpacing: 1 },

  card: {
    backgroundColor: "#111118", borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: "#2A2A35",
  },
  cardTitle: { color: "#F5F5F5", fontSize: 14, fontWeight: "700", marginBottom: 10 },
  cardSubtitle: { color: "#6B7280", fontSize: 12, marginBottom: 10 },

  inputSourceRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  sourceBtn: {
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8,
    backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A35",
  },
  sourceBtnActive: { backgroundColor: "#C41E3A22", borderColor: "#C41E3A" },
  sourceBtnText: { color: "#9CA3AF", fontSize: 12 },
  sourceBtnTextActive: { color: "#C41E3A", fontWeight: "600" },
  gainRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  paramLabel: { color: "#9CA3AF", fontSize: 12 },
  levelMeter: { flexDirection: "row", gap: 2, height: 10, alignItems: "flex-end" },
  levelBar: { flex: 1, height: 10, borderRadius: 2 },

  sectionNav: {
    flexDirection: "row", backgroundColor: "#111118", borderRadius: 12,
    borderWidth: 1, borderColor: "#2A2A35", marginBottom: 12, overflow: "hidden",
  },
  sectionNavBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  sectionNavBtnActive: { backgroundColor: "#C41E3A" },
  sectionNavText: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
  sectionNavTextActive: { color: "#F5F5F5" },

  signalChain: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginBottom: 14, gap: 4,
  },
  chainLabel: { color: "#9CA3AF", fontSize: 10, fontWeight: "700" },
  chainArrow: { width: 12, height: 1, backgroundColor: "#C41E3A" },

  pedalRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1A1A24", borderRadius: 10, padding: 12,
    marginBottom: 4, borderWidth: 1, borderColor: "#2A2A35",
  },
  pedalLED: { width: 10, height: 10, borderRadius: 5 },
  pedalInfo: { flex: 1 },
  pedalName: { color: "#F5F5F5", fontSize: 13, fontWeight: "600" },
  pedalCategory: { color: "#6B7280", fontSize: 11 },
  pedalExpanded: {
    backgroundColor: "#0D0D14", borderRadius: 10, padding: 12,
    marginBottom: 4, borderWidth: 1,
  },
  pedalParamRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
  },
  pedalParamLabel: { color: "#9CA3AF", fontSize: 12 },

  ampRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1A1A24", borderRadius: 10, padding: 12,
    marginBottom: 6, borderWidth: 1, borderColor: "#2A2A35",
  },
  ampColorDot: { width: 12, height: 12, borderRadius: 6 },
  ampInfo: { flex: 1 },
  ampName: { color: "#F5F5F5", fontSize: 13, fontWeight: "700" },
  ampBased: { color: "#6B7280", fontSize: 11 },
  ampChar: { color: "#9CA3AF", fontSize: 11, marginTop: 2 },
  ampGainRange: { color: "#6B7280", fontSize: 11 },
  ampControls: {
    backgroundColor: "#0D0D14", borderRadius: 10, padding: 14,
    marginTop: 10, borderWidth: 1,
  },
  ampControlsTitle: { fontSize: 13, fontWeight: "700", marginBottom: 12 },

  cabRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#1A1A24", borderRadius: 10, padding: 12,
    marginBottom: 6, borderWidth: 1, borderColor: "#2A2A35",
  },
  cabRowActive: { borderColor: "#FFD700", backgroundColor: "#1A1500" },
  cabInfo: {},
  cabName: { color: "#F5F5F5", fontSize: 13, fontWeight: "600" },
  cabSpeaker: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  micRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  micBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A35",
    alignItems: "center",
  },
  micBtnActive: { backgroundColor: "#FFD70022", borderColor: "#FFD700" },
  micBtnText: { color: "#9CA3AF", fontSize: 12 },
  micBtnTextActive: { color: "#FFD700", fontWeight: "600" },

  metronomeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  bpmRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bpmBtn: {
    width: 44, height: 44, backgroundColor: "#1A1A24", borderRadius: 10,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2A2A35",
  },
  bpmBtnText: { color: "#F5F5F5", fontSize: 22, fontWeight: "700" },
  bpmDisplay: { flex: 1, alignItems: "center" },
  bpmValue: { color: "#F5F5F5", fontSize: 36, fontWeight: "900" },
  bpmLabel: { color: "#6B7280", fontSize: 11 },
  tapBtn: {
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#C41E3A22",
    borderRadius: 10, borderWidth: 1, borderColor: "#C41E3A",
  },
  tapBtnText: { color: "#C41E3A", fontSize: 13, fontWeight: "700" },

  bufferRow: { flexDirection: "row", gap: 8 },
  bufferBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#1A1A24", borderWidth: 1, borderColor: "#2A2A35",
    alignItems: "center",
  },
  bufferBtnActive: { backgroundColor: "#C41E3A22", borderColor: "#C41E3A" },
  bufferBtnText: { color: "#F5F5F5", fontSize: 14, fontWeight: "700" },
  bufferBtnTextActive: { color: "#C41E3A" },
  bufferBtnSub: { color: "#6B7280", fontSize: 10, marginTop: 2 },

  participantRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#2A2A35",
  },
  participantAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#1A1A24", alignItems: "center", justifyContent: "center",
  },
  participantInfo: { flex: 1 },
  participantName: { color: "#F5F5F5", fontSize: 13, fontWeight: "600" },
  participantInstrument: { color: "#6B7280", fontSize: 11 },
  latencyBadge: {
    backgroundColor: "#1A1A24", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  latencyText: { fontSize: 11, fontWeight: "700" },

  recordRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recordingIndicator: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#C41E3A22", borderRadius: 8, padding: 10, marginTop: 10,
  },
  recordDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C41E3A" },
  recordingText: { color: "#C41E3A", fontSize: 12 },

  sessionControls: { marginTop: 4, marginBottom: 16 },
  goLiveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#C41E3A", borderRadius: 16, paddingVertical: 18, gap: 10,
  },
  goLiveBtnText: { color: "#F5F5F5", fontSize: 16, fontWeight: "800" },
  liveControls: { flexDirection: "row", gap: 12 },
  endBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 14,
    backgroundColor: "#1A0A0E", borderWidth: 1, borderColor: "#C41E3A",
    alignItems: "center",
  },
  endBtnText: { color: "#C41E3A", fontSize: 15, fontWeight: "700" },
  inviteBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: "#111118",
    borderWidth: 1, borderColor: "#2A2A35",
  },
  inviteBtnText: { color: "#F5F5F5", fontSize: 15, fontWeight: "600" },
});
