const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username });

    // Check if username and password are provided
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan Password harus diisi'
      });
    }

    // First, check if the user exists and get their data
    const [users] = await pool.query(
      'SELECT u.id, u.username, u.password, u.full_name, u.role_id, r.role_name FROM sys_user u LEFT JOIN sys_role r ON u.role_id = r.id WHERE u.username = ? LIMIT 1',
      [username]
    ).catch(err => {
      console.error('Database query error:', err);
      throw new Error('Database error when fetching user');
    });

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username atau Password salah'
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password).catch(err => {
      console.error('Password comparison error:', err);
      throw new Error('Error validating password');
    });

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Username atau Password salah'
      });
    }

    // Get user menu privileges with error handling
    const [menus] = await pool.query(
      `SELECT DISTINCT m.id, m.menu_name, m.menu_path, m.parent_id, m.icon, m.order_number
       FROM sys_menu m
       INNER JOIN sys_role_menu_privilege rmp ON m.id = rmp.menu_id
       WHERE rmp.role_id = ? AND rmp.can_view = true
       ORDER BY m.order_number ASC`,
      [user.role_id]
    ).catch(err => {
      console.error('Menu query error:', err);
      throw new Error('Error fetching user menus');
    });

    // Create token with error handling
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role_id: user.role_id,
        role_name: user.role_name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove sensitive data
    delete user.password;

    // Send successful response
    return res.json({
      success: true,
      data: {
        token,
        user,
        menus: menus || [] // Ensure menus is always an array
      }
    });

  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    // Send appropriate error message
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server. Silakan coba lagi.'
    });
  }
};

module.exports = {
  login
};