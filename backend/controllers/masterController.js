const { pool } = require('../config/db');

const doctorController = {
  getAllDoctors: async (req, res) => {
    try {
      // Ambil semua dokter beserta poli (LEFT JOIN polyclinic)
      const [doctors] = await pool.query(`
        SELECT 
          d.id, d.name, d.license_no, d.specialization, d.phone_number, d.email, d.status, d.delt_flg, d.created_at, d.updated_at, d.poli,
          p.name AS poli_name
        FROM doctors d
        LEFT JOIN polyclinic p ON d.poli = p.id
        WHERE d.delt_flg = 'N'
        ORDER BY d.name
      `);
  
      // Ambil jadwal hari untuk semua dokter
      const [schedules] = await pool.query(`
        SELECT doctor_id, day_of_week, start_time, end_time, is_active
        FROM doctor_schedule
        ORDER BY doctor_id, day_of_week, start_time
      `);
  
      // Gabungkan jadwal ke masing-masing dokter
      const doctorsWithSchedule = doctors.map(doc => {
        const docSchedules = schedules
          .filter(sch => sch.doctor_id === doc.id)
          .map(sch => ({
            day_of_week: sch.day_of_week.toLowerCase(), // Ensure lowercase for consistency
            start_time: sch.start_time,
            end_time: sch.end_time,
            is_active: !!sch.is_active // Convert to boolean (tinyint(1) to true/false)
          }));
        return {
          ...doc,
          schedule: docSchedules // Now an array of schedule objects with time
        };
      });
  
      res.json({
        status: 'success',
        data: doctorsWithSchedule
      });
    } catch (error) {
      console.error('Error in getAllDoctors:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data dokter'
      });
    }
  },

  createDoctor: async (req, res) => {
    try {
      const { name, specialization, phone_number, email, schedule, status, poli } = req.body;

      const [result] = await pool.query(
        'INSERT INTO doctors (name, specialization, phone_number, email, schedule, status, poli) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, specialization, phone_number, email, schedule, status, poli || null]
      );

      res.status(201).json({
        status: 'success',
        message: 'Data dokter berhasil ditambahkan',
        data: { id: result.insertId }
      });
    } catch (error) {
      console.error('Error in createDoctor:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal menambahkan data dokter'
      });
    }
  },

  updateDoctor: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const { id } = req.params;
      const { name, specialization, phone_number, email, status, schedule = [], poli } = req.body;

      // 1. Update doctor's details
      await connection.query(
        'UPDATE doctors SET name = ?, specialization = ?, phone_number = ?, email = ?, status = ?, poli = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, specialization, phone_number, email, status, poli || null, id]
      );

      // 2. Delete all existing schedules for this doctor
      await connection.query('DELETE FROM doctor_schedule WHERE doctor_id = ?', [id]);

      // 3. Insert new schedules if any are provided
      if (schedule.length > 0) {
        const scheduleValues = schedule.map(s => [id, s.day_of_week, s.start_time, s.end_time, s.is_active]);
        await connection.query(
          'INSERT INTO doctor_schedule (doctor_id, day_of_week, start_time, end_time, is_active) VALUES ?',
          [scheduleValues]
        );
      }

      await connection.commit();

      // Fetch the updated schedules to return to the frontend
      const [newSchedules] = await connection.query(
        'SELECT id, day_of_week, start_time, end_time FROM doctor_schedule WHERE doctor_id = ? ORDER BY FIELD(day_of_week, "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"), start_time',
        [id]
      );

      // Group schedules by day for the frontend
      const schedulesByDay = newSchedules.reduce((acc, schedule) => {
        const day = schedule.day_of_week;
        if (!acc[day]) {
          acc[day] = [];
        }
        const { day_of_week, ...rest } = schedule;
        acc[day].push(rest);
        return acc;
      }, {});

      res.json({
        status: 'success',
        message: 'Data dokter dan jadwal berhasil diperbarui',
        data: {
          schedule: schedulesByDay
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error in updateDoctor transaction:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal memperbarui data dokter. Transaksi dibatalkan.'
      });
    } finally {
      connection.release();
    }
  },

  deleteDoctor: async (req, res) => {
    try {
      const { id } = req.params;
      
      const [result] = await pool.query(
        'UPDATE doctors SET delt_flg = "Y", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Data dokter tidak ditemukan'
        });
      }

      res.json({
        status: 'success',
        message: 'Data dokter berhasil dihapus'
      });
    } catch (error) {
      console.error('Error in deleteDoctor:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal menghapus data dokter'
      });
    }
  }
};

const patientController = {
  searchPatients: async (req, res) => {
    try {
      const { search } = req.query;
      
      const [patients] = await pool.query(`
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
        WHERE (nik LIKE ? OR nama_lengkap LIKE ?)
        AND delt_flg = 'N'
        ORDER BY nama_lengkap
        LIMIT 10
      `, [`%${search}%`, `%${search}%`]);

      res.json({
        status: 'success',
        data: patients
      });
    } catch (error) {
      console.error('Error in searchPatients:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal mencari data pasien'
      });
    }
  },

  getAllPatients: async (req, res) => {
    try {
      const [patients] = await pool.query(`
        SELECT id, no_rm, nik, nama_lengkap, tanggal_lahir, jenis_kelamin, alamat, no_telepon, email, created_at, delt_flg
        FROM pasien
        WHERE delt_flg = 'N'
        ORDER BY nama_lengkap
      `);
      // Tambahkan status aktif/tidak aktif
      const result = patients.map(p => ({
        ...p,
        status: p.delt_flg === 'N' ? 'Active' : 'Inactive',
        birth_date: p.tanggal_lahir,
        gender: p.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
        phone_number: p.no_telepon,
        address: p.alamat
      }));
      res.json({ status: 'success', data: result });
    } catch (error) {
      console.error('Error in getAllPatients:', error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil data pasien' });
    }
  },

  updatePatient: async (req, res) => {
    try {
      const { no_rm } = req.params;
      const { nama_lengkap, email, phone_number, tanggal_lahir, jenis_kelamin, alamat, nik } = req.body;
      const [result] = await pool.query(
        'UPDATE pasien SET nama_lengkap=?, email=?, no_telepon=?, tanggal_lahir=?, jenis_kelamin=?, alamat=?, nik=? WHERE no_rm=?',
        [nama_lengkap, email, phone_number, tanggal_lahir, jenis_kelamin, alamat, nik, no_rm]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 'error', message: 'Pasien tidak ditemukan' });
      }
      res.json({ status: 'success', message: 'Data pasien berhasil diupdate' });
    } catch (error) {
      console.error('Update pasien error:', error);
      res.status(500).json({ status: 'error', message: 'Gagal update pasien' });
    }
  }
};

const doctorScheduleController = {
  getDoctorSchedules: async (req, res) => {
    try {
      const { doctor_id } = req.query;
      
      if (!doctor_id) {
        return res.status(400).json({
          status: 'error',
          message: 'ID dokter harus disediakan'
        });
      }

      const [schedules] = await pool.query(`
        SELECT 
          ds.id,
          ds.doctor_id,
          d.name as doctor_name,
          ds.day_of_week,
          ds.start_time,
          ds.end_time,
          ds.is_active
        FROM doctor_schedule ds
        JOIN doctors d ON ds.doctor_id = d.id
        WHERE ds.doctor_id = ? 
        AND ds.is_active = true
        ORDER BY 
          CASE ds.day_of_week
            WHEN 'monday' THEN 1
            WHEN 'tuesday' THEN 2
            WHEN 'wednesday' THEN 3
            WHEN 'thursday' THEN 4
            WHEN 'friday' THEN 5
            WHEN 'saturday' THEN 6
            WHEN 'sunday' THEN 7
          END,
          ds.start_time
      `, [doctor_id]);

      // Mengubah format data menjadi struktur yang lebih mudah digunakan
      const formattedSchedules = schedules.reduce((acc, schedule) => {
        if (!acc[schedule.day_of_week]) {
          acc[schedule.day_of_week] = [];
        }
        acc[schedule.day_of_week].push({
          id: schedule.id,
          start_time: schedule.start_time,
          end_time: schedule.end_time
        });
        return acc;
      }, {});

      res.json({
        status: 'success',
        data: formattedSchedules
      });
    } catch (error) {
      console.error('Error in getDoctorSchedules:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil jadwal dokter'
      });
    }
  },

  createDoctorSchedule: async (req, res) => {
    try {
      const { doctor_id, day_of_week, start_time, end_time } = req.body;

      // Validasi jadwal yang bertabrakan
      const [existingSchedules] = await pool.query(`
        SELECT id FROM doctor_schedule
        WHERE doctor_id = ? 
        AND day_of_week = ?
        AND is_active = true
        AND (
          (start_time <= ? AND end_time >= ?) OR
          (start_time <= ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
      `, [doctor_id, day_of_week, start_time, start_time, end_time, end_time, start_time, end_time]);

      if (existingSchedules.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Jadwal bertabrakan dengan jadwal yang sudah ada'
        });
      }

      const [result] = await pool.query(
        'INSERT INTO doctor_schedule (doctor_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)',
        [doctor_id, day_of_week, start_time, end_time]
      );

      res.status(201).json({
        status: 'success',
        message: 'Jadwal dokter berhasil ditambahkan',
        data: { id: result.insertId }
      });
    } catch (error) {
      console.error('Error in createDoctorSchedule:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal menambahkan jadwal dokter'
      });
    }
  },

  updateDoctorSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const { start_time, end_time, is_active } = req.body;

      // Validasi jadwal yang bertabrakan
      const [schedule] = await pool.query(
        'SELECT doctor_id, day_of_week FROM doctor_schedule WHERE id = ?',
        [id]
      );

      if (schedule.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Jadwal tidak ditemukan'
        });
      }

      const [existingSchedules] = await pool.query(`
        SELECT id FROM doctor_schedule
        WHERE doctor_id = ? 
        AND day_of_week = ?
        AND id != ?
        AND is_active = true
        AND (
          (start_time <= ? AND end_time >= ?) OR
          (start_time <= ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
      `, [schedule[0].doctor_id, schedule[0].day_of_week, id, start_time, start_time, end_time, end_time, start_time, end_time]);

      if (existingSchedules.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Jadwal bertabrakan dengan jadwal yang sudah ada'
        });
      }

      const [result] = await pool.query(
        'UPDATE doctor_schedule SET start_time = ?, end_time = ?, is_active = ? WHERE id = ?',
        [start_time, end_time, is_active, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Jadwal tidak ditemukan'
        });
      }

      res.json({
        status: 'success',
        message: 'Jadwal dokter berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error in updateDoctorSchedule:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal memperbarui jadwal dokter'
      });
    }
  },

  deleteDoctorSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      
      const [result] = await pool.query(
        'UPDATE doctor_schedule SET is_active = false WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Jadwal tidak ditemukan'
        });
      }

      res.json({
        status: 'success',
        message: 'Jadwal dokter berhasil dihapus'
      });
    } catch (error) {
      console.error('Error in deleteDoctorSchedule:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal menghapus jadwal dokter'
      });
    }
  }
};

const medicineController = {
  getAllMedicines: async (req, res) => {
    try {
      const [medicines] = await pool.query(`
        SELECT id, name, unit, price, delt_flg
        FROM medicines
        WHERE delt_flg = 'N'
        ORDER BY name
      `);
      res.json({ status: 'success', data: medicines });
    } catch (error) {
      console.error('Error in getAllMedicines:', error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil data obat' });
    }
  },

  createMedicine: async (req, res) => {
    try {
      const { name, unit, price } = req.body;
      if (!name || !unit || price === undefined) {
        return res.status(400).json({ status: 'error', message: 'Nama, satuan, dan harga wajib diisi' });
      }
      const [result] = await pool.query(
        'INSERT INTO medicines (name, unit, price, delt_flg) VALUES (?, ?, ?, "N")',
        [name, unit, price]
      );
      res.status(201).json({ status: 'success', message: 'Obat berhasil ditambahkan', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error in createMedicine:', error);
      res.status(500).json({ status: 'error', message: 'Gagal menambah obat' });
    }
  },

  updateMedicine: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, unit, price } = req.body;
      if (!name || !unit || price === undefined) {
        return res.status(400).json({ status: 'error', message: 'Nama, satuan, dan harga wajib diisi' });
      }
      const [result] = await pool.query(
        'UPDATE medicines SET name = ?, unit = ?, price = ? WHERE id = ? AND delt_flg = "N"',
        [name, unit, price, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 'error', message: 'Obat tidak ditemukan' });
      }
      res.json({ status: 'success', message: 'Obat berhasil diperbarui' });
    } catch (error) {
      console.error('Error in updateMedicine:', error);
      res.status(500).json({ status: 'error', message: 'Gagal memperbarui obat' });
    }
  },

  deleteMedicine: async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await pool.query(
        'UPDATE medicines SET delt_flg = "Y" WHERE id = ?',
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 'error', message: 'Obat tidak ditemukan' });
      }
      res.json({ status: 'success', message: 'Obat berhasil dihapus' });
    } catch (error) {
      console.error('Error in deleteMedicine:', error);
      res.status(500).json({ status: 'error', message: 'Gagal menghapus obat' });
    }
  },
};

const serviceController = {
  getAllServices: async (req, res) => {
    try {
      const [services] = await pool.query(`
        SELECT id, name, price, delt_flg FROM services WHERE delt_flg = 'N' ORDER BY id
      `);
      res.json({ status: 'success', data: services });
    } catch (error) {
      console.error('Error in getAllServices:', error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil data tindakan' });
    }
  },
  createService: async (req, res) => {
    try {
      const { name, price } = req.body;
      if (!name || price === undefined) {
        return res.status(400).json({ status: 'error', message: 'Nama dan harga wajib diisi' });
      }
      const [result] = await pool.query(
        'INSERT INTO services (name, price, delt_flg) VALUES (?, ?, "N")',
        [name, price]
      );
      res.status(201).json({ status: 'success', message: 'Tindakan berhasil ditambahkan', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error in createService:', error);
      res.status(500).json({ status: 'error', message: 'Gagal menambah tindakan' });
    }
  },
  updateService: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price } = req.body;
      if (!name || price === undefined) {
        return res.status(400).json({ status: 'error', message: 'Nama dan harga wajib diisi' });
      }
      const [result] = await pool.query(
        'UPDATE services SET name = ?, price = ? WHERE id = ? AND delt_flg = "N"',
        [name, price, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 'error', message: 'Tindakan tidak ditemukan' });
      }
      res.json({ status: 'success', message: 'Tindakan berhasil diperbarui' });
    } catch (error) {
      console.error('Error in updateService:', error);
      res.status(500).json({ status: 'error', message: 'Gagal memperbarui tindakan' });
    }
  },
  deleteService: async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await pool.query(
        'UPDATE services SET delt_flg = "Y" WHERE id = ?',
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 'error', message: 'Tindakan tidak ditemukan' });
      }
      res.json({ status: 'success', message: 'Tindakan berhasil dihapus' });
    } catch (error) {
      console.error('Error in deleteService:', error);
      res.status(500).json({ status: 'error', message: 'Gagal menghapus tindakan' });
    }
  },
};

const polyclinicController = {
  getAllPolyclinics: async (req, res) => {
    try {
      const [polys] = await pool.query('SELECT id, name, code, created_dt, update_dt FROM polyclinic ORDER BY id');
      res.json({ status: 'success', data: polys });
    } catch (error) {
      console.error('Error in getAllPolyclinics:', error);
      res.status(500).json({ status: 'error', message: 'Gagal mengambil data poli' });
    }
  },
  createPolyclinic: async (req, res) => {
    try {
      const { name, code } = req.body;
      if (!name || !code) {
        return res.status(400).json({ status: 'error', message: 'Nama dan kode wajib diisi' });
      }
      const [result] = await pool.query(
        'INSERT INTO polyclinic (name, code, created_dt) VALUES (?, ?, NOW())',
        [name, code]
      );
      res.status(201).json({ status: 'success', message: 'Poli berhasil ditambahkan', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error in createPolyclinic:', error);
      res.status(500).json({ status: 'error', message: 'Gagal menambah poli' });
    }
  },
  updatePolyclinic: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code } = req.body;
      if (!name || !code) {
        return res.status(400).json({ status: 'error', message: 'Nama dan kode wajib diisi' });
      }
      const [result] = await pool.query(
        'UPDATE polyclinic SET name = ?, code = ?, update_dt = NOW() WHERE id = ?',
        [name, code, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 'error', message: 'Poli tidak ditemukan' });
      }
      res.json({ status: 'success', message: 'Poli berhasil diperbarui' });
    } catch (error) {
      console.error('Error in updatePolyclinic:', error);
      res.status(500).json({ status: 'error', message: 'Gagal memperbarui poli' });
    }
  },
  deletePolyclinic: async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await pool.query('DELETE FROM polyclinic WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 'error', message: 'Poli tidak ditemukan' });
      }
      res.json({ status: 'success', message: 'Poli berhasil dihapus' });
    } catch (error) {
      console.error('Error in deletePolyclinic:', error);
      res.status(500).json({ status: 'error', message: 'Gagal menghapus poli' });
    }
  },
};

module.exports = { 
  ...doctorController, 
  ...patientController,
  ...doctorScheduleController,
  ...medicineController,
  ...serviceController,
  ...polyclinicController,
};