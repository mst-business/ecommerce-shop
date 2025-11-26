require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRouter = require('./routes');
const { connectDatabase } = require('./config/database');
const { seedExampleData } = require('./config/seed');
const { errorHandler } = require('./middleware/errorHandler');
const { applySecurityMiddleware } = require('./middleware/security');
const { CORS, REQUEST_LIMITS } = require('./config/security');

const app = express();
const PORT = process.env.API_PORT || 3001;

// ===========================================
// Security Middleware (applied first)
// ===========================================
applySecurityMiddleware(app);

// ===========================================
// Core Middleware
// ===========================================

// CORS with security configuration
app.use(cors({
  origin: CORS.ALLOWED_ORIGINS,
  methods: CORS.ALLOWED_METHODS,
  allowedHeaders: CORS.ALLOWED_HEADERS,
  credentials: CORS.CREDENTIALS,
  maxAge: CORS.MAX_AGE,
}));

// Body parsing with size limits
app.use(express.json({ limit: REQUEST_LIMITS.JSON_LIMIT }));
app.use(express.urlencoded({ 
  extended: true, 
  limit: REQUEST_LIMITS.URL_ENCODED_LIMIT,
  parameterLimit: REQUEST_LIMITS.PARAMETER_LIMIT,
}));

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ===========================================
// Static Files
// ===========================================
app.use(
  '/images',
  express.static(path.join(__dirname, '..', 'public', 'images'), {
    maxAge: '1d', // Cache for 1 day
    etag: true,
  })
);

// ===========================================
// API Routes
// ===========================================
app.use('/api', apiRouter);

// ===========================================
// Error Handler (must be last)
// ===========================================
app.use(errorHandler);

// ===========================================
// Server Startup
// ===========================================
async function startServer() {
  try {
    await connectDatabase();
    await seedExampleData();

    app.listen(PORT, () => {
      console.log('===========================================');
      console.log(`🚀 API server listening at http://localhost:${PORT}`);
      console.log(`🔒 Security middleware enabled`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('===========================================');
    });
  } catch (error) {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
