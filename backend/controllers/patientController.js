const { pool } = require('../config/db');

const generateRMNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const [counter] = await pool.query(
    'SELECT counter FROM rm_counter WHERE date = CURDATE()'
  );
  
  let nextCounter = 1;
  if (counter.length > 0) {
    nextCounter = counter[0].counter + 1;
    await pool.query(
      'UPDATE rm_counter SET counter = ? WHERE date = CURDATE()',
      [nextCounter]
    );
  } else {
    await pool.query(
      'INSERT INTO rm_counter (date, counter) VALUES (CURDATE(), 1)'
    );
  }
  
  return `RM${dateStr}${nextCounter.toString().padStart(4, '0')}`;
};

const generateAppointmentCode = (poli, id) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  return `APP-${poli.toUpperCase()}-${dateStr}${id.toString().padStart(10, '0')}`;
};

const patientController = {
  searchPatients: async (req, res) => {
    try {
      const { keyword } = req.query;
      const [patients] = await pool.query(`
        SELECT id, no_rm, nik, nama_lengkap, tanggal_lahir, jenis_kelamin, alamat
        FROM pasien
        WHERE nama_lengkap LIKE ? OR nik LIKE ?
        LIMIT 10
      `, [`%${keyword}%`, `%${keyword}%`]);
      
      res.json({
        status: 'success',
        data: patients
      });
    } catch (error) {
      console.error('Error searching patients:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to search patients'
      });
    }
  },

  registerPatient: async (req, res) => {
    try {
      const {
        nik,
        nama_lengkap,
        tanggal_lahir,
        jenis_kelamin,
        alamat,
        no_telepon,
        email
      } = req.body;

      const no_rm = await generateRMNumber();
      
      const [result] = await pool.query(`
        INSERT INTO pasien (
          no_rm, nik, nama_lengkap, tanggal_lahir, 
          jenis_kelamin, alamat, no_telepon, email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [no_rm, nik, nama_lengkap, tanggal_lahir, 
          jenis_kelamin, alamat, no_telepon, email]);
      
      res.status(201).json({
        status: 'success',
        data: {
          id: result.insertId,
          no_rm,
          nik,
          nama_lengkap
        }
      });
    } catch (error) {
      console.error('Error registering patient:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to register patient'
      });
    }
  },

  getAppointments: async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      
      const [appointments] = await pool.query(`
        SELECT 
          a.appointment_code,
          a.appointment_date,
          a.appointment_time,
          a.type,
          a.status,
          p.nama_lengkap as patient_name,
          a.patient_no_rm,
          p.nik,
          p.no_telepon as phone,
          d.id as doctor_id,
          d.name as doctor
        FROM appointments a
        JOIN pasien p ON a.patient_no_rm = p.no_rm
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.appointment_date BETWEEN ? AND ?
        ORDER BY a.appointment_date, a.appointment_time
      `, [start_date, end_date]);
      
      res.json({
        status: 'success',
        data: appointments
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data kunjungan'
      });
    }
  },

  createAppointment: async (req, res) => {
    try {
      console.log('Received payload:', req.body); // Add logging
      const {
        patient_no_rm,
        doctor_id,
        appointment_date,
        appointment_time,
        type,
        notes,
        poli,
        height,
        weight,
        heart_rate,
        blood_sugar,
        temperature,
        complaint
      } = req.body;

      // Validate patient_no_rm exists in pasien
      const [patientCheck] = await pool.query(
        'SELECT no_rm FROM pasien WHERE no_rm = ?',
        [patient_no_rm]
      );
      if (patientCheck.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: `Patient with no_rm ${patient_no_rm} does not exist. Please register the patient first.`
        });
      }

      // Validate input vitals
      if (!height || !weight || !heart_rate || !blood_sugar || !temperature || !complaint) {
        return res.status(400).json({
          status: 'error',
          message: 'Vitals (height, weight, heart rate, blood sugar, temperature) and complaint are required'
        });
      }

      await pool.query('START TRANSACTION');

      // Generate appointment_code
      const appointmentCode = generateAppointmentCode(poli, Date.now());

      // Insert into appointments
      await pool.query(
        `INSERT INTO appointments (
          appointment_code, patient_no_rm, doctor_id, appointment_date,
          appointment_time, type, notes, poli
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appointmentCode,
          patient_no_rm,
          doctor_id,
          appointment_date,
          appointment_time,
          type,
          notes || null,
          poli
        ]
      );

      // Insert into visits using appointment_code
      await pool.query(
        `INSERT INTO visits (
          appointment_id, patient_id, visit_date, visit_time, doctor_id,
          complaint, notes, height, weight, heart_rate, blood_sugar, temperature
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appointmentCode,
          patient_no_rm,
          appointment_date,
          appointment_time,
          doctor_id,
          complaint,
          notes || null,
          height,
          weight,
          heart_rate,
          blood_sugar,
          temperature
        ]
      );

      await pool.query('COMMIT');

      res.status(201).json({
        status: 'success',
        data: { appointment_code: appointmentCode, appointment_date, appointment_time }
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error creating appointment:', error);
      res.status(500).json({ status: 'error', message: 'Gagal membuat kunjungan baru' });
    }
  },

  updateAppointment: async (req, res) => {
    try {
      const { appointment_code } = req.params;
      const {
        doctor_id,
        appointment_date,
        appointment_time,
        type,
        status,
        notes,
        poli
      } = req.body;

      const [result] = await pool.query(`
        UPDATE appointments 
        SET doctor_id = ?,
            appointment_date = ?,
            appointment_time = ?,
            type = ?,
            status = ?,
            notes = ?,
            poli = ?
        WHERE appointment_code = ?
      `, [doctor_id, appointment_date, appointment_time, type, status, notes, poli, appointment_code]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Kunjungan tidak ditemukan'
        });
      }

      res.json({
        status: 'success',
        message: 'Kunjungan berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal memperbarui kunjungan'
      });
    }
  },

  deleteAppointment: async (req, res) => {
    try {
      const { appointment_code } = req.params;

      await pool.query('START TRANSACTION');
      await pool.query('DELETE FROM visits WHERE appointment_code = ?', [appointment_code]);
      const [result] = await pool.query(
        'DELETE FROM appointments WHERE appointment_code = ?',
        [appointment_code]
      );

      if (result.affectedRows === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({
          status: 'error',
          message: 'Kunjungan tidak ditemukan'
        });
      }

      await pool.query('COMMIT');
      res.json({
        status: 'success',
        message: 'Kunjungan berhasil dihapus'
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error deleting appointment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal menghapus kunjungan'
      });
    }
  }
};

module.exports = patientController;