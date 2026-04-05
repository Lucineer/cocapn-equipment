// ═══════════════════════════════════════════════════════════════
// PII Detection — Detect, dehydrate, and rehydrate PII
// From log-origin patterns
// ═══════════════════════════════════════════════════════════════

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const IPV4_RE = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
const DATE_RE = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g;

export interface PIIMatch {
  type: 'email' | 'phone' | 'ssn' | 'credit' | 'ip' | 'date';
  value: string;
  start: number;
  end: number;
}

export interface DehydratedText {
  text: string;          // PII replaced with tokens
  mapping: Record<string, string>;  // token → original value
  matches: PIIMatch[];
}

const PII_PATTERNS: Array<{ type: PIIMatch['type']; regex: RegExp }> = [
  { type: 'ssn', regex: SSN_RE },
  { type: 'credit', regex: CREDIT_RE },
  { type: 'email', regex: EMAIL_RE },
  { type: 'phone', regex: PHONE_RE },
  { type: 'ip', regex: IPV4_RE },
  { type: 'date', regex: DATE_RE },
];

export function detectPII(text: string): PIIMatch[] {
  const matches: PIIMatch[] = [];
  for (const pattern of PII_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push({ type: pattern.type, value: match[0], start: match.index, end: match.index + match[0].length });
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

export function dehydrate(text: string): DehydratedText {
  const matches = detectPII(text);
  const mapping: Record<string, string> = {};
  let result = text;
  let offset = 0;

  // Process in reverse to preserve indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const token = `[${m.type.toUpperCase()}_${i}]`;
    mapping[token] = m.value;
    result = result.slice(0, m.start) + token + result.slice(m.end);
  }

  return { text: result, mapping, matches };
}

export function rehydrate(text: string, mapping: Record<string, string>): string {
  let result = text;
  for (const [token, original] of Object.entries(mapping)) {
    result = result.replace(token, original);
  }
  return result;
}

export function hasPII(text: string): boolean {
  return detectPII(text).length > 0;
}
