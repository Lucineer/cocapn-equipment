# Cocapn Equipment

Shared equipment library for the Lucineer fleet. Each module is standalone — import what you need.

> Equipment effects WHAT the agent perceives. Skills effect HOW the agent thinks.

## Modules

| Module | Source | What It Does |
|---|---|---|
| `byok.ts` | studylog-ai | BYOK v2 — 20+ LLM providers, zero keys in code |
| `trust.ts` | fleet-orchestrator | Event-count trust with severity weights |
| `crystal.ts` | fleet-orchestrator | Cache/promote/decay crystallized knowledge |
| `evaporation*.ts` | studylog-ai | Self-cleaning KV with TTL |
| `confidence.ts` | studylog-ai | Per-query confidence tracking |
| `deadband.ts` | studylog-ai | Response deduplication cache |
| `model-router.ts` | studylog-ai | Task → model routing |
| `multi-profile.ts` | studylog-ai | Multi-user profile management |
| `tutor.ts` | studylog-ai | Socratic method branching tutor |
| `dice.ts` | dmlog-ai | TTRPG dice with modifiers, advantage/disadvantage |
| `pii.ts` | log-origin | PII detection, dehydrate, rehydrate |
| `bootcamp.ts` | git-agent | Ground truth assessment, skill distillation |
| `dead-reckoning.ts` | dead-reckoning-engine | Storyboard→animate→publish pipeline |
| `keeper.ts` | The Keeper's Architecture | Hot/warm/cold memory tiers + creative GC |
| `cross-cocapn.ts` | studylog-ai | Cross-vessel knowledge transfer |
| `repo-agent.ts` | studylog-ai | Repo agent actions |
| `soft-actualize.ts` | studylog-ai | Soft actualization scoring |
| `seed-loader.ts` | studylog-ai | Seed data loading |
| `response-logger.ts` | studylog-ai | Response logging |
| `brain-lesson.ts` | studylog-ai | Interactive lesson engine |

## Usage

```typescript
import { chat, PROVIDERS } from './src/byok.js';
import { computeTrust, createTrustState } from './src/trust.js';
import { cacheQuery, storeCrystal } from './src/crystal.js';
import { dice, advantage } from './src/dice.js';
import { detectPII, dehydrate, rehydrate } from './src/pii.js';
import { hotGet, warmGet, coldGet, gc, store } from './src/keeper.js';
import { storyboard, animate } from './src/dead-reckoning.js';
import { assessShip, distillSkill } from './src/bootcamp.js';
```

## Philosophy

- **Each module is standalone** — no dependencies between equipment modules
- **Import what you need** — don't pay for what you don't use
- **Zero runtime deps** — pure TypeScript, works in Cloudflare Workers, Deno, Bun, Node
- **Equipment is outside the model** — it shapes what the agent perceives
- **Skills are inside the model** — they shape how the agent thinks

## Fleet

[Capitaine (flagship)](https://github.com/Lucineer/capitaine) ·
[Git-Agent (kernel)](https://github.com/Lucineer/git-agent) ·
[All vessels](https://github.com/orgs/Lucineer/repositories)

## License

MIT · Superinstance & Lucineer (DiGennaro et al.)
