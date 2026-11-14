/**
 * Phone number normalization utilities for TORSHA BAZAAR.
 * Aligns customer/partner phone strings with Firebase Auth E.164 format (+91XXXXXXXXXX).
 * Never treats normalization alone as OTP verification.
 */

export function normalizePhoneE164(
  phone?: string | null,
  defaultCountryCode = '+91'
): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (!trimmed) return '';

  // Strip formatting spaces, hyphens, parentheses, and dots
  const compact = trimmed.replace(/[\s\-().]/g, '');

  // Already has + prefix followed by digits
  if (/^\+\d{8,15}$/.test(compact)) {
    return compact;
  }

  // International 00 prefix (e.g. 00919832012345)
  if (/^00\d{8,15}$/.test(compact)) {
    return `+${compact.slice(2)}`;
  }

  // Digits-only Indian / regional formats
  if (/^\d+$/.test(compact)) {
    // Standard 10-digit Indian number -> +91XXXXXXXXXX
    if (compact.length === 10 && defaultCountryCode === '+91') {
      return `+91${compact}`;
    }
    // Trunk-prefixed 11-digit Indian number (0XXXXXXXXXX) -> +91XXXXXXXXXX
    if (compact.length === 11 && compact.startsWith('0') && defaultCountryCode === '+91') {
      return `+91${compact.slice(1)}`;
    }
    // 12-digit India country-coded number without + (91XXXXXXXXXX)
    if (compact.length === 12 && compact.startsWith('91')) {
      return `+${compact}`;
    }
    if (compact.length >= 8 && compact.length <= 15) {
      return compact.startsWith('+') ? compact : `${defaultCountryCode}${compact}`;
    }
  }

  return trimmed;
}

export function phonesMatchNormalized(
  a?: string | null,
  b?: string | null
): boolean {
  const na = normalizePhoneE164(a);
  const nb = normalizePhoneE164(b);
  return Boolean(na && nb && na === nb);
}
