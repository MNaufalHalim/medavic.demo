const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/menus', authMiddleware, userController.getUserMenus);
router.get('/', authMiddleware, userController.getAllUsers);
router.post('/', authMiddleware,  userController.createUser);
router.put('/:id', authMiddleware,  userController.updateUser);
router.delete('/:id', authMiddleware, userController.deleteUser);
router.get('/:id/role', authMiddleware, userController.getUserRole);
router.post('/:id/role', authMiddleware, userController.setUserRole);

module.exports = router;