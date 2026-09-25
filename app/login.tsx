import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/use-auth";
import { APP_ID, OAUTH_PORTAL_URL, startOAuthLogin } from "@/constants/oauth";

const avatar = require("@/assets/images/nato1000-avatar.jpg");

export default function LoginScreen() {
  const { isAuthenticated, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const authConfigured = Boolean(APP_ID && OAUTH_PORTAL_URL);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#59B9FF" />
        <Text style={styles.loadingText}>Checking your secure session…</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  const handleSignIn = async () => {
    setLoginError(null);
    if (!authConfigured) {
      setLoginError(
        "Secure sign-in is not configured for this build yet. Add the app OAuth settings to the deployment environment; no password or demo account is used here.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await startOAuthLogin();
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Could not start secure sign-in. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>A</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>APEX NEXUS</Text>
              <Text style={styles.brandSubtitle}>SECURE ACCESS</Text>
            </View>
          </View>

          <View style={styles.avatarHalo}>
            <Image source={avatar} style={styles.avatar} accessibilityLabel="Nato1000 illustrated profile avatar" />
          </View>

          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.title}>Sign in to continue</Text>
          <Text style={styles.description}>
            Use your trusted account to access your Apex Nexus workspace. Your session is protected by the project’s OAuth sign-in flow.
          </Text>

          <View style={styles.accountPreview}>
            <View style={styles.statusDot} />
            <View>
              <Text style={styles.handle}>Nato1000</Text>
              <Text style={styles.handleCaption}>Your profile identity</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting, busy: submitting }}
            disabled={submitting}
            onPress={handleSignIn}
            style={({ pressed }) => [styles.signInButton, pressed && !submitting && styles.buttonPressed, submitting && styles.buttonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#07111D" />
            ) : (
              <Text style={styles.signInButtonText}>Continue with secure sign-in</Text>
            )}
          </Pressable>

          {!authConfigured && (
            <Text style={styles.configHint}>
              OAuth settings are required before this button can start a live sign-in.
            </Text>
          )}
          {loginError && <Text accessibilityRole="alert" style={styles.errorText}>{loginError}</Text>}

          <View style={styles.securityNote}>
            <Text style={styles.lockIcon}>◆</Text>
            <Text style={styles.securityText}>No local password is stored by this app.</Text>
          </View>
        </View>
        <Text style={styles.footer}>APEX NEXUS · ACCOUNT ACCESS</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#060A10" },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: "#060A10" },
  loadingText: { color: "#91A4B8", fontSize: 14 },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 22 },
  card: {
    width: "100%",
    maxWidth: 460,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 32,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#1D344A",
    backgroundColor: "#0C131D",
    shadowColor: "#178CE6",
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 11, alignSelf: "flex-start", marginBottom: 28 },
  brandMark: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#10273A", borderWidth: 1, borderColor: "#2B9DEB", alignItems: "center", justifyContent: "center" },
  brandMarkText: { color: "#70C7FF", fontSize: 22, fontWeight: "900" },
  brandTitle: { color: "#F0F6FC", fontSize: 14, fontWeight: "900", letterSpacing: 2.1 },
  brandSubtitle: { color: "#668098", fontSize: 9, fontWeight: "800", letterSpacing: 2.4, marginTop: 3 },
  avatarHalo: { width: 118, height: 118, borderRadius: 59, padding: 4, borderWidth: 1, borderColor: "#2B9DEB", backgroundColor: "#10273A", marginBottom: 24 },
  avatar: { width: "100%", height: "100%", borderRadius: 55 },
  eyebrow: { color: "#61BDF8", fontSize: 10, fontWeight: "800", letterSpacing: 2.6, marginBottom: 9 },
  title: { color: "#F3F7FC", fontSize: 26, lineHeight: 33, fontWeight: "800", textAlign: "center" },
  description: { color: "#9CAEC0", fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 12, maxWidth: 360 },
  accountPreview: { flexDirection: "row", alignItems: "center", alignSelf: "stretch", gap: 12, padding: 14, marginTop: 24, marginBottom: 16, backgroundColor: "#101C28", borderWidth: 1, borderColor: "#203447", borderRadius: 14 },
  statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#6BD6AB" },
  handle: { color: "#F0F6FC", fontSize: 14, fontWeight: "700" },
  handleCaption: { color: "#7790A4", fontSize: 11, marginTop: 3 },
  signInButton: { minHeight: 52, alignSelf: "stretch", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, backgroundColor: "#68C5FF", borderRadius: 14 },
  signInButtonText: { color: "#06121D", fontSize: 14, fontWeight: "800" },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.72 },
  configHint: { color: "#8297AA", fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 10 },
  errorText: { alignSelf: "stretch", color: "#FF9D9D", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 12 },
  securityNote: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22 },
  lockIcon: { color: "#6BD6AB", fontSize: 9 },
  securityText: { color: "#71879A", fontSize: 11 },
  footer: { color: "#516579", fontSize: 9, fontWeight: "700", letterSpacing: 2.4, marginTop: 22 },
});
