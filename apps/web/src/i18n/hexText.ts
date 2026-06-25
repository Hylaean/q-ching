import type { Hexagram } from '@hylaean/core';
import type { Locale } from './strings';
import { HEXAGRAMS_FR } from './hexagrams.fr';

export interface LocalizedHex {
  name: string;
  gloss: string;
  judgment: string;
  image: string;
  lineTexts: string[];
}

/** The displayed text for a hexagram in the active locale (English fallback). */
export function hexText(h: Hexagram, locale: Locale): LocalizedHex {
  if (locale === 'fr') {
    const fr = HEXAGRAMS_FR[h.number];
    if (fr) return fr;
  }
  return {
    name: h.name.english,
    gloss: h.gloss,
    judgment: h.judgment,
    image: h.image,
    lineTexts: h.lineTexts,
  };
}

/** Localized hexagram name by King Wen number (the journal stores numbers/names). */
export function hexName(number: number, fallbackEnglish: string, locale: Locale): string {
  if (locale === 'fr') {
    const fr = HEXAGRAMS_FR[number];
    if (fr) return fr.name;
  }
  return fallbackEnglish;
}
