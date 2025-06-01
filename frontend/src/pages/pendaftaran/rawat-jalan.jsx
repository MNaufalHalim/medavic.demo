import React, { useState, useEffect } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { id } from 'date-fns/locale';
import axios from 'axios';
import config from '../../config';
import Select from 'react-select';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Coffee, 
  Edit, 
  Trash2, 
  FileText, 
  ChevronRight,
  RefreshCw,
  CalendarDays,
  UserPlus,
  Stethoscope,
  Activity,
  Save
} from 'lucide-react';
import PageTemplate from '../../components/PageTemplate';

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
`;

const todayName = format(new Date(), 'EEEE').toLowerCase();

const RawatJalan = () => {
  const getAvailableDoctors = (currentSectionIdx) => {
    return doctors.filter(doctor => 
      !selectedDoctors.some((selectedDoc, idx) => 
        idx !== currentSectionIdx && selectedDoc && selectedDoc.id === doctor.id
      )
    );
  };

  const getDoctorStatusToday = (doctor) => {
    if (!doctor || !Array.isArray(doctor.schedule)) return "not available";
  
    const dayName = todayName;
  
    return doctor.schedule.some(
      (sch) => sch.day_of_week === dayName && sch.is_active
    )
      ? "available"
      : "not available";
  };

  const [dateRange, setDateRange] = useState({
    start: startOfToday(),
    end: addDays(startOfToday(), 6),
  });
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAppointment, setEditedAppointment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [patientOptions, setPatientOptions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [selectedDoctors, setSelectedDoctors] = useState([null, null, null]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [now, setNow] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [newAppointment, setNewAppointment] = useState({
    no_rm: '',
    nik: '',
    nama_lengkap: '',
    tanggal_lahir: format(new Date(), 'yyyy-MM-dd'),
    jenis_kelamin: 'L',
    alamat: '',
    no_telepon: '',
    email: '',
    doctorId: '',
    doctor: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    type: 'Konsultasi',
    status: 'scheduled',
    notes: '',
    poli: 'umum',
    height: '',
    weight: '',
    heart_rate: '',
    blood_sugar: '',
    temperature: '',
    complaint: ''
  });

  const timeSlots = Array.from({ length: 9 }, (_, i) => ({
    time: format(new Date().setHours(9 + i, 0), 'HH:mm'),
    label: format(new Date().setHours(9 + i, 0), 'HH:mm'),
  }));

  const getTimeGroup = (time) => {
    const hour = new Date().getHours();
    const timeHour = parseInt(time.split(':')[0]);
    return hour === timeHour;
  };

  const isDoctorAvailable = (doctorId, date, time) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor || !Array.isArray(doctor.schedule)) return false;
  
    const dayName = format(date, 'EEEE').toLowerCase();
  
    return doctor.schedule.some(schedule => {
      if (!schedule) return false;
      if (schedule.day_of_week !== dayName) return false;
      if (schedule.is_active === false) return false;
      
      if (!schedule.start_time || !schedule.end_time) return false;
      
      const startTime = schedule.start_time.substring(0, 5);
      const endTime = schedule.end_time.substring(0, 5);
      
      return time >= startTime && time <= endTime;
    });
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(dateRange.start, i);
    return {
      date,
      dayName: format(date, 'EEEE', { locale: id }),
      dayDate: format(date, 'd MMM', { locale: id }),
      fullDate: format(date, 'yyyy-MM-dd'),
    };
  });

  const checkSlotStatus = (slot, doctor, date) => {
    // console.log('Checking Slot Status:', {
    //   slotTime: slot.time,
    //   doctorId: doctor?.id,
    //   doctorName: doctor?.name,
    //   date: date,
    // });

    if (!doctor) {
      return { isAvailable: false, isBreakTime: false, existingAppointment: null };
    }
  
    const time = slot.time;
    const formattedDate = format(date, 'yyyy-MM-dd');
  
    const isBreakTime = time === '12:00';
    const isAvailable = isDoctorAvailable(doctor.id, date, time);
    const existingAppointment = appointments.find(
      app => Number(app.doctorId) === Number(doctor.id) && 
             app.date === formattedDate && 
             app.time === time
    );
  
    const result = { isAvailable, isBreakTime, existingAppointment };
    // console.log('Slot Status Result:', result);
    return result;
  };

  const handleSlotClick = (time, date) => {
    setModalType('new');
    setShowModal(true);
    setNewAppointment({
      no_rm: '',
      nik: '',
      nama_lengkap: '',
      tanggal_lahir: format(new Date(), 'yyyy-MM-dd'),
      jenis_kelamin: 'L',
      alamat: '',
      no_telepon: '',
      email: '',
      doctorId: '',
      doctor: '',
      date: date,
      time: time,
      type: 'Konsultasi',
      status: 'scheduled',
      notes: '',
      poli: 'umum',
      height: '',
      weight: '',
      heart_rate: '',
      blood_sugar: '',
      temperature: '',
      complaint: ''
    });
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setModalType('detail');
    setShowModal(true);
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [dateRange]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/rm/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: format(dateRange.start, 'yyyy-MM-dd'),
          end_date: format(dateRange.end, 'yyyy-MM-dd'),
        },
      });
      console.log('API Response for Appointments:', response.data);
      if (response.data.status === 'success') {
        const fetchedAppointments = response.data.data.map((apt) => {
          const mappedAppointment = {
            appointment_code: apt.appointment_code,
            patientId: apt.patient_no_rm,
            patientName: apt.patient_name,
            doctorId: apt.doctor_id, // Map doctor_id to doctorId
            doctor: apt.doctor || 'Unknown Doctor', // Fallback if doctor name is missing
            date: format(new Date(apt.appointment_date), 'yyyy-MM-dd'),
            time: apt.appointment_time.substring(0, 5),
            type: apt.type,
            status: apt.status,
            notes: apt.notes || '',
            poli: apt.poli || 'umum',
          };
          console.log('Mapped Appointment:', mappedAppointment);
          return mappedAppointment;
        });
        console.log('Setting Appointments State:', fetchedAppointments);
        setAppointments(fetchedAppointments);
      } else {
        console.error('Failed to fetch appointments:', response.data.message);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/master/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.data.status === 'success') {
        const doctorsWithScheduleObjects = response.data.data.map(doctor => {
          if (Array.isArray(doctor.schedule) && typeof doctor.schedule[0] === 'string') {
            return {
              ...doctor,
              schedule: doctor.schedule.map(day => ({
                day_of_week: day.toLowerCase(),
                start_time: '09:00',
                end_time: '17:00',
                is_active: true,
              }))
            };
          }
          return doctor;
        });
        console.log('Fetched Doctors:', doctorsWithScheduleObjects);
        setDoctors(doctorsWithScheduleObjects);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchDoctorSchedule = async (doctorId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/master/doctor-schedules`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { doctor_id: doctorId }
      });
      if (response.data.status === 'success') {
        const formattedSchedule = [];
        Object.entries(response.data.data).forEach(([day, timeSlots]) => {
          timeSlots.forEach(slot => {
            formattedSchedule.push({
              day_of_week: day.toLowerCase(),
              start_time: slot.start_time.substring(0, 5),
              end_time: slot.end_time.substring(0, 5),
              is_active: true,
              id: slot.id
            });
          });
        });
        setDoctors(prevDoctors => prevDoctors.map(doc => 
          doc.id === doctorId ? { ...doc, schedule: formattedSchedule } : doc
        ));
      }
    } catch (error) {
      console.error('Error fetching doctor schedule:', error);
    }
  };

  const handleSelectDoctor = (doctorId, sectionIdx) => {
    const fullDoctorData = doctors.find(d => d.id === doctorId);
    if (fullDoctorData) {
      setSelectedDoctors(prev => {
        const newArr = [...prev];
        newArr[sectionIdx] = fullDoctorData;
        return newArr;
      });
      fetchDoctorSchedule(doctorId);
    }
  };

  const handleCreateAppointment = async () => {
    try {
      const token = localStorage.getItem('token');
      let appointmentData;
      let finalPatientNoRm = selectedPatient?.no_rm;

      console.log('Creating Appointment with:', { selectedPatient, showNewPatientForm, newAppointment });

      if (!selectedPatient && showNewPatientForm) {
        const patientData = {
          nik: newAppointment.nik,
          nama_lengkap: newAppointment.nama_lengkap,
          tanggal_lahir: newAppointment.tanggal_lahir,
          jenis_kelamin: newAppointment.jenis_kelamin,
          alamat: newAppointment.alamat,
          no_telepon: newAppointment.no_telepon,
          email: newAppointment.email
        };
        const patientResponse = await axios.post(`${config.apiUrl}/rm/register`, patientData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (patientResponse.data.status !== 'success') {
          throw new Error('Failed to register patient');
        }
        finalPatientNoRm = patientResponse.data.data.no_rm;
        console.log('Registered new patient with no_rm:', finalPatientNoRm);
      } else if (selectedPatient) {
        finalPatientNoRm = selectedPatient.no_rm;
      } else {
        throw new Error('No patient selected or registered');
      }

      if (!finalPatientNoRm) {
        throw new Error('No patient selected or registered');
      }

      if (!newAppointment.doctorId) {
        throw new Error('No doctor selected');
      }

      // Generate a timestamp to ensure unique appointment codes
      const timestamp = new Date().getTime();
      
      appointmentData = {
        patient_no_rm: finalPatientNoRm,
        doctor_id: Number(newAppointment.doctorId), // Ensure doctorId is a number
        appointment_date: newAppointment.date,
        appointment_time: newAppointment.time,
        type: newAppointment.type,
        notes: newAppointment.notes,
        poli: newAppointment.poli,
        height: newAppointment.height,
        weight: newAppointment.weight,
        heart_rate: newAppointment.heart_rate,
        blood_sugar: newAppointment.blood_sugar,
        temperature: newAppointment.temperature,
        complaint: newAppointment.complaint,
        timestamp: timestamp // Add timestamp to ensure unique appointment code generation
      };

      console.log('Sending Appointment Data:', appointmentData);
      const response = await axios.post(`${config.apiUrl}/rm/appointments`, appointmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Create Appointment Response:', response.data);

      if (response.data.status === 'success') {
        await fetchAppointments(); // Refresh appointments to include the new one
        console.log('Appointments Refreshed After Creation');
        setShowModal(false);
        setSelectedPatient(null);
        setShowNewPatientForm(false);
        setNewAppointment({
          no_rm: '',
          nik: '',
          nama_lengkap: '',
          tanggal_lahir: format(new Date(), 'yyyy-MM-dd'),
          jenis_kelamin: 'L',
          alamat: '',
          no_telepon: '',
          email: '',
          doctorId: '',
          doctor: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          time: '09:00',
          type: 'Konsultasi',
          status: 'scheduled',
          notes: '',
          poli: 'umum',
          height: '',
          weight: '',
          heart_rate: '',
          blood_sugar: '',
          temperature: '',
          complaint: ''
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment: ' + error.message);
    }
  };

  const handleUpdateAppointment = async () => {
    try {
      const token = localStorage.getItem('token');
      const appointmentData = {
        doctor_id: Number(editedAppointment.doctorId), // Ensure doctorId is a number
        appointment_date: editedAppointment.date,
        appointment_time: editedAppointment.time,
        type: editedAppointment.type,
        status: editedAppointment.status,
        notes: editedAppointment.notes,
        poli: editedAppointment.poli,
      };

      console.log('Updating appointment with data:', appointmentData);

      const response = await axios.put(
        `${config.apiUrl}/rm/appointments/${selectedAppointment.appointment_code}`,
        appointmentData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Update Appointment Response:', response.data);

      if (response.data.status === 'success') {
        await fetchAppointments(); // Refresh appointments to reflect changes
        setShowModal(false);
        setIsEditing(false);
        setEditedAppointment(null);
      } else {
        throw new Error(response.data.message || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment: ' + error.message);
    }
  };

  const handleDeleteAppointment = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.apiUrl}/rm/appointments/${selectedAppointment.appointment_code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAppointments();
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment: ' + error.message);
    }
  };

  const handleAddClick = () => {
    setModalType('new');
    setShowModal(true);
    setNewAppointment({
      no_rm: '',
      nik: '',
      nama_lengkap: '',
      tanggal_lahir: format(new Date(), 'yyyy-MM-dd'),
      jenis_kelamin: 'L',
      alamat: '',
      no_telepon: '',
      email: '',
      doctorId: '',
      doctor: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      type: 'Konsultasi',
      status: 'scheduled',
      notes: '',
      poli: 'umum',
      height: '',
      weight: '',
      heart_rate: '',
      blood_sugar: '',
      temperature: '',
      complaint: ''
    });
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedAppointment({ ...selectedAppointment });
  };

  const handleDeleteClick = () => {
    setConfirmAction(() => async () => {
      await handleDeleteAppointment();
      setShowConfirmModal(false);
      setShowModal(false);
    });
    setShowConfirmModal(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedAppointment(null);
  };

  const handleEditSubmit = () => {
    setConfirmAction(() => async () => {
      await handleUpdateAppointment();
      setIsEditing(false);
      setEditedAppointment(null);
      setShowConfirmModal(false);
      setShowModal(false);
    });
    setShowConfirmModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditedAppointment(null);
    setModalType(null);
    setSelectedAppointment(null);
    setSelectedPatient(null);
    setShowNewPatientForm(false);
    setPatientOptions([]);
    setNewAppointment({
      no_rm: '',
      nik: '',
      nama_lengkap: '',
      tanggal_lahir: format(new Date(), 'yyyy-MM-dd'),
      jenis_kelamin: 'L',
      alamat: '',
      no_telepon: '',
      email: '',
      doctorId: '',
      doctor: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      type: 'Konsultasi',
      status: 'scheduled',
      notes: '',
      poli: 'umum',
      height: '',
      weight: '',
      heart_rate: '',
      blood_sugar: '',
      temperature: '',
      complaint: ''
    });
  };

  const highlightMatch = (text, search) => {
    if (!text) return '';
    if (!search || search.length < 3) return text;
    
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    const parts = String(text).split(regex);
    
    return (
      <span>
        {parts.filter(part => part).map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="bg-yellow-200">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const searchPatients = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 3) {
      setPatientOptions([]);
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/rm/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { keyword: searchTerm }
      });
  
      if (response.data.status === 'success') {
        const options = response.data.data.map(patient => {
          const birthDate = new Date(patient.tanggal_lahir);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          
          return {
            value: patient.no_rm,
            label: (
              <div className="flex items-center gap-3 py-1">
                <div className={`w-8 h-8 rounded-full ${patient.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'} flex items-center justify-center font-medium text-lg`}>
                  {patient.jenis_kelamin}
                </div>
                <div>
                  <div className="font-medium">
                    {highlightMatch(patient.nama_lengkap, searchTerm)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {highlightMatch(patient.nik, searchTerm)} • {age} tahun
                  </div>
                </div>
              </div>
            ),
            data: patient,
            age
          };
        });
        
        const finalOptions = [
          ...options,
          {
            value: 'new',
            label: (
              <div className="text-center py-2">
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  + Tambah Pasien Baru
                </button>
              </div>
            ),
            isDisabled: false
          }
        ];
        
        setPatientOptions(finalOptions);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatientOptions([]);
    }
  };

  const handlePatientSelect = (selected) => {
    if (selected?.value === 'new') {
      setShowNewPatientForm(true);
      setSelectedPatient(null);
      setNewAppointment(prev => ({
        ...prev,
        no_rm: '',
        nik: '',
        nama_lengkap: '',
        tanggal_lahir: format(new Date(), 'yyyy-MM-dd'),
        jenis_kelamin: 'L',
        alamat: '',
        no_telepon: '',
        email: ''
      }));
      return;
    }
  
    if (selected) {
      setSelectedPatient(selected.data);
      setShowNewPatientForm(false);
      setNewAppointment(prev => ({
        ...prev,
        no_rm: selected.value,
        nik: selected.data.nik,
        nama_lengkap: selected.data.nama_lengkap,
        tanggal_lahir: selected.data.tanggal_lahir,
        jenis_kelamin: selected.data.jenis_kelamin,
        alamat: selected.data.alamat,
        no_telepon: selected.data.no_telepon,
        email: selected.data.email
      }));
    } else {
      setSelectedPatient(null);
      setNewAppointment(prev => ({
        ...prev,
        no_rm: ''
      }));
    }
  };

  return (
    <PageTemplate>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="">
        {/* Modern Header with Gradient Background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-md p-6 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <CalendarDays className="mr-3" size={28} strokeWidth={2} />
                Jadwal Kunjungan
              </h1>
              <p className="text-blue-100 mt-2 flex items-center">
                <Calendar className="mr-2" size={16} />
                {format(dateRange.start, 'EEEE', { locale: id })}, {format(dateRange.start, 'dd MMM yyyy', { locale: id })} - {format(dateRange.end, 'EEEE', { locale: id })}, {format(dateRange.end, 'dd MMM yyyy', { locale: id })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button 
                  className={`bg-white/10 backdrop-blur-sm hover:bg-white/20 px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 text-white transition-all duration-200 ${format(dateRange.start, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') ? 'ring-2 ring-white/50' : ''}`}
                  onClick={(e) => {
                    const datePicker = e.currentTarget.querySelector('input[type="date"]');
                    datePicker.showPicker();
                  }}
                >
                  <Calendar size={18} />
                  <span>
                    {format(dateRange.start, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') ? 'Hari Ini, ' : ''}
                    {format(dateRange.start, 'd MMM yyyy', { locale: id })}
                  </span>
                  <input
                    type="date"
                    value={format(dateRange.start, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newStart = new Date(e.target.value);
                      setDateRange({
                        start: newStart,
                        end: addDays(newStart, 6)
                      });
                    }}
                    className="absolute opacity-0 w-0 h-0"
                  />
                </button>
                <button 
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 p-2.5 rounded-lg shadow-sm flex items-center justify-center text-white transition-all duration-200"
                  onClick={() => {
                    setDateRange({
                      start: startOfToday(),
                      end: addDays(startOfToday(), 6)
                    });
                  }}
                  title="Kembali ke hari ini"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <button 
                onClick={handleAddClick} 
                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-lg font-medium shadow-sm flex items-center transition-all duration-200"
              >
                <Plus size={18} className="mr-1" />
                Tambah Kunjungan
              </button>
            </div>
          </div>
          
          {/* Weekly Calendar */}
          <div className="flex items-center justify-between mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-3 overflow-x-auto">
            {Array.from({ length: 7 }, (_, i) => {
              const day = addDays(dateRange.start, i);
              const isToday = format(day, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
              return (
                <div 
                  key={i} 
                  className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all duration-200 min-w-[80px] ${isToday ? 'bg-white/20 shadow-md' : 'hover:bg-white/10'}`}
                  onClick={() => {
                    setDateRange({
                      start: day,
                      end: addDays(day, 6)
                    });
                  }}
                >
                  <div className="text-xs text-blue-100">{format(day, 'EEEE', { locale: id })}</div>
                  <div className={`text-xl font-bold ${isToday ? 'text-white' : 'text-blue-100'} mt-1`}>{format(day, 'd')}</div>
                  <div className="text-xs text-blue-100">{format(day, 'MMM', { locale: id })}</div>
                  {isToday && <div className="h-1 w-6 bg-white rounded-full mt-1"></div>}
                </div>
              );
            })}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="bg-white/20 rounded-full p-3 mr-3">
                <User size={20} />
              </div>
              <div>
                <div className="text-sm text-blue-100">Total Pasien</div>
                <div className="text-2xl font-bold">{appointments.length}</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="bg-white/20 rounded-full p-3 mr-3">
                <Stethoscope size={20} />
              </div>
              <div>
                <div className="text-sm text-blue-100">Dokter Aktif</div>
                <div className="text-2xl font-bold">{selectedDoctors.filter(d => d !== null).length}</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="bg-white/20 rounded-full p-3 mr-3">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-sm text-blue-100">Kunjungan Hari Ini</div>
                <div className="text-2xl font-bold">
                  {appointments.filter(apt => apt.date === format(new Date(), 'yyyy-MM-dd')).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="min-w-[700px] grid grid-cols-[80px_repeat(3,1fr)] border-b border-gray-100">
            <div className="p-4 border-r border-gray-100 bg-gray-50 flex items-center justify-center">
              <div className="text-gray-500 font-medium text-sm">GMT +07:00</div>
            </div>
            {[0, 1, 2].map((sectionIdx) => {
              const doctor = selectedDoctors[sectionIdx];
              const appointmentCount = doctor ? 
                appointments.filter(apt => 
                  Number(apt.doctorId) === Number(doctor.id) && 
                  apt.date === format(dateRange.start, 'yyyy-MM-dd')
                ).length || 0 : 0;
              
              return (
                <div
                  key={sectionIdx}
                  className={`${sectionIdx !== 2 ? 'border-r border-gray-100' : ''}`}
                >
                  <div className="relative">
                    <button
                      onClick={() => {
                        setSelectedSection(sectionIdx);
                        setShowDoctorModal(!showDoctorModal);
                      }}
                      className={`w-full p-5 ${doctor ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/50 hover:bg-gray-100/50'} transition-all duration-200`}
                    >
                      {doctor ? (
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-medium text-xl shrink-0 shadow-md">
                            {doctor.name.charAt(0)}
                          </div>
                          <div className="flex flex-col items-start flex-1 text-left">
                            <span className="font-semibold text-gray-800 text-lg">Dr. {doctor.name}</span>
                            <span className="text-sm text-gray-500 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                              {doctor.specialization || 'Spesialis Umum'}
                            </span>
                            <div className="flex items-center mt-2">
                              <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                <Calendar size={14} className="mr-1" />
                                <span>
                                  {appointmentCount} {appointmentCount === 1 ? 'Pasien' : 'Pasien'}
                                </span>
                              </div>
                              <div className={`ml-2 text-xs px-2 py-1 rounded-lg flex items-center ${getDoctorStatusToday(doctor) === "available" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                                {getDoctorStatusToday(doctor) === "available" ? 
                                  <><CheckCircle size={12} className="mr-1" /> Tersedia</> : 
                                  <><AlertCircle size={12} className="mr-1" /> Tidak Tersedia</>
                                }
                              </div>
                            </div>
                          </div>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const newDoctors = [...selectedDoctors];
                              newDoctors[sectionIdx] = null;
                              setSelectedDoctors(newDoctors);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200"
                          >
                            <X size={18} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-gray-400 justify-center py-4 hover:text-blue-500 transition-all duration-200">
                          <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <Plus size={24} />
                          </div>
                          <span className="font-medium">Pilih Dokter</span>
                        </div>
                      )}
                    </button>

                    {showDoctorModal && selectedSection === sectionIdx && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 max-h-[400px] overflow-hidden">
                        <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search size={16} className="text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={doctorSearchTerm}
                              onChange={(e) => setDoctorSearchTerm(e.target.value)}
                              placeholder="Cari dokter..."
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-[340px]">
                          {getAvailableDoctors(selectedSection).length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                              <Stethoscope size={40} className="mx-auto mb-2 text-gray-300" />
                              <p>Tidak ada dokter tersedia</p>
                            </div>
                          ) : getAvailableDoctors(selectedSection)
                            .filter(d => d.name.toLowerCase().includes(doctorSearchTerm.toLowerCase()))
                            .length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                              <Search size={40} className="mx-auto mb-2 text-gray-300" />
                              <p>Tidak ada hasil pencarian</p>
                            </div>
                          ) : (
                            <div className="p-2 grid gap-2">
                              {getAvailableDoctors(selectedSection)
                                .filter(d => d.name.toLowerCase().includes(doctorSearchTerm.toLowerCase()))
                                .map(doctor => (
                                  <div
                                    key={doctor.id}
                                    onClick={() => {
                                      handleSelectDoctor(doctor.id, selectedSection);
                                      setShowDoctorModal(false);
                                      setDoctorSearchTerm('');
                                    }}
                                    className="w-full p-3 text-left hover:bg-blue-50 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-150"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-medium shadow-sm">
                                      {doctor.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-800">
                                        Dr. {doctor.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {doctor.specialization || 'Spesialis Umum'}
                                      </div>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center ${getDoctorStatusToday(doctor) === "available" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                                      {getDoctorStatusToday(doctor) === "available" ? 
                                        <><CheckCircle size={12} className="mr-1" /> Tersedia</> : 
                                        <><AlertCircle size={12} className="mr-1" /> Tidak Tersedia</>
                                      }
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[80px_repeat(3,1fr)] relative">

            
            <div className="border-r border-gray-100 bg-gray-50 relative">
              {timeSlots.map((slot, idx) => {
                const isCurrentHour = format(dateRange.start, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') && 
                                     parseInt(slot.time.split(':')[0]) === parseInt(format(now, 'HH'));
                return (
                  <div
                    key={idx}
                    className={`h-24 border-b border-gray-100 flex items-center justify-center text-gray-500 font-medium relative ${isCurrentHour ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`flex items-center ${isCurrentHour ? 'text-blue-600 font-bold' : ''}`}>
                      {isCurrentHour && (
                        <div className="relative mr-2">
                          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                          <div className="relative h-3 w-3 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                      {slot.time}
                    </div>
                    
                    {/* Current time indicator */}
                    {format(dateRange.start, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') && 
                     slot.time <= format(now, 'HH:mm') && 
                     parseInt(slot.time.split(':')[0]) + 1 > parseInt(format(now, 'HH')) && (
                      <div className="ml-1" style={{
                        top: `${((parseInt(format(now, 'mm')) / 60) * 100)}%`,
                      }}>
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                            <div className="relative h-4 w-4 bg-blue-500 rounded-full shadow-md flex items-center justify-center">
                              <Clock size={10} className="text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              

            </div>

            {[0, 1, 2].map((sectionIdx) => {
              const doctor = selectedDoctors[sectionIdx];
              return (
                <div key={sectionIdx} className={`${sectionIdx !== 2 ? 'border-r border-gray-100' : ''}`}>
                  {timeSlots.map((slot, timeIdx) => {
                    const { isAvailable, isBreakTime, existingAppointment } = checkSlotStatus(slot, doctor, dateRange.start);

                    return (
                      <div
                        key={timeIdx}
                        className={`h-24 border-b border-gray-100 relative ${
                          !doctor
                            ? 'bg-gray-50/30'
                            : isBreakTime
                            ? 'bg-amber-50/50'
                            : !isAvailable
                            ? 'bg-gray-100/70'
                            : !existingAppointment
                            ? 'group hover:bg-blue-50 transition-colors duration-200'
                            : ''
                        } ${
                          format(dateRange.start, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') && 
                          slot.time === format(now, 'HH:00') ? 'ring-2 ring-blue-400 ring-inset' : ''
                        }`}
                      >
                        {/* Current time indicator for doctor slots */}
                        {/* {format(dateRange.start, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') && 
                         slot.time <= format(now, 'HH:mm') && 
                         parseInt(slot.time.split(':')[0]) + 1 > parseInt(format(now, 'HH')) && (
                          <div className="absolute z-40" style={{
                            top: `${((parseInt(format(now, 'mm')) / 60) * 100)}%`,
                            right: '8px'
                          }}>
                            <div className="relative">
                              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                              <div className="relative h-3 w-3 bg-blue-500 rounded-full shadow-md"></div>
                            </div>
                          </div>
                        )} */}

                        {/* Current time indicator */}
                        {/* {format(dateRange.start, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') && 
                         slot.time <= format(now, 'HH:mm') && 
                         parseInt(slot.time.split(':')[0]) + 1 > parseInt(format(now, 'HH')) && (
                          <div className="absolute left-0 right-0 z-40" style={{
                            top: `${((parseInt(format(now, 'mm')) / 60) * 100)}%`,
                          }}>
                            <div className="flex items-center">
                              <div className="h-5 w-5 rounded-full bg-red-500 shadow-lg flex items-center justify-center text-white -ml-2.5">
                                <Clock size={12} />
                              </div>
                              <div className="h-0.5 w-full bg-red-500 shadow-sm"></div>
                              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow-md -mr-1">
                                {format(now, 'HH:mm')}
                              </div>
                            </div>
                          </div>
                        )} */}
                        {isBreakTime && (
                          <div className="absolute inset-0 flex items-center justify-center z-30">
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#fef3c7_10px,#fef3c7_20px)] opacity-30"></div>
                            <div className="bg-amber-100 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg z-40 shadow-sm flex items-center">
                              <Coffee size={14} className="mr-1.5" />
                              <span className="font-medium">BREAK TIME</span>
                            </div>
                          </div>
                        )}
                        
                        {!isBreakTime && !isAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center z-20">
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#f3f4f6_10px,#f3f4f6_20px)] opacity-30"></div>
                            <div className="bg-gray-100 border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg z-30 shadow-sm flex items-center">
                              <AlertCircle size={14} className="mr-1.5" />
                              <span className="font-medium">NOT AVAILABLE</span>
                            </div>
                          </div>
                        )}

                        {!isBreakTime && isAvailable && existingAppointment && (
                          <button
                            onClick={() => handleAppointmentClick(existingAppointment)}
                            className="absolute inset-0 z-10 p-3 text-left transition-transform duration-200 hover:scale-[1.02] focus:scale-[1.02] focus:outline-none"
                          >
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 h-full flex flex-col text-white shadow-md">
                              <div className="flex justify-between items-start">
                                <span className="font-medium truncate text-base">
                                  {existingAppointment.patientName}
                                </span>
                                <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                                  {existingAppointment.type}
                                </span>
                              </div>
                              <div className="mt-auto flex items-center text-xs text-blue-100">
                                <Clock size={12} className="mr-1" />
                                <span>{slot.time}</span>
                              </div>
                            </div>
                          </button>
                        )}
                        
                        {!isBreakTime && isAvailable && !existingAppointment && doctor && (
                          <button
                            onClick={() => {
                              setModalType('new');
                              setShowModal(true);
                              setNewAppointment(prev => ({
                                ...prev,
                                doctorId: doctor.id,
                                doctor: doctor.name,
                                date: format(dateRange.start, 'yyyy-MM-dd'),
                                time: slot.time,
                                type: 'Konsultasi',
                                status: 'scheduled',
                                poli: 'umum',
                                height: '',
                                weight: '',
                                heart_rate: '',
                                blood_sugar: '',
                                temperature: '',
                                notes: ''
                              }));
                            }}
                            className="absolute inset-0 z-10 flex items-center justify-center p-3"
                          >
                            <div className="border-2 border-dashed border-blue-200 rounded-lg w-full h-full flex items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50/50 transition-all duration-200">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform group-hover:scale-105 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2">
                                <Plus size={16} />
                                <span className="font-medium">Tambah Kunjungan</span>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl border border-gray-100 transform transition-all duration-300 ease-in-out flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5 flex justify-between items-center rounded-t-xl">
              <h3 className="text-xl font-bold text-white flex items-center">
                {modalType === 'new' ? (
                  <>
                    <UserPlus className="mr-3" size={22} />
                    Tambah Kunjungan Baru
                  </>
                ) : (
                  <>
                    <FileText className="mr-3" size={22} />
                    {`Detail Kunjungan ${isEditing ? '(Edit Mode)' : ''}`}
                  </>
                )}
              </h3>
              <button 
                onClick={handleCloseModal} 
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(90vh - 70px)' }}>
              {modalType === 'new' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm">
                    <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                      <Search className="mr-2 text-blue-500" size={18} />
                      Cari Pasien
                    </h4>
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="flex-1 relative">
                        <div className="relative">
                          <Select
                            isClearable
                            isSearchable
                            placeholder="Cari berdasarkan NIK atau nama (min. 3 huruf)..."
                            options={patientOptions}
                            onInputChange={(value, { action }) => {
                              if (action === 'input-change') {
                                searchPatients(value);
                              }
                            }}
                            onChange={handlePatientSelect}
                            className="basic-single"
                            classNamePrefix="select"
                            styles={{
                              control: (baseStyles, state) => ({
                                ...baseStyles,
                                borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
                                boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                                borderRadius: '0.5rem',
                                padding: '2px',
                                '&:hover': {
                                  borderColor: '#3b82f6'
                                }
                              }),
                              option: (styles, { isSelected, isFocused }) => ({
                                ...styles,
                                backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#dbeafe' : null,
                                color: isSelected ? 'white' : '#374151',
                                ':active': {
                                  backgroundColor: '#3b82f6',
                                  color: 'white'
                                }
                              })
                            }}
                          />
                        </div>
                        {selectedPatient && (
                          <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 shadow-sm flex items-center justify-between animate-fadeIn">
                            <div className="flex items-center">
                              <div className={`w-12 h-12 rounded-full ${selectedPatient.jenis_kelamin === 'L' ? 'bg-blue-500' : 'bg-pink-500'} text-white flex items-center justify-center font-bold text-lg mr-3 shadow-sm`}>
                                {selectedPatient.nama_lengkap.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-800 text-base">{selectedPatient.nama_lengkap}</div>
                                <div className="text-sm text-gray-500 flex items-center flex-wrap gap-1 mt-0.5">
                                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                    RM: {selectedPatient.no_rm}
                                  </span>
                                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                                    {selectedPatient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                  </span>
                                  {selectedPatient.tanggal_lahir && (
                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                                      {format(new Date(selectedPatient.tanggal_lahir), 'dd MMM yyyy')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setSelectedPatient(null);
                                setShowNewPatientForm(true);
                              }}
                              className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                              title="Hapus pilihan pasien"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPatient(null);
                          setShowNewPatientForm(prev => !prev);
                        }}
                        className={`px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${showNewPatientForm ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' : 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'}`}
                      >
                        {showNewPatientForm ? (
                          <>
                            <X size={16} />
                            Batal
                          </>
                        ) : (
                          <>
                            <UserPlus size={16} />
                            Pasien Baru
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {selectedPatient && (
                    <div className="space-y-4 bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm">
                      <h4 className="font-medium text-gray-900">Detail Pasien</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">NIK</h4>
                          <p className="mt-1 text-gray-900">{selectedPatient.nik}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Nama Lengkap</h4>
                          <p className="mt-1 text-gray-900">{selectedPatient.nama_lengkap}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Tanggal Lahir</h4>
                          <p className="mt-1 text-gray-900">
                            {format(new Date(selectedPatient.tanggal_lahir), 'dd MMM yyyy')}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Jenis Kelamin</h4>
                          <p className="mt-1 text-gray-900">
                            {selectedPatient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Alamat</h4>
                          <p className="mt-1 text-gray-900">{selectedPatient.alamat}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">No. Telepon</h4>
                          <p className="mt-1 text-gray-900">{selectedPatient.no_telepon}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedPatient && showNewPatientForm && (
                    <div className="space-y-5 bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800 flex items-center">
                          <UserPlus className="mr-2 text-blue-500" size={18} />
                          Data Pasien Baru
                        </h4>
                        <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          Isi data pasien dengan lengkap
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                            NIK
                            <span className="ml-1 text-red-500">*</span>
                          </h4>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <CreditCard className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={newAppointment.nik}
                              onChange={(e) =>
                                setNewAppointment((prev) => ({
                                  ...prev,
                                  nik: e.target.value,
                                }))
                              }
                              className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                              placeholder="Masukkan NIK"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="relative">
                          <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                            Nama Lengkap
                            <span className="ml-1 text-red-500">*</span>
                          </h4>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={newAppointment.nama_lengkap}
                              onChange={(e) =>
                                setNewAppointment((prev) => ({
                                  ...prev,
                                  nama_lengkap: e.target.value,
                                }))
                              }
                              className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                              placeholder="Masukkan nama lengkap"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                            Tanggal Lahir
                            <span className="ml-1 text-red-500">*</span>
                          </h4>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="date"
                              value={newAppointment.tanggal_lahir}
                              onChange={(e) =>
                                setNewAppointment((prev) => ({
                                  ...prev,
                                  tanggal_lahir: e.target.value,
                                }))
                              }
                              className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="relative">
                          <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                            Jenis Kelamin
                            <span className="ml-1 text-red-500">*</span>
                          </h4>
                          <div className="flex gap-3">
                            <div 
                              onClick={() => setNewAppointment(prev => ({ ...prev, jenis_kelamin: 'L' }))} 
                              className={`flex-1 border ${newAppointment.jenis_kelamin === 'L' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-lg p-3 flex items-center cursor-pointer transition-all duration-200 hover:border-blue-300`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${newAppointment.jenis_kelamin === 'L' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                <Male size={16} />
                              </div>
                              <span className={`${newAppointment.jenis_kelamin === 'L' ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>Laki-laki</span>
                            </div>
                            <div 
                              onClick={() => setNewAppointment(prev => ({ ...prev, jenis_kelamin: 'P' }))} 
                              className={`flex-1 border ${newAppointment.jenis_kelamin === 'P' ? 'border-pink-500 bg-pink-50' : 'border-gray-300'} rounded-lg p-3 flex items-center cursor-pointer transition-all duration-200 hover:border-pink-300`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${newAppointment.jenis_kelamin === 'P' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                <Female size={16} />
                              </div>
                              <span className={`${newAppointment.jenis_kelamin === 'P' ? 'text-pink-700 font-medium' : 'text-gray-700'}`}>Perempuan</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <h4 className="text-sm font-medium text-gray-600 mb-1.5">
                          Alamat
                        </h4>
                        <div className="relative">
                          <textarea
                            value={newAppointment.alamat}
                            onChange={(e) =>
                              setNewAppointment((prev) => ({
                                ...prev,
                                alamat: e.target.value,
                              }))
                            }
                            rows={3}
                            className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                            placeholder="Masukkan alamat lengkap"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                            No. Telepon
                            <span className="ml-1 text-red-500">*</span>
                          </h4>
                          <div className="relative">
                            <input
                              type="tel"
                              value={newAppointment.no_telepon}
                              onChange={(e) =>
                                setNewAppointment((prev) => ({
                                  ...prev,
                                  no_telepon: e.target.value,
                                }))
                              }
                              className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                              placeholder="Masukkan nomor telepon"
                              required
                            />
                          </div>
                        </div>
                        <div className="relative">
                          <h4 className="text-sm font-medium text-gray-600 mb-1.5">
                            Email
                          </h4>
                          <div className="relative">
                            <input
                              type="email"
                              value={newAppointment.email}
                              onChange={(e) =>
                                setNewAppointment((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                              placeholder="Masukkan email"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-5 bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <Calendar className="mr-2 text-blue-500" size={18} />
                      Data Kunjungan
                    </h4>
                    
                    <div className="relative">
                      <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                        Dokter
                        <span className="ml-1 text-red-500">*</span>
                      </h4>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Stethoscope size={16} className="text-gray-400" />
                        </div>
                        <select
                          value={newAppointment.doctorId}
                          onChange={(e) => {
                            const doctor = doctors.find(d => d.id === parseInt(e.target.value, 10));
                            setNewAppointment(prev => ({
                              ...prev,
                              doctorId: e.target.value,
                              doctor: doctor ? doctor.name : ''
                            }));
                          }}
                          className="block w-full pl-10 px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 bg-white"
                          required
                        >
                          <option value="">Pilih Dokter</option>
                          {doctors.map(doctor => (
                            <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                          Tanggal
                          <span className="ml-1 text-red-500">*</span>
                        </h4>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CalendarDays size={16} className="text-gray-400" />
                          </div>
                          <input
                            type="date"
                            value={newAppointment.date}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                            className="block w-full pl-10 px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="relative">
                        <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                          Waktu
                          <span className="ml-1 text-red-500">*</span>
                        </h4>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Clock size={16} className="text-gray-400" />
                          </div>
                          <select
                            value={newAppointment.time}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                            className="block w-full pl-10 px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 bg-white"
                            required
                          >
                            {timeSlots.map(slot => (
                              <option key={slot.time} value={slot.time}>{slot.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                        Poliklinik
                        <span className="ml-1 text-red-500">*</span>
                      </h4>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Stethoscope size={16} className="text-gray-400" />
                        </div>
                        <select
                          value={newAppointment.poli}
                          onChange={(e) => setNewAppointment(prev => ({ ...prev, poli: e.target.value }))}
                          className="block w-full pl-10 px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 bg-white"
                          required
                        >
                          <option value="umum">Umum</option>
                          <option value="gigi">Gigi</option>
                          <option value="anak">Anak</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-5 bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <Activity className="mr-2 text-blue-500" size={18} />
                      Vital Signs
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                          Height (cm)
                          <span className="ml-1 text-red-500">*</span>
                        </h4>
                        <div className="relative">
                          <input
                            type="number"
                            value={newAppointment.height}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, height: e.target.value }))}
                            className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                            placeholder="Masukkan tinggi"
                            required
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                          Weight (kg)
                          <span className="ml-1 text-red-500">*</span>
                        </h4>
                        <div className="relative">
                          <input
                            type="number"
                            value={newAppointment.weight}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, weight: e.target.value }))}
                            className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                            placeholder="Masukkan berat"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                          Heart Rate (bpm)
                          <span className="ml-1 text-red-500">*</span>
                        </h4>
                        <div className="relative">
                          <input
                            type="number"
                            value={newAppointment.heart_rate}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, heart_rate: e.target.value }))}
                            className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                            placeholder="Masukkan detak jantung"
                            required
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                          Blood Sugar (mg/dL)
                          <span className="ml-1 text-red-500">*</span>
                        </h4>
                        <div className="relative">
                          <input
                            type="number"
                            value={newAppointment.blood_sugar}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, blood_sugar: e.target.value }))}
                            className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                            placeholder="Masukkan gula darah"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                        Temperature (°C)
                        <span className="ml-1 text-red-500">*</span>
                      </h4>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={newAppointment.temperature}
                          onChange={(e) => setNewAppointment(prev => ({ ...prev, temperature: e.target.value }))}
                          className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                          placeholder="Masukkan suhu"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-5 bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <FileText className="mr-2 text-blue-500" size={18} />
                      Keluhan & Catatan
                    </h4>
                    
                    <div className="relative">
                      <h4 className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                        Keluhan
                        <span className="ml-1 text-red-500">*</span>
                      </h4>
                      <div className="relative">
                        <textarea
                          value={newAppointment.complaint}
                          onChange={(e) => setNewAppointment(prev => ({ ...prev, complaint: e.target.value }))}
                          rows={5}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                          placeholder="Masukkan keluhan pasien"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="relative">
                      <h4 className="text-sm font-medium text-gray-600 mb-1.5">
                        Catatan Tambahan
                      </h4>
                      <div className="relative">
                        <textarea
                          value={newAppointment.notes}
                          onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                          rows={5}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                          placeholder="Masukkan catatan tambahan jika ada"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'detail' && (
                <div className="space-y-6">
                  {!isEditing ? (
                    <>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Nama Pasien</h4>
                          <p className="mt-1 text-gray-900">{selectedAppointment.patientName}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Dokter</h4>
                          <p className="mt-1 text-gray-900">{selectedAppointment.doctor}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Tanggal</h4>
                            <p className="mt-1 text-gray-900">
                              {format(new Date(selectedAppointment.date), 'dd MMM yyyy')}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Waktu</h4>
                            <p className="mt-1 text-gray-900">{selectedAppointment.time}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Status</h4>
                          <p className="mt-1 text-gray-900">{selectedAppointment.status}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Poliklinik</h4>
                          <p className="mt-1 text-gray-900">{selectedAppointment.poli}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Catatan</h4>
                          <p className="mt-1 text-gray-900">{selectedAppointment.notes || '-'}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Nama Pasien</h4>
                          <p className="mt-1 text-gray-900">{editedAppointment.patientName}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Dokter</h4>
                          <select
                            value={editedAppointment.doctorId}
                            onChange={(e) => {
                              const doctor = doctors.find((d) => d.id === parseInt(e.target.value, 10));
                              setEditedAppointment((prev) => ({
                                ...prev,
                                doctorId: e.target.value,
                                doctor: doctor ? doctor.name : '',
                              }));
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            {doctors.map((doctor) => (
                              <option key={doctor.id} value={doctor.id}>
                                {doctor.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Tanggal</h4>
                            <input
                              type="date"
                              value={editedAppointment.date}
                              onChange={(e) =>
                                setEditedAppointment((prev) => ({ ...prev, date: e.target.value }))
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Waktu</h4>
                            <select
                              value={editedAppointment.time}
                              onChange={(e) =>
                                setEditedAppointment((prev) => ({ ...prev, time: e.target.value }))
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              {timeSlots.map((slot) => (
                                <option key={slot.time} value={slot.time}>
                                  {slot.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Status</h4>
                          <select
                            value={editedAppointment.status}
                            onChange={(e) =>
                              setEditedAppointment((prev) => ({ ...prev, status: e.target.value }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Poliklinik</h4>
                          <select
                            value={editedAppointment.poli}
                            onChange={(e) =>
                              setEditedAppointment((prev) => ({ ...prev, poli: e.target.value }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="umum">Umum</option>
                            <option value="gigi">Gigi</option>
                            <option value="anak">Anak</option>
                          </select>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Catatan</h4>
                          <textarea
                            value={editedAppointment.notes}
                            onChange={(e) =>
                              setEditedAppointment((prev) => ({ ...prev, notes: e.target.value }))
                            }
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="border-t px-6 py-5 bg-gradient-to-r from-gray-50 to-white flex justify-end gap-3">
              {modalType === 'new' ? (
                <>
                  <button
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                  >
                    <X size={16} />
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setConfirmAction(() => handleCreateAppointment);
                      setShowConfirmModal(true);
                    }}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
                  >
                    <Save size={16} />
                    Simpan
                  </button>
                </>
              ) : (
                <>
                  {!isEditing ? (
                    <>
                      <button
                        onClick={handleDeleteClick}
                        className="px-5 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-100 rounded-lg hover:bg-red-50 transition-all duration-200 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Hapus
                      </button>
                      <button
                        onClick={handleEditClick}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEditCancel}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                      >
                        <X size={16} />
                        Batal
                      </button>
                      <button
                        onClick={handleEditSubmit}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
                      >
                        <Save size={16} />
                        Simpan
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Konfirmasi
            </h3>
            <p className="text-gray-500 mb-6">
              Apakah Anda yakin ingin menyimpan perubahan ini?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  confirmAction();
                  setShowConfirmModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
};

export default RawatJalan;
