# DROPAi — Mobile App Design Document

## Brand Identity

**App Name:** DROPAi  
**Tagline:** Studio quality. Every drop.  
**Visual Concept:** Half vinyl record rising/dropping from the bottom of the screen with a gold liquid drop — premium, cinematic, dark.  
**Target Platform:** iOS (portrait, one-handed usage)  
**Design Language:** Ultra-premium dark studio aesthetic. Deep black backgrounds, crimson vinyl red, liquid gold accents. Feels like a high-end recording studio crossed with a luxury streaming platform.

### Color Palette

| Token | Hex | Purpose |
|-------|-----|---------|
| `primary` | `#C41E3A` | Crimson — brand, CTAs, active states |
| `gold` | `#FFD700` | Gold — "Ai" accent, premium features, highlights |
| `background` | `#080808` | Near-black — all screen backgrounds |
| `surface` | `#111118` | Dark surface — cards, panels |
| `surface2` | `#1A1A24` | Elevated surface — nested panels, modals |
| `foreground` | `#F5F5F5` | Near-white — primary text |
| `muted` | `#9CA3AF` | Secondary text, labels |
| `border` | `#2A2A35` | Subtle borders and dividers |
| `accent` | `#FF4D6D` | Hot pink — waveforms, EQ highlights |
| `success` | `#34D399` | Green — active, connected, playing |
| `warning` | `#FBBF24` | Amber — alerts, clipping warnings |
| `error` | `#F87171` | Red — errors |

---

## Screen List

| # | Screen | Tab | Description |
|---|--------|-----|-------------|
| 1 | Home / Dashboard | Home | Featured drops, quick actions, activity feed |
| 2 | Library | Library | All tracks, search/filter, playback |
| 3 | Upload / Record | Upload | File picker + in-app recording, metadata |
| 4 | AI Mastering | (modal) | Studio-grade AI + manual DSP controls |
| 5 | Track Detail | (modal) | Waveform, metadata, distribute, collab invite |
| 6 | Jamy Room | Jamy | Live online jam — amp/cab/pedal/plugin chain |
| 7 | Jamy Session | (modal) | Active live session with participants |
| 8 | Collab | Collab | Artist discovery, requests, messaging |
| 9 | Profile | Profile | Artist bio, portfolio, branding, stats |
| 10 | DJ / Mixer | (modal) | Dual deck, crossfader, effects |
| 11 | Settings | (modal) | Audio quality, account, notifications |

---

## Primary Content & Functionality

### 1. Home / Dashboard
- **DROPAi wordmark** header with half-record logo animation
- **Quick Actions:** Upload, Jamy Room, AI Master, Find Collab
- **Recent Drops:** Horizontal scroll of track cards with waveform thumbnails
- **Activity Feed:** Mastering completions, collab requests, session invites
- **Stats Strip:** Total tracks, plays, mastered count, active sessions

### 2. Library
- Search bar + filter chips (All, WAV HD, WAV, MP3, Mastered, Unmastered)
- FlatList of track cards: artwork, title, artist, format badge, mastering status, BPM
- Sort: Date, Name, Duration, Plays
- Swipe actions: Master, Share, Delete
- Persistent mini-player at bottom

### 3. Upload / Record
- **File picker:** WAV, WAV HD (24-bit/96kHz), MP3, FLAC, AAC
- **In-app recording:** Mic input with real-time level meter, 24-bit capture
- **Format display:** Sample rate, bit depth, file size
- **Metadata form:** Title, Artist, Album, Genre, BPM, Key
- **Artwork upload:** Camera or photo library
- **Quality selector:** Standard (44.1kHz/16-bit), High (48kHz/24-bit), Studio (96kHz/24-bit)

### 4. AI Mastering Module
**AI Mode:**
- Genre preset selector: Electronic, Hip-Hop, Rock, Jazz, Classical, Podcast, Metal, R&B
- Target platform: Spotify (−14 LUFS), Apple Music (−16 LUFS), YouTube (−14 LUFS), Broadcast (−23 LUFS), CD (−9 LUFS)
- One-tap "DROP IT" master button

**Manual Mode (Studio DSP Chain):**
- **Input Gain:** −24 to +24 dB
- **High-Pass Filter:** 20–500 Hz cutoff with slope selector (6/12/18/24 dB/oct)
- **Multiband Compressor:** 4 bands (Sub, Low, Mid, High) — threshold, ratio, attack, release per band
- **Mid-Side EQ:** 10-band parametric with M/S mode toggle
- **Harmonic Exciter:** Saturation amount, harmonic blend (2nd/3rd order)
- **Stereo Width:** L/R balance, mid-side width (0–200%)
- **Limiter:** True peak ceiling (−0.1 to −1.0 dBTP), release, ISP detection
- **LUFS Meter:** Real-time integrated/short-term/momentary LUFS display
- **Before/After A/B comparison**
- **Export:** WAV 16-bit, WAV 24-bit, WAV HD 24/96, MP3 320kbps, AAC 256kbps

### 5. Jamy Room (Live Online Jam)
**The core unique feature of DROPAi.**

**Input Section:**
- Input source selector: Built-in Mic, External Mic, Guitar (via adapter), Line In
- Input gain knob with clip indicator
- Tuner (chromatic, always visible)
- Metronome: BPM 40–300, tap tempo, time signature

**Signal Chain (left to right, fully configurable):**
```
[Input] → [Tuner] → [Pedal Board] → [Amp Head] → [Cabinet] → [FX Loop] → [Output]
```

**Pedal Board (stomp boxes — toggle on/off):**
| Pedal | Controls |
|-------|----------|
| Tuner | Display only |
| Compressor | Threshold, Ratio, Attack, Sustain, Level |
| Overdrive (TS-style) | Drive, Tone, Level |
| Distortion (DS-style) | Gain, Tone, Level |
| Fuzz | Fuzz, Volume, Tone |
| Wah | Frequency sweep (auto-wah or expression) |
| Chorus | Rate, Depth, Mix |
| Phaser | Rate, Depth, Feedback, Mix |
| Flanger | Rate, Depth, Feedback, Mix |
| Delay | Time (ms/BPM sync), Feedback, Mix, Tap Tempo |
| Reverb | Room/Hall/Plate/Spring, Size, Decay, Mix |
| Pitch Shifter | Semitones (−12 to +12), Mix |
| Noise Gate | Threshold, Release |

**Amp Simulator:**
| Amp Model | Based On | Character |
|-----------|----------|-----------|
| Clean King | Fender Twin Reverb | Clean, glassy, warm |
| Brit Stack | Marshall JCM800 | Classic rock crunch |
| Mesa Recto | Mesa Boogie Dual Rectifier | Heavy, tight low end |
| Vox Top Boost | Vox AC30 | Chime, jangle, British |
| Orange Crush | Orange Rockerverb | Warm, punchy, natural OD |
| Roland Jazz | Roland JC-120 | Ultra-clean, stereo chorus |
| Init Clean | Flat/transparent | No coloration |

**Cabinet Selector (per amp):**
- 1×12, 2×12, 4×12 configurations
- Speaker types: Celestion Vintage 30, Celestion G12M, Jensen C12N, EV12L
- Mic position: Centre, Edge, Off-axis
- Room mic blend

**FX Loop (post-amp):**
- Send/Return level
- Parallel/Series routing toggle
- Rack effects: Studio Reverb, Tape Delay, Chorus, Pitch Harmonizer

**Live Session Room:**
- Up to 8 participants in a Jamy session
- Each participant: avatar, instrument icon, mute/solo, individual level
- Session chat
- Shared metronome (BPM sync across all participants)
- Record session toggle (captures all stems)
- Latency display (ms) per participant
- Buffer size selector: 64/128/256/512 samples

### 6. Collab Screen
- Artist discovery grid with genre tags, instrument, role
- Search/filter by genre, instrument, role (Producer, Vocalist, DJ, Guitarist, Bassist, Drummer)
- Collab requests (incoming/outgoing) with track previews
- Active sessions list
- In-app messaging per collab

### 7. Artist Profile
- Hero banner (custom gradient or uploaded image)
- Avatar with edit
- Display name, bio, genre tags, instruments
- Stats: Tracks, Plays, Collabs, Jamy Sessions
- Portfolio grid
- Branding panel: custom accent colour, banner
- Share profile link

### 8. DJ / Mixer
- Dual deck layout (Deck A + Deck B)
- Per-deck: waveform, BPM, pitch/tempo slider, loop, hot cues
- Crossfader with curve selector
- 3-band EQ kill per channel
- Effects rack: Reverb, Delay, Filter, Flanger
- BPM sync, Record session

---

## Key User Flows

### Flow 1: Upload & AI Master a Track
1. Tap **Upload** → pick file or record → fill metadata → tap **Add to Library**
2. Track appears in Library with "Unmastered" badge
3. Tap track → **Master with AI** → select genre preset + target platform
4. Tap **DROP IT** → AI processes → Before/After comparison
5. Export in chosen format → saved as "AI Mastered"

### Flow 2: Jamy Room Session
1. Tap **Jamy** tab → tap **Start Session** or **Join Session**
2. Select input source (Mic / Guitar)
3. Build signal chain: toggle pedals, choose amp model, select cabinet
4. Tap **Go Live** → session room opens
5. Other artists join → jam together in real time
6. Tap **Record** to capture session → saved to Library

### Flow 3: Collab Invite
1. Tap **Collab** → browse artists → tap artist → **Invite to Collab**
2. Select track → send request
3. Artist accepts → Active Session created
4. Upload stems, chat, leave comments

---

## Navigation Structure

```
Tab Bar (5 tabs):
├── Home        (house.fill)
├── Library     (music.note.list)
├── Upload      (plus — circular CTA)
├── Jamy        (headphones)
└── Profile     (person.crop.circle.fill)

Modal screens:
├── Track Detail      → from Library / Home
├── AI Mastering      → from Library / Track Detail
├── Jamy Session      → from Jamy tab
├── DJ Mixer          → from Home quick action
├── Collab            → from Home quick action
└── Settings          → from Profile
```
