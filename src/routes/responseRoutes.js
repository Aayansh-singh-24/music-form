const express = require('express');
const { createResponse } = require('../controllers/responseController');
const validate = require('../middleware/validate');
const { submitLimiter } = require('../middleware/rateLimiter');
const { responseSchema } = require('../validators/responseValidator');

const router = express.Router();

// POST /api/responses
router.post('/', submitLimiter, validate(responseSchema), createResponse);

module.exports = router;
