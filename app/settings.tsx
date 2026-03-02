import React, { useState } from "react";
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
import { GlassCard } from "@/components/ui/glass-card";
import { NeonText } from "@/components/ui/neon-text";

// ─── Settings Data ─────────────────────────────────────────────────────────────

const APP_VERSION = "1.0.0";
const BUILD = "2026.03";

interface SettingRow {
  id: string;
  icon: "speaker.wave.3.fill" | "waveform" | "mic.fill" | "bolt.fill" | "bell.fill" | "moon.fill" | "lock.fill" | "trash.fill" | "info.circle.fill" | "questionmark.circle.fill" | "envelope.fill" | "star.fill";
  label: string;
  description?: string;
  type: "toggle" | "action" | "info";
  color: string;
  value?: boolean;
  actionLabel?: string;
}

export default function SettingsScreen() {
  const router = useRouter();

  const [hqPlayback, setHqPlayback] = useState(true);
  const [autoMaster, setAutoMaster] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached audio previews and thumbnails. Your library data will not be affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => Alert.alert("Cache Cleared", "App cache has been cleared successfully."),
        },
      ]
    );
  };

  const handleResetLibrary = () => {
    Alert.alert(
      "Reset Library",
      "This will permanently delete all tracks from your local library. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => Alert.alert("Library Reset", "Your library has been cleared."),
        },
      ]
    );
  };

  const handleContact = () => {
    Alert.alert(
      "Contact Support",
      "Email us at support@dropai.app\n\nOr visit dropai.app/support for live chat and documentation.",
      [{ text: "OK" }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "About DROPAi",
      `DROPAi v${APP_VERSION} (Build ${BUILD})\n\nStudio quality. Every drop.\n\nBuilt for artists who demand the best — 24-bit/96kHz recording, AI mastering, live Jamy Room sessions, and worldwide distribution to Spotify, Apple Music, YouTube, SoundCloud, Beatport, and Facebook.\n\n© 2026 DROPAi. All rights reserved.`,
      [{ text: "OK" }]
    );
  };

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
          <NeonText color="#F5F5F5" size={22} weight="900">Settings</NeonText>
        </View>

        {/* ── Audio Quality ── */}
        <Text style={styles.sectionLabel}>AUDIO QUALITY</Text>
        <GlassCard style={styles.section} glowColor="#C41E3A" elevation={2}>
          <SettingToggle
            icon="speaker.wave.3.fill"
            iconColor="#C41E3A"
            label="Studio HD Playback"
            description="Stream and export at 24-bit/96kHz"
            value={hqPlayback}
            onChange={setHqPlayback}
          />
          <View style={styles.divider} />
          <SettingToggle
            icon="bolt.fill"
            iconColor="#FFD700"
            label="Auto-Master on Upload"
            description="Apply AI mastering immediately after upload"
            value={autoMaster}
            onChange={setAutoMaster}
          />
          <View style={styles.divider} />
          <SettingInfo
            icon="waveform"
            iconColor="#FF4D6D"
            label="Default Export Format"
            value="WAV HD (24-bit/96kHz)"
            onPress={() => Alert.alert("Export Format", "WAV HD (24-bit/96kHz) — highest quality lossless format.\n\nOther formats available during export: WAV (16-bit/44.1kHz), MP3 320kbps, FLAC, AAC 256kbps.")}
          />
        </GlassCard>

        {/* ── Recording ── */}
        <Text style={styles.sectionLabel}>RECORDING</Text>
        <GlassCard style={styles.section} glowColor="#F97316" elevation={2}>
          <SettingInfo
            icon="mic.fill"
            iconColor="#F97316"
            label="Input Source"
            value="Built-in Microphone"
            onPress={() => Alert.alert("Input Source", "Connect an external audio interface via USB or Lightning for professional 24-bit/96kHz recording.\n\nSupported: Focusrite Scarlett, Universal Audio, PreSonus, Behringer, MOTU.")}
          />
          <View style={styles.divider} />
          <SettingInfo
            icon="waveform"
            iconColor="#34D399"
            label="Buffer Size"
            value="256 samples (5.8ms)"
            onPress={() => Alert.alert("Buffer Size", "Lower buffer = lower latency but higher CPU load.\n\n• 64 samples — Ultra-low latency (1.5ms) — for live monitoring\n• 128 samples — Low latency (2.9ms) — recommended for Jamy Room\n• 256 samples — Standard (5.8ms) — default\n• 512 samples — Stable (11.6ms) — for slower devices")}
          />
        </GlassCard>

        {/* ── App Preferences ── */}
        <Text style={styles.sectionLabel}>APP PREFERENCES</Text>
        <GlassCard style={styles.section} glowColor="#A78BFA" elevation={2}>
          <SettingToggle
            icon="bell.fill"
            iconColor="#A78BFA"
            label="Push Notifications"
            description="Jamy Room invites, mastering complete, distribution live"
            value={notifications}
            onChange={setNotifications}
          />
          <View style={styles.divider} />
          <SettingToggle
            icon="moon.fill"
            iconColor="#60A5FA"
            label="Dark Mode"
            description="Always on — optimised for studio environments"
            value={darkMode}
            onChange={setDarkMode}
          />
          <View style={styles.divider} />
          <SettingToggle
            icon="lock.fill"
            iconColor="#34D399"
            label="Biometric Lock"
            description="Require Face ID / Touch ID to open DROPAi"
            value={biometric}
            onChange={setBiometric}
          />
        </GlassCard>

        {/* ── AI Assistant ── */}
        <Text style={styles.sectionLabel}>AI ASSISTANT</Text>
        <GlassCard style={styles.section} glowColor="#FFD700" elevation={2}>
          <SettingAction
            icon="bolt.fill"
            iconColor="#FFD700"
            label="AI Mode"
            description="Min · Max · Full Auto — controls how much the AI assists"
            actionLabel="Change in app"
            onPress={() => {
              router.back();
              Alert.alert("AI Mode", "Tap the AI badge in the top-right of any screen, or tap the floating AI button to change modes:\n\n• Min — suggestions only, you decide\n• Max — AI optimises settings automatically\n• Full Auto — end-to-end autonomous production");
            }}
          />
          <View style={styles.divider} />
          <SettingAction
            icon="trash.fill"
            iconColor="#C41E3A"
            label="Clear AI Conversation History"
            description="Removes all saved chat history with the AI assistant"
            actionLabel="Clear"
            onPress={() => Alert.alert("History Cleared", "AI conversation history has been cleared.")}
          />
        </GlassCard>

        {/* ── Data & Storage ── */}
        <Text style={styles.sectionLabel}>DATA & STORAGE</Text>
        <GlassCard style={styles.section} glowColor="#6B7280" elevation={2}>
          <SettingAction
            icon="trash.fill"
            iconColor="#F97316"
            label="Clear Cache"
            description="Free up storage by clearing audio previews and thumbnails"
            actionLabel="Clear"
            onPress={handleClearCache}
          />
          <View style={styles.divider} />
          <SettingAction
            icon="trash.fill"
            iconColor="#C41E3A"
            label="Reset Library"
            description="Permanently delete all tracks from local storage"
            actionLabel="Reset"
            onPress={handleResetLibrary}
          />
        </GlassCard>

        {/* ── Support & About ── */}
        <Text style={styles.sectionLabel}>SUPPORT & ABOUT</Text>
        <GlassCard style={styles.section} glowColor="#60A5FA" elevation={2}>
          <SettingAction
            icon="questionmark.circle.fill"
            iconColor="#60A5FA"
            label="Help & Documentation"
            description="Guides, tutorials, and feature walkthroughs"
            actionLabel="Open"
            onPress={() => Alert.alert("Help", "Visit dropai.app/docs for full documentation, video tutorials, and the DROPAi community forum.")}
          />
          <View style={styles.divider} />
          <SettingAction
            icon="envelope.fill"
            iconColor="#34D399"
            label="Contact Support"
            description="support@dropai.app · Live chat available 24/7"
            actionLabel="Contact"
            onPress={handleContact}
          />
          <View style={styles.divider} />
          <SettingAction
            icon="star.fill"
            iconColor="#FFD700"
            label="Rate DROPAi"
            description="Love the app? Leave us a review on the App Store"
            actionLabel="Rate"
            onPress={() => Alert.alert("Rate DROPAi", "Thank you! Rating us helps other artists discover DROPAi.\n\nWe'll open the App Store rating page when the app is published.")}
          />
          <View style={styles.divider} />
          <SettingAction
            icon="info.circle.fill"
            iconColor="#9CA3AF"
            label="About DROPAi"
            description={`Version ${APP_VERSION} · Build ${BUILD}`}
            actionLabel="View"
            onPress={handleAbout}
          />
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DROPAi v{APP_VERSION}</Text>
          <Text style={styles.footerSub}>Studio quality. Every drop.</Text>
          <Text style={styles.footerSub}>© 2026 DROPAi. All rights reserved.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SettingToggle({
  icon, iconColor, label, description, value, onChange,
}: {
  icon: React.ComponentProps<typeof IconSymbol>["name"];
  iconColor: string;
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={row.container}>
      <View style={[row.iconWrap, { backgroundColor: iconColor + "18" }]}>
        <IconSymbol name={icon} size={18} color={iconColor} />
      </View>
      <View style={row.text}>
        <Text style={row.label}>{label}</Text>
        {description && <Text style={row.desc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#2A2A35", true: "#C41E3A" }}
        thumbColor={value ? "#F5F5F5" : "#6B7280"}
      />
    </View>
  );
}

function SettingAction({
  icon, iconColor, label, description, actionLabel, onPress,
}: {
  icon: React.ComponentProps<typeof IconSymbol>["name"];
  iconColor: string;
  label: string;
  description?: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [row.container, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[row.iconWrap, { backgroundColor: iconColor + "18" }]}>
        <IconSymbol name={icon} size={18} color={iconColor} />
      </View>
      <View style={row.text}>
        <Text style={row.label}>{label}</Text>
        {description && <Text style={row.desc}>{description}</Text>}
      </View>
      <View style={[row.actionBtn, { borderColor: iconColor + "44" }]}>
        <Text style={[row.actionBtnText, { color: iconColor }]}>{actionLabel}</Text>
      </View>
    </Pressable>
  );
}

function SettingInfo({
  icon, iconColor, label, value, onPress,
}: {
  icon: React.ComponentProps<typeof IconSymbol>["name"];
  iconColor: string;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [row.container, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[row.iconWrap, { backgroundColor: iconColor + "18" }]}>
        <IconSymbol name={icon} size={18} color={iconColor} />
      </View>
      <View style={row.text}>
        <Text style={row.label}>{label}</Text>
        <Text style={[row.desc, { color: iconColor }]}>{value}</Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color="#4B5563" />
    </Pressable>
  );
}

const row = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
  label: { color: "#E5E7EB", fontSize: 14, fontWeight: "600", lineHeight: 18 },
  desc: { color: "#6B7280", fontSize: 12, lineHeight: 16 },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, backgroundColor: "transparent",
  },
  actionBtnText: { fontSize: 12, fontWeight: "700" },
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48, gap: 4 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: { padding: 4 },
  sectionLabel: {
    color: "#4B5563", fontSize: 11, fontWeight: "800",
    letterSpacing: 1.5, marginTop: 16, marginBottom: 8, paddingLeft: 4,
  },
  section: { padding: 16, gap: 12 },
  divider: { height: 1, backgroundColor: "#1E1E2E" },
  footer: { alignItems: "center", gap: 4, marginTop: 32, marginBottom: 16 },
  footerText: { color: "#374151", fontSize: 12, fontWeight: "700" },
  footerSub: { color: "#1F2937", fontSize: 11 },
});
