// ═══════════════════════════════════════════════════════════════
// Boot Camp — Ground truth assessment, skill distillation
// From git-agent boot camp endpoints
// ═══════════════════════════════════════════════════════════════

export interface ShipSpecs {
  vesselId: string;
  vesselType: 'cloudflare-worker' | 'docker-container' | 'node-app' | 'bare-repo';
  fileCount: number;
  totalCommits: number;
  languages: string;
  hasWrangler: boolean;
  hasPackage: boolean;
  hasDocker: boolean;
  hasDevcontainer: boolean;
  hasAgent: boolean;
}

export interface GroundTruth {
  vesselId: string;
  specs: ShipSpecs;
  phase: 'untie' | 'ground-truth' | 'building' | 'skills-distilled' | 'operational';
  corrections: string;
  lockedAt?: number;
}

export interface Skill {
  name: string;
  content: string;
  distilledAt: number;
  domain: string;
  model: string;
}

export function assessShip(contents: { name: string }[]): ShipSpecs {
  const names = contents.map(c => c.name);
  const hasWrangler = names.includes('wrangler.toml');
  const hasPackage = names.includes('package.json');
  const hasDocker = names.includes('Dockerfile');
  const hasDevcontainer = names.includes('.devcontainer');
  const hasAgent = names.includes('.agent') || names.includes('CLAUDE.md');

  let vesselType: ShipSpecs['vesselType'] = 'bare-repo';
  if (hasWrangler) vesselType = 'cloudflare-worker';
  else if (hasDocker) vesselType = 'docker-container';
  else if (hasPackage) vesselType = 'node-app';

  return {
    vesselId: '',
    vesselType,
    fileCount: contents.length,
    totalCommits: 0,
    languages: 'unknown',
    hasWrangler, hasPackage, hasDocker, hasDevcontainer, hasAgent,
  };
}

export function determinePhase(hasAgent: boolean, hasGroundTruth: boolean, hasSkills: boolean): GroundTruth['phase'] {
  if (!hasAgent) return 'untie';
  if (!hasGroundTruth) return 'ground-truth';
  if (!hasSkills) return 'building';
  return 'skills-distilled';
}

export function formatGroundTruth(specs: ShipSpecs, corrections: string): string {
  const timestamp = new Date().toISOString();
  return [
    '# Ground Truth Log',
    '',
    `Ship: ${specs.vesselId}`,
    `Assessed: ${timestamp}`,
    '',
    '## Vessel Specs',
    ...Object.entries(specs).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Human Corrections',
    corrections || "(none — captain's assessment confirmed)",
    '',
    '## Status',
    'LOCKED — ground truth confirmed by human.',
    '',
  ].join('\n');
}

export function distillSkill(name: string, content: string, domain: string, model: string): Skill {
  return {
    name,
    content,
    distilledAt: Date.now(),
    domain,
    model,
  };
}

export function formatSkillMd(skill: Skill): string {
  return [
    `# ${skill.name}`,
    '',
    `Domain: ${skill.domain}`,
    `Model: ${skill.model}`,
    `Distilled: ${new Date(skill.distilledAt).toISOString()}`,
    '',
    skill.content,
    '',
  ].join('\n');
}
