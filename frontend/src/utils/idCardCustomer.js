import client from '../api/client';
import { buildCustomerPayload, validateGhCustomerForm } from './customer';
import { cnicDigits, formatCnic, normalizeIdCardParsed } from './cnicScanner';

export function findCustomerByCnic(customers, cnic) {
  const digits = cnicDigits(cnic);
  if (!digits) return null;
  const list = Array.isArray(customers) ? customers : [];
  return list.find((c) => cnicDigits(c.cnic) === digits) || null;
}

export async function findCustomerByCnicApi(cnic) {
  const digits = cnicDigits(cnic);
  if (digits.length !== 13) return null;
  try {
    const res = await client.get('/customers/', { params: { search: digits } });
    const list = res.data?.results || res.data || [];
    return findCustomerByCnic(Array.isArray(list) ? list : [], cnic);
  } catch {
    return null;
  }
}

export function draftGuestFromScan(parsed) {
  const normalized = normalizeIdCardParsed(parsed) || {};
  return {
    full_name: (normalized.full_name || '').trim(),
    cnic: formatCnic(normalized.cnic || ''),
    address: '',
    phone: '',
    email: '',
    notes: '',
  };
}

/**
 * Match existing guest by CNIC or create new from ID card scan.
 * @returns {Promise<{ status: 'existing'|'created'|'needs_phone'|'invalid', customer?, draft?, errors? }>}
 */
export async function resolveGuestFromIdScan(parsed, { customers = [] } = {}) {
  const draft = draftGuestFromScan(parsed);

  if (!draft.cnic && !draft.full_name) {
    return { status: 'invalid', draft };
  }

  let existing = findCustomerByCnic(customers, draft.cnic);
  if (!existing && draft.cnic) {
    existing = await findCustomerByCnicApi(draft.cnic);
  }
  if (existing) {
    return {
      status: 'existing',
      customer: existing,
      draft: {
        ...draft,
        full_name: draft.full_name || existing.full_name || '',
        cnic: draft.cnic || formatCnic(existing.cnic || ''),
      },
    };
  }

  const errors = validateGhCustomerForm(draft);
  if (Object.keys(errors).length === 0) {
    const res = await client.post('/customers/', buildCustomerPayload(draft));
    return { status: 'created', customer: res.data, draft };
  }

  return { status: 'needs_phone', draft, errors };
}

export function isPhoneCompleteForAutoSave(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10;
}

/** Save scanned guest draft to API (validates first). */
export async function saveGuestFromDraft(guestDraft) {
  const errors = validateGhCustomerForm(guestDraft);
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: Object.values(errors)[0], errors };
  }

  const existing = await findCustomerByCnicApi(guestDraft.cnic);
  if (existing) {
    return { ok: true, customer: existing, created: false };
  }

  const res = await client.post('/customers/', buildCustomerPayload(guestDraft));
  return { ok: true, customer: res.data, created: true };
}
