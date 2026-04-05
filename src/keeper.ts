// ═══════════════════════════════════════════════════════════════
// Keeper — Hot/warm/cold memory tiers with creative GC
// From The Keeper's Architecture paper
// ═══════════════════════════════════════════════════════════════

export enum KeeperTier { HOT = 'hot', WARM = 'warm', COLD = 'cold', ARCHIVED = 'archived' }

export interface MemoryEntry {
  key: string;
  tier: KeeperTier;
  content: string;
  domain: string;
  hitCount: number;
  lastAccessed: number;
  createdAt: number;
  importance: number;  // 0-1, computed from usage patterns
}

export interface KeeperConfig {
  hotMaxAge: number;      // ms — default 1 hour
  warmMaxAge: number;     // ms — default 24 hours
  coldMaxAge: number;     // ms — default 30 days
  hotMaxItems: number;
  warmMaxItems: number;
  gcInterval: number;     // ms — default 1 hour
}

const DEFAULT_CONFIG: KeeperConfig = {
  hotMaxAge: 3600000,        // 1 hour
  warmMaxAge: 86400000,      // 24 hours
  coldMaxAge: 2592000000,    // 30 days
  hotMaxItems: 100,
  warmMaxItems: 1000,
  gcInterval: 3600000,       // 1 hour
};

const TIER_PREFIX = { hot: 'keeper:hot:', warm: 'keeper:warm:', cold: 'keeper:cold:' };

export async function hotGet(kv: KVNamespace, key: string): Promise<MemoryEntry | null> {
  const raw = await kv.get(`${TIER_PREFIX.hot}${key}`);
  if (!raw) return null;
  const entry: MemoryEntry = JSON.parse(raw);
  entry.hitCount++;
  entry.lastAccessed = Date.now();
  await kv.put(`${TIER_PREFIX.hot}${key}`, JSON.stringify(entry), { expirationTtl: 3600 });
  return entry;
}

export async function warmGet(kv: KVNamespace, key: string): Promise<MemoryEntry | null> {
  const raw = await kv.get(`${TIER_PREFIX.warm}${key}`);
  if (!raw) return null;
  const entry: MemoryEntry = JSON.parse(raw);
  entry.hitCount++;
  entry.lastAccessed = Date.now();
  // Promote to hot if accessed frequently
  if (entry.hitCount > 5) {
    await kv.put(`${TIER_PREFIX.hot}${key}`, JSON.stringify({ ...entry, tier: KeeperTier.HOT }), { expirationTtl: 3600 });
    await kv.delete(`${TIER_PREFIX.warm}${key}`);
  }
  return entry;
}

export async function coldGet(kv: KVNamespace, key: string): Promise<MemoryEntry | null> {
  const raw = await kv.get(`${TIER_PREFIX.cold}${key}`);
  if (!raw) return null;
  const entry: MemoryEntry = JSON.parse(raw);
  entry.hitCount++;
  entry.lastAccessed = Date.now();
  // Promote to warm
  await kv.put(`${TIER_PREFIX.warm}${key}`, JSON.stringify({ ...entry, tier: KeeperTier.WARM }), { expirationTtl: 86400 });
  await kv.delete(`${TIER_PREFIX.cold}${key}`);
  return entry;
}

export async function store(kv: KVNamespace, key: string, content: string, domain: string, tier: KeeperTier = KeeperTier.HOT): Promise<void> {
  const entry: MemoryEntry = {
    key, tier, content, domain,
    hitCount: 0,
    lastAccessed: Date.now(),
    createdAt: Date.now(),
    importance: 0.5,
  };
  const prefix = TIER_PREFIX[tier];
  const ttl = tier === KeeperTier.HOT ? 3600 : tier === KeeperTier.WARM ? 86400 : 2592000;
  await kv.put(`${prefix}${key}`, JSON.stringify(entry), { expirationTtl: ttl });
}

export async function gc(kv: KVNamespace, config: KeeperConfig = DEFAULT_CONFIG): Promise<{ moved: number; deleted: number }> {
  let moved = 0, deleted = 0;
  const now = Date.now();

  // Hot → Warm (if too old or too many)
  const hotList = await kv.list({ prefix: TIER_PREFIX.hot, limit: config.hotMaxItems });
  if (hotList.keys.length > config.hotMaxItems) {
    const oldest = hotList.keys.slice(0, hotList.keys.length - config.hotMaxItems);
    for (const k of oldest) {
      const raw = await kv.get(k.name);
      if (raw) {
        const entry: MemoryEntry = JSON.parse(raw);
        await kv.put(`${TIER_PREFIX.warm}${entry.key}`, JSON.stringify({ ...entry, tier: KeeperTier.WARM }), { expirationTtl: 86400 });
        await kv.delete(k.name);
        moved++;
      }
    }
  }

  // Warm → Cold
  const warmList = await kv.list({ prefix: TIER_PREFIX.warm, limit: config.warmMaxItems });
  for (const k of warmList.keys) {
    const raw = await kv.get(k.name);
    if (!raw) continue;
    const entry: MemoryEntry = JSON.parse(raw);
    if (now - entry.lastAccessed > config.warmMaxAge || warmList.keys.length > config.warmMaxItems) {
      await kv.put(`${TIER_PREFIX.cold}${entry.key}`, JSON.stringify({ ...entry, tier: KeeperTier.COLD }), { expirationTtl: 2592000 });
      await kv.delete(k.name);
      moved++;
    }
  }

  // Cold → Archive (creative GC — distill essence before deletion)
  const coldList = await kv.list({ prefix: TIER_PREFIX.cold, limit: 500 });
  for (const k of coldList.keys) {
    const raw = await kv.get(k.name);
    if (!raw) continue;
    const entry: MemoryEntry = JSON.parse(raw);
    if (now - entry.lastAccessed > config.coldMaxAge || entry.importance < 0.1) {
      // Creative GC: if important, distill into a recipe before deleting
      if (entry.importance > 0.3 && entry.content.length > 200) {
        const recipe = distillRecipe(entry);
        await kv.put(`keeper:recipe:${entry.key}`, JSON.stringify(recipe), { expirationTtl: 86400 * 365 });
      }
      await kv.delete(k.name);
      deleted++;
    }
  }

  return { moved, deleted };
}

function distillRecipe(entry: MemoryEntry): { key: string; recipe: string; originalLength: number; distillRatio: number } {
  const content = entry.content;
  const lines = content.split('\n');
  // Simple distillation: keep first and last lines, summarize middle
  const first = lines.slice(0, 2).join('\n');
  const last = lines.slice(-2).join('\n');
  const middle = lines.length > 4 ? `[...${lines.length - 4} lines distilled...]` : '';
  const recipe = [first, middle, last].join('\n');
  return {
    key: entry.key,
    recipe,
    originalLength: content.length,
    distillRatio: recipe.length / content.length,
  };
}
