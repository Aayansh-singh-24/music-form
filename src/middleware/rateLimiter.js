const rateLimit = require('express-rate-limit');
const { submitLimitPer15Min } = require('../config/env');

const tooManyRequests = (message) => (req, res) =>
  res.status(429).json({ success: false, message });

// Applied to every /api route.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooManyRequests('Too many requests. Please wait a few minutes and try again.'),
});

// Stricter limit on form submissions (kept generous for shared campus Wi-Fi).
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: submitLimitPer15Min,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooManyRequests('Too many submissions from this network. Please try again in a little while.'),
});

module.exports = { apiLimiter, submitLimiter };
