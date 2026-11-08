const crypto = require('crypto');
const { hashSecret } = require('../config/env');

/**
 * Scrambles the random browser ID so the database never holds the raw value.
 * Same input + same secret => same output, which is what lets us group
 * repeat responses from the same browser without knowing who the person is.
 */
function hashAnonId(anonId) {
  return crypto.createHmac('sha256', hashSecret).update(anonId).digest('hex');
}

module.exports = { hashAnonId };
