import {
  hasLatinScript,
  hasUrduScript,
  normalizeCardName,
  preserveCardText,
} from './urduRoman';

/** Pakistani CNIC: 12345-1234567-1 */
const CNIC_PATTERN = /\d{5}[-\s]?\d{7}[-\s]?\d/;

const LABEL_WORDS = new Set([
  'name', 'father', 'father name', 'husband', 'husband name', 'gender', 'country', 'country of stay',
  'identity', 'identity number', 'cnic', 'nic', 'date', 'birth', 'issue', 'expiry',
  'pakistan', 'islamic', 'republic', 'national', 'card', 'holder', 'signature',
  'date of birth', 'date of issue', 'date of expiry', 'm', 'f', 'male', 'female',
  'national identity card', 'identity card',
  'نام', 'والد کا نام', 'شوہر کا نام', 'شناختی کارڈ', 'قومیت',
]);

/** Card header / govt text — never a person's name. */
const CARD_HEADER_RE = /islamic|republic|pakistan|raristan|karachi|national\s*identity|identity\s*card|identity\s*number|date\s*of|country\s*of|holder'?s?\s*signature/i;

const NON_NAME_WORDS = new Set([
  'islamic', 'republic', 'pakistan', 'national', 'identity', 'card', 'nic', 'cnic',
  'gender', 'country', 'stay', 'father', 'husband', 'name', 'date', 'birth', 'issue',
  'expiry', 'holder', 'signature', 'male', 'female', 'of', 'the', 'and',
]);

export function formatCnic(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 13) return String(value || '').trim();
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function cnicDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const val = obj?.[key];
    if (val != null && String(val).trim()) return String(val).trim();
  }
  return '';
};

function extractCnic(text) {
  const match = String(text || '').match(CNIC_PATTERN);
  return match ? formatCnic(match[0]) : '';
}

function isCardHeaderText(text) {
  const t = String(text || '').trim();
  if (!t) return true;
  if (CARD_HEADER_RE.test(t)) return true;
  const lower = t.toLowerCase();
  if (lower.includes('national identity') || lower.includes('identity card')) return true;
  return false;
}

/** Real person name on CNIC — not header, labels, or CNIC. */
export function looksLikePersonName(text) {
  const t = preserveCardText(text);
  if (!t || t.length < 3 || CNIC_PATTERN.test(t)) return false;
  if (isCardHeaderText(t) || isLabelLine(t) || isRelativeNameLabelLine(t)) return false;

  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 6) return false;
  if (words.some((w) => NON_NAME_WORDS.has(w.toLowerCase().replace(/[^a-z]/g, '')))) return false;
  if (/^\d+[\d.\-/]*$/.test(t)) return false;

  return hasLatinScript(t) || hasUrduScript(t);
}

function scorePersonName(name) {
  if (!looksLikePersonName(name)) return -1;
  let score = 20;
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words.length <= 4) score += 25;
  if (name.length > 35) score -= 40;
  if (name.length <= 30) score += 5;
  return score;
}

function splitOcrLines(rawText) {
  const byNewline = String(rawText || '').split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;

  const single = byNewline[0] || String(rawText || '').trim();
  if (!single) return [];

  const split = single
    .split(/\b(?=(?:Name|Father Name|Husband Name|Identity Number|Gender|Date of (?:Birth|Issue|Expiry))\b)/i)
    .map((s) => s.trim())
    .filter(Boolean);

  return split.length > 1 ? split : byNewline;
}

/** Father / Husband name labels on Pakistani CNIC (male vs female cards). */
function isRelativeNameLabelLine(line) {
  const text = String(line || '').trim();
  if (!text) return false;
  if (/father|husband|والد\s*کا\s*نام|شوہر\s*کا\s*نام|^والد$|^شوہر$/i.test(text)) return true;
  const normalized = text.toLowerCase().replace(/[:\-.]/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized === 'father name' || normalized === 'husband name';
}

function isNameLabelLine(line) {
  const text = String(line || '').trim();
  if (!text || isRelativeNameLabelLine(text) || isCardHeaderText(text)) return false;
  if (/father|husband/i.test(text)) return false;
  if (/^نام$/i.test(text)) return true;
  if (/^name\s*[:.]?\s*$/i.test(text)) return true;
  const compact = text.toLowerCase().replace(/[^a-z]/g, '');
  return compact === 'name' || /^n[a-z]{0,4}me$/.test(compact);
}

function isLabelLine(line) {
  const text = String(line || '').trim();
  if (!text) return true;
  const normalized = text.toLowerCase().replace(/[:\-.]/g, ' ').replace(/\s+/g, ' ').trim();
  if (LABEL_WORDS.has(normalized)) return true;
  if (/^(father|husband|identity|date|gender|country|national|islamic|republic|pakistan|holder|signature|نام|والد|شوہر)/i.test(normalized)) {
    return true;
  }
  if (/^(father|husband)\s*name$/i.test(normalized)) return true;
  if (/national identity/i.test(text)) return true;
  if (/identity\s*(number|card)/i.test(text)) return true;
  return false;
}

/** English portion before Urdu on the same OCR line (NADRA cards). */
function englishPortionFromLine(line) {
  const text = preserveCardText(line);
  if (!text) return '';
  const urduIdx = text.search(/[\u0600-\u06FF]/);
  return urduIdx >= 0 ? preserveCardText(text.slice(0, urduIdx)) : text;
}

/** Pull English name text from a noisy OCR line. */
function latinNameFromLine(line) {
  const text = englishPortionFromLine(line);
  if (!text || CNIC_PATTERN.test(text)) return '';
  if (isRelativeNameLabelLine(text) || isNameLabelLine(text)) return '';

  const segments = text.match(/[A-Za-z][A-Za-z.'\s-]*/g) || [];
  const candidates = segments
    .map((s) => preserveCardText(s))
    .filter((s) => {
      if (s.length < 3) return false;
      if (isLabelLine(s) || isRelativeNameLabelLine(s)) return false;
      return !/^(of|the|and|card|identity|national|husband|father|name)$/i.test(s);
    });

  if (!candidates.length) return '';
  const valid = candidates.filter((s) => looksLikePersonName(s));
  const pool = valid.length ? valid : candidates;
  return pool.sort((a, b) => b.length - a.length)[0];
}

function looksLikeUrduName(line) {
  const text = preserveCardText(line);
  if (!text || text.length < 2 || CNIC_PATTERN.test(text)) return false;
  if (isLabelLine(text) || isRelativeNameLabelLine(text)) return false;
  return hasUrduScript(text);
}

function looksLikeLatinName(line) {
  const latin = latinNameFromLine(line);
  if (!latin || latin.length < 3) return false;
  const words = latin.split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= 6;
}

function resolveNameFromCandidates(candidates) {
  const list = candidates
    .map((c) => preserveCardText(c))
    .filter((c) => c && !CNIC_PATTERN.test(c) && !isLabelLine(c) && !isRelativeNameLabelLine(c) && !isCardHeaderText(c));

  if (!list.length) return '';

  for (const item of list) {
    const latin = latinNameFromLine(item);
    if (latin && looksLikePersonName(latin)) return normalizeCardName(latin);
  }

  const urdu = list.find((c) => looksLikeUrduName(c) && looksLikePersonName(c));
  if (urdu) return normalizeCardName(urdu);

  const fallback = list.find((c) => looksLikePersonName(c));
  return fallback ? normalizeCardName(fallback) : '';
}

/** "Name Afeera Bibi" on one line — Name must be at line start, not in header. */
function inlineNameFromLabelLine(line) {
  const text = String(line || '').trim();
  if (!text || isCardHeaderText(text)) return '';

  const latinMatch = text.match(/^name\s*[:.]?\s+(.+)$/i);
  if (latinMatch?.[1]) {
    const val = latinMatch[1].trim();
    const latin = latinNameFromLine(val);
    if (latin && looksLikePersonName(latin)) return latin;
    if (looksLikeUrduName(val) && looksLikePersonName(val)) return val;
  }

  const urduMatch = text.match(/^نام\s*[:.]?\s+(.+)$/);
  if (urduMatch?.[1]) {
    const val = urduMatch[1].trim();
    if (looksLikePersonName(val)) return val;
  }

  return '';
}

function valueAfterNameLabel(lines, startIdx) {
  const inline = inlineNameFromLabelLine(lines[startIdx]);
  if (inline) return inline;

  for (let j = startIdx + 1; j < lines.length; j += 1) {
    const line = lines[j];
    if (isRelativeNameLabelLine(line)) break;
    if (/identity\s*number|date\s*of\s*birth|gender/i.test(line)) break;
    if (CNIC_PATTERN.test(line)) break;
    if (isNameLabelLine(line)) break;
    if (isLabelLine(line) && !latinNameFromLine(line) && !looksLikeUrduName(line)) continue;

    const latin = latinNameFromLine(line);
    if (latin && looksLikePersonName(latin)) return latin;
    const urdu = preserveCardText(line);
    if (looksLikeUrduName(line) && looksLikePersonName(urdu)) return urdu;
  }

  return '';
}

function collectNameBlock(lines) {
  for (let i = 0; i < lines.length; i += 1) {
    if (!isNameLabelLine(lines[i])) continue;
    const value = valueAfterNameLabel(lines, i);
    if (value) return [value];
  }
  return [];
}

/** Lines above CNIC / Identity Number — English name often here. */
function collectNameNearCnic(lines) {
  const cnicIdx = lines.findIndex(
    (l) => CNIC_PATTERN.test(l) || /identity\s*number/i.test(l),
  );
  if (cnicIdx < 0) return [];

  const candidates = [];
  let inRelativeBlock = false;

  for (let i = 0; i < cnicIdx; i += 1) {
    const line = lines[i];
    if (isRelativeNameLabelLine(line)) {
      inRelativeBlock = true;
      continue;
    }
    if (isNameLabelLine(line)) {
      inRelativeBlock = false;
      const value = valueAfterNameLabel(lines, i);
      if (value) candidates.push(value);
      continue;
    }
    if (inRelativeBlock) continue;
    if (isLabelLine(line)) continue;

    const latin = latinNameFromLine(line);
    if (latin && looksLikePersonName(latin)) {
      candidates.push(latin);
      continue;
    }
    if (looksLikeUrduName(line) && looksLikePersonName(line)) candidates.push(line);
  }

  return candidates;
}

function extractNameFromLines(lines) {
  const blockCandidates = collectNameBlock(lines);
  if (blockCandidates.length) {
    const resolved = resolveNameFromCandidates(blockCandidates);
    if (resolved) return resolved;
  }

  const nearCnicCandidates = collectNameNearCnic(lines);
  if (nearCnicCandidates.length) {
    const resolved = resolveNameFromCandidates(nearCnicCandidates);
    if (resolved) return resolved;
  }

  const allLatin = lines
    .filter((l) => !isLabelLine(l) && !isRelativeNameLabelLine(l) && !isCardHeaderText(l) && !CNIC_PATTERN.test(l))
    .map((l) => latinNameFromLine(l))
    .filter((n) => n && looksLikePersonName(n));
  if (allLatin.length) {
    return normalizeCardName(allLatin[0]);
  }

  const urduCandidate = lines.find((l) => looksLikeUrduName(l) && looksLikePersonName(l));
  if (urduCandidate) return normalizeCardName(urduCandidate);

  return '';
}

/** Card se sirf name aur CNIC. */
export function normalizeIdCardParsed(parsed) {
  if (!parsed) return null;
  const cnic = formatCnic(parsed.cnic || extractCnic(parsed.raw || ''));
  let full_name = normalizeCardName(parsed.full_name || '');

  if (full_name && (
    isLabelLine(full_name)
    || CNIC_PATTERN.test(full_name)
    || isCardHeaderText(full_name)
    || !looksLikePersonName(full_name)
  )) {
    full_name = '';
  }

  return { full_name, cnic };
}

function hasValidCnic(cnic) {
  return cnicDigits(cnic).length === 13;
}

function mergeScore(parsed) {
  if (!parsed) return -1;
  const hasCnic = hasValidCnic(parsed.cnic);
  const nameScore = scorePersonName(parsed.full_name);
  let score = 0;
  if (hasCnic) score += 50;
  if (nameScore > 0) score += nameScore;
  if (hasCnic && nameScore > 0) score += 40;
  return score;
}

/** Merge parse attempts — prefer CNIC + name from the same read, not mixed across passes. */
export function mergeIdCardParsed(candidates) {
  let bestPaired = null;
  let bestPairedScore = -1;

  for (const item of candidates) {
    const parsed = normalizeIdCardParsed(item);
    const score = mergeScore(parsed);
    if (score > bestPairedScore) {
      bestPairedScore = score;
      bestPaired = parsed;
    }
  }

  if (bestPaired?.cnic && bestPaired?.full_name) {
    return normalizeIdCardParsed(bestPaired);
  }

  let cnic = bestPaired?.cnic && hasValidCnic(bestPaired.cnic) ? bestPaired.cnic : '';
  let full_name = bestPaired?.full_name && looksLikePersonName(bestPaired.full_name)
    ? bestPaired.full_name
    : '';
  let bestNameScore = scorePersonName(full_name);

  for (const item of candidates) {
    const parsed = normalizeIdCardParsed(item);
    if (!parsed) continue;
    if (!cnic && hasValidCnic(parsed.cnic)) cnic = parsed.cnic;
    const nameScore = scorePersonName(parsed.full_name);
    if (nameScore > bestNameScore) {
      bestNameScore = nameScore;
      full_name = parsed.full_name;
    }
  }

  return normalizeIdCardParsed({ full_name, cnic });
}

/** Parse OCR text from Pakistani CNIC. */
export function parseIdCardOcrText(rawText) {
  const text = String(rawText || '').replace(/\r/g, '\n').trim();
  if (!text) return null;

  const lines = splitOcrLines(text);
  return normalizeIdCardParsed({
    full_name: extractNameFromLines(lines),
    cnic: extractCnic(text),
    raw: text,
  });
}

function tryDecodeEmbeddedPayload(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  const attempts = [trimmed];
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 20) {
      attempts.push(atob(trimmed));
    }
  } catch {
    /* ignore */
  }
  try {
    attempts.push(decodeURIComponent(trimmed));
  } catch {
    /* ignore */
  }

  for (const attempt of attempts) {
    if (!attempt || attempt === trimmed) continue;
    const parsed = parseIdCardScan(attempt);
    if (parsed?.cnic || parsed?.full_name) return parsed;
  }
  return null;
}

function personNameFromField(raw) {
  const text = preserveCardText(raw);
  if (!text || CNIC_PATTERN.test(text) || cnicDigits(text).length === 13) return '';
  if (/father|husband|والد|شوہر/i.test(text)) return '';
  if (looksLikePersonName(text)) return normalizeCardName(text);
  const latin = latinNameFromLine(text);
  if (latin && looksLikePersonName(latin)) return normalizeCardName(latin);
  return '';
}

/** NADRA QR/barcode: CNIC | Name | Father/Husband Name | DOB | ... */
function nameFromDelimitedParts(parts, cnicIdx) {
  if (cnicIdx < 0) return '';

  const ordered = [
    parts[cnicIdx + 1],
    parts[cnicIdx - 1],
    parts[cnicIdx + 2],
  ];

  for (const field of ordered) {
    const name = personNameFromField(field);
    if (name) return name;
  }

  return '';
}

function parseDelimitedCardText(text) {
  const parts = text.split(/[|,\t;]+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const cnicIdx = parts.findIndex((p) => CNIC_PATTERN.test(p) || cnicDigits(p).length === 13);
  const cnicPart = cnicIdx >= 0
    ? formatCnic(parts[cnicIdx])
    : formatCnic(parts.find((p) => CNIC_PATTERN.test(p) || cnicDigits(p).length === 13) || '');

  return normalizeIdCardParsed({
    full_name: nameFromDelimitedParts(parts, cnicIdx),
    cnic: cnicPart,
  });
}

function parseQueryCardText(text) {
  if (!/[=:&]/.test(text) || !/cnic|name|citizen/i.test(text)) return null;
  const chunks = text.split(/[&;\n]+/).map((s) => s.trim()).filter(Boolean);
  const fields = {};
  chunks.forEach((chunk) => {
    const m = chunk.match(/^([^=:]+)[=:](.+)$/);
    if (!m) return;
    fields[m[1].trim().toLowerCase().replace(/\s+/g, '_')] = m[2].trim();
  });
  if (!Object.keys(fields).length) return null;

  return normalizeIdCardParsed({
    full_name: pick(
      fields,
      'name', 'full_name', 'citizenname', 'citizen_name', 'name_in_english',
    ),
    cnic: pick(
      fields,
      'cnic', 'nic', 'citizennumber', 'citizen_number', 'identity', 'identity_number',
    ),
  });
}

/** Parse USB QR / barcode / image text — name + CNIC only. */
export function parseIdCardScan(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return null;

  try {
    const json = JSON.parse(text);
    const englishName = pick(
      json,
      'full_name', 'name', 'Name', 'FullName', 'fullName',
      'CitizenName', 'citizenName', 'NameInEnglish', 'nameInEnglish',
    );
    const urduName = pick(
      json,
      'NameUrdu', 'nameUrdu', 'name_urdu', 'CitizenNameUrdu', 'NameInUrdu',
    );

    const parsed = normalizeIdCardParsed({
      full_name: englishName || urduName,
      cnic: pick(
        json,
        'cnic', 'CNIC', 'nic', 'NIC', 'identity',
        'CitizenNumber', 'citizenNumber', 'cnicNumber', 'CNICNumber',
        'IdentityNumber', 'identityNumber',
      ),
    });
    if (parsed?.cnic || parsed?.full_name) return parsed;
  } catch {
    /* not JSON */
  }

  const embedded = tryDecodeEmbeddedPayload(text);
  if (embedded) return embedded;

  const queryParsed = parseQueryCardText(text);
  if (queryParsed?.cnic || queryParsed?.full_name) return queryParsed;

  if (/[|,\t;]/.test(text)) {
    const delimited = parseDelimitedCardText(text);
    if (delimited?.cnic || delimited?.full_name) return delimited;
  }

  const digitsOnly = text.replace(/\D/g, '');
  if (digitsOnly.length === 13 && !text.match(/[A-Za-z\u0600-\u06FF]{3,}/)) {
    return normalizeIdCardParsed({ full_name: '', cnic: digitsOnly });
  }

  if (text.includes('\n') || /name|identity|cnic|father|husband|نام/i.test(text)) {
    const ocrParsed = parseIdCardOcrText(text);
    if (ocrParsed?.cnic || ocrParsed?.full_name) return ocrParsed;
  }

  const cnic = extractCnic(text);
  if (cnic) {
    const lines = splitOcrLines(text);
    return normalizeIdCardParsed({
      full_name: extractNameFromLines(lines),
      cnic,
    });
  }

  const latin = latinNameFromLine(text);
  if (latin && looksLikePersonName(latin)) return normalizeIdCardParsed({ full_name: latin, cnic: '' });
  if (looksLikeUrduName(text) && looksLikePersonName(text)) return normalizeIdCardParsed({ full_name: text, cnic: '' });

  return normalizeIdCardParsed({ full_name: '', cnic: '' });
}
