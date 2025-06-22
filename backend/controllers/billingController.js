const { pool } = require('../config/db');

exports.getPatients = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    if (isNaN(new Date(queryDate))) {
      return res.status(400).json({ success: false, message: 'Tanggal tidak valid' });
    }

    // Get visits with appointments that have status 'examined' or 'dispensed'
    const [visits] = await pool.query(
      `SELECT v.visit_id, v.visit_date, v.weight, v.height, v.heart_rate, v.blood_sugar, v.temperature, d.name AS doctor_name, a.status as appointment_status, a.appointment_code
       FROM visits v 
       LEFT JOIN doctors d ON v.doctor_id = d.id 
       LEFT JOIN appointments a ON v.appointment_id = a.appointment_code
       WHERE DATE(v.visit_date) = ? AND a.status IN ('examined', 'dispensed','completed')`,
      [queryDate]
    );

    if (!visits.length) {
      return res.json({ success: true, data: [] });
    }

    const visitIds = visits.map(v => v.visit_id);
    const [patients] = await pool.query(
      `SELECT p.no_rm, p.nama_lengkap, p.tanggal_lahir, p.jenis_kelamin, v.visit_id 
       FROM pasien p 
       JOIN visits v ON p.no_rm = v.patient_id 
       WHERE v.visit_id IN (?) 
       ORDER BY p.nama_lengkap ASC`,
      [visitIds]
    );

    // Get medication status for each visit
    const [medicationStatuses] = await pool.query(
      `SELECT v.visit_id, 
              CASE 
                WHEN COUNT(vm.id) = 0 THEN 'no_medication'
                WHEN COUNT(CASE WHEN vm.status = 'pending' THEN 1 END) > 0 THEN 'pending'
                ELSE 'processed'
              END as medication_status
       FROM visits v
       LEFT JOIN visit_medications vm ON v.visit_id = vm.visit_id AND vm.status IN ('pending', 'processed')
       WHERE v.visit_id IN (?)
       GROUP BY v.visit_id`,
      [visitIds]
    );

    const result = patients.map(p => {
      const visit = visits.find(v => v.visit_id === p.visit_id);
      const medStatus = medicationStatuses.find(ms => ms.visit_id === p.visit_id);
      
      // Calculate age from tanggal_lahir
      const birthDate = new Date(p.tanggal_lahir);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      
      // Map appointment status to medication status
      let medication_status = 'no_medication';
      if (visit?.appointment_status === 'examined') {
        medication_status = 'pending'; // Shows as 'waiting'
      } else if (visit?.appointment_status === 'dispensed') {
        medication_status = 'processed'; // Shows as 'completed'
      }
      
      return { 
        ...p, 
        doctor_name: visit.doctor_name, 
        visit_date: visit.visit_date,
        appointment_status: visit?.appointment_status,
        appointment_code: visit?.appointment_code,
        age: calculatedAge,
        weight: visit?.weight,
        height: visit?.height,
        heart_rate: visit?.heart_rate,
        blood_sugar: visit?.blood_sugar,
        temperature: visit?.temperature,
        medication_status: medication_status
      };
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

exports.searchMedicines = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || search.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const [medicines] = await pool.query(
      'SELECT id, name, stock, price FROM medicines WHERE delt_flg = "N" AND name LIKE ? ORDER BY name ASC LIMIT 20',
      [`%${search}%`]
    );
    
    return res.json({ success: true, data: medicines });
  } catch (error) {
    console.error('Error searching medicines:', error);
    return res.status(500).json({ success: false, message: 'Gagal mencari obat' });
  }
};

exports.getVisitMedications = async (req, res) => {
  try {
    const { visitId } = req.params;
    if (!visitId) {
      return res.status(400).json({ success: false, message: 'Visit ID diperlukan' });
    }

    const [visit] = await pool.query(
      `SELECT v.visit_id, v.patient_id, v.weight, v.height, v.heart_rate, v.blood_sugar, v.temperature, p.no_rm, p.nama_lengkap, p.tanggal_lahir, p.jenis_kelamin, d.name AS doctor_name, a.status as appointment_status, a.appointment_code
       FROM visits v
       JOIN pasien p ON v.patient_id = p.no_rm
       LEFT JOIN doctors d ON v.doctor_id = d.id
       LEFT JOIN appointments a ON v.appointment_id = a.appointment_code
       WHERE v.visit_id = ? LIMIT 1`,
      [visitId]
    );
    if (!visit.length) {
      return res.status(404).json({ success: false, message: 'Kunjungan tidak ditemukan' });
    }

    // Calculate age from tanggal_lahir
    const birthDate = new Date(visit[0].tanggal_lahir);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    const [visitMedications] = await pool.query(
      `SELECT vm.id, m.name AS medicine_name, vm.dosage, vm.frequency, vm.duration, vm.quantity, m.stock, vm.status
       FROM visit_medications vm
       JOIN medicines m ON vm.medicine_id = m.id
       WHERE vm.visit_id = ? AND vm.status IN ('pending', 'processed')
       ORDER BY vm.created_at DESC`,
      [visitId]
    );

    // Add calculated age and appointment status to patient data
    const patientData = {
      ...visit[0],
      age: calculatedAge,
      appointment_status: visit[0].appointment_status,
      appointment_code: visit[0].appointment_code
    };

    return res.json({
      success: true,
      patient: patientData,
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

exports.getVisitVitals = async (req, res) => {
  try {
    const { visitId } = req.params;
    if (!visitId) {
      return res.status(400).json({ success: false, message: 'Visit ID diperlukan' });
    }

    const [visit] = await pool.query(
      `SELECT v.visit_id, v.patient_id, v.weight, v.height, v.heart_rate, v.blood_sugar, v.temperature,
              p.no_rm, p.nama_lengkap, p.tanggal_lahir, p.jenis_kelamin,
              d.name AS doctor_name
       FROM visits v
       JOIN pasien p ON v.patient_id = p.no_rm
       LEFT JOIN doctors d ON v.doctor_id = d.id
       WHERE v.visit_id = ? LIMIT 1`,
      [visitId]
    );
    
    if (!visit.length) {
      return res.status(404).json({ success: false, message: 'Kunjungan tidak ditemukan' });
    }

    // Calculate age
    const birthDate = new Date(visit[0].tanggal_lahir);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    const vitals = {
      ...visit[0],
      age: calculatedAge
    };

    return res.json({
      success: true,
      vitals: vitals
    });
  } catch (error) {
    console.error('Error fetching visit vitals:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data vital pasien'
    });
  }
};

exports.getVisitAppointment = async (req, res) => {
  try {
    const { visitId } = req.params;
    if (!visitId) {
      return res.status(400).json({ success: false, message: 'Visit ID diperlukan' });
    }

    const [appointment] = await pool.query(
      `SELECT a.appointment_code, a.status, a.appointment_date, a.appointment_time
       FROM appointments a
       JOIN visits v ON a.appointment_code = v.appointment_id
       WHERE v.visit_id = ? LIMIT 1`,
      [visitId]
    );
    
    if (!appointment.length) {
      return res.status(404).json({ success: false, message: 'Appointment tidak ditemukan' });
    }

    return res.json({
      success: true,
      appointment: appointment[0]
    });
  } catch (error) {
    console.error('Error fetching visit appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data appointment'
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
          'UPDATE visit_medications SET dosage = ?, frequency = ?, duration = ?, quantity = ?, status = ? WHERE id = ? AND visit_id = ?',
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

// New function for processing medications (updates and additions)
exports.processMedications = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { visit_id, updates, adds } = req.body;

    if (!visit_id) {
      return res.status(400).json({ success: false, message: 'Visit ID diperlukan' });
    }

    await connection.beginTransaction();

    // Get appointment_code from visit to update appointment status
    const [visitData] = await connection.query(
      'SELECT appointment_id FROM visits WHERE visit_id = ? LIMIT 1',
      [visit_id]
    );

    if (!visitData.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Visit tidak ditemukan' });
    }

    const appointmentCode = visitData[0].appointment_id;

    // AMBIL DATA OBAT YANG AKAN DIUPDATE sebelum dihapus
    // Ini untuk menyimpan data obat yang masih ada di form (belum dihapus user)
    const existingMedsToUpdate = [];
    if (updates && Array.isArray(updates)) {
      for (const update of updates) {
        if (update.id && update.quantity !== undefined) {
          const [existingMed] = await connection.query(
            'SELECT medicine_id, dosage, frequency, duration FROM visit_medications WHERE id = ? AND visit_id = ? LIMIT 1',
            [update.id, visit_id]
          );
          
          if (existingMed.length > 0) {
            existingMedsToUpdate.push({
              ...existingMed[0],
              newQuantity: update.quantity
            });
          }
        }
      }
    }

    // HAPUS SEMUA DATA OBAT LAMA untuk visit_id ini
    // Ini memastikan tidak ada data obat lama yang tertinggal
    await connection.query(
      'DELETE FROM visit_medications WHERE visit_id = ? AND status IN ("pending", "processed")',
      [visit_id]
    );

    // Insert ulang obat yang diupdate dengan quantity baru
    // Obat yang masih ada di form akan disimpan kembali dengan quantity yang diubah
    for (const med of existingMedsToUpdate) {
      await connection.query(
        'INSERT INTO visit_medications (visit_id, medicine_id, dosage, frequency, duration, quantity, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [visit_id, med.medicine_id, med.dosage, med.frequency, med.duration, med.newQuantity, 'processed']
      );
    }

    // Process additions of new medications
    // Obat baru yang ditambahkan user
    if (adds && Array.isArray(adds)) {
      for (const add of adds) {
        if (add.medicine_id && add.quantity > 0) {
          await connection.query(
            'INSERT INTO visit_medications (visit_id, medicine_id, dosage, frequency, duration, quantity, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [visit_id, add.medicine_id, add.dosage || '', add.frequency || '', add.duration || '', add.quantity, 'processed']
          );
        }
      }
    }

    // Update appointment status from 'examined' to 'dispensed' if there are medications
    const totalMedications = existingMedsToUpdate.length + (adds ? adds.filter(add => add.medicine_id && add.quantity > 0).length : 0);
    
    if (totalMedications > 0 && appointmentCode) {
      await connection.query(
        'UPDATE appointments SET status = ? WHERE appointment_code = ? AND status = ?',
        ['dispensed', appointmentCode, 'examined']
      );
    }

    await connection.commit();

    return res.json({
      success: true,
      message: 'Data resep berhasil disimpan dan status appointment diperbarui'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error processing medications:', error);
    return res.status(400).json({ success: false, message: error.message || 'Gagal memproses data obat' });
  } finally {
    connection.release();
  }
};

async function getFullInvoiceData(connection, paymentId) {
    const [updatedRows] = await connection.query(
      `
      SELECT 
        pay.payment_id, 
        pay.visit_id, 
        v.patient_id, 
        p.nama_lengkap, 
        pay.total,
        pay.paid_amount, 
        pay.payment_date, 
        pay.method,
        pay.status,
        a.status as appointment_status,
        a.appointment_code,
        a.update_dt as status_updated_at
      FROM payments pay
      JOIN (SELECT DISTINCT payment_id, visit_id, patient_id, appointment_id FROM v_payment_item_list_active) v ON pay.payment_id = v.payment_id
      JOIN pasien p ON v.patient_id = p.no_rm
      LEFT JOIN appointments a ON v.appointment_id = a.appointment_code
      WHERE pay.payment_id = ?
      `, [paymentId]
    );

    if (updatedRows.length === 0) return null;

    const [items] = await connection.query(`
      SELECT v.payment_id, v.visit_id, v.patient_id, v.appointment_id, v.visit_date, v.visit_time, v.item_name, v.quantity, v.price, v.pay_item_type, v.status
      FROM v_payment_item_list_active v
      WHERE v.payment_id = ?
      ORDER BY v.pay_item_type, v.item_name
    `, [paymentId]);

    return {
      ...updatedRows[0],
      items: items
    };
}

exports.getPayments = async (req, res) => {
  try {
    const [invoices] = await pool.query(`
      SELECT 
        v.payment_id, 
        v.visit_id, 
        v.patient_id, 
        p.nama_lengkap, 
        SUM(COALESCE(v.price,0)) AS total,
        MAX(pay.paid_amount) AS paid_amount,
        MAX(pay.payment_date) AS payment_date,
        MAX(pay.method) AS method,
        MAX(a.status) as appointment_status,
        MAX(a.appointment_code) as appointment_code,
        MAX(a.update_dt) as status_updated_at
      FROM v_payment_item_list_active v
      LEFT JOIN payments pay ON v.payment_id = pay.payment_id
      LEFT JOIN pasien p ON v.patient_id = p.no_rm
      LEFT JOIN appointments a ON v.appointment_id = a.appointment_code
      GROUP BY v.payment_id, v.visit_id, v.patient_id, p.nama_lengkap
      ORDER BY MAX(v.visit_date) DESC, v.payment_id DESC
    `);

    const [items] = await pool.query(`
      SELECT 
        v.payment_id, v.visit_id, v.patient_id, v.appointment_id, v.visit_date, v.visit_time, v.item_name, v.quantity, v.price, v.pay_item_type, v.status
      FROM v_payment_item_list_active v
      ORDER BY v.payment_id, v.pay_item_type, v.item_name
    `);

    // Mapping detail item ke setiap invoice
    const invoiceMap = {};
    invoices.forEach(inv => {
      invoiceMap[inv.payment_id] = { ...inv, items: [] };
    });
    items.forEach(item => {
      if (invoiceMap[item.payment_id]) {
        invoiceMap[item.payment_id].items.push(item);
      }
    });
    const result = Object.values(invoiceMap);

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data pembayaran' });
  }
};

exports.processPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { paymentId, amount, method } = req.body;

    if (!paymentId || !amount || !method) {
      return res.status(400).json({ success: false, message: 'Data pembayaran tidak lengkap.' });
    }

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah pembayaran tidak valid.' });
    }

    await connection.beginTransaction();

    // 1. Lock invoice row and get visit_id
    const [rows] = await connection.query('SELECT * FROM payments WHERE payment_id = ? FOR UPDATE', [paymentId]);

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan.' });
    }

    const invoice = rows[0];
    const visitId = invoice.visit_id;

    // 2. Securely calculate the total from the source of truth (the view)
    const [totalResult] = await connection.query(
      `SELECT SUM(COALESCE(price, 0)) AS calculatedTotal FROM v_payment_item_list_active WHERE visit_id = ?`,
      [visitId]
    );
    const calculatedTotal = Number(totalResult[0]?.calculatedTotal) || 0;
    
    // 3. Update the invoice total in DB if it's incorrect
    if (calculatedTotal !== Number(invoice.total)) {
      await connection.query('UPDATE payments SET total = ? WHERE payment_id = ?', [calculatedTotal, paymentId]);
    }
    
    // 4. Validate payment against the real, up-to-date balance
    const paidAmount = Number(invoice.paid_amount) || 0;
    const remainingBalance = calculatedTotal - paidAmount;

    if (paymentAmount > remainingBalance + 0.01) { // Add tolerance for float precision
      await connection.rollback();
      return res.status(400).json({ success: false, message: `Jumlah pembayaran Rp ${paymentAmount.toLocaleString('id-ID')} melebihi sisa tagihan Rp ${remainingBalance.toLocaleString('id-ID')}.` });
    }

    const newPaidAmount = paidAmount + paymentAmount;
    const newStatus = newPaidAmount >= calculatedTotal ? 'PAID' : 'PARTIAL';
    
    // Auto-close logic is removed. Closing is now a manual user action.

    await connection.query(
      `UPDATE payments SET paid_amount = ?, status = ?, payment_date = NOW(), method = ? WHERE payment_id = ?`,
      [newPaidAmount, newStatus, method, paymentId]
    );

    await connection.commit();

    const updatedInvoice = await getFullInvoiceData(connection, paymentId);
    
    if (!updatedInvoice) {
      return res.status(404).json({ success: false, message: 'Gagal mengambil data invoice terbaru.' });
    }

    res.json({ success: true, message: 'Pembayaran berhasil diproses.', data: updatedInvoice });

  } catch (error) {
    await connection.rollback();
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan di server.' });
  } finally {
    connection.release();
  }
};

exports.activatePayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { paymentId } = req.params;
        await connection.beginTransaction();

        const [payment] = await connection.query('SELECT visit_id FROM payments WHERE payment_id = ?', [paymentId]);
        if (payment.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan.' });
        }

        const [visit] = await connection.query('SELECT appointment_id FROM visits WHERE visit_id = ?', [payment[0].visit_id]);
        if (visit.length > 0 && visit[0].appointment_id) {
            await connection.query(
                'UPDATE appointments SET status = ? WHERE appointment_code = ?',
                ['dispensed', visit[0].appointment_id]
            );
        }

        await connection.commit();
        
        const updatedInvoice = await getFullInvoiceData(connection, paymentId);
        if (!updatedInvoice) {
            return res.status(404).json({ success: false, message: 'Gagal mengambil data invoice terbaru setelah aktivasi.' });
        }
        res.json({ success: true, message: 'Invoice berhasil diaktifkan kembali.', data: updatedInvoice });

    } catch (error) {
        await connection.rollback();
        console.error('Error activating payment:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan di server.' });
    } finally {
        connection.release();
    }
};

exports.closePayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { paymentId } = req.params;
        await connection.beginTransaction();

        const [payment] = await connection.query('SELECT visit_id, total, paid_amount FROM payments WHERE payment_id = ? FOR UPDATE', [paymentId]);
        if (payment.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan.' });
        }

        if (Number(payment[0].paid_amount) < Number(payment[0].total)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Tidak dapat menutup invoice yang belum lunas.' });
        }

        const [visit] = await connection.query('SELECT appointment_id FROM visits WHERE visit_id = ?', [payment[0].visit_id]);
        if (visit.length > 0 && visit[0].appointment_id) {
            await connection.query(
                'UPDATE appointments SET status = ? WHERE appointment_code = ?',
                ['completed', visit[0].appointment_id]
            );
        }

        await connection.commit();
        
        const updatedInvoice = await getFullInvoiceData(connection, paymentId);
        if (!updatedInvoice) {
            return res.status(404).json({ success: false, message: 'Gagal mengambil data invoice terbaru setelah penutupan.' });
        }
        res.json({ success: true, message: 'Invoice berhasil ditutup.', data: updatedInvoice });
    } catch (error) {
        await connection.rollback();
        console.error('Error closing payment:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan di server.' });
    } finally {
        connection.release();
    }
};

exports.resetPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { paymentId } = req.params;
        await connection.beginTransaction();

        const [payment] = await connection.query('SELECT visit_id FROM payments WHERE payment_id = ? FOR UPDATE', [paymentId]);
        if (payment.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan.' });
        }

        const [visit] = await connection.query('SELECT appointment_id FROM visits WHERE visit_id = ?', [payment[0].visit_id]);
        if (visit.length > 0 && visit[0].appointment_id) {
            const [appointment] = await connection.query('SELECT status FROM appointments WHERE appointment_code = ?', [visit[0].appointment_id]);
            if (appointment.length > 0 && appointment[0].status === 'completed') {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Tidak dapat mereset pembayaran untuk invoice yang sudah ditutup.' });
            }
        }

        await connection.query(
            `UPDATE payments SET paid_amount = NULL, status = 'UNPAID', payment_date = NULL, method = NULL WHERE payment_id = ?`,
            [paymentId]
        );

        await connection.commit();
        
        const updatedInvoice = await getFullInvoiceData(connection, paymentId);
        if (!updatedInvoice) {
            return res.status(404).json({ success: false, message: 'Gagal mengambil data invoice terbaru setelah reset.' });
        }
        res.json({ success: true, message: 'Pembayaran berhasil direset.', data: updatedInvoice });

    } catch (error) {
        await connection.rollback();
        console.error('Error resetting payment:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan di server.' });
    } finally {
        connection.release();
    }
};