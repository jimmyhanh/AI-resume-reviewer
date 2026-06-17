const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
const pinoHttp = require('pino-http');
const crypto = require('crypto');
require('dotenv').config();

// ── Startup guard ────────────────────────────────────────────────────────────
if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI environment variable is not set. Exiting.');
  process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
  console.error('FATAL: OPENAI_API_KEY environment variable is not set. Exiting.');
  process.exit(1);
}

// ── Structured logger ─────────────────────────────────────────────────────────
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } }
  })
});

const resumeRoutes = require('./routes/resume');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── Request correlation IDs ───────────────────────────────────────────────────
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ── HTTP request logging ──────────────────────────────────────────────────────
app.use(pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customLogLevel: (req, res) => res.statusCode >= 500 ? 'error' : 'info',
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, id: req.id }),
    res: (res) => ({ statusCode: res.statusCode })
  }
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// ── General middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ── Database connection ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => {
    logger.error({ err }, 'MongoDB connection error');
    process.exit(1);
  });

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/resume', resumeRoutes);

// ── Health check (includes DB status) ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';
  const healthy = mongoose.connection.readyState === 1;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    requestId: req.id
  });
});

// ── Centralized error handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, `Server running on http://localhost:${PORT}`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info({ signal }, 'Shutdown signal received. Closing gracefully...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed.');
    } catch (err) {
      logger.error({ err }, 'Error closing MongoDB connection');
    }
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = app;