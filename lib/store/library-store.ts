import AsyncStorage from "@react-native-async-storage/async-storage";

export type AudioFormat = "WAV" | "MP3" | "WAV_HD" | "FLAC" | "AAC";
export type MasteringStatus = "unmastered" | "ai_mastered" | "manual_mastered" | "processing";
export type AudioQuality = "standard" | "high" | "studio";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  bpm: number | null;
  key: string;
  duration: number;       // seconds
  fileSize: number;       // bytes
  format: AudioFormat;
  quality: AudioQuality;
  sampleRate: number;     // Hz: 44100 | 48000 | 96000
  bitDepth: number;       // 16 | 24 | 32
  fileUri: string;
  artworkUri: string | null;
  masteringStatus: MasteringStatus;
  masteringPreset: string | null;
  uploadedAt: string;     // ISO date
  plays: number;
  lufsTarget: number | null;
  lufsAchieved: number | null;
  truePeak: number | null;
}

export interface LibraryState {
  tracks: Track[];
}

const STORAGE_KEY = "@dropai_library_v2";

export async function loadLibrary(): Promise<LibraryState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LibraryState;
  } catch {}
  return { tracks: [] };
}

export async function saveLibrary(state: LibraryState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export async function addTrack(track: Track): Promise<LibraryState> {
  const state = await loadLibrary();
  const updated = { tracks: [track, ...state.tracks] };
  await saveLibrary(updated);
  return updated;
}

export async function updateTrack(id: string, updates: Partial<Track>): Promise<LibraryState> {
  const state = await loadLibrary();
  const updated = {
    tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
  };
  await saveLibrary(updated);
  return updated;
}

export async function deleteTrack(id: string): Promise<LibraryState> {
  const state = await loadLibrary();
  const updated = { tracks: state.tracks.filter((t) => t.id !== id) };
  await saveLibrary(updated);
  return updated;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatSampleRate(hz: number): string {
  return `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz`;
}

export function getQualityLabel(q: AudioQuality): string {
  return { standard: "Standard", high: "High", studio: "Studio HD" }[q];
}

// Demo seed tracks for first launch
export const DEMO_TRACKS: Track[] = [
  {
    id: "demo-1",
    title: "Neon Pressure",
    artist: "DROPAi Artist",
    album: "The Drop Sessions",
    genre: "Electronic",
    bpm: 128,
    key: "Am",
    duration: 245,
    fileSize: 104857600,   // ~100 MB WAV HD
    format: "WAV_HD",
    quality: "studio",
    sampleRate: 96000,
    bitDepth: 24,
    fileUri: "",
    artworkUri: null,
    masteringStatus: "ai_mastered",
    masteringPreset: "Electronic",
    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    plays: 312,
    lufsTarget: -14,
    lufsAchieved: -14.1,
    truePeak: -0.3,
  },
  {
    id: "demo-2",
    title: "Raw Signal",
    artist: "DROPAi Artist",
    album: "",
    genre: "Hip-Hop",
    bpm: 95,
    key: "Gm",
    duration: 187,
    fileSize: 37748736,    // ~36 MB WAV 24-bit
    format: "WAV",
    quality: "high",
    sampleRate: 48000,
    bitDepth: 24,
    fileUri: "",
    artworkUri: null,
    masteringStatus: "unmastered",
    masteringPreset: null,
    uploadedAt: new Date(Date.now() - 172800000).toISOString(),
    plays: 58,
    lufsTarget: null,
    lufsAchieved: null,
    truePeak: null,
  },
  {
    id: "demo-3",
    title: "Deep Frequency",
    artist: "DROPAi Artist",
    album: "Underground",
    genre: "Techno",
    bpm: 140,
    key: "Dm",
    duration: 312,
    fileSize: 18874368,    // ~18 MB MP3 320
    format: "MP3",
    quality: "standard",
    sampleRate: 44100,
    bitDepth: 16,
    fileUri: "",
    artworkUri: null,
    masteringStatus: "manual_mastered",
    masteringPreset: null,
    uploadedAt: new Date(Date.now() - 259200000).toISOString(),
    plays: 189,
    lufsTarget: -16,
    lufsAchieved: -16.0,
    truePeak: -0.5,
  },
  {
    id: "demo-4",
    title: "Jamy Session #1",
    artist: "DROPAi Artist",
    album: "Live Jams",
    genre: "Rock",
    bpm: 112,
    key: "E",
    duration: 423,
    fileSize: 83886080,    // ~80 MB WAV HD
    format: "WAV_HD",
    quality: "studio",
    sampleRate: 96000,
    bitDepth: 24,
    fileUri: "",
    artworkUri: null,
    masteringStatus: "unmastered",
    masteringPreset: null,
    uploadedAt: new Date(Date.now() - 345600000).toISOString(),
    plays: 27,
    lufsTarget: null,
    lufsAchieved: null,
    truePeak: null,
  },
];
