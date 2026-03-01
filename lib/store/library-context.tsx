import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import {
  Track,
  LibraryState,
  loadLibrary,
  saveLibrary,
  addTrack,
  updateTrack,
  deleteTrack,
  DEMO_TRACKS,
} from "./library-store";

interface LibraryContextValue {
  tracks: Track[];
  loading: boolean;
  addTrack: (track: Track) => Promise<void>;
  updateTrack: (id: string, updates: Partial<Track>) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
  incrementPlays: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

type Action =
  | { type: "SET_TRACKS"; tracks: Track[] }
  | { type: "SET_LOADING"; loading: boolean };

function reducer(state: { tracks: Track[]; loading: boolean }, action: Action) {
  switch (action.type) {
    case "SET_TRACKS":
      return { ...state, tracks: action.tracks };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { tracks: [], loading: true });

  const reload = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    let lib = await loadLibrary();
    // Seed demo tracks on first launch
    if (lib.tracks.length === 0) {
      lib = { tracks: DEMO_TRACKS };
      await saveLibrary(lib);
    }
    dispatch({ type: "SET_TRACKS", tracks: lib.tracks });
    dispatch({ type: "SET_LOADING", loading: false });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleAddTrack = useCallback(async (track: Track) => {
    const updated = await addTrack(track);
    dispatch({ type: "SET_TRACKS", tracks: updated.tracks });
  }, []);

  const handleUpdateTrack = useCallback(async (id: string, updates: Partial<Track>) => {
    const updated = await updateTrack(id, updates);
    dispatch({ type: "SET_TRACKS", tracks: updated.tracks });
  }, []);

  const handleDeleteTrack = useCallback(async (id: string) => {
    const updated = await deleteTrack(id);
    dispatch({ type: "SET_TRACKS", tracks: updated.tracks });
  }, []);

  const incrementPlays = useCallback(async (id: string) => {
    const track = state.tracks.find((t) => t.id === id);
    if (track) {
      await handleUpdateTrack(id, { plays: track.plays + 1 });
    }
  }, [state.tracks, handleUpdateTrack]);

  return (
    <LibraryContext.Provider
      value={{
        tracks: state.tracks,
        loading: state.loading,
        addTrack: handleAddTrack,
        updateTrack: handleUpdateTrack,
        deleteTrack: handleDeleteTrack,
        incrementPlays,
        reload,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
