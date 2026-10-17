const rateLimit = require('express-rate-limit');

// General auth rate limiter (login, register, google auth)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // max 50 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// Strict limiter for OTP / forgot-password requests to prevent email spamming
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // max 5 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many password reset requests. Please wait 15 minutes before requesting another OTP.',
  },
});

module.exports = { authLimiter, forgotPasswordLimiter };

