/**
 * COREvia Banking Input Sanitization and Mass Assignment Protection
 * Neutralizes XSS attack vectors and enforces strictly allowlisted DTO persistence
 */

/**
 * Escapes HTML entities to prevent Cross-Site Scripting (XSS)
 * Covers script tags, event handlers, javascript: pseudo-protocol
 */
export function sanitizeText(input: unknown, maxLength?: number): string {
  if (input === null || input === undefined) return '';
  let str = String(input);
  if (typeof maxLength === 'number' && maxLength > 0 && str.length > maxLength) {
    str = str.slice(0, maxLength);
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, 'blocked:')
    .replace(/data:/gi, 'blocked:');
}

/**
 * Recursively sanitizes object strings for safe storage and rendering
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return sanitizeText(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }
  return obj;
}

/**
 * Mass Assignment Protection: Whitelist filter for updates
 * Strips protected metadata, ID fields, and unauthorized keys
 */
export function filterAllowlist<T extends Record<string, any>>(
  input: Record<string, any>,
  allowedKeys: (keyof T)[]
): Partial<T> {
  const result: Partial<T> = {};
  if (!input || typeof input !== 'object') return result;

  for (const key of allowedKeys) {
    const stringKey = String(key);
    if (Object.prototype.hasOwnProperty.call(input, stringKey)) {
      const val = input[stringKey];
      if (val !== undefined) {
        (result as any)[stringKey] = typeof val === 'string' ? sanitizeText(val) : val;
      }
    }
  }
  return result;
}

/**
 * Validates bounded pagination parameters
 */
export function validatePagination(pageParam: unknown, limitParam: unknown, maxLimit: number = 100) {
  let page = Number(pageParam);
  let limit = Number(limitParam);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > maxLimit) limit = maxLimit; // Cap to prevent DOS

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Validates and safely parses numeric IDs from route parameters
 */
export function validateId(param: unknown, paramName: string = 'ID'): number {
  const num = Number(param);
  if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
    throw new Error(`Invalid ${paramName} provided. Expected positive integer.`);
  }
  return num;
}
