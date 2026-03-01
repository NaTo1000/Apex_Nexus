import React, { createContext, useContext, useReducer, useCallback, useRef } from "react";
import { Track } from "./library-store";

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number; // 0-1
  duration: number; // seconds
  position: number; // seconds
}

interface PlayerContextValue extends PlayerState {
  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setProgress: (progress: number, position: number, duration: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

type Action =
  | { type: "PLAY"; track: Track }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "STOP" }
  | { type: "SET_PROGRESS"; progress: number; position: number; duration: number };

function reducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case "PLAY":
      return { ...state, currentTrack: action.track, isPlaying: true, progress: 0, position: 0 };
    case "PAUSE":
      return { ...state, isPlaying: false };
    case "RESUME":
      return { ...state, isPlaying: true };
    case "STOP":
      return { currentTrack: null, isPlaying: false, progress: 0, duration: 0, position: 0 };
    case "SET_PROGRESS":
      return { ...state, progress: action.progress, position: action.position, duration: action.duration };
    default:
      return state;
  }
}

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  position: 0,
};

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const seekRef = useRef<((pos: number) => void) | null>(null);

  const play = useCallback((track: Track) => {
    dispatch({ type: "PLAY", track });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: "PAUSE" });
  }, []);

  const resume = useCallback(() => {
    dispatch({ type: "RESUME" });
  }, []);

  const stop = useCallback(() => {
    dispatch({ type: "STOP" });
  }, []);

  const seek = useCallback((position: number) => {
    seekRef.current?.(position);
  }, []);

  const setProgress = useCallback((progress: number, position: number, duration: number) => {
    dispatch({ type: "SET_PROGRESS", progress, position, duration });
  }, []);

  return (
    <PlayerContext.Provider value={{ ...state, play, pause, resume, stop, seek, setProgress }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
