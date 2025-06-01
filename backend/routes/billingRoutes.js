const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/billingController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/patients', authMiddleware, (req, res, next) => pharmacyController.getPatients(req, res).catch(next));
router.get('/medicines', authMiddleware, (req, res, next) => pharmacyController.getMedicines(req, res).catch(next));
router.get('/visit/:visitId/medications', authMiddleware, (req, res, next) => pharmacyController.getVisitMedications(req, res).catch(next));
router.post('/visit_medication', authMiddleware, (req, res, next) => pharmacyController.addVisitMedication(req, res).catch(next));
router.post('/visit/:visitId/medications', authMiddleware, (req, res, next) => pharmacyController.saveVisitMedications(req, res).catch(next));

module.exports = router;