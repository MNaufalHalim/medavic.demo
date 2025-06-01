const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authMiddleware = require('../middleware/authMiddleware');

// Menu routes
router.get('/', authMiddleware, menuController.getAllMenus);
// Add this new route for user menus
router.get('/user', authMiddleware, menuController.getUserMenus);

module.exports = router;