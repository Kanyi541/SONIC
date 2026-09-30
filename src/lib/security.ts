/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitize HTML input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate username (alphanumeric, underscore, hyphen)
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  isStrong: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters');

  if (password.length >= 12) score += 1;
  else feedback.push('Consider using 12+ characters for better security');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  return {
    isStrong: score >= 4,
    score,
    feedback,
  };
}

/**
 * Rate limiter class for API endpoints
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside the time window
    const validRequests = userRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

/**
 * CSRF token generation and validation
 */
export class CSRFProtection {
  private static tokens: Map<string, { token: string; expires: number }> = new Map();
  private static readonly TOKEN_EXPIRY = 3600000; // 1 hour

  static generateToken(sessionId: string): string {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    this.tokens.set(sessionId, {
      token,
      expires: Date.now() + this.TOKEN_EXPIRY,
    });
    return token;
  }

  static validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);
    if (!stored) return false;

    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId);
      return false;
    }

    return stored.token === token;
  }

  static revokeToken(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  // Clean up expired tokens periodically
  static cleanup(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

/**
 * SQL injection prevention (basic pattern matching)
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|OR|AND)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\b(EXEC|EXECUTE|SP_|XP_)\b)/i,
    /(''')/,
    /(\b(WHERE|HAVING|GROUP BY|ORDER BY)\b)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Prevent NoSQL injection
 */
export function sanitizeMongoQuery(query: any): any {
  if (typeof query !== 'object' || query === null) {
    return query;
  }

  const dangerousOperators = ['$where', '$ne', '$gt', '$lt', '$regex', '$expr'];

  for (const key in query) {
    if (dangerousOperators.includes(key)) {
      delete query[key];
    } else if (typeof query[key] === 'object') {
      query[key] = sanitizeMongoQuery(query[key]);
    }
  }

  return query;
}
