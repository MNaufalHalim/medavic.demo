const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');
const authMiddleware = require('../middleware/authmiddleware');
const validateRequest = require('../middleware/validation');
const schemas = require('../schemas/validation');

router.get('/menus', authMiddleware, userController.getUserMenus);
router.get('/', authMiddleware, userController.getAllUsers);
router.post('/', authMiddleware, validateRequest(schemas.user.create), userController.createUser);
router.put('/:id', authMiddleware, validateRequest(schemas.user.update), userController.updateUser);
router.delete('/:id', authMiddleware, userController.deleteUser);
router.get('/:id/role', authMiddleware, userController.getUserRole);
router.post('/:id/role', authMiddleware, validateRequest(schemas.user.setRole), userController.setUserRole);

module.exports = router;