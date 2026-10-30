import rateLimit from 'express-rate-limit';

const defaultHandler = (message: string) => {
  return (_req: any, res: any) => {
    res.status(429).json({
      success: false,
      error: { message }
    });
  };
};

/**
 * Login rate limiter: Protects against brute-force and credential-stuffing attacks.
 * Limit: 10 failed or total attempts per 15 minutes per IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler('Too many login attempts. Please wait 15 minutes before trying again.')
});

/**
 * Registration rate limiter: Prevents automated bot account creation spam.
 * Limit: 10 accounts per hour per IP.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler('Too many account registrations from this network. Please try again later.')
});

/**
 * Forgot password rate limiter: Prevents email inbox flooding / Brevo API exhaustion.
 * Limit: 5 requests per 15 minutes per IP.
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler('Too many password reset requests. Please wait 15 minutes before trying again.')
});

/**
 * Password reset completion rate limiter: Protects token verification endpoint.
 * Limit: 10 requests per 15 minutes per IP.
 */
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler('Too many reset attempts. Please wait a few minutes.')
});

/**
 * Public enquiry limiter: Prevents lead spamming on public forms.
 * Limit: 10 enquiries per 15 minutes per IP.
 */
export const publicEnquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler('Too many enquiry submissions from this connection. Please wait a few minutes.')
});

