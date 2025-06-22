const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authMiddleware = require('../middleware/authMiddleware');

// Menu routes
router.get('/', authMiddleware, menuController.getAllMenus);
// Add this new route for user menus
router.get('/user', authMiddleware, menuController.getUserMenus);
// CRUD Menu
router.post('/', authMiddleware, menuController.createMenu);
// Batch update menu (harus sebelum /:id)
router.put('/batch', authMiddleware, menuController.batchUpdateMenu);
router.put('/:id', authMiddleware, menuController.updateMenu);
router.delete('/:id', authMiddleware, menuController.deleteMenu);

module.exports = router;