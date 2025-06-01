const { pool } = require('../config/db');

const roleController = {
  getAllRoles: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          r.id,
          r.role_name,
          r.description,
          r.is_system,
          r.delt_flg
        FROM sys_role r
        WHERE r.delt_flg = 'N'
        ORDER BY r.id
      `);

      res.json({
        status: 'success',
        data: rows
      });
    } catch (error) {
      console.error('Error in getAllRoles:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to fetch roles'
      });
    }
  },

  createRole: async (req, res) => {
    const { role_name, description } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO sys_role (role_name, description, delt_flg) VALUES (?, ?, ?)',
        [role_name, description, 'N']
      );
      
      res.status(201).json({
        status: 'success',
        data: { id: result.insertId, role_name, description, delt_flg: 'N' }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Failed to create role' });
    }
  },

  updateRole: async (req, res) => {
    const { id } = req.params;
    const { role_name, description } = req.body;
    try {
      const [result] = await pool.query(
        'UPDATE sys_role SET role_name = ?, description = ? WHERE id = ?',
        [role_name, description, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Role not found' });
      }
      
      res.json({
        status: 'success',
        message: 'Role updated successfully'
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Failed to update role' });
    }
  },

  deleteRole: async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await pool.query(
        'UPDATE sys_role SET delt_flg = ? WHERE id = ?',
        ['Y', id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Role not found' });
      }
      
      res.json({
        status: 'success',
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Failed to delete role' });
    }
  },

  getRolePrivileges: async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(`
        SELECT 
          rp.role_id,
          rp.menu_id,
          rp.can_view,
          rp.can_create,
          rp.can_edit,
          rp.can_delete,
          rp.can_access,
          m.menu_name,
          m.menu_path,
          m.icon,
          m.parent_id,
          m.order_number
        FROM sys_role_menu_privilege rp
        JOIN sys_menu m ON rp.menu_id = m.id
        WHERE rp.role_id = ?
      `, [id]);
      
      res.json({
        status: 'success',
        data: rows
      });
    } catch (error) {
      console.error('Error in getRolePrivileges:', error);
      res.status(500).json({ message: 'Failed to fetch role privileges' });
    }
  },

  updateRolePrivileges: async (req, res) => {
    try {
      const { id } = req.params;
      const { privileges } = req.body;
      
      await pool.query('START TRANSACTION');
      
      await pool.query('DELETE FROM sys_role_menu_privilege WHERE role_id = ?', [id]);
      
      for (const priv of privileges) {
        await pool.query(`
          INSERT INTO sys_role_menu_privilege 
          (role_id, menu_id, can_view, can_create, can_edit, can_delete, can_access) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [id, priv.menu_id, priv.can_view, priv.can_create, priv.can_edit, priv.can_delete, priv.can_access]);
      }
      
      await pool.query('COMMIT');
      
      res.json({
        status: 'success',
        message: 'Role privileges updated successfully'
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error in updateRolePrivileges:', error);
      res.status(500).json({ message: 'Failed to update role privileges' });
    }
  },
  
  getRoleMenus: async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(`
        SELECT DISTINCT
          m.*,
          COALESCE(rp.can_view, 0) as can_view,
          COALESCE(rp.can_create, 0) as can_create,
          COALESCE(rp.can_edit, 0) as can_edit,
          COALESCE(rp.can_delete, 0) as can_delete,
          COALESCE(rp.can_access, 0) as can_access
        FROM sys_menu m
        LEFT JOIN sys_role_menu_privilege rp ON m.id = rp.menu_id AND rp.role_id = ?
        ORDER BY COALESCE(m.parent_id, m.id), m.order_number
      `, [id]);
      
      // Transform into hierarchical structure
      const menuMap = {};
      const rootMenus = [];

      rows.forEach(menu => {
        menu.children = [];
        menuMap[menu.id] = menu;
      });

      rows.forEach(menu => {
        if (menu.parent_id === null) {
          rootMenus.push(menu);
        } else {
          const parent = menuMap[menu.parent_id];
          if (parent) {
            parent.children.push(menu);
          }
        }
      });

      res.json({
        status: 'success',
        data: rootMenus
      });
    } catch (error) {
      console.error('Error in getRoleMenus:', error);
      res.status(500).json({ message: 'Failed to fetch role menus' });
    }
  },
};

module.exports = roleController;