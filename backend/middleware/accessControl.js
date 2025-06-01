const { pool } = require('../config/db');

/**
 * Middleware untuk memeriksa hak akses pengguna berdasarkan menu dan operasi
 * @param {string} menuPath - Path menu yang diakses
 * @param {string} operation - Operasi yang dilakukan (view, create, edit, delete, access)
 * @returns {function} Middleware Express
 */
const checkAccess = (menuPath, operation) => {
  return async (req, res, next) => {
    try {
      // Pastikan user sudah terautentikasi dan memiliki role_id
      if (!req.user || !req.user.role_id) {
        return res.status(401).json({
          success: false,
          message: 'Tidak terautentikasi atau tidak memiliki role'
        });
      }

      const roleId = req.user.role_id;
      
      // Dapatkan ID menu berdasarkan path
      const [menuRows] = await pool.query(
        'SELECT id FROM sys_menu WHERE menu_path = ? LIMIT 1',
        [menuPath]
      );

      if (!menuRows || menuRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Menu tidak ditemukan'
        });
      }

      const menuId = menuRows[0].id;

      // Periksa hak akses berdasarkan operasi
      let accessColumn;
      switch (operation) {
        case 'view':
          accessColumn = 'can_view';
          break;
        case 'create':
          accessColumn = 'can_create';
          break;
        case 'edit':
          accessColumn = 'can_edit';
          break;
        case 'delete':
          accessColumn = 'can_delete';
          break;
        case 'access':
          accessColumn = 'can_access';
          break;
        default:
          accessColumn = 'can_view'; // Default ke view jika operasi tidak spesifik
      }

      // Periksa apakah pengguna memiliki hak akses untuk menu dan operasi tersebut
      const [privilegeRows] = await pool.query(
        `SELECT ${accessColumn} FROM sys_role_menu_privilege 
         WHERE role_id = ? AND menu_id = ? LIMIT 1`,
        [roleId, menuId]
      );

      if (!privilegeRows || privilegeRows.length === 0 || privilegeRows[0][accessColumn] !== 1) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki hak akses untuk operasi ini'
        });
      }

      // Jika memiliki akses, lanjutkan ke handler berikutnya
      next();
    } catch (error) {
      console.error('Error in access control middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memeriksa hak akses'
      });
    }
  };
};

module.exports = { checkAccess };