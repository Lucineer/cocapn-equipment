// ═══════════════════════════════════════════════════════════════
// Dice Roller — TTRPG dice with modifiers
// From dmlog-ai patterns
// ═══════════════════════════════════════════════════════════════

export interface DiceResult {
  notation: string;    // "2d6+3"
  rolls: number[];     // [4, 2]
  modifier: number;    // 3
  total: number;       // 9
  natural: number;     // 6 (sum of rolls before modifier)
  crit: 'none' | 'crit' | 'fail';
}

const DICE_REGEX = /^(\d+)?d(\d+)([+-]\d+)?$/i;

export function parseRoll(notation: string): { count: number; sides: number; modifier: number } | null {
  const match = notation.trim().toLowerCase().match(DICE_REGEX);
  if (!match) return null;
  return {
    count: parseInt(match[1] || '1'),
    sides: parseInt(match[2]),
    modifier: parseInt(match[3] || '0'),
  };
}

export function dice(notation: string): DiceResult | null {
  const parsed = parseRoll(notation);
  if (!parsed) return null;

  const rolls: number[] = [];
  for (let i = 0; i < parsed.count; i++) {
    rolls.push(Math.floor(Math.random() * parsed.sides) + 1);
  }

  const natural = rolls.reduce((a, b) => a + b, 0);
  let crit: DiceResult['crit'] = 'none';
  if (parsed.sides === 20 && parsed.count === 1) {
    if (rolls[0] === 20) crit = 'crit';
    if (rolls[0] === 1) crit = 'fail';
  }

  return {
    notation,
    rolls,
    modifier: parsed.modifier,
    total: natural + parsed.modifier,
    natural,
    crit,
  };
}

export function rollMultiple(notations: string[]): DiceResult[] {
  return notations.map(n => dice(n)).filter((r): r is DiceResult => r !== null);
}

export function advantage(sides: number = 20): DiceResult {
  const a = dice(`1d${sides}`)!;
  const b = dice(`1d${sides}`)!;
  const winner = a.natural >= b.natural ? a : b;
  return { ...winner, notation: `2d${sides}(kh1)`, rolls: [a.natural, b.natural] };
}

export function disadvantage(sides: number = 20): DiceResult {
  const a = dice(`1d${sides}`)!;
  const b = dice(`1d${sides}`)!;
  const loser = a.natural <= b.natural ? a : b;
  return { ...loser, notation: `2d${sides}(kl1)`, rolls: [a.natural, b.natural] };
}
