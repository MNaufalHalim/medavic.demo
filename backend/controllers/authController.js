const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const login = async (req, res) => {
  // Set a response timeout to prevent hanging requests
  let isResponseSent = false;
  const loginTimeout = setTimeout(() => {
    if (!isResponseSent) {
      isResponseSent = true;
      console.error('Login request timed out');
      return res.status(503).json({
        success: false,
        message: 'Permintaan login memakan waktu terlalu lama. Silakan coba lagi.'
      });
    }
  }, 15000); // 15 second timeout

  try {
    console.log('Login request received:', new Date().toISOString());
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username });

    // Check if username and password are provided
    if (!username || !password) {
      clearTimeout(loginTimeout);
      isResponseSent = true;
      return res.status(400).json({
        success: false,
        message: 'Username dan Password harus diisi'
      });
    }

    // First, check if the user exists and get their data
    console.log('Querying database for user:', new Date().toISOString());
    let users;
    try {
      [users] = await pool.query(
        'SELECT u.id, u.username, u.password, u.full_name, u.role_id, r.role_name FROM sys_user u LEFT JOIN sys_role r ON u.role_id = r.id WHERE u.username = ? LIMIT 1',
        [username]
      );
      console.log('User query completed:', new Date().toISOString());
    } catch (err) {
      console.error('Database query error:', err);
      throw new Error(`Database error when fetching user: ${err.message}`);
    }

    if (!users || users.length === 0) {
      clearTimeout(loginTimeout);
      isResponseSent = true;
      return res.status(401).json({
        success: false,
        message: 'Username atau Password salah'
      });
    }

    const user = users[0];

    // Verify password
    console.log('Verifying password:', new Date().toISOString());
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password verification completed:', new Date().toISOString());
    } catch (err) {
      console.error('Password comparison error:', err);
      throw new Error(`Error validating password: ${err.message}`);
    }

    if (!isValidPassword) {
      clearTimeout(loginTimeout);
      isResponseSent = true;
      return res.status(401).json({
        success: false,
        message: 'Username atau Password salah'
      });
    }

    // Get user menu privileges with error handling
    console.log('Fetching user menus:', new Date().toISOString());
    let menus = [];
    try {
      // Periksa apakah tabel sys_role_menu_privilege ada
      const [tableCheck] = await pool.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = DATABASE() AND table_name = 'sys_role_menu_privilege'`
      );
      
      const tableExists = tableCheck[0].count > 0;
      console.log(`Table sys_role_menu_privilege exists: ${tableExists}`);
      
      if (tableExists) {
        // Gunakan query yang lebih sederhana dan robust
        const [menuResults] = await pool.query(
          `SELECT DISTINCT m.id, m.menu_name, m.menu_path, m.parent_id, m.icon, m.order_number
           FROM sys_menu m
           INNER JOIN sys_role_menu_privilege rmp ON m.id = rmp.menu_id
           WHERE rmp.role_id = ? AND rmp.can_view = 1
           ORDER BY COALESCE(m.parent_id, m.id), m.order_number`,
          [user.role_id]
        );
        
        // Proses menu untuk membuat struktur hierarki
        const menuMap = {};
        const rootMenus = [];
        
        // Pertama, buat map dari semua menu
        menuResults.forEach(menu => {
          menuMap[menu.id] = {
            ...menu,
            children: []
          };
        });
        
        // Kemudian, susun hierarki
        menuResults.forEach(menu => {
          if (menu.parent_id === null) {
            rootMenus.push(menuMap[menu.id]);
          } else if (menuMap[menu.parent_id]) {
            menuMap[menu.parent_id].children.push(menuMap[menu.id]);
          }
        });
        
        menus = rootMenus;
      } else {
        // Fallback ke query lama jika tabel tidak ada
        const [menuResults] = await pool.query(
          `SELECT DISTINCT m.id, m.menu_name, m.menu_path, m.parent_id, m.icon, m.order_number
           FROM sys_menu m
           LEFT JOIN sys_role_privilege rp ON m.id = rp.menu_id
           WHERE rp.role_id = ? AND rp.can_view = 1
           ORDER BY m.order_number ASC`,
          [user.role_id]
        );
        menus = menuResults || [];
      }
      
      console.log(`Menu query completed, found ${menus.length} root menus:`, new Date().toISOString());
    } catch (err) {
      console.error('Menu query error:', err);
      // Log detail error untuk debugging
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage
      });
      // Don't throw here, continue with empty menus
      console.warn('Continuing login process with empty menus');
    }

    // Create token with error handling
    console.log('Generating JWT token:', new Date().toISOString());
    let token;
    try {
      token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role_id: user.role_id,
          role_name: user.role_name 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log('Token generation completed:', new Date().toISOString());
    } catch (err) {
      console.error('JWT signing error:', err);
      throw new Error(`Error creating authentication token: ${err.message}`);
    }

    // Remove sensitive data
    delete user.password;

    // Send successful response
    clearTimeout(loginTimeout);
    isResponseSent = true;
    console.log('Login successful, sending response:', new Date().toISOString());
    return res.json({
      success: true,
      data: {
        token,
        user,
        menus
      }
    });

  } catch (error) {
    clearTimeout(loginTimeout);
    if (!isResponseSent) {
      isResponseSent = true;
      console.error('Login error details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        time: new Date().toISOString()
      });

      // Send appropriate error message
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server. Silakan coba lagi.'
      });
    }
  }
};

module.exports = {
  login
};