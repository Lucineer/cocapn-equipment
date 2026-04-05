// ═══════════════════════════════════════════════════════════════
// cocapn-equipment — Shared Fleet Equipment Library
// Each module is standalone. Import what you need.
// No dependencies between modules. No framework. Pure TypeScript.
//
// Usage: import { chat } from './src/byok.js';
//        import { computeTrust } from './src/trust.js';
// ═══════════════════════════════════════════════════════════════

export { chat, PROVIDERS, type LLMMessage } from './byok.js';
export { computeTrust, TrustLevel, type TrustEvent } from './trust.js';
export { cacheQuery, getCached, promoteCrystal, type CrystalEntry } from './crystal.js';
export { evapPipeline, getEvapReport } from './evaporation-pipeline.js';
export { trackConfidence, getConfidence } from './confidence.js';
export { deadbandCheck, deadbandStore, getEfficiencyStats } from './deadband.js';
export { SocraticMethod } from './tutor.js';
export { dice, parseRoll, DiceResult } from './dice.js';
export { detectPII, dehydrate, rehydrate } from './pii.js';
export { assessShip, lockGroundTruth, distillSkill } from './bootcamp.js';
export { storyboard, animate } from './dead-reckoning.js';
export { hotGet, warmGet, coldGet, gc, KeeperTier } from './keeper.js';
