const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function createInitialData() {
  try {
    // Buat user admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const [userResult] = await pool.query(`
      INSERT INTO sys_user (
        username, 
        password, 
        full_name, 
        role_id, 
        is_active,
        created_at,
        delt_flg
      ) VALUES (
        'admin',
        ?,
        'Administrator',
        1,
        1,
        NOW(),
        'N'
      ) ON DUPLICATE KEY UPDATE id=id
    `, [hashedPassword]);

    // Set privilege untuk super admin (role_id = 1)
    const [menus] = await pool.query('SELECT id FROM sys_menu');
    for (const menu of menus) {
      await pool.query(`
        INSERT INTO sys_role_menu_privilege 
        (role_id, menu_id, can_view, can_create, can_edit, can_delete, can_access)
        VALUES (1, ?, 1, 1, 1, 1, 1)
        ON DUPLICATE KEY UPDATE 
          can_view = 1,
          can_create = 1,
          can_edit = 1,
          can_delete = 1,
          can_access = 1
      `, [menu.id]);
    }

    console.log('Data awal berhasil dibuat');
    process.exit(0);
  } catch (error) {
    console.error('Error membuat data awal:', error);
    process.exit(1);
  }
}

// Jalankan fungsi
createInitialData();