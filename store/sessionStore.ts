import { create } from "zustand";

export type SessionEvent = {
  id: string;
  type: string;
  timestamp: number;
  severity: "normal" | "warning" | "suspicious";
  metadata?: Record<string, unknown>;
};

type SessionState = {
  isSessionActive: boolean;
  sessionStartTime: number | null;
  sessionEndTime: number | null;
  events: SessionEvent[];
  riskScore: number;
};

type SessionActions = {
  startSession: () => void;
  endSession: () => void;
  resetSession: () => void;
  addEvent: (event: SessionEvent) => void;
};

export type SessionStore = SessionState & SessionActions;

const initialState: SessionState = {
  isSessionActive: false,
  sessionStartTime: null,
  sessionEndTime: null,
  events: [],
  riskScore: 0,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  startSession: () => {
    set({
      isSessionActive: true,
      sessionStartTime: Date.now(),
      sessionEndTime: null,
      events: [],
      riskScore: 0,
    });
  },

  endSession: () => {
    set({
      isSessionActive: false,
      sessionEndTime: Date.now(),
    });
  },

  resetSession: () => {
    set(initialState);
  },

  addEvent: (event) => {
    set((state) => ({
      events: [...state.events, event],
    }));
  },
}));
