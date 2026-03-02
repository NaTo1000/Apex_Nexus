import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAssistant, AIMode, ChatMessage } from "@/lib/store/assistant-context";
import { trpc } from "@/lib/trpc";

// ─── Mode Config ──────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<AIMode, { label: string; shortLabel: string; color: string; bg: string; description: string }> = {
  min: {
    label: "Min",
    shortLabel: "MIN",
    color: "#34D399",
    bg: "#34D39922",
    description: "Suggestions only — you control everything",
  },
  max: {
    label: "Max",
    shortLabel: "MAX",
    color: "#FFD700",
    bg: "#FFD70022",
    description: "AI recommends settings — you approve",
  },
  full_auto: {
    label: "Full Auto",
    shortLabel: "AUTO",
    color: "#C41E3A",
    bg: "#C41E3A22",
    description: "AI autonomously runs your production pipeline",
  },
};

const QUICK_CHIPS: Record<string, string[]> = {
  home: ["What should I work on?", "Analyse my library", "Best release strategy"],
  library: ["Master this track", "Compare my tracks", "What format should I use?"],
  upload: ["Best format for streaming?", "What metadata matters most?", "Optimal BPM for my genre?"],
  "mastering/[id]": ["Suggest mastering settings", "What LUFS target?", "Explain multiband compression"],
  jamy: ["Best amp for my style?", "Signal chain advice", "Reduce latency tips"],
  "dj-mixer": ["BPM matching tips", "Best transition technique", "EQ kill strategies"],
  lyricist: ["Write a hook for me", "Rhyme scheme advice", "How to make a hit chorus"],
  "video-generator": ["Best visual style for my genre", "Low budget video ideas", "Colour palette suggestions"],
  "recording-studio": ["Mic placement tips", "How to reduce noise", "Best recording levels"],
  distribution: ["Which platforms pay most?", "When to release?", "Playlist pitching strategy"],
  payments: ["Explain royalty splits", "Is membership worth it?", "Distribution cost comparison"],
};

// ─── Floating Button ──────────────────────────────────────────────────────────

export function AIAssistantButton() {
  const { mode, isOpen, toggleAssistant, isThinking } = useAssistant();
  const insets = useSafeAreaInsets();
  const cfg = MODE_CONFIG[mode];
  const pulse = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isThinking) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse.setValue(1);
    }
  }, [isThinking, pulse]);

  if (isOpen) return null;

  return (
    <Animated.View
      style={[
        styles.floatBtn,
        { bottom: insets.bottom + 80, transform: [{ scale: pulse }] },
        { backgroundColor: cfg.bg, borderColor: cfg.color + "66" },
      ]}
    >
      <Pressable
        style={styles.floatBtnInner}
        onPress={toggleAssistant}
      >
        {isThinking ? (
          <ActivityIndicator color={cfg.color} size="small" />
        ) : (
          <IconSymbol name="wand.and.stars" size={22} color={cfg.color} />
        )}
        <View style={[styles.modeDot, { backgroundColor: cfg.color }]} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Assistant Panel ──────────────────────────────────────────────────────────

export function AIAssistantPanel() {
  const {
    mode, setMode, isOpen, closeAssistant,
    history, addMessage, setThinking, isThinking,
    currentScreen, clearHistory,
  } = useAssistant();

  const [input, setInput] = useState("");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const chatMutation = trpc.assistant.chat.useMutation({
    onMutate: () => setThinking(true),
    onSettled: () => setThinking(false),
    onSuccess: (data) => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: data.content,
        timestamp: data.timestamp,
        usedWebSearch: data.usedWebSearch,
        mode: data.mode as AIMode,
      };
      addMessage(assistantMsg);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: () => {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "I hit a snag — please try again.",
        timestamp: new Date().toISOString(),
      };
      addMessage(errMsg);
    },
  });

  const handleSend = useCallback((text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    setInput("");

    chatMutation.mutate({
      message: msg,
      mode,
      screen: currentScreen,
      history: history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      allowWebSearch: true,
    });

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [input, isThinking, mode, currentScreen, history, addMessage, chatMutation]);

  const chips = QUICK_CHIPS[currentScreen] ?? QUICK_CHIPS.home;
  const cfg = MODE_CONFIG[mode];

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeAssistant}
    >
      <KeyboardAvoidingView
        style={[styles.panel, { paddingBottom: insets.bottom }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.panelHeader}>
          <View style={styles.panelHeaderLeft}>
            <View style={[styles.aiOrb, { backgroundColor: cfg.bg, borderColor: cfg.color + "66" }]}>
              <IconSymbol name="wand.and.stars" size={18} color={cfg.color} />
            </View>
            <View>
              <Text style={styles.panelTitle}>DROPAi Assistant</Text>
              <Text style={[styles.panelSubtitle, { color: cfg.color }]}>{cfg.description}</Text>
            </View>
          </View>
          <Pressable style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]} onPress={closeAssistant}>
            <IconSymbol name="xmark" size={18} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Mode Selector */}
        <Pressable
          style={[styles.modeBar, { backgroundColor: cfg.bg, borderColor: cfg.color + "44" }]}
          onPress={() => setShowModeSelector((v) => !v)}
        >
          <View style={styles.modeBarLeft}>
            <View style={[styles.modeBadge, { backgroundColor: cfg.color }]}>
              <Text style={styles.modeBadgeText}>{cfg.shortLabel}</Text>
            </View>
            <Text style={[styles.modeLabel, { color: cfg.color }]}>{cfg.label} Mode</Text>
          </View>
          <IconSymbol name={showModeSelector ? "chevron.up" : "chevron.down"} size={14} color={cfg.color} />
        </Pressable>

        {showModeSelector && (
          <View style={styles.modeSelectorPanel}>
            {(Object.keys(MODE_CONFIG) as AIMode[]).map((m) => {
              const c = MODE_CONFIG[m];
              return (
                <Pressable
                  key={m}
                  style={[styles.modeOption, mode === m && { backgroundColor: c.bg, borderColor: c.color + "44" }]}
                  onPress={() => { setMode(m); setShowModeSelector(false); }}
                >
                  <View style={[styles.modeDotLarge, { backgroundColor: c.color }]} />
                  <View style={styles.modeOptionText}>
                    <Text style={[styles.modeOptionLabel, { color: c.color }]}>{c.label}</Text>
                    <Text style={styles.modeOptionDesc}>{c.description}</Text>
                  </View>
                  {mode === m && <IconSymbol name="checkmark" size={14} color={c.color} />}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Internet Access Indicator */}
        <View style={styles.internetBadge}>
          <View style={styles.internetDot} />
          <Text style={styles.internetText}>Live internet research enabled · Admin access blocked</Text>
        </View>

        {/* Chat History */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {history.length === 0 && (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatEmoji}>🎵</Text>
              <Text style={styles.emptyChatTitle}>Hey, I'm your DROPAi assistant</Text>
              <Text style={styles.emptyChatText}>
                I can help with mastering, songwriting, distribution strategy, music theory, and more. I have live internet access to research current trends and platform data.
              </Text>
            </View>
          )}

          {history.map((msg) => (
            <View key={msg.id} style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.aiBubble]}>
              {msg.role === "assistant" && (
                <View style={styles.bubbleHeader}>
                  <IconSymbol name="wand.and.stars" size={12} color={MODE_CONFIG[msg.mode ?? "min"].color} />
                  <Text style={[styles.bubbleMode, { color: MODE_CONFIG[msg.mode ?? "min"].color }]}>
                    {MODE_CONFIG[msg.mode ?? "min"].shortLabel}
                  </Text>
                  {msg.usedWebSearch && (
                    <View style={styles.webSearchBadge}>
                      <IconSymbol name="globe" size={10} color="#60A5FA" />
                      <Text style={styles.webSearchText}>web</Text>
                    </View>
                  )}
                </View>
              )}
              <Text style={[styles.bubbleText, msg.role === "user" && styles.userBubbleText]}>
                {msg.content}
              </Text>
              <Text style={styles.bubbleTime}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          ))}

          {isThinking && (
            <View style={[styles.bubble, styles.aiBubble]}>
              <View style={styles.thinkingRow}>
                <ActivityIndicator color={cfg.color} size="small" />
                <Text style={[styles.thinkingText, { color: cfg.color }]}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Chips */}
        {history.length < 2 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            <View style={styles.chipsRow}>
              {chips.map((chip) => (
                <Pressable
                  key={chip}
                  style={({ pressed }) => [styles.chip, pressed && { opacity: 0.75 }]}
                  onPress={() => handleSend(chip)}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about your music..."
            placeholderTextColor="#4B5563"
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <View style={styles.inputActions}>
            {history.length > 0 && (
              <Pressable
                style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
                onPress={clearHistory}
              >
                <IconSymbol name="trash" size={16} color="#4B5563" />
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: cfg.color },
                pressed && { opacity: 0.85 },
                (!input.trim() || isThinking) && { opacity: 0.4 },
              ]}
              onPress={() => handleSend()}
              disabled={!input.trim() || isThinking}
            >
              <IconSymbol name="paperplane.fill" size={16} color="#0A0A0F" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Mode Badge (for screen headers) ─────────────────────────────────────────

export function AIModeHeaderBadge() {
  const { mode, openAssistant } = useAssistant();
  const cfg = MODE_CONFIG[mode];

  return (
    <Pressable
      style={[styles.headerBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + "55" }]}
      onPress={openAssistant}
    >
      <View style={[styles.headerBadgeDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.headerBadgeText, { color: cfg.color }]}>{cfg.shortLabel}</Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Floating button
  floatBtn: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    zIndex: 999,
    elevation: 10,
    shadowColor: "#C41E3A",
    shadowRadius: 12,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
  },
  floatBtnInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modeDot: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#0A0A0F",
  },
  // Panel
  panel: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A25",
  },
  panelHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  panelTitle: { color: "#F5F5F5", fontSize: 16, fontWeight: "800" },
  panelSubtitle: { fontSize: 11, marginTop: 1 },
  closeBtn: { padding: 8 },
  // Mode bar
  modeBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  modeBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  modeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  modeBadgeText: { color: "#0A0A0F", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  modeLabel: { fontSize: 13, fontWeight: "700" },
  modeSelectorPanel: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: "#111118",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A25",
  },
  modeDotLarge: { width: 10, height: 10, borderRadius: 5 },
  modeOptionText: { flex: 1 },
  modeOptionLabel: { fontSize: 14, fontWeight: "700" },
  modeOptionDesc: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  // Internet badge
  internetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#0D1117",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1A2A1A",
  },
  internetDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" },
  internetText: { color: "#4B7A4B", fontSize: 10, fontWeight: "600" },
  // Chat
  chatScroll: { flex: 1 },
  chatContent: { padding: 16, gap: 10 },
  emptyChat: { alignItems: "center", paddingVertical: 30, gap: 10 },
  emptyChatEmoji: { fontSize: 40 },
  emptyChatTitle: { color: "#F5F5F5", fontSize: 16, fontWeight: "700", textAlign: "center" },
  emptyChatText: { color: "#6B7280", fontSize: 13, textAlign: "center", lineHeight: 20, maxWidth: 300 },
  bubble: {
    maxWidth: "88%",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#1A0A0E",
    borderColor: "#C41E3A44",
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#0E0E18",
    borderColor: "#2A2A35",
  },
  bubbleHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  bubbleMode: { fontSize: 10, fontWeight: "800" },
  webSearchBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#60A5FA11", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  webSearchText: { color: "#60A5FA", fontSize: 9, fontWeight: "600" },
  bubbleText: { color: "#E5E7EB", fontSize: 13, lineHeight: 20 },
  userBubbleText: { color: "#F5F5F5" },
  bubbleTime: { color: "#4B5563", fontSize: 10, marginTop: 6, alignSelf: "flex-end" },
  thinkingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  thinkingText: { fontSize: 13, fontWeight: "600" },
  // Chips
  chipsScroll: { maxHeight: 48, marginBottom: 4 },
  chipsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  chip: {
    backgroundColor: "#111118",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  chipText: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" },
  // Input
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1A1A25",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#111118",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A35",
    color: "#F5F5F5",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  inputActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  clearBtn: { padding: 8 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  // Header badge
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  headerBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  headerBadgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
});
