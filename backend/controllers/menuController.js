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
      console.log(`Fetching menus for user ID ${userId} with role ID ${roleId}`);
      
      // Cek apakah tabel sys_role_menu_privilege ada
      const [tableCheck] = await pool.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = DATABASE() AND table_name = 'sys_role_menu_privilege'`
      );
      
      const tableExists = tableCheck[0].count > 0;
      console.log(`Table sys_role_menu_privilege exists: ${tableExists}`);
      
      let menuData = [];
      
      if (tableExists) {
        try {
          // Coba pendekatan sederhana tanpa recursive CTE
          console.log('Trying simple approach without recursive CTE');
          
          // 1. Ambil parent menu
          const [parentMenus] = await pool.query(`
            SELECT m.id, m.menu_name, m.menu_path, m.icon, m.parent_id, m.order_number
            FROM sys_menu m
            JOIN sys_role_menu_privilege rmp ON m.id = rmp.menu_id
            WHERE rmp.role_id = ? 
            AND rmp.can_view = 1
            AND m.parent_id IS NULL
            ORDER BY m.order_number
          `, [roleId]);
          
          console.log(`Found ${parentMenus.length} parent menus`);
          
          // 2. Untuk setiap parent, ambil child-nya
          for (const menu of parentMenus) {
            const [children] = await pool.query(`
              SELECT m.id, m.menu_name, m.menu_path, m.icon, m.order_number
              FROM sys_menu m
              JOIN sys_role_menu_privilege rmp ON m.id = rmp.menu_id
              WHERE rmp.role_id = ?
              AND rmp.can_view = 1
              AND m.parent_id = ?
              ORDER BY m.order_number
            `, [roleId, menu.id]);
            
            menu.children = children || [];
          }
          
          menuData = parentMenus;
        } catch (error) {
          console.error('Error in simple menu query:', error);
          
          // Fallback ke query yang lebih sederhana lagi
          console.log('Falling back to even simpler query');
          const [allMenus] = await pool.query(`
            SELECT m.id, m.menu_name, m.menu_path, m.icon, m.parent_id, m.order_number
            FROM sys_menu m
            JOIN sys_role_menu_privilege rmp ON m.id = rmp.menu_id
            WHERE rmp.role_id = ? 
            AND rmp.can_view = 1
            ORDER BY m.order_number
          `, [roleId]);
          
          // Buat struktur hierarki secara manual
          const menuMap = {};
          const rootMenus = [];
          
          // Pertama, buat map dari semua menu
          allMenus.forEach(menu => {
            menuMap[menu.id] = {
              ...menu,
              children: []
            };
          });
          
          // Kemudian, susun hierarki
          allMenus.forEach(menu => {
            if (menu.parent_id === null) {
              rootMenus.push(menuMap[menu.id]);
            } else if (menuMap[menu.parent_id]) {
              menuMap[menu.parent_id].children.push(menuMap[menu.id]);
            }
          });
          
          menuData = rootMenus;
        }
      } else {
        // Gunakan sys_role_privilege jika sys_role_menu_privilege tidak ada
        console.log('Using sys_role_privilege table as fallback');
        const [menuRows] = await pool.query(`
          SELECT m.id, m.menu_name, m.menu_path, m.icon, m.parent_id, m.order_number
          FROM sys_menu m
          LEFT JOIN sys_role_privilege rp ON m.id = rp.menu_id
          WHERE rp.role_id = ? AND rp.can_view = 1
          ORDER BY m.order_number
        `, [roleId]);
        
        // Buat struktur hierarki secara manual
        const menuMap = {};
        const rootMenus = [];
        
        // Pertama, buat map dari semua menu
        menuRows.forEach(menu => {
          menuMap[menu.id] = {
            ...menu,
            children: []
          };
        });
        
        // Kemudian, susun hierarki
        menuRows.forEach(menu => {
          if (menu.parent_id === null) {
            rootMenus.push(menuMap[menu.id]);
          } else if (menuMap[menu.parent_id]) {
            menuMap[menu.parent_id].children.push(menuMap[menu.id]);
          }
        });
        
        menuData = rootMenus;
      }
      
      console.log(`Successfully fetched ${menuData.length} menu items`);
      
      res.json({
        status: 'success',
        data: menuData
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