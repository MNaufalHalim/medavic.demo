const express = require('express');
const router = express.Router();
const medicalController = require('../controllers/medicalController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit'
});

router.get('/patients', authMiddleware, apiLimiter, medicalController.getAllPatients);
router.get('/patients/search', authMiddleware, apiLimiter, medicalController.searchPatients);
router.get('/patients/:id', authMiddleware, apiLimiter, medicalController.getPatientById);
router.get('/patients/:no_rm/combined-data', authMiddleware, apiLimiter, medicalController.getCombinedPatientData);
router.get('/patients/:id/vitals', authMiddleware, apiLimiter, medicalController.getPatientVitals);
router.get('/patients/:no_rm/visits', authMiddleware, apiLimiter, medicalController.getPatientVisitHistory);
router.post('/patients/waiting', authMiddleware, apiLimiter, medicalController.getWaitingPatients);
router.get('/patients/:no_rm/current-visit', authMiddleware, apiLimiter, medicalController.getCurrentVisitMedicalRecord);
router.post('/editvitals', authMiddleware, apiLimiter, medicalController.editVitals);

router.get('/procedures/search', authMiddleware, apiLimiter, medicalController.searchProcedure);
router.get('/medications/search', authMiddleware, apiLimiter, medicalController.searchMedication);
router.get('/medication-presets/:medicationId', authMiddleware, apiLimiter, medicalController.getMedicationPresets);
router.get('/diagnoses/search', authMiddleware, apiLimiter, medicalController.searchDiagnose);
router.post('/visit-procedures', authMiddleware, apiLimiter, medicalController.updateVisitProcedures);
router.post('/visit-medications', authMiddleware, apiLimiter, medicalController.updateVisitMedications);
router.post('/visit-diagnoses', authMiddleware, apiLimiter, medicalController.updateVisitDiagnoses);

module.exports = router;