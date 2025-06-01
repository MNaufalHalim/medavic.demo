const { pool } = require('../config/db');

const doctorController = {
  getAllDoctors: async (req, res) => {
    try {
      // Ambil semua dokter
      const [doctors] = await pool.query(`
        SELECT 
          id,
          name,
          specialization,
          phone_number,
          email,
          status,
          created_at,
          updated_at
        FROM doctors
        WHERE delt_flg = 'N'
        ORDER BY name
      `);
  
      // Ambil jadwal hari untuk semua dokter
      const [schedules] = await pool.query(`
        SELECT doctor_id, day_of_week
        FROM doctor_schedule
        WHERE is_active = 1
        GROUP BY doctor_id, day_of_week
      `);
  
      // Gabungkan jadwal ke masing-masing dokter
      const doctorsWithSchedule = doctors.map(doc => {
        const docSchedules = schedules
          .filter(sch => sch.doctor_id === doc.id)
          .map(sch => ({
            day_of_week: sch.day_of_week,
            start_time: sch.start_time,
            end_time: sch.end_time,
            is_active: true
          }));
        return {
          ...doc,
          schedule: docSchedules // array of day_of_week, misal: ['monday', 'wednesday']
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
      const { name, specialization, phone_number, email, schedule, status } = req.body;

      const [result] = await pool.query(
        'INSERT INTO doctors (name, specialization, phone_number, email, schedule, status) VALUES (?, ?, ?, ?, ?, ?)',
        [name, specialization, phone_number, email, schedule, status]
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
    try {
      const { id } = req.params;
      const { name, specialization, phone_number, email, schedule, status } = req.body;

      const [result] = await pool.query(
        'UPDATE doctors SET name = ?, specialization = ?, phone_number = ?, email = ?, schedule = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, specialization, phone_number, email, schedule, status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Data dokter tidak ditemukan'
        });
      }

      res.json({
        status: 'success',
        message: 'Data dokter berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error in updateDoctor:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal memperbarui data dokter'
      });
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

module.exports = { 
  ...doctorController, 
  ...patientController,
  ...doctorScheduleController 
};