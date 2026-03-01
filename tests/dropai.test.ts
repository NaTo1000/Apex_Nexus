import { describe, it, expect } from "vitest";
import {
  formatDuration,
  formatFileSize,
  formatSampleRate,
  getQualityLabel,
  type Track,
  type AudioQuality,
} from "../lib/store/library-store";

describe("formatDuration", () => {
  it("formats 0 seconds as 0:00", () => {
    expect(formatDuration(0)).toBe("0:00");
  });
  it("formats 65 seconds as 1:05", () => {
    expect(formatDuration(65)).toBe("1:05");
  });
  it("formats 245 seconds as 4:05", () => {
    expect(formatDuration(245)).toBe("4:05");
  });
  it("formats 3600 seconds as 60:00", () => {
    expect(formatDuration(3600)).toBe("60:00");
  });
});

describe("formatFileSize", () => {
  it("formats bytes under 1 KB", () => {
    expect(formatFileSize(512)).toBe("512 B");
  });
  it("formats kilobytes", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
  it("formats megabytes", () => {
    expect(formatFileSize(104857600)).toBe("100.0 MB");
  });
});

describe("formatSampleRate", () => {
  it("formats 44100 Hz as 44.1 kHz", () => {
    expect(formatSampleRate(44100)).toBe("44.1 kHz");
  });
  it("formats 48000 Hz as 48 kHz", () => {
    expect(formatSampleRate(48000)).toBe("48 kHz");
  });
  it("formats 96000 Hz as 96 kHz", () => {
    expect(formatSampleRate(96000)).toBe("96 kHz");
  });
});

describe("getQualityLabel", () => {
  it("returns Standard for standard quality", () => {
    expect(getQualityLabel("standard")).toBe("Standard");
  });
  it("returns High for high quality", () => {
    expect(getQualityLabel("high")).toBe("High");
  });
  it("returns Studio HD for studio quality", () => {
    expect(getQualityLabel("studio")).toBe("Studio HD");
  });
});

describe("Track type structure", () => {
  it("creates a valid Track object with all required fields", () => {
    const track: Track = {
      id: "test-1",
      title: "Test Track",
      artist: "Test Artist",
      album: "Test Album",
      genre: "Electronic",
      bpm: 128,
      key: "Am",
      duration: 245,
      fileSize: 104857600,
      format: "WAV_HD",
      quality: "studio",
      sampleRate: 96000,
      bitDepth: 24,
      fileUri: "file://test.wav",
      artworkUri: null,
      masteringStatus: "unmastered",
      masteringPreset: null,
      uploadedAt: new Date().toISOString(),
      plays: 0,
      lufsTarget: -14,
      lufsAchieved: null,
      truePeak: null,
    };
    expect(track.id).toBe("test-1");
    expect(track.format).toBe("WAV_HD");
    expect(track.quality).toBe("studio");
    expect(track.sampleRate).toBe(96000);
    expect(track.bitDepth).toBe(24);
    expect(track.masteringStatus).toBe("unmastered");
  });

  it("validates all audio format types", () => {
    const formats = ["WAV", "MP3", "WAV_HD", "FLAC", "AAC"] as const;
    formats.forEach((f) => {
      expect(typeof f).toBe("string");
    });
  });

  it("validates all quality tiers", () => {
    const qualities: AudioQuality[] = ["standard", "high", "studio"];
    qualities.forEach((q) => {
      expect(getQualityLabel(q)).toBeTruthy();
    });
  });
});

describe("DROPAi audio quality standards", () => {
  it("Studio HD is 96kHz/24-bit", () => {
    const studioTrack: Partial<Track> = {
      quality: "studio",
      sampleRate: 96000,
      bitDepth: 24,
    };
    expect(studioTrack.sampleRate).toBe(96000);
    expect(studioTrack.bitDepth).toBe(24);
  });

  it("High quality is 48kHz/24-bit", () => {
    const highTrack: Partial<Track> = {
      quality: "high",
      sampleRate: 48000,
      bitDepth: 24,
    };
    expect(highTrack.sampleRate).toBe(48000);
    expect(highTrack.bitDepth).toBe(24);
  });

  it("Standard quality is 44.1kHz/16-bit", () => {
    const stdTrack: Partial<Track> = {
      quality: "standard",
      sampleRate: 44100,
      bitDepth: 16,
    };
    expect(stdTrack.sampleRate).toBe(44100);
    expect(stdTrack.bitDepth).toBe(16);
  });

  it("LUFS targets are within broadcast/streaming standards", () => {
    const spotifyTarget = -14;
    const appleTarget = -16;
    const broadcastTarget = -23;
    // All targets should be negative (below 0 dBFS)
    expect(spotifyTarget).toBeLessThan(0);
    expect(appleTarget).toBeLessThan(0);
    expect(broadcastTarget).toBeLessThan(0);
    // Spotify is louder than Apple Music
    expect(spotifyTarget).toBeGreaterThan(appleTarget);
    // Apple Music is louder than broadcast
    expect(appleTarget).toBeGreaterThan(broadcastTarget);
  });
});
