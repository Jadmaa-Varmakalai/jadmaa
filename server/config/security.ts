import crypto from 'crypto';

/**
 * Validates cryptographic signing secrets during application boot.
 * Fails fast if critical secrets are missing or insufficiently strong in production.
 */
export function validateSecurityConfiguration(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET?.trim();
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET?.trim();

  // 1. Mandatory presence check
  if (!jwtSecret) {
    const errorMsg = '[Security Error] JWT_SECRET is not configured. Server startup aborted.';
    console.error(errorMsg);
    if (isProduction) {
      process.exit(1);
    }
  }

  if (!jwtRefreshSecret) {
    const errorMsg = '[Security Error] JWT_REFRESH_SECRET is not configured. Server startup aborted.';
    console.error(errorMsg);
    if (isProduction) {
      process.exit(1);
    }
  }

  // 2. Minimum length / entropy check
  const minLength = isProduction ? 32 : 16;
  if (jwtSecret && jwtSecret.length < minLength) {
    const msg = `[Security Warning] JWT_SECRET is too short (${jwtSecret.length} chars). Production requires at least ${minLength} characters.`;
    if (isProduction) {
      console.error(msg);
      process.exit(1);
    } else {
      console.warn(msg);
    }
  }

  if (jwtRefreshSecret && jwtRefreshSecret.length < minLength) {
    const msg = `[Security Warning] JWT_REFRESH_SECRET is too short (${jwtRefreshSecret.length} chars). Production requires at least ${minLength} characters.`;
    if (isProduction) {
      console.error(msg);
      process.exit(1);
    } else {
      console.warn(msg);
    }
  }
}

/**
 * Retrieve verified JWT access token secret. Throws if missing.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET is missing from server configuration.');
  }
  return secret;
}

/**
 * Retrieve verified JWT refresh token secret. Throws if missing.
 */
export function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is missing from server configuration.');
  }
  return secret;
}

/**
 * Compute SHA-256 hash of a token for secure database persistence.
 * Prevents plain-text token exfiltration from database compromises.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

