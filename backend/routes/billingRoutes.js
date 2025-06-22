const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/billingController');
const authMiddleware = require('../middleware/authMiddleware');

// Route untuk mendapatkan daftar pasien berdasarkan tanggal
router.get('/patients', authMiddleware, (req, res, next) => pharmacyController.getPatients(req, res).catch(next));

// Route untuk mendapatkan daftar obat
router.get('/medicines', authMiddleware, (req, res, next) => pharmacyController.getMedicines(req, res).catch(next));

// Route untuk mencari obat (dropdown search) - temporarily without auth for testing
router.get('/medicines/search', (req, res, next) => pharmacyController.searchMedicines(req, res).catch(next));

// Route untuk mendapatkan data obat kunjungan
router.get('/visit/:visitId/medications', authMiddleware, (req, res, next) => pharmacyController.getVisitMedications(req, res).catch(next));

// Route untuk mendapatkan data vital pasien
router.get('/visit/:visitId/vitals', authMiddleware, (req, res, next) => pharmacyController.getVisitVitals(req, res).catch(next));

// Route untuk mendapatkan data appointment dari visit
router.get('/visit/:visitId/appointment', authMiddleware, (req, res, next) => pharmacyController.getVisitAppointment(req, res).catch(next));

// Route untuk menambah obat kunjungan
router.post('/visit_medication', authMiddleware, (req, res, next) => pharmacyController.addVisitMedication(req, res).catch(next));

// Route untuk menyimpan perubahan data obat kunjungan
router.post('/visit/:visitId/medications', authMiddleware, (req, res, next) => pharmacyController.saveVisitMedications(req, res).catch(next));

// Route untuk memproses obat (update dan tambah)
router.post('/process-medications', authMiddleware, (req, res, next) => pharmacyController.processMedications(req, res).catch(next));

// Payments
router.get('/payments', authMiddleware, (req, res, next) => pharmacyController.getPayments(req, res).catch(next));
router.post('/payments/pay', authMiddleware, (req, res, next) => pharmacyController.processPayment(req, res).catch(next));
router.post('/payments/:paymentId/activate', authMiddleware, (req, res, next) => pharmacyController.activatePayment(req, res).catch(next));
router.post('/payments/:paymentId/close', authMiddleware, (req, res, next) => pharmacyController.closePayment(req, res).catch(next));
router.post('/payments/:paymentId/reset', authMiddleware, (req, res, next) => pharmacyController.resetPayment(req, res).catch(next));

module.exports = router;