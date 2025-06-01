const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Determine if we're in production (Railway) environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;

// Use production database credentials when in production
const dbConfig = isProduction ? {
  host: '44o1s.h.filess.io',
  port: 61002,
  user: 'medavic_excepthad',
  password: process.env.DB_PASSWORD || '********************', // Password should be set in Railway environment variables
  database: 'medavic_excepthad',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false // Sometimes needed for cloud database connections
  }
} : {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medavic',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig).promise(); // Add this to get promise-based queries

const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    
    // Log connection info for debugging (without sensitive data)
    console.log(`Connected to ${isProduction ? 'production' : 'development'} database at ${dbConfig.host}:${dbConfig.port || 3306}`);
    
    // Test the connection with a simple query
    const [result] = await connection.query('SELECT 1 as test');
    console.log('Database query test successful:', result);
    
    connection.release();
  } catch (error) {
    console.error('Database initialization error:', error);
    console.error('Connection config:', { 
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      // Don't log the password
    });
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase
};