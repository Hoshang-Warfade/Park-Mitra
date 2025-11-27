require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import database configuration
const { initializeDatabase, closeDatabase } = require('./backend/config/db');

// Import routes
const authRoutes = require('./backend/routes/auth');
const bookingRoutes = require('./backend/routes/bookings');
const organizationRoutes = require('./backend/routes/organizations');
const watchmanRoutes = require('./backend/routes/watchmen');
const paymentRoutes = require('./backend/routes/payments');
const informalParkingRoutes = require('./backend/routes/informal-parking');
const parkingLotRoutes = require('./backend/routes/parking-lots');

// Import middleware
const errorHandler = require('./backend/middleware/errorHandler');
const requestLogger = require('./backend/middleware/logger');
const { createRateLimiter, rateLimiters } = require('./backend/middleware/rateLimiter');
const securityHeaders = require('./backend/middleware/securityHeaders');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Order matters!
// 1. Security headers (first)
app.use(securityHeaders);

// 2. Configure CORS to allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Body parser middleware with 10mb limit
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 4. Request logging (after body parser)
app.use(requestLogger);

// 5. General API rate limiter
app.use('/api/', rateLimiters.general);

// API Routes with specific rate limiters
app.use('/api/auth', rateLimiters.auth, authRoutes);
app.use('/api/bookings', rateLimiters.booking, bookingRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/watchmen', watchmanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/informal-parking', informalParkingRoutes);
app.use('/api/parking-lots', parkingLotRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ParkMitra API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  });
}

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('='.repeat(60));
    console.log('🚀 ParkMitra Server Initialization');
    console.log('='.repeat(60));
    
    // Initialize database
    console.log('\n📊 Initializing database...');
    await initializeDatabase();
    console.log('✓ Database initialized successfully');
    
    // Start Express server
    console.log('\n🌐 Starting Express server...');
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log(`✓ ParkMitra API Server is running`);
      console.log(`✓ Port: ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`✓ API Base: http://localhost:${PORT}/api`);
      console.log(`✓ Health Check: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(60));
      console.log('\n📋 Available Routes:');
      console.log('  • POST   /api/auth/register');
      console.log('  • POST   /api/auth/login');
      console.log('  • GET    /api/bookings');
      console.log('  • GET    /api/organizations');
      console.log('  • GET    /api/parking-lots');
      console.log('  • GET    /api/watchmen');
      console.log('  • POST   /api/payments');
      console.log('  • GET    /api/informal-parking');
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n\n⚠️  Received ${signal} signal, shutting down gracefully...`);
  
  try {
    await closeDatabase();
    console.log('✓ Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n' + '='.repeat(60));
  console.error('❌ UNCAUGHT EXCEPTION - System will shut down');
  console.error('='.repeat(60));
  console.error('Error:', error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', error.stack);
  }
  console.error('='.repeat(60));
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n' + '='.repeat(60));
  console.error('❌ UNHANDLED PROMISE REJECTION - System will shut down');
  console.error('='.repeat(60));
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('='.repeat(60));
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

module.exports = app;
