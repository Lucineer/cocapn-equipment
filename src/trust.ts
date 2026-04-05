// ═══════════════════════════════════════════════════════════════
// Trust Calculator — Event-count based fleet trust
// From fleet-orchestrator + increments-fleet-trust patterns
// ═══════════════════════════════════════════════════════════════

export enum TrustLevel { UNKNOWN = 0, UNTRUSTED = 1, PROBATION = 2, TRUSTED = 3, VERIFIED = 4, ANCHOR = 5 }

export interface TrustEvent {
  vesselId: string;
  type: 'good' | 'bad' | 'neutral';
  severity: number;  // 0-10
  category: string;  // 'deploy', 'heartbeat', 'coordination', 'security'
  timestamp: number;
}

export interface TrustState {
  vesselId: string;
  level: TrustLevel;
  score: number;
  goodCount: number;
  badCount: number;
  lastEvent: number;
  history: TrustEvent[];
}

const SEVERITY_WEIGHT = { good: 1, bad: -3, neutral: 0 };
const DECAY_RATE = 0.001; // Per hour
const LEVEL_THRESHOLDS = [0, 10, 30, 60, 80, 95];

export function computeTrust(state: TrustState, event: TrustEvent): TrustState {
  const hoursSinceLast = (event.timestamp - state.lastEvent) / 3600000;
  const decay = Math.min(state.score * DECAY_RATE * hoursSinceLast, state.score * 0.1);
  const severityWeight = event.type === 'bad' ? 1 + (event.severity / 10) : 1;

  state.score = Math.max(0, Math.min(100, state.score - decay + (SEVERITY_WEIGHT[event.type] * severityWeight * 2)));
  state.goodCount += event.type === 'good' ? 1 : 0;
  state.badCount += event.type === 'bad' ? 1 : 0;
  state.lastEvent = event.timestamp;
  state.history.push(event);
  if (state.history.length > 1000) state.history = state.history.slice(-500);

  // Recalculate level
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (state.score >= LEVEL_THRESHOLDS[i]) { state.level = i as TrustLevel; break; }
  }

  return state;
}

export function createTrustState(vesselId: string): TrustState {
  return { vesselId, level: TrustLevel.UNKNOWN, score: 50, goodCount: 0, badCount: 0, lastEvent: Date.now(), history: [] };
}
