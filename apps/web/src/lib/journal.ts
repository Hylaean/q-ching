/**
 * The journal: a slim, durable record of past castings persisted to
 * localStorage. We deliberately store only what's needed to revisit a reading
 * (and reproduce it from its seed) — never the full hexagram prose.
 */
import type { Reading } from '@q-ching/core';

export interface JournalEntry {
  id: string;
  createdAt: string; // ISO
  question: string;
  method: Reading['method'];
  primaryNumber: number;
  primaryName: string; // english, for at-a-glance scanning
  primarySymbol: string;
  transformedNumber: number | null;
  seed: string;
}

const KEY = 'q-ching:journal:v1';
const MAX_ENTRIES = 100;

export function loadJournal(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JournalEntry[]) : [];
  } catch {
    return [];
  }
}

function persist(entries: JournalEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* storage may be full or blocked (private mode) — fail silently */
  }
}

export function recordReading(question: string, reading: Reading): JournalEntry {
  const entry: JournalEntry = {
    id: `${reading.createdAt}-${reading.seed.slice(0, 8)}`,
    createdAt: reading.createdAt,
    question: question.trim(),
    method: reading.method,
    primaryNumber: reading.primary.number,
    primaryName: reading.primary.name.english,
    primarySymbol: reading.primary.symbol,
    transformedNumber: reading.transformed ? reading.transformed.number : null,
    seed: reading.seed,
  };
  const existing = loadJournal().filter((e) => e.id !== entry.id);
  const next = [entry, ...existing];
  persist(next);
  return entry;
}

export function clearJournal(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
