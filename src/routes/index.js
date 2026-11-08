const express = require('express');
const responseRoutes = require('./responseRoutes');

const router = express.Router();

// GET /api/health  (handy for uptime pingers and deployment checks)
router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.use('/responses', responseRoutes);

module.exports = router;
