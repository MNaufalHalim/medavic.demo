const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validation');
const schemas = require('../schemas/validation');

// Import controllers
const userController = require('../controllers/userController');
const menuController = require('../controllers/menuController');
const roleController = require('../controllers/roleController');
const patientController = require('../controllers/patientController');
const doctorController = require('../controllers/masterController'); // Tambahkan ini
const billingController = require('../controllers/billingController'); // Tambahkan ini

// Auth routes
router.use('/auth', require('./authroutes'));

// Protected routes
router.use(authMiddleware);

// User routes
router.use('/users', require('./userroutes'));

// Menu routes
router.use('/menus', require('./menuRoutes'));

// Role routes 
router.use('/roles', require('./roleroutes'));

// Patient routes
router.use('/patients', require('./patientRoutes'));

// Appointment routes
router.use('/rm', require('./rmRoutes'));

// Doctor routes
router.use('/master', require('./masterRoutes')); // Tambahkan ini

// Mecial Record routes
router.use('/medical', require('./medicalRoutes')); // Tambahkan ini

router.use('/billing', require('./billingRoutes')); // Tambahkan ini

module.exports = router;