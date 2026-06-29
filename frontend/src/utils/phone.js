/** Pakistani mobile: 11 digits, starts with 03 (e.g. 0300 1234567). */

export function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function normalizePakPhone(value) {
  let digits = phoneDigits(value);
  if (digits.startsWith('0092')) {
    digits = `0${digits.slice(4)}`;
  } else if (digits.startsWith('92') && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  }
  return digits.slice(0, 11);
}

/** Display format: 03XX XXXXXXX */
export function formatPakPhone(value) {
  const digits = normalizePakPhone(value);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

export function isValidPakPhone(value) {
  return /^03\d{9}$/.test(normalizePakPhone(value));
}

export function validatePakPhone(value, { required = true } = {}) {
  const digits = normalizePakPhone(value);
  if (!digits) {
    return required ? 'Phone number is required.' : null;
  }
  if (digits.length < 11) {
    return 'Enter 11 digits (e.g. 0300 1234567).';
  }
  if (!/^03\d{9}$/.test(digits)) {
    return 'Enter a valid mobile number starting with 03.';
  }
  return null;
}

export const PAK_PHONE_PLACEHOLDER = '0300 1234567';
export const PAK_PHONE_INPUT_MAX_LENGTH = 12;
