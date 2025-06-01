const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validation');
const schemas = require('../schemas/validation');

router.get('/', authMiddleware, roleController.getAllRoles);
router.post('/', authMiddleware, validateRequest(schemas.role.create), roleController.createRole);
router.put('/:id', authMiddleware, validateRequest(schemas.role.update), roleController.updateRole);
router.delete('/:id', authMiddleware, roleController.deleteRole);
router.get('/:id/privilege', authMiddleware, roleController.getRolePrivileges);
router.post('/:id/privilege', authMiddleware, validateRequest(schemas.role.privileges), roleController.updateRolePrivileges);

module.exports = router;