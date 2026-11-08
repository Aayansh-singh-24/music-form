const path = require('path');
const express = require('express');
const helmet = require('helmet');

const { isProd } = require('./config/env');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Hosting platforms sit behind a proxy; this lets rate limiting see the real visitor IP.
app.set('trust proxy', 1);

// Security headers. The CSP only allows our own files plus Google Fonts.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ['https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://itunes.apple.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        // Forcing https breaks plain-http localhost in some browsers.
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
  })
);

// Only accept small JSON bodies.
app.use(express.json({ limit: '20kb' }));

// API
app.use('/api', apiLimiter, routes);

// Frontend (plain HTML/CSS/JS)
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: isProd ? '1h' : 0 }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
