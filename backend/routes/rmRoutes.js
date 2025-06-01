const express = require('express');
const router = express.Router();
const patientController = require('../controllers/rmController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/search', authMiddleware, patientController.searchPatients);
router.post('/register', authMiddleware, patientController.registerPatient);
router.get('/appointments', authMiddleware, patientController.getAppointments);
router.post('/appointments', authMiddleware, patientController.createAppointment);
router.put('/appointments/:appointment_code', authMiddleware, patientController.updateAppointment);
router.delete('/appointments/:appointment_code', authMiddleware, patientController.deleteAppointment);

module.exports = router;