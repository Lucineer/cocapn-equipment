// ═══════════════════════════════════════════════════════════════
// Crystal Graph — Cache, promote, decay crystallized knowledge
// From fleet-orchestrator + studylog knowledge-graph patterns
// ═══════════════════════════════════════════════════════════════

export interface CrystalEntry {
  key: string;           // Query hash or semantic key
  response: string;      // Cached response
  confidence: number;    // 0-1, starts at 0.5
  hitCount: number;      // Times returned from cache
  missCount: number;     // Times cache returned stale/wrong
  createdAt: number;
  lastHit: number;
  source: string;        // Which model produced this
  domain: string;        // Which vessel/domain
}

export interface CrystalQuery {
  key: string;
  response: string;
  confidence: number;
  source: string;
  domain: string;
}

const DECAY_PER_HOUR = 0.005;
const PROMOTION_THRESHOLD = 0.8;   // Confidence to become "crystallized"
const DEMOTION_THRESHOLD = 0.3;   // Confidence to be garbage collected
const MAX_CRYSTALS = 10000;

export async function cacheQuery(kv: KVNamespace, query: CrystalQuery): Promise<{ cached: CrystalEntry | null; needsModel: boolean }> {
  const key = `crystal:${query.key}`;
  const raw = await kv.get(key);

  if (raw) {
    const entry: CrystalEntry = JSON.parse(raw);
    const hoursSinceHit = (Date.now() - entry.lastHit) / 3600000;
    entry.confidence = Math.max(0, entry.confidence - (DECAY_PER_HOUR * hoursSinceHit));

    if (entry.confidence >= DEMOTION_THRESHOLD) {
      entry.hitCount++;
      entry.lastHit = Date.now();
      await kv.put(key, JSON.stringify(entry), { expirationTtl: 86400 * 30 });
      return { cached: entry, needsModel: false };
    } else {
      // Stale crystal — need fresh model call
      return { cached: null, needsModel: true };
    }
  }

  return { cached: null, needsModel: true };
}

export async function storeCrystal(kv: KVNamespace, query: CrystalQuery): Promise<CrystalEntry> {
  const key = `crystal:${query.key}`;
  const raw = await kv.get(key);
  let entry: CrystalEntry;

  if (raw) {
    entry = JSON.parse(raw);
    entry.response = query.response;
    entry.confidence = Math.min(1, entry.confidence + 0.1);
    entry.source = query.source;
    entry.lastHit = Date.now();
  } else {
    entry = {
      key: query.key,
      response: query.response,
      confidence: query.confidence || 0.5,
      hitCount: 0,
      missCount: 0,
      createdAt: Date.now(),
      lastHit: Date.now(),
      source: query.source,
      domain: query.domain,
    };
  }

  await kv.put(key, JSON.stringify(entry), { expirationTtl: 86400 * 30 });
  return entry;
}

export async function promoteCrystal(kv: KVNamespace, key: string): Promise<boolean> {
  const raw = await kv.get(`crystal:${key}`);
  if (!raw) return false;
  const entry: CrystalEntry = JSON.parse(raw);
  if (entry.confidence >= PROMOTION_THRESHOLD && entry.hitCount > 10) {
    // Promote to "crystallized" — move to a permanent namespace
    await kv.put(`crystallized:${key}`, JSON.stringify(entry));
    return true;
  }
  return false;
}

export async function getCrystallized(kv: KVNamespace, prefix?: string): Promise<CrystalEntry[]> {
  const list = await kv.list({ prefix: 'crystallized:' + (prefix || ''), limit: 100 });
  const results: CrystalEntry[] = [];
  for (const key of list.keys) {
    const raw = await kv.get(key.name);
    if (raw) results.push(JSON.parse(raw));
  }
  return results;
}

export async function crystalStats(kv: KVNamespace): Promise<{ total: number; crystallized: number; avgConfidence: number }> {
  const [all, promoted] = await Promise.all([
    kv.list({ prefix: 'crystal:', limit: 1000 }),
    kv.list({ prefix: 'crystallized:', limit: 1000 }),
  ]);
  const total = all.keys.length;
  const crystallized = promoted.keys.length;
  return { total, crystallized, avgConfidence: total > 0 ? 0.6 : 0 }; // Simplified
}
