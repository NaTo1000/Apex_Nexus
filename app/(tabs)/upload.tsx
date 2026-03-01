import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLibrary } from "@/lib/store/library-context";
import { Track, AudioFormat, formatFileSize } from "@/lib/store/library-store";

const GENRE_OPTIONS = [
  "Electronic", "Hip-Hop", "Techno", "House", "Drum & Bass",
  "Rock", "Jazz", "Classical", "Pop", "R&B", "Ambient", "Other",
];

const KEY_OPTIONS = [
  "C", "Cm", "C#", "C#m", "D", "Dm", "D#", "D#m",
  "E", "Em", "F", "Fm", "F#", "F#m", "G", "Gm",
  "G#", "G#m", "A", "Am", "A#", "A#m", "B", "Bm",
];

function detectFormat(mimeType: string, name: string): AudioFormat {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "flac" || mimeType.includes("flac")) return "FLAC";
  if (ext === "aac" || mimeType.includes("aac")) return "AAC";
  if (ext === "mp3" || mimeType.includes("mpeg")) return "MP3";
  if (ext === "wav" || mimeType.includes("wav")) return "WAV";
  return "WAV";
}

export default function UploadScreen() {
  const router = useRouter();
  const { addTrack } = useLibrary();

  const [file, setFile] = useState<{
    name: string;
    uri: string;
    size: number;
    mimeType: string;
    format: AudioFormat;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("Apex Artist");
  const [album, setAlbum] = useState("");
  const [genre, setGenre] = useState("Electronic");
  const [bpmText, setBpmText] = useState("");
  const [key, setKey] = useState("Am");
  const [uploading, setUploading] = useState(false);
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [showKeyPicker, setShowKeyPicker] = useState(false);

  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const format = detectFormat(asset.mimeType ?? "", asset.name ?? "");
      setFile({
        name: asset.name ?? "Unknown",
        uri: asset.uri,
        size: asset.size ?? 0,
        mimeType: asset.mimeType ?? "audio/wav",
        format,
      });
      // Auto-fill title from filename
      const nameWithoutExt = (asset.name ?? "").replace(/\.[^.]+$/, "");
      if (!title) setTitle(nameWithoutExt);
    } catch (e) {
      Alert.alert("Error", "Could not pick file. Please try again.");
    }
  }, [title]);

  const handleUpload = useCallback(async () => {
    if (!file) {
      Alert.alert("No File", "Please select an audio file first.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a track title.");
      return;
    }

    setUploading(true);
    try {
      const bpm = bpmText ? parseInt(bpmText, 10) : null;
      const qualityMap: Record<string, { sampleRate: number; bitDepth: number; quality: import('@/lib/store/library-store').AudioQuality }> = {
        WAV_HD: { sampleRate: 96000, bitDepth: 24, quality: 'studio' },
        WAV:    { sampleRate: 48000, bitDepth: 24, quality: 'high' },
        FLAC:   { sampleRate: 48000, bitDepth: 24, quality: 'high' },
        MP3:    { sampleRate: 44100, bitDepth: 16, quality: 'standard' },
        AAC:    { sampleRate: 44100, bitDepth: 16, quality: 'standard' },
      };
      const qInfo = qualityMap[file.format] ?? qualityMap.WAV;
      const track: Track = {
        id: `track-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: title.trim(),
        artist: artist.trim() || "Unknown Artist",
        album: album.trim(),
        genre,
        bpm: bpm && !isNaN(bpm) ? bpm : null,
        key,
        duration: 0,
        fileSize: file.size,
        format: file.format,
        quality: qInfo.quality,
        sampleRate: qInfo.sampleRate,
        bitDepth: qInfo.bitDepth,
        fileUri: file.uri,
        artworkUri: null,
        masteringStatus: "unmastered",
        masteringPreset: null,
        uploadedAt: new Date().toISOString(),
        plays: 0,
        lufsTarget: null,
        lufsAchieved: null,
        truePeak: null,
      };

      await addTrack(track);

      Alert.alert(
        "Upload Complete",
        `"${track.title}" has been added to your library.`,
        [
          {
            text: "Master Now",
            onPress: () => (router as any).push({ pathname: "/mastering/[id]", params: { id: track.id } }),
          },
          {
            text: "Go to Library",
            onPress: () => (router as any).push("/(tabs)/library"),
          },
        ]
      );

      // Reset form
      setFile(null);
      setTitle("");
      setAlbum("");
      setBpmText("");
    } catch (e) {
      Alert.alert("Upload Failed", "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [file, title, artist, album, genre, bpmText, key, addTrack, router]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Upload Track</Text>

        {/* File Picker */}
        <Pressable
          style={({ pressed }) => [styles.dropZone, file && styles.dropZoneActive, pressed && { opacity: 0.8 }]}
          onPress={pickFile}
        >
          {file ? (
            <View style={styles.fileInfo}>
              <View style={styles.fileIconRow}>
                <IconSymbol name="music.note" size={28} color="#A78BFA" />
                <View style={styles.formatBadge}>
                  <Text style={styles.formatBadgeText}>{file.format.replace("_", " ")}</Text>
                </View>
              </View>
              <Text style={styles.fileName} numberOfLines={2}>{file.name}</Text>
              <Text style={styles.fileMeta}>{formatFileSize(file.size)}</Text>
              <Text style={styles.changeFile}>Tap to change file</Text>
            </View>
          ) : (
            <View style={styles.dropZoneEmpty}>
              <View style={styles.uploadIconCircle}>
                <IconSymbol name="arrow.up.circle.fill" size={40} color="#7C3AED" />
              </View>
              <Text style={styles.dropTitle}>Select Audio File</Text>
              <Text style={styles.dropSubtitle}>WAV · WAV HD · MP3 · FLAC · AAC</Text>
            </View>
          )}
        </Pressable>

        {/* Metadata Form */}
        <View style={styles.form}>
          <Text style={styles.sectionLabel}>Track Details</Text>

          <FormField label="Title *" value={title} onChangeText={setTitle} placeholder="Track title" />
          <FormField label="Artist" value={artist} onChangeText={setArtist} placeholder="Artist name" />
          <FormField label="Album" value={album} onChangeText={setAlbum} placeholder="Album name (optional)" />

          {/* Genre picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Genre</Text>
            <Pressable
              style={styles.pickerBtn}
              onPress={() => { setShowGenrePicker(!showGenrePicker); setShowKeyPicker(false); }}
            >
              <Text style={styles.pickerValue}>{genre}</Text>
              <IconSymbol name="chevron.down" size={16} color="#64748B" />
            </Pressable>
            {showGenrePicker && (
              <View style={styles.pickerMenu}>
                {GENRE_OPTIONS.map((g) => (
                  <Pressable
                    key={g}
                    style={[styles.pickerOption, genre === g && styles.pickerOptionActive]}
                    onPress={() => { setGenre(g); setShowGenrePicker(false); }}
                  >
                    <Text style={[styles.pickerOptionText, genre === g && styles.pickerOptionTextActive]}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>BPM</Text>
              <TextInput
                style={styles.input}
                value={bpmText}
                onChangeText={setBpmText}
                placeholder="e.g. 128"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Key</Text>
              <Pressable
                style={styles.pickerBtn}
                onPress={() => { setShowKeyPicker(!showKeyPicker); setShowGenrePicker(false); }}
              >
                <Text style={styles.pickerValue}>{key}</Text>
                <IconSymbol name="chevron.down" size={16} color="#64748B" />
              </Pressable>
              {showKeyPicker && (
                <View style={[styles.pickerMenu, { maxHeight: 200 }]}>
                  <ScrollView nestedScrollEnabled>
                    {KEY_OPTIONS.map((k) => (
                      <Pressable
                        key={k}
                        style={[styles.pickerOption, key === k && styles.pickerOptionActive]}
                        onPress={() => { setKey(k); setShowKeyPicker(false); }}
                      >
                        <Text style={[styles.pickerOptionText, key === k && styles.pickerOptionTextActive]}>{k}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Upload Button */}
        <Pressable
          style={({ pressed }) => [
            styles.uploadBtn,
            !file && styles.uploadBtnDisabled,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleUpload}
          disabled={uploading || !file}
        >
          {uploading ? (
            <ActivityIndicator color="#F1F5F9" />
          ) : (
            <>
              <IconSymbol name="arrow.up.circle.fill" size={20} color="#F1F5F9" />
              <Text style={styles.uploadBtnText}>Add to Library</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.hint}>
          After uploading, you can master your track with AI or manual controls.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { color: "#F1F5F9", fontSize: 26, fontWeight: "800", marginBottom: 20 },
  dropZone: {
    borderWidth: 2,
    borderColor: "#2D2D4E",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#1A1A2E",
  },
  dropZoneActive: { borderColor: "#7C3AED", backgroundColor: "#16213E" },
  dropZoneEmpty: { alignItems: "center", gap: 12 },
  uploadIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#7C3AED22",
    alignItems: "center",
    justifyContent: "center",
  },
  dropTitle: { color: "#F1F5F9", fontSize: 16, fontWeight: "700" },
  dropSubtitle: { color: "#64748B", fontSize: 13 },
  fileInfo: { alignItems: "center", gap: 8, width: "100%" },
  fileIconRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  formatBadge: {
    backgroundColor: "#7C3AED",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  formatBadgeText: { color: "#F1F5F9", fontSize: 11, fontWeight: "700" },
  fileName: { color: "#F1F5F9", fontSize: 14, fontWeight: "600", textAlign: "center" },
  fileMeta: { color: "#64748B", fontSize: 12 },
  changeFile: { color: "#A78BFA", fontSize: 12, marginTop: 4 },
  form: { gap: 4 },
  sectionLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { color: "#94A3B8", fontSize: 12, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2D2D4E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F1F5F9",
    fontSize: 14,
  },
  row: { flexDirection: "row", gap: 12 },
  pickerBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2D2D4E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerValue: { color: "#F1F5F9", fontSize: 14 },
  pickerMenu: {
    backgroundColor: "#16213E",
    borderWidth: 1,
    borderColor: "#2D2D4E",
    borderRadius: 10,
    marginTop: 4,
    overflow: "hidden",
  },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#2D2D4E" },
  pickerOptionActive: { backgroundColor: "#7C3AED22" },
  pickerOptionText: { color: "#94A3B8", fontSize: 14 },
  pickerOptionTextActive: { color: "#A78BFA", fontWeight: "600" },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  uploadBtnDisabled: { backgroundColor: "#2D2D4E" },
  uploadBtnText: { color: "#F1F5F9", fontSize: 16, fontWeight: "700" },
  hint: { color: "#64748B", fontSize: 12, textAlign: "center" },
});
