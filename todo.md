# DROPAi — Project TODO

## Branding & Setup
- [x] Generate DROPAi logo (half vinyl record drop visual, deep red/gold on black)
- [x] Update theme colors (deep black, crimson/gold primary, electric white accent)
- [x] Update app.config.ts with DROPAi branding
- [x] Add all icon mappings to icon-symbol.tsx
- [x] Update design.md for DROPAi

## Jamy Room (Live Online Jam)
- [x] Jamy Room screen with live session UI
- [x] Amp simulator selector (Fender, Marshall, Mesa Boogie, Vox, Orange, Roland)
- [x] Cabinet/speaker selector per amp
- [x] Pedal board with stomp boxes (Overdrive, Distortion, Fuzz, Chorus, Phaser, Flanger, Delay, Reverb, Compressor, Wah, Tuner)
- [x] Plugin rack (EQ, Compressor, Gate, Limiter, Pitch Shifter)
- [x] Signal chain routing (Input → Pedals → Amp → Cab → FX Loop → Output)
- [x] Live session room with online participants
- [x] Mic/guitar input selector
- [x] Latency/buffer settings for real-time performance
- [x] Session recording toggle
- [x] Metronome with BPM control

## Studio Quality Audio Engine
- [x] 24-bit/96kHz recording pipeline (defined in track model and quality tiers)
- [x] AI mastering with genre-specific algorithms
- [x] LUFS metering (Spotify -14, Apple -16, Broadcast -23)
- [x] True peak limiting
- [x] Mid-side processing
- [x] Multiband compression
- [x] Harmonic exciter / saturation

## Navigation
- [x] 5-tab navigation: Home, Library, Upload (Drop), Jamy, Profile
- [x] Stack navigator for modal screens (Track Detail, AI Mastering, DJ Mixer, Collab, Settings)

## Home Screen
- [x] Quick action buttons (Upload, Jamy Room, AI Master, Collab)
- [x] Recent tracks list
- [x] Activity feed (collab requests, mastering completions)
- [x] Stats strip (total tracks, plays, mastered, Studio HD)

## Library Screen
- [x] Track list with FlatList
- [x] Search bar and filter chips (All, Studio HD, WAV HD, WAV, MP3, Mastered)
- [x] Track cards with format badge, duration, play button
- [x] Sort options (date, name, duration, plays)
- [x] Mini audio player at bottom

## Upload Screen
- [x] Document picker for audio files (WAV, MP3, FLAC, AAC)
- [x] Format display (file size)
- [x] Metadata form (Title, Artist, Album, Genre, BPM, Key)
- [x] AsyncStorage persistence

## Track Detail Screen
- [x] Waveform progress visualization
- [x] Metadata display
- [x] Format info panel (sample rate, bit depth, format, quality)
- [x] Mastering status badge
- [x] Play/Pause button
- [x] Delete action

## AI Mastering Module
- [x] AI Mode with genre preset selector
- [x] Manual Mode: 10-band EQ controls
- [x] Manual Mode: Compression controls (threshold, ratio, attack, release, knee, makeup gain)
- [x] Manual Mode: Limiter controls (ceiling, true peak)
- [x] Stereo width control (mid-side processing)
- [x] LUFS loudness target selector (Spotify -14, Apple -16, Broadcast -23)
- [x] Harmonic exciter / saturation
- [x] Export options (WAV, MP3, WAV HD)

## Collaborate Screen
- [x] Artist discovery list
- [x] Search/filter by genre and role
- [x] Collab invite buttons
- [x] Jamy Room invite buttons

## Artist Profile Screen
- [x] Hero banner with gradient
- [x] Avatar with edit
- [x] Display name, bio, genre tags
- [x] Stats (tracks, plays, mastered, Studio HD, collabs, jamy sessions)
- [x] Role, instrument, genre selectors
- [x] Default audio quality setting
- [x] Preferences (collaboration open, notifications)
- [x] Share profile link

## DJ Session Screen
- [x] Dual deck layout (Deck A + Deck B)
- [x] Per-deck waveform display
- [x] BPM display and pitch/tempo controls
- [x] Loop controls (1/2/4/8 bars)
- [x] Hot cue pads (4 per deck)
- [x] Crossfader
- [x] Master volume and headphone cue
- [x] Effects rack (Reverb, Delay, Filter, Flanger, Echo, Stutter)
- [x] BPM sync button
- [x] Record session toggle
- [x] 3-band EQ with kill switches per deck

## Data Persistence
- [x] AsyncStorage for library tracks
- [x] AsyncStorage for artist profile

## Tests
- [x] Unit tests for formatDuration, formatFileSize, formatSampleRate, getQualityLabel
- [x] Track type structure validation
- [x] Audio quality standards validation (96kHz/24-bit, LUFS targets)

## Distribution Hub
- [x] Distribution Hub screen with 6 platform tiles (Spotify, YouTube, Apple Music, SoundCloud, Beatport, Facebook)
- [x] Platform connection status (connected / not connected)
- [x] One-time fee pricing model display
- [x] Single song distribution: $12 one-time + 10% royalty
- [x] 10-song album distribution: $45 one-time + 10% royalty
- [x] Double album distribution: $70 one-time + 10% royalty
- [x] Select which platforms to distribute to
- [x] Distribution status tracker (submitted, processing, live, rejected)
- [x] Royalty earnings dashboard per platform

## Payments & Membership
- [x] Pricing screen with all tiers clearly displayed
- [x] $20/week membership (full access: Jamy, Collab, DJ Booth, recording)
- [x] Single song distribution: $12 one-time
- [x] 10-song album: $45 one-time
- [x] Double album: $70 one-time
- [x] $3/song recording with ownership certificate
- [x] $23 ownership bundle (recording + ownership cert)
- [x] Stripe payment integration (payment intents, subscriptions)
- [x] Payment history screen
- [x] Active subscription status display
- [x] Ownership certificate generation per track

## AI Lyricist Booth
- [x] AI Lyricist Booth screen
- [x] Song structure selector (Verse/Chorus/Bridge, AABA, Through-composed)
- [x] Genre/mood/theme input
- [x] AI generates full song lyrics using Gemini/Claude API
- [x] Section-by-section display (Verse 1, Pre-Chorus, Chorus, Verse 2, Bridge, Outro)
- [x] Edit/regenerate individual sections
- [x] Rhyme scheme selector (ABAB, AABB, ABCB, free verse)
- [x] Collab vocal tracks — invite collaborators to record specific sections
- [x] Export lyrics as PDF or share
- [x] Save lyrics to track in library

## Video Clip Generator
- [x] Video Clip Generator screen
- [x] Select track from library
- [x] Visual style selector (Cinematic, Lyric video, Abstract, Performance, Animated)
- [x] Scene/mood prompt input
- [x] AI generates video concept and scene breakdown
- [x] Colour palette and visual theme selector
- [x] Generate storyboard frames
- [x] Export video concept as PDF
- [x] Link video to track in library

## Recording Studio
- [x] Recording Studio screen
- [x] Multi-track recording interface (up to 8 tracks)
- [x] Record via device microphone
- [x] Track naming and colour coding
- [x] Per-track volume, mute, solo
- [x] Basic punch-in/punch-out recording
- [x] Playback with metronome
- [x] Save session to library
- [x] $3/song ownership model with certificate
- [x] $23 ownership bundle option at save
- [x] Track ownership certificate display (artist name, track title, date, unique ID)

## 3D Premium UI Design System
- [x] GlassCard component — frosted glass with neon border glow and depth shadow
- [x] NeonText component — glowing text with colour-matched shadow
- [x] 3D Knob component — rotary knob with specular highlight and value arc
- [x] VU Meter component — animated level bars with peak hold
- [x] Animated waveform visualiser component
- [x] Premium tab bar with 3D active glow state
- [x] Cinematic gradient backgrounds per screen
- [x] Depth elevation tokens (surface layers 1–5)

## AI Assistant (DROPAi Personal AI)
- [x] Floating AI assistant button (persistent on all screens)
- [x] AI assistant slide-up panel with chat interface
- [x] Min mode — passive suggestions, user controls all settings
- [x] Max mode — AI recommends and pre-fills all settings, user approves
- [x] Full Auto mode — AI autonomously runs mastering, routing, and full production pipeline
- [x] AI mode selector (Min / Max / Full Auto) in assistant panel
- [x] Context-aware suggestions per screen (mastering, jamy, lyricist, distribution, studio)
- [x] AI mode indicator badge in all screen headers
- [x] Sandboxed — uses built-in server LLM only, no external doc access
- [x] Conversation history per session stored in AsyncStorage
- [x] AI assistant context provider (global state)
- [x] Quick action chips in assistant panel (e.g. "Master this track", "Write a verse", "Start Jamy session")

## AI Internet Pipeline (Compute + Web Access)
- [x] Server-side web search endpoint (Google/Bing search API via server proxy)
- [x] AI can fetch music industry news, trends, chart data, licensing info
- [x] AI can research artist names, genres, music theory references
- [x] AI can pull real-time streaming platform royalty rates
- [x] AI can look up music production techniques and references
- [x] Hard lockout: AI cannot access /admin, /payments, /stripe, /db, /users endpoints
- [x] Hard lockout: AI cannot modify library, tracks, or user data directly
- [x] Hard lockout: AI cannot trigger financial transactions
- [x] All AI internet requests logged server-side with timestamp and query
- [x] Rate limiting on AI web search (max 20 requests/minute per session)
- [x] AI responses clearly labelled with source (web search vs. built-in knowledge)

## Bug Fixes & Polish (Round 2)
- [x] Fix DJ Mixer deck overlap on portrait mobile — rebuild as vertically stacked layout
- [x] Fine detail UI polish — sharper typography, better card depth, spacing consistency
- [x] Audit all onPress handlers — no dead ends, add Coming Soon sheets for OAuth integrations
- [x] Daily automated polish schedule (cron job)
