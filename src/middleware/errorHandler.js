const { isProd } = require('../config/env');

function notFound(req, res) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  return res.status(404).type('text').send('Page not found');
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Problems with the incoming request body
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Your response is too large.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid request format.' });
  }

  // Anything unexpected: log the details privately, show a generic message publicly.
  console.error('Unexpected error:', isProd ? err.message : err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong on our side. Please try again in a moment.',
  });
}

module.exports = { notFound, errorHandler };
