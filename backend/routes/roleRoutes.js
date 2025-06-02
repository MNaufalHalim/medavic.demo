const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, roleController.getAllRoles);
router.post('/', authMiddleware, roleController.createRole);
router.put('/:id', authMiddleware, roleController.updateRole);
router.delete('/:id', authMiddleware, roleController.deleteRole);
router.get('/:id/privilege', authMiddleware, roleController.getRolePrivileges);
router.post('/:id/privilege', authMiddleware, roleController.updateRolePrivileges);

module.exports = router;