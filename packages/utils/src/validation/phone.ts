export function isValidIndianMobile(phone: string): boolean {
  const normalized = phone.replace(/\s+/g, '');
  const withOptionalPrefix = normalized.startsWith('+91') ? normalized.slice(3) : normalized;
  return /^[6-9]\d{9}$/.test(withOptionalPrefix);
}

