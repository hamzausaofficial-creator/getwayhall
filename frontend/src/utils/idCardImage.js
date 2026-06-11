import jsQR from 'jsqr';
import Tesseract, { PSM } from 'tesseract.js';
import {
  parseIdCardOcrText,
  parseIdCardScan,
  mergeIdCardParsed,
  looksLikePersonName,
  formatCnic,
} from './cnicScanner';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}

function imageToCanvas(img, maxEdge = 2000) {
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function upscaleCanvas(source, factor = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * factor));
  canvas.height = Math.max(1, Math.round(source.height * factor));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function enhanceForOcr(canvas, { invert = false } = {}) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    let gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const boosted = gray < 140 ? gray * 0.65 : Math.min(255, gray * 1.25);
    gray = invert ? 255 - boosted : boosted;
    const v = Math.round(Math.max(0, Math.min(255, gray)));
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function cropCanvas(source, x, y, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, x, y, w, h, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function decodeQrFromCanvas(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const result = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' });
  return result?.data?.trim() || '';
}

function collectQrCandidates(img) {
  const base = imageToCanvas(img, 2200);
  const { width, height } = base;
  const canvases = [
    base,
    cropCanvas(base, 0, height * 0.45, width, height * 0.55),
    cropCanvas(base, width * 0.30, height * 0.48, width * 0.70, height * 0.52),
    enhanceForOcr(imageToCanvas(img, 1800)),
  ];

  const seen = new Set();
  const texts = [];

  for (const canvas of canvases) {
    for (const scale of [1, 1.3, 0.85]) {
      let target = canvas;
      if (scale !== 1) {
        target = document.createElement('canvas');
        target.width = Math.max(1, Math.round(canvas.width * scale));
        target.height = Math.max(1, Math.round(canvas.height * scale));
        const ctx = target.getContext('2d');
        ctx.drawImage(canvas, 0, 0, target.width, target.height);
      }
      const decoded = decodeQrFromCanvas(target);
      if (decoded && !seen.has(decoded)) {
        seen.add(decoded);
        texts.push(decoded);
      }
    }
  }

  return texts;
}

async function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

async function createOcrWorker(lang) {
  const worker = await Tesseract.createWorker(lang, 1, { logger: () => {} });
  return worker;
}

async function ocrWithWorker(worker, canvas, psm = PSM.SINGLE_BLOCK) {
  const prepared = upscaleCanvas(enhanceForOcr(canvas), 2);
  const blob = await canvasToBlob(prepared);
  if (!blob) return '';
  await worker.setParameters({ tessedit_pageseg_mode: psm });
  const { data } = await worker.recognize(blob);
  return String(data?.text || '').trim();
}

/** NADRA front card crop regions (fractions of width/height). */
function getCardCrops(canvas) {
  const { width, height } = canvas;
  return {
    nameBand: cropCanvas(canvas, 0, height * 0.22, width * 0.58, height * 0.12),
    nameZone: cropCanvas(canvas, 0, height * 0.18, width * 0.62, height * 0.28),
    textColumn: cropCanvas(canvas, 0, height * 0.15, width * 0.58, height * 0.55),
    topHalf: cropCanvas(canvas, 0, 0, width, height * 0.72),
    cnicZone: cropCanvas(canvas, 0, height * 0.58, width * 0.72, height * 0.22),
    full: canvas,
  };
}

function parseNameOcrText(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;

  const attempts = [
    `Name\n${text}`,
    text.replace(/^name\s*[:.]?\s*/i, 'Name\n'),
    text,
  ];

  for (const attempt of attempts) {
    const parsed = parseIdCardOcrText(attempt);
    if (parsed?.full_name && looksLikePersonName(parsed.full_name)) return parsed;
  }

  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (looksLikePersonName(line)) {
      return { full_name: line, cnic: '' };
    }
  }

  return parseIdCardOcrText(text);
}

function parseCnicOcrText(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  const parsed = parseIdCardOcrText(`Identity Number\n${text}`);
  if (parsed?.cnic) return parsed;
  return parseIdCardOcrText(text);
}

function hasUsefulFields(parsed) {
  return Boolean(parsed?.cnic) || Boolean(parsed?.full_name);
}

/**
 * Read Pakistani ID card image: QR first, then multi-pass OCR for name + CNIC.
 */
export async function parseIdCardImage(file, { onProgress } = {}) {
  if (!file) {
    throw new Error('No image selected');
  }
  if (!ACCEPTED_TYPES.includes(file.type) && !String(file.type || '').startsWith('image/')) {
    throw new Error('Use JPG, PNG, or WebP image of the ID card');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large (max 8 MB)');
  }

  onProgress?.('Loading image…');
  const img = await loadImageElement(file);
  const canvas = imageToCanvas(img, 2200);
  const crops = getCardCrops(canvas);
  const parsedAttempts = [];

  onProgress?.('Reading QR code…');
  const qrTexts = collectQrCandidates(img);
  qrTexts.forEach((t) => {
    const p = parseIdCardScan(t);
    if (p) parsedAttempts.push(p);
  });

  let engWorker;
  let urdWorker;
  try {
    onProgress?.('Reading name from card…');
    [engWorker, urdWorker] = await Promise.all([
      createOcrWorker('eng'),
      createOcrWorker('urd+eng'),
    ]);

    const [
      nameBandOcr,
      nameZoneOcr,
      textColumnOcr,
      topHalfOcr,
      cnicZoneOcr,
      fullOcr,
    ] = await Promise.all([
      ocrWithWorker(engWorker, crops.nameBand, PSM.SINGLE_LINE),
      ocrWithWorker(urdWorker, crops.nameZone, PSM.SINGLE_BLOCK),
      ocrWithWorker(urdWorker, crops.textColumn, PSM.SINGLE_BLOCK),
      ocrWithWorker(urdWorker, crops.topHalf, PSM.SINGLE_BLOCK),
      ocrWithWorker(engWorker, crops.cnicZone, PSM.SINGLE_BLOCK),
      ocrWithWorker(urdWorker, crops.full, PSM.AUTO),
    ]);

    [nameBandOcr, nameZoneOcr, textColumnOcr].forEach((text) => {
      const p = parseNameOcrText(text);
      if (p) parsedAttempts.push(p);
    });

    [topHalfOcr, fullOcr].forEach((text) => {
      if (!text) return;
      parsedAttempts.push(parseIdCardOcrText(text));
      parsedAttempts.push(parseIdCardScan(text));
    });

    const cnicParsed = parseCnicOcrText(cnicZoneOcr);
    if (cnicParsed) parsedAttempts.push(cnicParsed);
  } finally {
    await Promise.allSettled([
      engWorker?.terminate(),
      urdWorker?.terminate(),
    ]);
  }

  const merged = mergeIdCardParsed(parsedAttempts.filter(Boolean));

  if (merged && hasUsefulFields(merged)) {
    const source = qrTexts.length && merged.cnic && formatCnic(merged.cnic) ? 'qr' : 'ocr';
    return { parsed: merged, source };
  }

  return { parsed: null, source: null };
}

export const ID_CARD_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/bmp,image/*';
