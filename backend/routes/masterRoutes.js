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

// Services (Tindakan)
router.get('/services', authMiddleware, masterController.getAllServices);
router.post('/services', authMiddleware, masterController.createService);
router.put('/services/:id', authMiddleware, masterController.updateService);
router.delete('/services/:id', authMiddleware, masterController.deleteService);

// Polyclinic (Poli)
router.get('/polyclinics', authMiddleware, masterController.getAllPolyclinics);
router.post('/polyclinics', authMiddleware, masterController.createPolyclinic);
router.put('/polyclinics/:id', authMiddleware, masterController.updatePolyclinic);
router.delete('/polyclinics/:id', authMiddleware, masterController.deletePolyclinic);

module.exports = router;