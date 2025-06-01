const { pool } = require('../config/db');

const menuController = {
  getAllMenus: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          m.id,
          m.menu_name,
          m.menu_path,
          m.icon,
          m.parent_id,
          m.order_number
        FROM sys_menu m
        WHERE m.delt_flg = 'N'
        ORDER BY COALESCE(m.parent_id, m.id), m.order_number
      `);

      res.json({
        status: 'success',
        data: rows
      });
    } catch (error) {
      console.error('Error in getAllMenus:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to fetch menus'
      });
    }
  },

  getUserMenus: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user's role_id first
      const [userRows] = await pool.query(
        'SELECT role_id FROM sys_user WHERE id = ?',
        [userId]
      );

      if (!userRows.length) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      const roleId = userRows[0].role_id;

      const [menuRows] = await pool.query(`
        WITH RECURSIVE menu_hierarchy AS (
          -- Ambil parent menu yang memiliki child dengan akses
          SELECT DISTINCT m.id, m.menu_name, m.menu_path, m.icon, m.parent_id, m.order_number
          FROM sys_menu m
          WHERE m.parent_id IS NULL 
          AND EXISTS (
            SELECT 1
            FROM sys_menu sm
            JOIN sys_role_menu_privilege rmp ON rmp.menu_id = sm.id
            WHERE sm.parent_id = m.id
            AND rmp.role_id = ?
            AND rmp.can_view = 1
          )
          
          UNION ALL
          
          -- Ambil child menu yang memiliki akses
          SELECT sm.id, sm.menu_name, sm.menu_path, sm.icon, sm.parent_id, sm.order_number
          FROM sys_menu sm
          JOIN sys_role_menu_privilege rmp ON rmp.menu_id = sm.id
          WHERE rmp.role_id = ?
          AND rmp.can_view = 1
        )
        SELECT 
          m.id,
          m.menu_name,
          m.menu_path,
          m.icon,
          m.parent_id,
          m.order_number,
          COALESCE(JSON_ARRAYAGG(
            CASE 
              WHEN c.id IS NOT NULL THEN
                JSON_OBJECT(
                  'id', c.id,
                  'menu_name', c.menu_name,
                  'menu_path', c.menu_path,
                  'icon', c.icon
                )
              ELSE NULL
            END
          ), '[]') as children
        FROM menu_hierarchy m
        LEFT JOIN menu_hierarchy c ON c.parent_id = m.id
        WHERE m.parent_id IS NULL
        GROUP BY m.id, m.menu_name, m.menu_path, m.icon, m.parent_id, m.order_number
        ORDER BY m.order_number;
      `, [roleId, roleId]);

      // Process the menu rows
      const processedMenus = menuRows.map(menu => ({
        ...menu,
        children: JSON.parse(menu.children)
      }));

      res.json({
        status: 'success',
        data: processedMenus
      });
    } catch (error) {
      console.error('Error fetching user menus:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user menus'
      });
    }
  }
};

module.exports = menuController;