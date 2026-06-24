/**
 * A tiny, explicit state machine for the divination ritual. Five phases flow
 * forward; the only backward move is "cast again", which returns to QUESTION
 * so the gesture/entropy is re-gathered fresh for the next reading.
 */
import type { CastMethod, Reading } from '@q-ching/core';

export type Phase = 'threshold' | 'question' | 'gathering' | 'casting' | 'reading';

export interface RitualState {
  phase: Phase;
  question: string;
  method: CastMethod;
  reading: Reading | null;
}

export type RitualAction =
  | { type: 'begin' }
  | { type: 'setQuestion'; question: string }
  | { type: 'setMethod'; method: CastMethod }
  | { type: 'toGathering' }
  | { type: 'toCasting' }
  | { type: 'castComplete'; reading: Reading }
  | { type: 'again' }
  | { type: 'reset' };

export const initialRitualState: RitualState = {
  phase: 'threshold',
  question: '',
  method: 'coin',
  reading: null,
};

export function ritualReducer(state: RitualState, action: RitualAction): RitualState {
  switch (action.type) {
    case 'begin':
      return { ...state, phase: 'question' };
    case 'setQuestion':
      return { ...state, question: action.question };
    case 'setMethod':
      return { ...state, method: action.method };
    case 'toGathering':
      return { ...state, phase: 'gathering' };
    case 'toCasting':
      return { ...state, phase: 'casting' };
    case 'castComplete':
      return { ...state, phase: 'reading', reading: action.reading };
    case 'again':
      // keep the question and method; clear the prior reading
      return { ...state, phase: 'question', reading: null };
    case 'reset':
      return initialRitualState;
    default:
      return state;
  }
}
