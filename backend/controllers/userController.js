const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const userController = {
  getAllUsers: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          u.id, 
          u.username, 
          u.full_name, 
          u.role_id, 
          r.role_name, 
          u.delt_flg,
          DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') as created_at
        FROM sys_user u
        LEFT JOIN sys_role r ON u.role_id = r.id
        ORDER BY u.id
      `);
  
      console.log('Database rows:', rows); // Debug log
  
      res.json({
        status: 'success',
        data: rows
      });
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users'
      });
    }
  },

  createUser: async (req, res) => {
    const { username, password, full_name, role_id } = req.body;
    try {
      // Check if username exists
      const [existing] = await pool.query('SELECT id FROM sys_user WHERE username = ?', [username]);
      if (existing.length > 0) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Username already exists' 
        });
      }

      // Hash the password before storing it
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const [result] = await pool.query(
        'INSERT INTO sys_user (username, password, full_name, role_id) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, full_name, role_id]
      );
      
      res.status(201).json({
        status: 'success',
        data: { id: result.insertId, username, full_name, role_id }
      });
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  },

  updateUser: async (req, res) => {
    const { id } = req.params;
    const { username, password, full_name, role_id } = req.body;
    try {
      let query, values;
      
      // Check if username exists for another user
      const [existing] = await pool.query('SELECT id FROM sys_user WHERE username = ? AND id != ?', [username, id]);
      if (existing.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Username already exists'
        });
      }
      
      if (password) {
        // Hash the password before storing it
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        query = 'UPDATE sys_user SET username = ?, password = ?, full_name = ?, role_id = ? WHERE id = ?';
        values = [username, hashedPassword, full_name, role_id, id];
      } else {
        query = 'UPDATE sys_user SET username = ?, full_name = ?, role_id = ? WHERE id = ?';
        values = [username, full_name, role_id, id];
      }

      const [result] = await pool.query(query, values);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        status: 'success',
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  },

  deleteUser: async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await pool.query(
        'UPDATE sys_user SET delt_flg = ? WHERE id = ?',
        ['Y', id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  },

  getUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(
        'SELECT r.* FROM sys_role r JOIN sys_user u ON r.id = u.role_id WHERE u.id = ?',
        [id]
      );
      res.json({
        status: 'success',
        data: rows[0] || null
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Failed to fetch user role' });
    }
  },

  setUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role_id } = req.body;
      const [result] = await pool.query(
        'UPDATE sys_user SET role_id = ? WHERE id = ?',
        [role_id, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({
        status: 'success',
        message: 'User role updated successfully'
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  },

  getUserMenus: async (req, res) => {
    try {
      const { role_id } = req.user;
      const [menus] = await pool.query(`
        SELECT m.*, rp.can_view, rp.can_create, rp.can_edit, rp.can_delete
        FROM sys_menu m
        LEFT JOIN sys_role_privilege rp ON m.id = rp.menu_id AND rp.role_id = ?
        WHERE m.delt_flg = 'N'
        ORDER BY COALESCE(m.parent_id, m.id), m.order_number
      `, [role_id]);
      
      res.json({
        status: 'success',
        data: menus
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Failed to fetch user menus' });
    }
  }
};

module.exports = userController;