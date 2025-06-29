const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { initializeDatabase } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Security - configure Helmet to not interfere with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  contentSecurityPolicy: false
}));

// Configure CORS to allow all requests during development
app.use(cors({
  origin: '*', // Allow all origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add explicit CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100 // limit setiap IP ke 100 request per windowMs
});
app.use(limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Railway
app.get('/', (req, res) => {
  res.status(200).send('Health check passed - MEDAVIC API is running');
});

// Routes
app.use('/api', require('./routes'));

// Error handling
app.use(errorHandler);

// Database initialization
initializeDatabase()
  .then(() => {
    // Use PORT from environment variable (Railway sets this automatically)
    // or fallback to 5000 for local development
    const PORT = process.env.PORT || 5000;
    
    // Listen on all network interfaces (0.0.0.0) for compatibility with Railway
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server berjalan di port ${PORT} on 0.0.0.0`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('Gagal menginisialisasi database:', err);
    process.exit(1);
  });