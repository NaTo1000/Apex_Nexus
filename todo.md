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
