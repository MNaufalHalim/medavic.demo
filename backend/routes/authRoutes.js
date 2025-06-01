const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');

router.post('/login', authController.login);
// Removed register route since it's not implemented yet

module.exports = router;