const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/search', authMiddleware, patientController.searchPatients);
router.post('/register', authMiddleware, patientController.registerPatient);
router.get('/appointments', patientController.getAppointments);
router.post('/appointments', authMiddleware, patientController.createAppointment);
router.put('/appointments/:id', authMiddleware, patientController.updateAppointment);
router.delete('/appointments/:id', authMiddleware, patientController.deleteAppointment);

module.exports = router;