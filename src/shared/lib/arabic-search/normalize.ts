const DIACRITICS = /[ً-ٰٟۖ-ۭ]/g
const TATWEEL = /ـ/g
const ARABIC_INDIC_DIGITS = /[٠-٩]/g
const EASTERN_DIGITS = /[۰-۹]/g

/**
 * Makes Arabic text comparable the way people actually type it:
 * أ إ آ ٱ → ا, ة → ه, ى → ي, ؤ → و, ئ → ي, no diacritics or tatweel,
 * Arabic digits → Latin digits, Latin letters lower-cased, spaces collapsed.
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(DIACRITICS, '')
    .replace(TATWEEL, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(ARABIC_INDIC_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(EASTERN_DIGITS, (d) => String(d.charCodeAt(0) - 0x06f0))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when every word of the query appears somewhere in the text, in any order. */
export function matchesSearch(text: string, query: string): boolean {
  const haystack = normalizeArabic(text)
  const words = normalizeArabic(query).split(' ').filter(Boolean)
  return words.every((word) => haystack.includes(word))
}
