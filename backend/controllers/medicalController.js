const { pool } = require('../config/db');

const medicalController = {
  getWaitingPatients: async (req, res) => {
    try {
      const { date } = req.body;

      if (!date) {
        return res.status(400).json({ success: false, message: 'Parameter date wajib diisi di body request' });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ success: false, message: 'Format tanggal harus YYYY-MM-DD' });
      }

      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Tanggal tidak valid' });
      }

      const formattedDate = parsedDate.toISOString().split('T')[0];

      const [allAppointments] = await pool.query(
        `SELECT COUNT(*) as total FROM appointments WHERE appointment_date = ?`,
        [formattedDate]
      );

      const [patients] = await pool.query(`
        SELECT p.id, p.no_rm, p.nama_lengkap, p.tanggal_lahir,
               TIMESTAMPDIFF(YEAR, p.tanggal_lahir, CURDATE()) AS umur,
               p.jenis_kelamin, a.appointment_time, d.name AS doctor_name, a.status,
               a.appointment_code
        FROM appointments a
        JOIN pasien p ON a.patient_no_rm = p.no_rm
        LEFT JOIN doctors d ON a.doctor_id = d.id
        WHERE a.appointment_date = ?
        ORDER BY a.appointment_time
      `, [formattedDate]);

      res.json({ success: true, data: patients || [], date: formattedDate });
    } catch (error) {
      console.error('Error in getWaitingPatients:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil daftar pasien waiting' });
    }
  },

  getCurrentVisitMedicalRecord: async (req, res) => {
    try {
      const { no_rm } = req.params;
      const [patient] = await pool.query('SELECT * FROM pasien WHERE no_rm = ?', [no_rm]);

      if (!patient || patient.length === 0) {
        return res.json({ success: true, data: null });
      }

      const [currentVisit] = await pool.query(`
        SELECT v.visit_id, v.visit_date, v.visit_time, d.name AS doctor_name
        FROM visits v
        LEFT JOIN doctors d ON v.doctor_id = d.id
        WHERE v.patient_id = ?
        ORDER BY v.visit_date DESC, v.visit_time DESC
        LIMIT 1
      `, [no_rm]);

      if (currentVisit.length === 0) {
        return res.json({
          success: true,
          data: {
            patient: patient[0], currentVisit: null, vitals: null,
            procedures: [], diagnoses: [], medications: [], timeline: []
          }
        });
      }

      const visitId = currentVisit[0].visit_id;

      const [vitals] = await pool.query(`SELECT height, weight, heart_rate, blood_sugar, temperature FROM visits WHERE visit_id = ?`, [visitId]);
      const [procedures] = await pool.query(`SELECT s.name AS procedure_name FROM visit_procedures vp LEFT JOIN services s ON vp.procedure_id = s.id WHERE vp.visit_id = ?`, [visitId]);
      const [diagnoses] = await pool.query(`SELECT d.name AS diagnosis_name FROM visit_diagnoses vd LEFT JOIN diagnoses d ON vd.diagnose_id = d.id WHERE vd.visit_id = ?`, [visitId]);
      const [medications] = await pool.query(`SELECT m.name AS medication_name, vm.dosage, vm.frequency, vm.duration FROM visit_medications vm LEFT JOIN medicines m ON vm.medicine_id = m.id WHERE vm.visit_id = ?`, [visitId]);
      const [timeline] = await pool.query(`SELECT t.activity, t.activity_time, t.details FROM visit_timeline t WHERE t.visit_id = ? ORDER BY t.activity_time`, [visitId]);

      res.json({
        success: true,
        data: {
          patient: patient[0],
          currentVisit: currentVisit[0],
          vitals: vitals[0] || null,
          procedures: procedures.map(p => p.procedure_name),
          diagnoses: diagnoses.map(d => d.diagnosis_name),
          medications: medications.map(m => ({
            name: m.medication_name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration
          })),
          timeline: timeline || []
        }
      });
    } catch (error) {
      console.error('Error in getCurrentVisitMedicalRecord:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil medical record visit saat ini' });
    }
  },

  editVitals: async (req, res) => {
    try {
      const { visit_id, height, weight, heart_rate, blood_sugar, temperature, patient_no_rm } = req.body;

      console.log('Received vitals data:', { visit_id, height, weight, heart_rate, blood_sugar, temperature, patient_no_rm }); // Debug log

      if (!visit_id && !patient_no_rm) {
        return res.status(400).json({
          success: false,
          message: 'visit_id atau patient_no_rm wajib diisi'
        });
      }

      // Check if all required fields are present and not empty strings
      const requiredFields = { height, weight, heart_rate, blood_sugar, temperature };
      const emptyFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value || value.toString().trim() === '')
        .map(([key]) => key);

      if (emptyFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Field berikut wajib diisi: ${emptyFields.join(', ')}`
        });
      }

      const numericFields = { height, weight, heart_rate, blood_sugar, temperature };
      const constraints = {
        height: { min: 50, max: 250, label: 'Tinggi' },
        weight: { min: 1, max: 300, label: 'Berat' },
        heart_rate: { min: 30, max: 200, label: 'Detak Jantung' },
        blood_sugar: { min: 20, max: 600, label: 'Gula Darah' },
        temperature: { min: 32, max: 43, label: 'Suhu' }
      };

      for (const [field, value] of Object.entries(numericFields)) {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
          return res.status(400).json({
            success: false,
            message: `${constraints[field].label} harus berupa angka positif`
          });
        }
        if (numValue < constraints[field].min || numValue > constraints[field].max) {
          return res.status(400).json({
            success: false,
            message: `${constraints[field].label} harus berada di antara ${constraints[field].min} dan ${constraints[field].max}`
          });
        }
      }

      let finalVisitId = visit_id;

      if (!visit_id && patient_no_rm) {
        const [patient] = await pool.query('SELECT id FROM pasien WHERE no_rm = ?', [patient_no_rm]);
        if (!patient || patient.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Pasien tidak ditemukan'
          });
        }

        const [result] = await pool.query(
          `INSERT INTO visits (patient_id, visit_date, visit_time, created_at, updated_at) VALUES (?, CURDATE(), CURTIME(), NOW(), NOW())`,
          [patient_no_rm]
        );
        finalVisitId = result.insertId;
      }

      const [visitCheck] = await pool.query('SELECT 1 FROM visits WHERE visit_id = ?', [finalVisitId]);
      if (!visitCheck || visitCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Kunjungan dengan visit_id tersebut tidak ditemukan'
        });
      }

      console.log('Updating vitals with values:', { height, weight, heart_rate, blood_sugar, temperature, finalVisitId }); // Debug log

      const [result] = await pool.query(
        `
        UPDATE visits 
        SET 
          height = ?,
          weight = ?,
          heart_rate = ?,
          blood_sugar = ?,
          temperature = ?,
          updated_at = NOW()
        WHERE visit_id = ?
      `,
        [height, weight, heart_rate, blood_sugar, temperature, finalVisitId]
      );

      if (result.affectedRows === 0) {
        return res.status(500).json({
          success: false,
          message: 'Gagal mengupdate vital signs, tidak ada perubahan yang dilakukan'
        });
      }

      console.log('Vitals updated successfully, affected rows:', result.affectedRows); // Debug log

      res.json({
        success: true,
        message: 'Vital signs berhasil diupdate',
        visit_id: finalVisitId
      });
    } catch (error) {
      console.error('Error in editVitals:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengupdate vital signs'
      });
    }
  },

  getCombinedPatientData: async (req, res) => {
    try {
      const { no_rm } = req.params;
      const { appointment_code } = req.query; // Add appointment_code as query parameter

      // First, get all visits for the patient
      const [visits] = await pool.query(`
        SELECT 
          v.visit_id,
          v.visit_date,
          v.visit_time,
          v.appointment_id,
          d.name AS doctor_name
        FROM visits v
        JOIN pasien p ON v.patient_id = p.no_rm
        LEFT JOIN doctors d ON v.doctor_id = d.id
        WHERE p.no_rm = ?
        ORDER BY v.visit_date DESC
      `, [no_rm]);

      if (visits.length === 0) {
        return res.json({
          success: true,
          data: [] // No visits found, return empty array
        });
      }

      const [patient] = await pool.query('SELECT * FROM pasien WHERE no_rm = ?', [no_rm]);

      if (!patient || patient.length === 0) {
        return res.json({
          success: true,
          data: null // No patient found, return null
        });
      }

      // Determine which visit to use
      let targetVisitId = null;
      
      if (appointment_code) {
        // If appointment_code is provided, find the matching visit
        const matchingVisit = visits.find(visit => visit.appointment_id === appointment_code);
        if (matchingVisit) {
          targetVisitId = matchingVisit.visit_id;
          console.log(`Using visit_id ${targetVisitId} for appointment ${appointment_code}`);
        }
      }
      
      // Fallback to the most recent visit if no matching appointment found
      if (!targetVisitId) {
        targetVisitId = visits[0].visit_id;
        console.log(`Using latest visit_id ${targetVisitId} as fallback`);
      }

      const [vitals] = await pool.query(`
        SELECT height, weight, heart_rate, blood_sugar, temperature 
        FROM visits
        WHERE visit_id = ?
      `, [targetVisitId]);

      const [procedures] = await pool.query(`
        SELECT s.name AS procedure_name 
        FROM visit_procedures vp
        JOIN visits v ON vp.visit_id = v.visit_id
        LEFT JOIN services s ON vp.procedure_id = s.id
        JOIN pasien p ON v.patient_id = p.no_rm WHERE v.visit_id = ?
      `, [targetVisitId]);

      const [diagnoses] = await pool.query(`
        SELECT CONCAT(d.code, ' - ', d.name) AS diagnosis_name 
        FROM visit_diagnoses vd
        JOIN visits v ON vd.visit_id = v.visit_id
        LEFT JOIN diagnoses d ON vd.diagnose_id = d.id
        JOIN pasien p ON v.patient_id = p.no_rm WHERE v.visit_id = ?
      `, [targetVisitId]);

      const [medications] = await pool.query(`
        SELECT 
          m.name AS medication_name,
          vm.dosage,
          vm.frequency,
          vm.duration
        FROM visit_medications vm
        JOIN visits v ON vm.visit_id = v.visit_id
        LEFT JOIN medicines m ON vm.medicine_id = m.id
        JOIN pasien p ON v.patient_id = p.no_rm 
        WHERE v.visit_id = ?
      `, [targetVisitId]);

      res.json({
        success: true,
        data: {
          visit_id: targetVisitId, // Include the visit_id in response
          vitals: vitals[0] || null,
          procedures: procedures.map(p => p.procedure_name) || [], // Ensure empty array
          diagnoses: diagnoses.map(d => d.diagnosis_name) || [], // Ensure empty array
          medications: medications.map(m => ({
            name: m.medication_name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration
          })) || [] // Ensure empty array
        }
      });
    } catch (error) {
      console.error('Error in getCombinedPatientData:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data gabungan pasien'
      });
    }
  },

  getPatientById: async (req, res) => {
    try {
      const { no_rm } = req.params;

      const [patient] = await pool.query(
        `
        SELECT 
          id,
          no_rm,
          nik,
          nama_lengkap,
          tanggal_lahir,
          TIMESTAMPDIFF(YEAR, tanggal_lahir, CURDATE()) AS umur,
          jenis_kelamin,
          alamat,
          no_telepon,
          email
        FROM pasien
        WHERE no_rm = ?
        AND delt_flg = 'N'
      `,
        [no_rm]
      );

      if (!patient || patient.length === 0) {
        return res.json({
          success: true,
          data: null // No patient found, return null
        });
      }

      res.json({
        success: true,
        data: patient[0]
      });
    } catch (error) {
      console.error('Error in getPatientById:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pasien'
      });
    }
  },

  getAllPatients: async (req, res) => {
    try {
      const [patients] = await pool.query(`
        SELECT 
          id,
          no_rm,
          nama_lengkap,
          TIMESTAMPDIFF(YEAR, tanggal_lahir, CURDATE()) AS umur,
          jenis_kelamin
        FROM pasien
        WHERE delt_flg = 'N'
        ORDER BY nama_lengkap
        LIMIT 20
      `);

      res.json({
        success: true,
        data: patients // Empty array if no patients found
      });
    } catch (error) {
      console.error('Error in getAllPatients:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar pasien'
      });
    }
  },

  searchPatients: async (req, res) => {
    try {
      const { search } = req.query;

      const [patients] = await pool.query(
        `
        SELECT 
          id,
          no_rm,
          nik,
          nama_lengkap,
          tanggal_lahir,
          jenis_kelamin,
          alamat,
          no_telepon,
          email
        FROM pasien
        WHERE (nik LIKE ? OR nama_lengkap LIKE ? OR no_rm LIKE ?)
        AND delt_flg = 'N'
        ORDER BY nama_lengkap
        LIMIT 10
      `,
        [`%${search}%`, `%${search}%`, `%${search}%`]
      );

      res.json({
        success: true,
        data: patients // Empty array if no patients found
      });
    } catch (error) {
      console.error('Error in searchPatients:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mencari data pasien'
      });
    }
  },

  getPatientVitals: async (req, res) => {
    try {
      const { no_rm } = req.params;

      const [patient] = await pool.query(
        `SELECT no_rm FROM pasien WHERE no_rm = ? AND delt_flg = 'N'`,
        [no_rm]
      );

      if (!patient || patient.length === 0) {
        return res.json({
          success: true,
          data: null // No patient found, return null
        });
      }

      const [visit] = await pool.query(
        `SELECT visit_id FROM visits WHERE patient_id = ? ORDER BY visit_date DESC LIMIT 1`,
        [no_rm]
      );

      if (!visit || visit.length === 0) {
        return res.json({
          success: true,
          data: null // No visits found, return null
        });
      }

      const [vitals] = await pool.query(
        `
        SELECT 
          height,
          weight,
          heart_rate,
          blood_sugar,
          temperature,
          created_at,
          updated_at
        FROM visits
        WHERE visit_id = ?
      `,
        [visit[0].visit_id]
      );

      res.json({
        success: true,
        data: vitals.length > 0 ? vitals[0] : null // Return null if no vitals found
      });
    } catch (error) {
      console.error('Error in getPatientVitals:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data vital signs pasien'
      });
    }
  },

  getPatientVisitHistory: async (req, res) => {
    try {
      const { no_rm } = req.params;

      const [patient] = await pool.query(
        `SELECT no_rm FROM pasien WHERE no_rm = ? AND delt_flg = 'N'`,
        [no_rm]
      );

      if (!patient || patient.length === 0) {
        return res.json({
          success: true,
          data: null // No patient found, return null
        });
      }

      const [visits] = await pool.query(
        `
        SELECT 
          v.visit_id,
          v.patient_id,
          v.doctor_id,
          v.appointment_id,
          d.name AS doctor_name,
          d.specialization AS doctor_specialty,
          v.visit_date,
          v.complaint,
          v.notes
        FROM visits v
        LEFT JOIN doctors d ON v.doctor_id = d.id
        WHERE v.patient_id = ?
        ORDER BY v.visit_date DESC
      `,
        [no_rm]
      );

      res.json({
        success: true,
        data: visits // Empty array if no visits found
      });
    } catch (error) {
      console.error('Error in getPatientVisitHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil riwayat kunjungan pasien'
      });
    }
  },

  searchProcedure: async (req, res) => {
    try {
      const { search } = req.query;

      if (!search || search.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Parameter search wajib diisi'
        });
      }

      const [procedures] = await pool.query(
        `SELECT id, name FROM services WHERE name LIKE ? ORDER BY name LIMIT 10`,
        [`%${search}%`]
      );

      res.json({
        success: true,
        data: procedures.map(p => ({ id: p.id, name: p.name })) // Empty array if no procedures found
      });
    } catch (error) {
      console.error('Error in searchProcedure:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mencari data prosedur'
      });
    }
  },

  searchMedication: async (req, res) => {
    try {
      const { search } = req.query;

      if (!search || search.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Parameter search wajib diisi'
        });
      }

      const [medications] = await pool.query(
        `SELECT id, name, stock, price FROM medicines WHERE name LIKE ? ORDER BY name LIMIT 10`,
        [`%${search}%`]
      );

      const result = medications.map(m => ({ id: m.id, name: m.name, stock: m.stock, price: m.price }));

      res.json({
        success: true,
        data: result // Empty array if no medications found
      });
    } catch (error) {
      console.error('Error in searchMedication:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mencari data obat'
      });
    }
  },

  getMedicationPresets: async (req, res) => {
    // Removed, no longer needed
    return res.status(404).json({ success: false, message: 'Endpoint tidak tersedia' });
  },

  searchDiagnose: async (req, res) => {
    try {
      const { search } = req.query;

      if (!search || search.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Parameter search wajib diisi'
        });
      }

      const [diagnoses] = await pool.query(
        `SELECT id, code, name FROM diagnoses WHERE name LIKE ? OR code LIKE ? ORDER BY name LIMIT 10`,
        [`%${search}%`, `%${search}%`]
      );

      res.json({
        success: true,
        data: diagnoses.map(d => ({ id: d.id, code: d.code, name: d.name })) // Empty array if no diagnoses found
      });
    } catch (error) {
      console.error('Error in searchDiagnose:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mencari data diagnosis'
      });
    }
  },

  updateVisitProcedures: async (req, res) => {
    try {
      const { visit_id, items } = req.body;

      console.log('Received procedure data:', { visit_id, items }); // Debug log

      if (!visit_id) {
        return res.status(400).json({
          success: false,
          message: 'visit_id wajib diisi'
        });
      }

      const [visitCheck] = await pool.query('SELECT 1 FROM visits WHERE visit_id = ?', [visit_id]);
      if (!visitCheck || visitCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Kunjungan dengan visit_id tersebut tidak ditemukan'
        });
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        await connection.query('DELETE FROM visit_procedures WHERE visit_id = ?', [visit_id]);

        if (items && items.length > 0) {
          console.log('Processing procedure items:', items); // Debug log
          
          for (const item of items) {
            // Handle both string and object formats from frontend
            const procedureName = typeof item === 'object' && item.name ? item.name : item;
            console.log('Processing procedure:', procedureName); // Debug log
            
            const [procedure] = await connection.query('SELECT id FROM services WHERE name = ?', [procedureName]);
            console.log('Found procedure:', procedure); // Debug log
            
            if (!procedure || procedure.length === 0) {
              throw new Error(`Prosedur '${procedureName}' tidak ditemukan`);
            }
            
            await connection.query(
              'INSERT INTO visit_procedures (visit_id, procedure_id) VALUES (?, ?)',
              [visit_id, procedure[0].id]
            );
            
            console.log(`Inserted procedure: ${procedureName} with ID: ${procedure[0].id}`); // Debug log
          }
        }

        await connection.commit();
        console.log('Successfully committed procedure updates'); // Debug log

        res.json({
          success: true,
          message: 'Prosedur kunjungan berhasil diperbarui'
        });
      } catch (error) {
        await connection.rollback();
        console.error('Database error in updateVisitProcedures:', error);
        res.status(400).json({
          success: false,
          message: error.message || 'Terjadi kesalahan saat memperbarui prosedur kunjungan'
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error in updateVisitProcedures:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  updateVisitMedications: async (req, res) => {
    try {
      const { visit_id, items } = req.body;

      if (!visit_id) {
        return res.status(400).json({
          success: false,
          message: 'visit_id wajib diisi'
        });
      }

      const [visitCheck] = await pool.query('SELECT 1 FROM visits WHERE visit_id = ?', [visit_id]);
      if (!visitCheck || visitCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Kunjungan dengan visit_id tersebut tidak ditemukan'
        });
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        await connection.query('DELETE FROM visit_medications WHERE visit_id = ?', [visit_id]);

        if (items && items.length > 0) {
          for (const item of items) {
            const { name, dosage, frequency, duration } = item;
            const [medication] = await connection.query('SELECT id, stock FROM medicines WHERE name = ?', [name]);
            if (!medication || medication.length === 0) {
              throw new Error(`Obat '${name}' tidak ditemukan`);
            }
            // Only check stock availability, quantity remains NULL for pharmacist
            if (medication[0].stock <= 0) {
              throw new Error(`Stok obat '${name}' habis`);
            }

            await connection.query(
              'INSERT INTO visit_medications (visit_id, medicine_id, dosage, frequency, duration, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
              [visit_id, medication[0].id, dosage, frequency, duration]
            );
          }
        }

        await connection.commit();

        res.json({
          success: true,
          message: 'Obat kunjungan berhasil diperbarui'
        });
      } catch (error) {
        await connection.rollback();
        console.error('Database error in updateVisitMedications:', error);
        res.status(400).json({
          success: false,
          message: error.message || 'Terjadi kesalahan saat memperbarui obat kunjungan'
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error in updateVisitMedications:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  updateVisitDiagnoses: async (req, res) => {
    try {
      const { visit_id, items } = req.body;

      console.log('Received diagnosis data:', { visit_id, items }); // Debug log

      if (!visit_id) {
        return res.status(400).json({
          success: false,
          message: 'visit_id wajib diisi'
        });
      }

      const [visitCheck] = await pool.query('SELECT 1 FROM visits WHERE visit_id = ?', [visit_id]);
      if (!visitCheck || visitCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Kunjungan dengan visit_id tersebut tidak ditemukan'
        });
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        await connection.query('DELETE FROM visit_diagnoses WHERE visit_id = ?', [visit_id]);

        if (items && items.length > 0) {
          console.log('Processing diagnosis items:', items); // Debug log
          
          for (const item of items) {
            // Handle both string and object formats from frontend
            const diagnosisName = typeof item === 'object' && item.name ? item.name : item;
            console.log('Processing diagnosis:', diagnosisName); // Debug log
            
            const [diagnosis] = await connection.query(
              'SELECT id FROM diagnoses WHERE name = ? OR CONCAT(code, " - ", name) = ?',
              [diagnosisName, diagnosisName]
            );
            
            console.log('Found diagnosis:', diagnosis); // Debug log
            
            if (!diagnosis || diagnosis.length === 0) {
              throw new Error(`Diagnosis '${diagnosisName}' tidak ditemukan`);
            }
            
            await connection.query(
              'INSERT INTO visit_diagnoses (visit_id, diagnose_id) VALUES (?, ?)',
              [visit_id, diagnosis[0].id]
            );
            
            console.log(`Inserted diagnosis: ${diagnosisName} with ID: ${diagnosis[0].id}`); // Debug log
          }
        }

        await connection.commit();
        console.log('Successfully committed diagnosis updates'); // Debug log

        res.json({
          success: true,
          message: 'Diagnosis kunjungan berhasil diperbarui'
        });
      } catch (error) {
        await connection.rollback();
        console.error('Database error in updateVisitDiagnoses:', error);
        res.status(400).json({
          success: false,
          message: error.message || 'Terjadi kesalahan saat memperbarui diagnosis kunjungan'
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error in updateVisitDiagnoses:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  updateAppointmentStatus: async (req, res) => {
    try {
      const { appointment_code } = req.body;

      if (!appointment_code) {
        return res.status(400).json({ success: false, message: 'appointment_code wajib diisi' });
      }

      const query = `
        UPDATE appointments 
        SET status = 'examined'
        WHERE appointment_code = ? AND status = 'scheduled'
      `;
      
      const [result] = await pool.query(query, [appointment_code]);

      if (result.affectedRows === 0) {
        console.log('No appointment updated - might already be examined or not found.');
      }

      res.json({
        success: true,
        message: 'Status appointment berhasil diperbarui menjadi examined',
        updatedCount: result.affectedRows
      });

    } catch (error) {
      console.error('Error in updateAppointmentStatus:', error);
      res.status(500).json({ success: false, message: 'Gagal mengupdate status appointment' });
    }
  },

  reactivateAppointment: async (req, res) => {
    try {
      const { appointment_code } = req.body;

      if (!appointment_code) {
        return res.status(400).json({ success: false, message: 'appointment_code wajib diisi' });
      }

      const query = `
        UPDATE appointments 
        SET status = 'scheduled' 
        WHERE appointment_code = ? AND status = 'examined'
      `;
      
      const [result] = await pool.query(query, [appointment_code]);

      if (result.affectedRows === 0) {
        console.log('No appointment reactivated - might not be in "examined" status or not found.');
      }

      res.json({
        success: true,
        message: 'Appointment berhasil diaktifkan kembali.',
        updatedCount: result.affectedRows
      });

    } catch (error) {
      console.error('Error in reactivateAppointment:', error);
      res.status(500).json({ success: false, message: 'Gagal mengaktifkan kembali appointment.' });
    }
  },

  getVisitIdByAppointment: async (req, res) => {
    try {
      const { appointment_code } = req.params;

      if (!appointment_code) {
        return res.status(400).json({ success: false, message: 'appointment_code wajib diisi' });
      }

      const [visit] = await pool.query(`
        SELECT visit_id, patient_id, visit_date, appointment_id
        FROM visits 
        WHERE appointment_id = ?
        ORDER BY visit_date DESC
        LIMIT 1
      `, [appointment_code]);

      if (!visit || visit.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tidak ada kunjungan yang ditemukan untuk appointment ini'
        });
      }

      res.json({
        success: true,
        data: visit[0]
      });

    } catch (error) {
      console.error('Error in getVisitIdByAppointment:', error);
      res.status(500).json({ success: false, message: 'Gagal mendapatkan visit_id' });
    }
  }
};

module.exports = medicalController;