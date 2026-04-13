/**
 * Input validation helpers for server actions.
 * Lightweight Zod-free validation to avoid adding a dependency.
 * Each function throws a descriptive error or returns sanitized data.
 */

/** Trim and enforce a max length. Returns trimmed string. */
export function sanitize(value: unknown, fieldName: string, maxLen = 500): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLen) {
    throw new ValidationError(`${fieldName} must be ${maxLen} characters or fewer.`);
  }
  return trimmed;
}

/** Optional string — returns null if empty/missing, validated string otherwise. */
export function sanitizeOptional(value: unknown, fieldName: string, maxLen = 500): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLen) {
    throw new ValidationError(`${fieldName} must be ${maxLen} characters or fewer.`);
  }
  return trimmed;
}

/** Validate email format. */
export function validateEmail(value: unknown, fieldName = "Email"): string {
  const email = sanitize(value, fieldName, 255);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError(`${fieldName} is not a valid email address.`);
  }
  return email.toLowerCase();
}

/** Validate URL format. */
export function validateUrl(value: unknown, fieldName = "URL"): string {
  const url = sanitize(value, fieldName, 2000);
  try {
    new URL(url);
    return url;
  } catch {
    throw new ValidationError(`${fieldName} is not a valid URL.`);
  }
}

/** Optional URL validation. */
export function validateUrlOptional(value: unknown, fieldName = "URL"): string | null {
  const str = sanitizeOptional(value, fieldName, 2000);
  if (!str) return null;
  try {
    new URL(str);
    return str;
  } catch {
    throw new ValidationError(`${fieldName} is not a valid URL.`);
  }
}

/** Validate phone number (basic format check). */
export function validatePhone(value: unknown, fieldName = "Phone"): string {
  const phone = sanitize(value, fieldName, 15);
  const phoneRegex = /^[+]?[\d\s\-()]{7,15}$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError(`${fieldName} is not a valid phone number.`);
  }
  return phone;
}

/** Validate a date string (YYYY-MM-DD). */
export function validateDate(value: unknown, fieldName = "Date"): string {
  const dateStr = sanitize(value, fieldName, 10);
  if (isNaN(Date.parse(dateStr))) {
    throw new ValidationError(`${fieldName} is not a valid date.`);
  }
  return dateStr;
}

/** Validate that a value is in a set of allowed values. */
export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string
): T {
  const str = sanitize(value, fieldName, 100);
  if (!allowedValues.includes(str as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(", ")}`
    );
  }
  return str as T;
}

/** Custom validation error class — server actions catch these and return { error }. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
