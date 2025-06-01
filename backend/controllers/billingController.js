const { pool } = require('../config/db');

exports.getPatients = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    if (isNaN(new Date(queryDate))) {
      return res.status(400).json({ success: false, message: 'Tanggal tidak valid' });
    }

    const [visits] = await pool.query(
      'SELECT v.visit_id, v.visit_date, d.name AS doctor_name FROM visits v LEFT JOIN doctors d ON v.doctor_id = d.id WHERE DATE(v.visit_date) = ?',
      [queryDate]
    );

    if (!visits.length) {
      return res.json({ success: true, data: [] });
    }

    const patientIds = visits.map(v => v.visit_id);
    const [patients] = await pool.query(
      'SELECT p.no_rm, p.nama_lengkap, v.visit_id FROM pasien p JOIN visits v ON p.no_rm = v.patient_id WHERE v.visit_id IN (?) ORDER BY p.nama_lengkap ASC',
      [patientIds]
    );

    const result = patients.map(p => {
      const visit = visits.find(v => v.visit_id === p.visit_id);
      return { ...p, doctor_name: visit.doctor_name, visit_date: visit.visit_date };
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(200).json({ success: true, data: [], message: 'Tidak ada data pasien untuk tanggal ini' });
  }
};

exports.getMedicines = async (req, res) => {
  try {
    const [medicines] = await pool.query(
      'SELECT id, name, stock FROM medicines WHERE delt_flg = "N" ORDER BY name ASC'
    );
    return res.json({ success: true, data: medicines });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return res.status(200).json({ success: true, data: [], message: 'Tidak ada data obat tersedia' });
  }
};

exports.getVisitMedications = async (req, res) => {
  try {
    const { visitId } = req.params;
    if (!visitId) {
      return res.status(400).json({ success: false, message: 'Visit ID diperlukan' });
    }

    const [visit] = await pool.query(
      'SELECT v.visit_id, v.patient_id, p.no_rm, p.nama_lengkap FROM visits v JOIN pasien p ON v.patient_id = p.no_rm WHERE v.visit_id = ? LIMIT 1',
      [visitId]
    );
    if (!visit.length) {
      return res.status(404).json({ success: false, message: 'Kunjungan tidak ditemukan' });
    }

    const [visitMedications] = await pool.query(
      `SELECT vm.id, m.name AS medicine_name, vm.dosage, vm.frequency, vm.duration, vm.quantity, m.stock, vm.status
       FROM visit_medications vm
       JOIN medicines m ON vm.medicine_id = m.id
       WHERE vm.visit_id = ? AND vm.status IN ('pending', 'processed')
       ORDER BY vm.created_at DESC`,
      [visitId]
    );

    return res.json({
      success: true,
      patient: visit[0],
      medications: visitMedications || [],
    });
  } catch (error) {
    console.error('Error fetching visit medications:', error);
    return res.status(200).json({
      success: true,
      patient: null,
      medications: [],
      message: 'Tidak ada data obat untuk kunjungan ini'
    });
  }
};

exports.addVisitMedication = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { visit_id, medicine_id, dosage, frequency, duration } = req.body;
    if (!visit_id || !medicine_id || !dosage || !frequency || !duration) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }

    const [visit] = await connection.query('SELECT patient_id FROM visits WHERE visit_id = ?', [visit_id]);
    if (!visit.length) {
      return res.status(404).json({ success: false, message: 'Visit ID tidak valid' });
    }

    const [medicine] = await connection.query('SELECT stock FROM medicines WHERE id = ? AND delt_flg = "N"', [medicine_id]);
    if (!medicine.length) {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    }

    const frequencyNum = parseInt(frequency.split('x')[0]) || 1;
    const durationNum = parseInt(duration) || 1;
    const quantity = frequencyNum * durationNum;

    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO visit_medications (visit_id, medicine_id, dosage, frequency, duration, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [visit_id, medicine_id, dosage, frequency, duration, quantity]
    );
    await connection.commit();

    return res.json({ success: true, message: 'Obat ditambahkan oleh dokter', id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding visit medication:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal menambah obat' });
  } finally {
    connection.release();
  }
};

exports.saveVisitMedications = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { visitId } = req.params;
    const { medications } = req.body;

    if (!visitId || !medications || !Array.isArray(medications)) {
      return res.status(400).json({ success: false, message: 'Visit ID dan daftar obat diperlukan' });
    }

    await connection.beginTransaction();

    // Ambil data asli dari database
    const [originalMeds] = await connection.query(
      `SELECT id, medicine_id, dosage, frequency, duration, quantity, status
       FROM visit_medications
       WHERE visit_id = ? AND status IN ('pending', 'processed')`,
      [visitId]
    );

    // Tentukan obat yang akan dihapus (tidak ada di daftar yang dikirim)
    const sentMedIds = medications.filter(m => m.id).map(m => m.id);
    const medsToDelete = originalMeds.filter(om => !sentMedIds.includes(om.id)).map(om => om.id);

    if (medsToDelete.length > 0) {
      const deletePlaceholders = medsToDelete.map(() => '?').join(',');
      await connection.query(
        `DELETE FROM visit_medications WHERE visit_id = ? AND id IN (${deletePlaceholders})`,
        [visitId, ...medsToDelete]
      );
    }

    // Proses update dan insert
    for (const med of medications) {
      if (med.id) {
        // Update obat yang sudah ada: sync all fields
        await connection.query(
          'UPDATE visit_medications SET dosage = ?, frequency = ?, duration = ?, quantity = ?, status = ?, updated_at = NOW() WHERE id = ? AND visit_id = ?',
          [med.dosage, med.frequency, med.duration, med.quantity, med.status || 'processed', med.id, visitId]
        );
      } else {
        // Insert obat baru
        await connection.query(
          'INSERT INTO visit_medications (visit_id, medicine_id, dosage, frequency, duration, quantity, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
          [visitId, med.medicine_id, med.dosage, med.frequency, med.duration, med.quantity, med.status || 'processed']
        );
      }
    }

    await connection.commit();

    // Ambil data terbaru untuk dikembalikan ke frontend
    const [updatedMedications] = await connection.query(
      `SELECT vm.id, m.name AS medicine_name, vm.dosage, vm.frequency, vm.duration, vm.quantity, m.stock, vm.status
       FROM visit_medications vm
       JOIN medicines m ON vm.medicine_id = m.id
       WHERE vm.visit_id = ? AND vm.status IN ('pending', 'processed')
       ORDER BY vm.created_at DESC`,
      [visitId]
    );
    const [patient] = await connection.query(
      'SELECT v.visit_id, v.patient_id, p.no_rm, p.nama_lengkap FROM visits v JOIN pasien p ON v.patient_id = p.no_rm WHERE v.visit_id = ? LIMIT 1',
      [visitId]
    );

    return res.json({
      success: true,
      message: 'Data obat berhasil disimpan',
      patient: patient[0],
      medications: updatedMedications,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving visit medications:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal menyimpan data obat' });
  } finally {
    connection.release();
  }
};