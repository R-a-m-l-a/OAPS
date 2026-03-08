/**
 * Server-side in-memory session store for bridging interviewee monitoring
 * data to the interviewer dashboard. Persists only within the same Node process.
 */

export type SessionEvent = {
  id: string;
  type: string;
  timestamp: number;
  severity: "normal" | "warning" | "suspicious";
  metadata?: Record<string, unknown>;
};

export type ServerSessionState = {
  isSessionActive: boolean;
  sessionStartTime: number | null;
  sessionEndTime: number | null;
  events: SessionEvent[];
  riskScore: number;
  focusRatio: number;
};

const initialState: ServerSessionState = {
  isSessionActive: false,
  sessionStartTime: null,
  sessionEndTime: null,
  events: [],
  riskScore: 0,
  focusRatio: 1,
};

let state: ServerSessionState = { ...initialState };

function cloneState(): ServerSessionState {
  return {
    ...state,
    events: [...state.events],
  };
}

export function getSession(): ServerSessionState {
  return cloneState();
}

export function updateSession(partial: Partial<ServerSessionState>): void {
  state = { ...state, ...partial };
  if (partial.events !== undefined) {
    state.events = [...partial.events];
  }
}

export function addEvents(newEvents: SessionEvent[]): void {
  if (newEvents.length === 0) return;
  state = {
    ...state,
    events: [...state.events, ...newEvents],
  };
}

export function clearSession(): void {
  state = { ...initialState };
}
