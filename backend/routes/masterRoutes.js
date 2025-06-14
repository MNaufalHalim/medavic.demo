const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const authMiddleware = require('../middleware/authMiddleware');

//Pasien
router.get('/patients', authMiddleware, masterController.getAllPatients);
router.get('/patients/search', authMiddleware, masterController.searchPatients);
router.put('/patients/:no_rm', authMiddleware, masterController.updatePatient);

//Doctor
router.get('/doctors/', authMiddleware, masterController.getAllDoctors);
router.post('/doctors/', authMiddleware, masterController.createDoctor);
router.put('/doctors/:id', authMiddleware, masterController.updateDoctor);
router.delete('/doctors/:id', authMiddleware, masterController.deleteDoctor);

//Doctor Schedule
router.get('/doctor-schedules', authMiddleware, masterController.getDoctorSchedules);
router.post('/doctor-schedules', authMiddleware, masterController.createDoctorSchedule);
router.put('/doctor-schedules/:id', authMiddleware, masterController.updateDoctorSchedule);
router.delete('/doctor-schedules/:id', authMiddleware, masterController.deleteDoctorSchedule);

//Obat (Medicines)
router.get('/medicines', authMiddleware, masterController.getAllMedicines);
router.post('/medicines', authMiddleware, masterController.createMedicine);
router.put('/medicines/:id', authMiddleware, masterController.updateMedicine);
router.delete('/medicines/:id', authMiddleware, masterController.deleteMedicine);

module.exports = router;