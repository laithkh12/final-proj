import rateLimit from 'express-rate-limit';

const rateLimitResponse = {
  success: false,
  message: 'Too many requests, please try again later',
};

/** Limits brute-force attempts on login and signup. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

/** Reusable limiter for authenticated routes such as future AI endpoints. */
export const authenticatedRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});
