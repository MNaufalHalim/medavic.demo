const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/billingController');
const authMiddleware = require('../middleware/authMiddleware');

// Route untuk mendapatkan daftar pasien berdasarkan tanggal
router.get('/patients', authMiddleware, (req, res, next) => pharmacyController.getPatients(req, res).catch(next));

// Route untuk mendapatkan daftar obat
router.get('/medicines', authMiddleware, (req, res, next) => pharmacyController.getMedicines(req, res).catch(next));

// Route untuk mendapatkan data obat kunjungan
router.get('/visit/:visitId/medications', authMiddleware, (req, res, next) => pharmacyController.getVisitMedications(req, res).catch(next));

// Route untuk menambah obat kunjungan
router.post('/visit_medication', authMiddleware, (req, res, next) => pharmacyController.addVisitMedication(req, res).catch(next));

// Route untuk menyimpan perubahan data obat kunjungan
router.post('/visit/:visitId/medications', authMiddleware, (req, res, next) => pharmacyController.saveVisitMedications(req, res).catch(next));

module.exports = router;