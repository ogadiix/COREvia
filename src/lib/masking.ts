/**
 * COREvia Banking Data Masking Utilities
 * Enforces RBI & Basel banking guidelines for sensitive data minimization
 */

/**
 * Masks an Indian bank account number to show only the last 4 digits
 * Example: '984019283741' -> '•••• •••• 3741'
 */
export function maskAccountNumber(accountNumber?: string | null): string {
  if (!accountNumber) return '••••';
  const clean = String(accountNumber).trim();
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4}`;
}

/**
 * Masks a Permanent Account Number (PAN)
 * Standard format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
 * Masked format: ABCDE••••F
 */
export function maskPAN(pan?: string | null): string {
  if (!pan) return '••••••••••';
  const clean = String(pan).trim().toUpperCase();
  if (clean.length !== 10) return '••••••••••';
  return `${clean.slice(0, 5)}••••${clean.slice(-1)}`;
}

/**
 * Masks an Aadhaar reference or status
 */
export function maskAadhaar(aadhaarNumber?: string | null): string {
  if (!aadhaarNumber) return '•••• •••• ••••';
  const clean = String(aadhaarNumber).replace(/\s+/g, '');
  if (clean.length < 4) return '•••• •••• ••••';
  return `•••• •••• ${clean.slice(-4)}`;
}

/**
 * Masks employee phone or customer phone
 * Example: '+91 98201 92831' -> '+91 ••••• ••831'
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '••••••••••';
  const clean = String(phone).trim();
  if (clean.length <= 4) return '••••';
  return `••••••${clean.slice(-4)}`;
}

/**
 * Masks sensitive financial strings in logs or debug strings
 */
export function sanitizeLogContent(content: string): string {
  if (!content) return '';
  return content
    // Mask potential API keys
    .replace(/(AIza[0-9A-Za-z-_]{35})/g, 'AIza••••[REDACTED]')
    // Mask potential PANs
    .replace(/([A-Z]{5}[0-9]{4}[A-Z]{1})/g, (m) => maskPAN(m))
    // Mask Bearer tokens
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    // Mask password fields in JSON
    .replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[REDACTED]"');
}
