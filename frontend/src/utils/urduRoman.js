/** Arabic / Urdu script blocks */
const URDU_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_RE = /[A-Za-z]/;
const DIACRITICS_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

const URDU_ROMAN_SEQUENCES = [
  ['چھ', 'chh'], ['چھ', 'chh'], ['کھ', 'kh'], ['گھ', 'gh'], ['بھ', 'bh'],
  ['ٹھ', 'th'], ['ڈھ', 'dh'], ['ڑھ', 'rh'], ['نج', 'nj'], ['چ', 'ch'],
  ['ش', 'sh'], ['ژ', 'zh'], ['ڈ', 'd'], ['ڑ', 'r'], ['ڑ', 'rr'], ['ٹ', 't'],
  ['ث', 's'], ['ص', 's'], ['ض', 'z'], ['ط', 't'], ['ظ', 'z'], ['ع', ''],
  ['غ', 'gh'], ['ف', 'f'], ['ق', 'q'], ['ک', 'k'], ['ڪ', 'k'], ['گ', 'g'],
  ['ں', 'n'], ['ھ', 'h'], ['ہ', 'h'], ['ۃ', 'h'], ['ۂ', 'e'], ['ة', 'h'],
  ['آ', 'aa'], ['أ', 'a'], ['إ', 'i'], ['ؤ', 'o'], ['ئ', 'i'], ['ء', ''],
  ['ى', 'a'], ['ی', 'i'], ['ے', 'e'], ['ۓ', 'e'], ['و', 'o'], ['ا', 'a'],
  ['ب', 'b'], ['پ', 'p'], ['ت', 't'], ['ج', 'j'], ['ح', 'h'], ['خ', 'kh'],
  ['د', 'd'], ['ذ', 'z'], ['ر', 'r'], ['ز', 'z'], ['س', 's'], ['ل', 'l'],
  ['م', 'm'], ['ن', 'n'],
];

export function hasUrduScript(text) {
  return URDU_RE.test(String(text || ''));
}

export function hasLatinScript(text) {
  return LATIN_RE.test(String(text || ''));
}

/** Whitespace only — card text as-is. */
export function preserveCardText(value) {
  return String(value || '')
    .replace(/[|:;]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function transliterateUrduToEnglish(text) {
  let input = String(text || '')
    .replace(DIACRITICS_RE, '')
    .replace(/\u200c|\u200d|\u200e|\u200f/g, '')
    .trim();

  if (!input) return '';

  let output = '';
  let i = 0;
  while (i < input.length) {
    let matched = false;
    for (const [seq, roman] of URDU_ROMAN_SEQUENCES) {
      if (input.startsWith(seq, i)) {
        output += roman;
        i += seq.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const ch = input[i];
    if (ch === ' ') {
      output += ' ';
    } else if (/[0-9.,/#-]/.test(ch)) {
      output += ch;
    }
    i += 1;
  }

  return preserveCardText(
    output
      .replace(/aa+/g, 'aa')
      .replace(/\s+'/g, ' ')
      .replace(/([^aeiou])\1{2,}/gi, '$1$1'),
  )
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Name: English on card → exact same casing.
 * Urdu on card → romanized English.
 */
export function normalizeCardName(value) {
  const text = preserveCardText(value);
  if (!text) return '';

  if (hasLatinScript(text)) {
    const latinOnly = text
      .match(/[A-Za-z][A-Za-z.'\s-]*/g)
      ?.map((s) => s.trim())
      .filter(Boolean)
      .join(' ')
      .trim();
    if (latinOnly) return latinOnly;
  }

  if (hasUrduScript(text)) {
    return transliterateUrduToEnglish(text);
  }

  return text;
}

/** Address: keep original language (Urdu stays Urdu). */
export function normalizeCardAddress(value) {
  return preserveCardText(value);
}
