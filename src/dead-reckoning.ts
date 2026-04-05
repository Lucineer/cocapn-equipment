// ═══════════════════════════════════════════════════════════════
// Dead Reckoning — Storyboard (expensive), animate (cheap), coordinate (git)
// From dead-reckoning-engine patterns
// ═══════════════════════════════════════════════════════════════

export interface CompassItem {
  id: string;
  horizon: '1y' | '5y' | '10y' | '25y' | '50y' | '100y';
  direction: string;
  priority: number;     // 0-10
  status: 'open' | 'pipeline' | 'ground' | 'published';
  storyboard: string;   // Expensive model's vision
  animation: string;    // Cheap model's implementation plan
  artifacts: string[];  // Git commits, PRs, papers
  createdAt: number;
  updatedAt: number;
}

export interface PipelineTask {
  id: string;
  compassId: string;
  description: string;
  model: string;        // Which model should execute
  status: 'pending' | 'running' | 'done' | 'failed';
  result?: string;
}

export function storyboard(direction: string, horizon: string): string {
  // This would normally call DeepSeek-Reasoner or Seed-2.0-pro
  // Returns a vision document for the direction
  return `## Vision: ${direction}\n\nHorizon: ${horizon}\n\n## The Picture\n[Expensive model fills this in — the "what could be"]\n\n## Key Decisions\n1. [Decision 1]\n2. [Decision 2]\n\n## Constraints\n- [Constraint 1]\n- [Constraint 2]\n\n## Success Criteria\n- [Criterion 1]\n- [Criterion 2]`;
}

export function animate(storyboard: string, horizon: string): PipelineTask[] {
  // This would normally call DeepSeek-chat or Seed-2.0-mini
  // Breaks storyboard into implementable tasks
  const sections = storyboard.split('\n## ');
  const tasks: PipelineTask[] = [];

  for (const section of sections) {
    const lines = section.split('\n').filter(l => l.trim());
    if (lines.length < 2) continue;
    const title = lines[0].trim();

    for (const line of lines.slice(1)) {
      if (line.match(/^\d+\.\s/)) {
        tasks.push({
          id: `task-${tasks.length + 1}`,
          compassId: '',
          description: line.replace(/^\d+\.\s/, ''),
          model: 'deepseek-chat', // Cheap model for animation
          status: 'pending',
        });
      }
    }
  }

  return tasks;
}

export function graduateToGround(item: CompassItem, evidence: string[]): CompassItem {
  // A compass item graduates from "pipeline" to "ground" when
  // enough evidence exists that it's working theory
  if (evidence.length < 3) return item;

  return {
    ...item,
    status: 'ground',
    artifacts: [...item.artifacts, ...evidence],
    updatedAt: Date.now(),
  };
}

export function graduateToPublished(item: CompassItem, artifacts: string[]): CompassItem {
  return {
    ...item,
    status: 'published',
    artifacts: [...item.artifacts, ...artifacts],
    updatedAt: Date.now(),
  };
}

export function compassSummary(items: CompassItem[]): { open: number; pipeline: number; ground: number; published: number } {
  return {
    open: items.filter(i => i.status === 'open').length,
    pipeline: items.filter(i => i.status === 'pipeline').length,
    ground: items.filter(i => i.status === 'ground').length,
    published: items.filter(i => i.status === 'published').length,
  };
}
