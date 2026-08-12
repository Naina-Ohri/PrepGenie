/**
 * rateLimiter.js
 * Limits AI-calling endpoints to 10 requests/user/hour per API.md §6.
 * Keyed on the authenticated user's id (not IP), since authMiddleware
 * runs before this in the resume/interview route chains.
 */

const rateLimit = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'You have reached the hourly limit for AI requests. Please try again later.',
    });
  },
});

module.exports = { aiRateLimiter };
