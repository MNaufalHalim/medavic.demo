const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { initializeDatabase } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Security
app.use(helmet());
app.use(cors());

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

// Billing routes
const billingRoutes = require('./routes/billingRoutes');
app.use('/api/billing', billingRoutes);

// Error handling
app.use(errorHandler);

// Database initialization
initializeDatabase()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server berjalan di port ${PORT} on 0.0.0.0`);
    });
  })
  .catch(err => {
    console.error('Gagal menginisialisasi database:', err);
    process.exit(1);
  });