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

const generateAppointmentCode = async (timestamp) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    // Query the last appointment for the current day to get the latest counter
    const [rows] = await pool.query(
      "SELECT appointment_code FROM appointments WHERE appointment_code LIKE ? ORDER BY appointment_code DESC LIMIT 1",
      [`A${datePrefix}%`]
    );
    
    let counter = 1;
    if (rows.length > 0) {
      const lastCode = rows[0].appointment_code;
      // Extract the counter part (last 4 characters)
      const lastCounter = parseInt(lastCode.slice(-4));
      counter = lastCounter + 1;
    }
    
    // Add timestamp milliseconds to ensure uniqueness if provided
    const uniqueSuffix = timestamp ? `-${timestamp.toString().slice(-4)}` : '';
    
    const counterStr = String(counter).padStart(4, '0');
    const appointmentCode = `A${datePrefix}${counterStr}${uniqueSuffix}`;
    console.log(`Generated appointment code: ${appointmentCode}`);
    return appointmentCode;
  } catch (error) {
    console.error('Error generating appointment code:', error);
    throw error;
  }
};

const appointmentController = {
  searchPatients: async (req, res) => {
    try {
      const { keyword } = req.query;
      
      // Validasi keyword minimal 3 karakter
      if (!keyword || keyword.length < 3) {
        return res.json({
          status: 'success',
          data: []
        });
      }
      
      const [patients] = await pool.query(`
        SELECT id, no_rm, nik, nama_lengkap, tanggal_lahir, jenis_kelamin, alamat, no_telepon, email
        FROM pasien
        WHERE nama_lengkap LIKE ? OR nik LIKE ?
        LIMIT 10
      `, [`%${keyword}%`, `%${keyword}%`]);
      
      console.log(`Search patients with keyword: ${keyword}, found: ${patients.length} results`);
      
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
      if (!complaint) {
        return res.status(400).json({
          status: 'error',
          message: 'Keluhan wajib diisi'
        });
      }

      await pool.query('START TRANSACTION');

      // Generate appointment_code with timestamp for uniqueness
      const timestamp = req.body.timestamp || Date.now();
      const appointmentCode = await generateAppointmentCode(timestamp);

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
          height || null,
          weight || null,
          heart_rate || null,
          blood_sugar || null,
          temperature || null
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
      await pool.query('DELETE FROM visits WHERE appointment_id = ?', [appointment_code]);
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
  },

  getAppointmentDetails: async (req, res) => {
    try {
      const { appointment_code } = req.params;
      
      const [appointment] = await pool.query(`
        SELECT 
          a.appointment_code,
          a.appointment_date,
          a.appointment_time,
          a.type,
          a.status,
          a.notes,
          a.poli,
          p.nama_lengkap as patient_name,
          p.no_rm as patient_no_rm,
          p.nik,
          p.tanggal_lahir,
          p.jenis_kelamin,
          p.alamat,
          p.no_telepon as phone,
          p.email,
          d.id as doctor_id,
          d.name as doctor,
          v.height,
          v.weight,
          v.heart_rate,
          v.blood_sugar,
          v.temperature,
          v.complaint
        FROM appointments a
        JOIN pasien p ON a.patient_no_rm = p.no_rm
        JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN visits v ON a.appointment_code = v.appointment_id
        WHERE a.appointment_code = ?
      `, [appointment_code]);
      
      if (appointment.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment tidak ditemukan'
        });
      }

      res.json({
        status: 'success',
        data: appointment[0]
      });
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil detail appointment'
      });
    }
  }
};

module.exports = appointmentController;