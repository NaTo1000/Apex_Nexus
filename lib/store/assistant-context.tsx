import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIMode = "min" | "max" | "full_auto";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  usedWebSearch?: boolean;
  mode?: AIMode;
}

export interface AssistantState {
  mode: AIMode;
  isOpen: boolean;
  isThinking: boolean;
  history: ChatMessage[];
  currentScreen: string;
}

interface AssistantContextValue extends AssistantState {
  setMode: (mode: AIMode) => void;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  setCurrentScreen: (screen: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setThinking: (v: boolean) => void;
  clearHistory: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AssistantContext = createContext<AssistantContextValue | null>(null);

const STORAGE_KEY = "@dropai_assistant_v1";
const MAX_HISTORY = 50;

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AIMode>("min");
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [currentScreen, setCurrentScreen] = useState("home");

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.mode) setModeState(saved.mode);
          if (saved.history) setHistory(saved.history.slice(-MAX_HISTORY));
        }
      } catch {}
    })();
  }, []);

  const persistState = useCallback(async (newMode: AIMode, newHistory: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: newMode, history: newHistory.slice(-MAX_HISTORY) }));
    } catch {}
  }, []);

  const setMode = useCallback((m: AIMode) => {
    setModeState(m);
    persistState(m, history);
  }, [history, persistState]);

  const openAssistant = useCallback(() => setIsOpen(true), []);
  const closeAssistant = useCallback(() => setIsOpen(false), []);
  const toggleAssistant = useCallback(() => setIsOpen((v) => !v), []);
  const setThinking = useCallback((v: boolean) => setIsThinking(v), []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setHistory((prev) => {
      const updated = [...prev, msg].slice(-MAX_HISTORY);
      persistState(mode, updated);
      return updated;
    });
  }, [mode, persistState]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    persistState(mode, []);
  }, [mode, persistState]);

  return (
    <AssistantContext.Provider
      value={{
        mode,
        isOpen,
        isThinking,
        history,
        currentScreen,
        setMode,
        openAssistant,
        closeAssistant,
        toggleAssistant,
        setCurrentScreen,
        addMessage,
        setThinking,
        clearHistory,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used inside AssistantProvider");
  return ctx;
}
