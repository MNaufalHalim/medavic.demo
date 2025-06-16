import React, { useState, useEffect } from "react";
import { format, addDays, startOfToday } from "date-fns";
import { id, enUS } from "date-fns/locale";
import axios from "axios";
import config from "../../config";
import Select from "react-select";
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
  Save,
  CreditCard,
  UserCircle,
  Heart,
  Building2,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  XCircle,
  Clipboard,
} from "lucide-react";
import PageTemplate from "../../components/PageTemplate";

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

const RawatJalan = () => {
  const getAvailableDoctors = (currentSectionIdx) => {
    return doctors.filter(
      (doctor) =>
        !selectedDoctors.some(
          (selectedDoc, idx) =>
            idx !== currentSectionIdx &&
            selectedDoc &&
            selectedDoc.id === doctor.id,
        ),
    );
  };

  const getDoctorStatusOnDate = (doctor, date) => {
    // console.log(`[STATUS_CHECK] Doctor: ${doctor?.name}, Date: ${date}`);
    if (doctor && doctor.schedule && doctor.schedule.length > 0) {
      // console.log(
      //   `[STATUS_CHECK] Dr. ${doctor.name}'s schedule:`,
      //   JSON.stringify(doctor.schedule, null, 2),
      // );
    } else if (doctor) {
      // console.log(
      //   `[STATUS_CHECK] Dr. ${doctor.name} has no schedule or empty schedule.`,
      // );
    }

    if (
      !doctor ||
      !Array.isArray(doctor.schedule) ||
      doctor.schedule.length === 0
    ) {
      // console.log(
      //   `[STATUS_CHECK] Dr. ${doctor?.name} - No schedule data, returning 'not available'.`,
      // );
      return "not available";
    }

    const dayName = format(new Date(date), "EEEE", {
      locale: enUS,
    }).toLowerCase();
    // console.log(
    //   `[STATUS_CHECK] Calculated dayName: '${dayName}' (using enUS) for date: ${date}`,
    // );
    const isAvailable = doctor.schedule.some((sch) => {
      // console.log(
      //   `[STATUS_CHECK]   Comparing: Schedule Day='${sch.day_of_week?.toLowerCase()}', Calculated Day='${dayName}', IsActive=${sch.is_active}`,
      // );
      return sch.day_of_week.toLowerCase() === dayName && sch.is_active;
    });
      // console.log(
      //   `[STATUS_CHECK] Dr. ${doctor?.name} - Final availability for ${dayName}: ${isAvailable}`,
      // );
    return isAvailable ? "available" : "not available";
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
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDoctorName, setSelectedDoctorName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [poli, setPoli] = useState("");
  const [complaint, setComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [newPatient, setNewPatient] = useState({
    nik: "",
    nama_lengkap: "",
    tanggal_lahir: format(new Date(), "yyyy-MM-dd"),
    jenis_kelamin: "L",
    alamat: "",
    no_telepon: "",
    email: "",
  });
  // State untuk view mode dan modal
  const [viewMode, setViewMode] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAppointmentData, setSelectedAppointmentData] = useState(null);
  const [formData, setFormData] = useState({
    doctor_id: "",
    appointment_date: "",
    appointment_time: "",
    poli: "",
    complaint: "",
    notes: ""
  });

  // Tambahkan fungsi untuk menutup modal view
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedAppointmentData(null);
    setViewMode(false);
  };

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    no_rm: "",
    nik: "",
    nama_lengkap: "",
    tanggal_lahir: format(new Date(), "yyyy-MM-dd"),
    jenis_kelamin: "L",
    alamat: "",
    no_telepon: "",
    email: "",
    doctorId: "",
    doctor: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    type: "Konsultasi",
    status: "scheduled",
    notes: "",
    poli: "umum",
    height: "",
    weight: "",
    heart_rate: "",
    blood_sugar: "",
    temperature: "",
    complaint: "",
  });

  const timeSlots = Array.from({ length: 9 }, (_, i) => ({
    time: format(new Date().setHours(9 + i, 0), "HH:mm"),
    label: format(new Date().setHours(9 + i, 0), "HH:mm"),
  }));

  const getTimeGroup = (time) => {
    const hour = new Date().getHours();
    const timeHour = parseInt(time.split(":")[0]);
    return hour === timeHour;
  };

  const isDoctorAvailable = (doctorId, appointmentDate, timeSlot) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor || !Array.isArray(doctor.schedule)) return false;

    const dayName = format(new Date(appointmentDate), "EEEE", {
      locale: enUS,
    }).toLowerCase();
    // console.log(`[isDoctorAvailable] Checking for Dr.ID ${doctorId} on ${dayName} (${appointmentDate}) at ${timeSlot}`);

    return doctor.schedule.some((sch) => {
      // console.log(`[isDoctorAvailable]   Comparing with schedule: Day=${sch.day_of_week}, Start=${sch.start_time}, End=${sch.end_time}, Active=${sch.is_active}`);
      if (!sch || sch.day_of_week !== dayName || !sch.is_active) {
        return false;
      }

      // Ensure start_time and end_time exist
      if (!sch.start_time || !sch.end_time) {
        // console.log(`[isDoctorAvailable]   Missing start_time or end_time for a schedule on ${dayName}`);
        return false;
      }

      const scheduleStartTime = sch.start_time.substring(0, 5); // HH:mm
      const scheduleEndTime = sch.end_time.substring(0, 5); // HH:mm

      // Dokter tersedia jika timeSlot >= scheduleStartTime DAN timeSlot < scheduleEndTime
      // Contoh: Slot 09:00, Jadwal 09:00-12:00. 09:00 >= 09:00 (true) && 09:00 < 12:00 (true) -> AVAILABLE
      // Contoh: Slot 12:00, Jadwal 09:00-12:00. 12:00 >= 09:00 (true) && 12:00 < 12:00 (false) -> NOT AVAILABLE (slot 12:00 adalah awal slot berikutnya)
      const isAvailableInSlot =
        timeSlot >= scheduleStartTime && timeSlot < scheduleEndTime;
      // if (isAvailableInSlot) {
      //   console.log(`[isDoctorAvailable]     MATCH! Dr.ID ${doctorId} available at ${timeSlot} (Schedule: ${scheduleStartTime}-${scheduleEndTime} on ${dayName})`);
      // }
      return isAvailableInSlot;
    });
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(dateRange.start, i);
    return {
      date,
      dayName: format(date, "EEEE", { locale: id }),
      dayDate: format(date, "d MMM", { locale: id }),
      fullDate: format(date, "yyyy-MM-dd"),
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
      return {
        isAvailable: false,
        isBreakTime: false,
        existingAppointment: null,
      };
    }

    const time = slot.time;
    const formattedDate = format(date, "yyyy-MM-dd");

    const isBreakTime = time === "12:00";
    const isAvailable = isDoctorAvailable(doctor.id, date, time);
    const existingAppointment = appointments.find(
      (app) =>
        Number(app.doctorId) === Number(doctor.id) &&
        app.date === formattedDate &&
        app.time === time,
    );

    const result = { isAvailable, isBreakTime, existingAppointment };
    // console.log('Slot Status Result:', result);
    return result;
  };

  // Tambahkan state untuk tracking slot yang dipilih
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Tambahkan fungsi untuk format waktu
  const formatTimeToHour = (time) => {
    if (!time) return "";
    return time.split(":")[0] + ":00";
  };

  const fetchAppointmentDetails = async (appointmentId) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/rm/appointments/${appointmentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.status === "success") {
        console.log("Detail appointment berhasil diambil:", response.data.data);
        return response.data.data;
      } else {
        console.error("Gagal mengambil detail appointment:", response.data.message);
        return null;
      }
    } catch (error) {
      console.error("Error mengambil detail appointment:", error);
      return null;
    }
  };

  const handleSlotClick = async (slot) => {
    console.log("handleSlotClick dipanggil dengan slot:", slot);
    
    if (slot.appointment) {
      setViewMode(true);
      const appointmentDetails = await fetchAppointmentDetails(slot.appointment.appointment_code);
      if (appointmentDetails) {
        setSelectedAppointmentData(appointmentDetails);
        setShowViewModal(true);
        setShowModal(false);
      }
    } else {
      setViewMode(false);
      setSelectedAppointmentData(null);
      setShowViewModal(false);
    setShowModal(true);
      setModalType("new");

      // Set data otomatis berdasarkan slot yang diklik
      const selectedDoctor = doctors.find(doc => doc.id === slot.doctorId);
      if (selectedDoctor) {
        console.log("Doctor ditemukan:", selectedDoctor);
        
        // Set doctor data
        setSelectedDoctor(selectedDoctor.id);
        setSelectedDoctorName(selectedDoctor.name);
        setPoli(selectedDoctor.poli || "umum");

        // Set appointment data
        setNewAppointment(prev => ({
          ...prev,
          doctorId: selectedDoctor.id,
          doctor: selectedDoctor.name,
          date: format(slot.date, "yyyy-MM-dd"),
          time: slot.time,
      type: "Konsultasi",
      status: "scheduled",
          poli: selectedDoctor.poli || "umum",
      height: "",
      weight: "",
      heart_rate: "",
      blood_sugar: "",
      temperature: "",
          complaint: ""
        }));

        // Set form data
        setFormData(prev => ({
          ...prev,
          doctor_id: selectedDoctor.id,
          appointment_date: format(slot.date, "yyyy-MM-dd"),
          appointment_time: slot.time,
          poli: selectedDoctor.poli || "umum"
        }));

        console.log("Form Data setelah update:", formData);

        // Set selected date and time
        setAppointmentDate(format(slot.date, "yyyy-MM-dd"));
        setSelectedTime(slot.time);
        setSelectedSlot({
          time: slot.time,
          date: slot.date,
          doctor: selectedDoctor
        });

    // Update available time slots
        await updateAvailableTimeSlots(selectedDoctor.id, format(slot.date, "yyyy-MM-dd"));
      } else {
        console.log("Doctor tidak ditemukan untuk ID:", slot.doctorId);
      }
    }
  };

  const handleAppointmentClick = async (appointment) => {
    console.log("=== DEBUG INFO ===");
    console.log("1. Appointment yang diklik:", appointment);
    console.log("2. Show View Modal Status:", true);
    console.log("3. View Mode Status:", true);
    console.log("=================");
    
    setViewMode(true);
    const appointmentDetails = await fetchAppointmentDetails(appointment.appointment_code);
    if (appointmentDetails) {
      setSelectedAppointmentData(appointmentDetails);
      setShowViewModal(true);
      setShowModal(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    // console.log(
    //   "[EFFECT] dateRange.start changed to:",
    //   dateRange.start,
    //   "Fetching appointments...",
    // );
    fetchAppointments();
  }, [dateRange.start]);

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
      const token = localStorage.getItem("token");
      const response = await axios.get(`${config.apiUrl}/rm/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: format(dateRange.start, "yyyy-MM-dd"),
          end_date: format(dateRange.end, "yyyy-MM-dd"),
        },
      });
      console.log("API Response for Appointments:", response.data);
      if (response.data.status === "success") {
        const fetchedAppointments = response.data.data.map((apt) => {
          const mappedAppointment = {
            appointment_code: apt.appointment_code,
            patientId: apt.patient_no_rm,
            patientName: apt.patient_name,
            doctorId: apt.doctor_id, // Map doctor_id to doctorId
            doctor: apt.doctor || "Unknown Doctor", // Fallback if doctor name is missing
            date: format(new Date(apt.appointment_date), "yyyy-MM-dd"),
            time: apt.appointment_time.substring(0, 5),
            type: apt.type,
            status: apt.status,
            notes: apt.notes || "",
            poli: apt.poli || "umum",
          };
          console.log("Mapped Appointment:", mappedAppointment);
          return mappedAppointment;
        });
        console.log("Setting Appointments State:", fetchedAppointments);
        setAppointments(fetchedAppointments);
      } else {
        console.error("Failed to fetch appointments:", response.data.message);
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${config.apiUrl}/master/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === "success") {
        const doctorsWithScheduleObjects = response.data.data.map((doctor) => {
          if (
            Array.isArray(doctor.schedule) &&
            typeof doctor.schedule[0] === "string"
          ) {
            return {
              ...doctor,
              schedule: doctor.schedule.map((day) => ({
                day_of_week: day.toLowerCase(),
                start_time: "09:00",
                end_time: "17:00",
                is_active: true,
              })),
            };
          }
          return doctor;
        });
        console.log("Fetched Doctors:", doctorsWithScheduleObjects);
        setDoctors(doctorsWithScheduleObjects);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchDoctorSchedule = async (doctorId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${config.apiUrl}/master/doctor-schedules`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { doctor_id: doctorId },
        },
      );
      if (response.data.status === "success") {
        const formattedSchedule = [];
        Object.entries(response.data.data).forEach(([day, timeSlots]) => {
          timeSlots.forEach((slot) => {
            formattedSchedule.push({
              day_of_week: day.toLowerCase(),
              start_time: slot.start_time.substring(0, 5),
              end_time: slot.end_time.substring(0, 5),
              is_active: true,
              id: slot.id,
            });
          });
        });
        setDoctors((prevDoctors) =>
          prevDoctors.map((doc) =>
            doc.id === doctorId ? { ...doc, schedule: formattedSchedule } : doc,
          ),
        );
      }
    } catch (error) {
      console.error("Error fetching doctor schedule:", error);
    }
  };

  const handleSelectDoctor = (doctorId, sectionIdx) => {
    const fullDoctorData = doctors.find((d) => d.id === doctorId);
    if (fullDoctorData) {
      setSelectedDoctors((prev) => {
        const newArr = [...prev];
        newArr[sectionIdx] = fullDoctorData;
        return newArr;
      });
      fetchDoctorSchedule(doctorId);
    }
  };

  const handleCreateAppointment = async () => {
    try {
      const token = localStorage.getItem("token");
      let appointmentData;
      let finalPatientNoRm = selectedPatient?.no_rm;

      console.log("Creating Appointment with:", {
        selectedPatient,
        showNewPatientForm,
        newAppointment,
      });

      if (!selectedPatient && showNewPatientForm) {
        const patientData = {
          nik: newPatient.nik,
          nama_lengkap: newPatient.nama_lengkap,
          tanggal_lahir: newPatient.tanggal_lahir,
          jenis_kelamin: newPatient.jenis_kelamin,
          alamat: newPatient.alamat,
          no_telepon: newPatient.no_telepon,
          email: newPatient.email,
        };
        const patientResponse = await axios.post(
          `${config.apiUrl}/rm/register`,
          patientData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (patientResponse.data.status !== "success") {
          throw new Error("Failed to register patient");
        }
        finalPatientNoRm = patientResponse.data.data.no_rm;
        console.log("Registered new patient with no_rm:", finalPatientNoRm);
      } else if (selectedPatient) {
        finalPatientNoRm = selectedPatient.no_rm;
      } else {
        throw new Error("No patient selected or registered");
      }

      if (!finalPatientNoRm) {
        throw new Error("No patient selected or registered");
      }

      if (!newAppointment.doctorId) {
        throw new Error("No doctor selected");
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
        timestamp: timestamp, // Add timestamp to ensure unique appointment code generation
      };

      console.log("Sending Appointment Data:", appointmentData);
      const response = await axios.post(
        `${config.apiUrl}/rm/appointments`,
        appointmentData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log("Create Appointment Response:", response.data);

      if (response.data.status === "success") {
        await fetchAppointments(); // Refresh appointments to include the new one
        console.log("Appointments Refreshed After Creation");
        setShowModal(false);
        setSelectedPatient(null);
        setShowNewPatientForm(false);
        setNewAppointment({
          no_rm: "",
          nik: "",
          nama_lengkap: "",
          tanggal_lahir: format(new Date(), "yyyy-MM-dd"),
          jenis_kelamin: "L",
          alamat: "",
          no_telepon: "",
          email: "",
          doctorId: "",
          doctor: "",
          date: format(new Date(), "yyyy-MM-dd"),
          time: "09:00",
          type: "Konsultasi",
          status: "scheduled",
          notes: "",
          poli: "umum",
          height: "",
          weight: "",
          heart_rate: "",
          blood_sugar: "",
          temperature: "",
          complaint: "",
        });
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Failed to create appointment: " + error.message);
    }
  };

  const handleUpdateAppointment = async () => {
    try {
      const token = localStorage.getItem("token");
      const appointmentData = {
        doctor_id: Number(editedAppointment.doctorId), // Ensure doctorId is a number
        appointment_date: editedAppointment.date,
        appointment_time: editedAppointment.time,
        type: editedAppointment.type,
        status: editedAppointment.status,
        notes: editedAppointment.notes,
        poli: editedAppointment.poli,
      };

      console.log("Updating appointment with data:", appointmentData);

      const response = await axios.put(
        `${config.apiUrl}/rm/appointments/${selectedAppointment.appointment_code}`,
        appointmentData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("Update Appointment Response:", response.data);

      if (response.data.status === "success") {
        await fetchAppointments(); // Refresh appointments to reflect changes
        setShowModal(false);
        setIsEditing(false);
        setEditedAppointment(null);
      } else {
        throw new Error(
          response.data.message || "Failed to update appointment",
        );
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert("Failed to update appointment: " + error.message);
    }
  };

  const handleDeleteAppointment = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${config.apiUrl}/rm/appointments/${selectedAppointment.appointment_code}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await fetchAppointments();
      setShowModal(false);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      alert("Failed to delete appointment: " + error.message);
    }
  };

  // Modifikasi handleAddClick untuk menangani klik tombol tambah kunjungan
  const handleAddClick = () => {
    setViewMode(false);
    setSelectedAppointmentData(null);
    setShowModal(true);
    setModalType("new");
    setSelectedSlot(null);
    setNewAppointment({
      no_rm: "",
      nik: "",
      nama_lengkap: "",
      tanggal_lahir: format(new Date(), "yyyy-MM-dd"),
      jenis_kelamin: "L",
      alamat: "",
      no_telepon: "",
      email: "",
      doctorId: "",
      doctor: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "09:00",
      type: "Konsultasi",
      status: "scheduled",
      notes: "",
      poli: "umum",
      height: "",
      weight: "",
      heart_rate: "",
      blood_sugar: "",
      temperature: "",
      complaint: "",
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

  // Modifikasi handleCloseModal
  const handleCloseModal = () => {
    setShowModal(false);
    setShowViewModal(false);
    setIsEditing(false);
    setEditedAppointment(null);
    setModalType(null);
    setSelectedAppointment(null);
    setSelectedPatient(null);
    setShowNewPatientForm(false);
    setPatientOptions([]);
    setSelectedSlot(null);
    setViewMode(false);
    setSelectedAppointmentData(null);
    setSelectedDoctor("");
    setSelectedDoctorName("");
    setFormData({
      doctor_id: "",
      appointment_date: "",
      appointment_time: "",
      poli: "",
      complaint: "",
      notes: ""
    });
    setNewAppointment({
      no_rm: "",
      nik: "",
      nama_lengkap: "",
      tanggal_lahir: format(new Date(), "yyyy-MM-dd"),
      jenis_kelamin: "L",
      alamat: "",
      no_telepon: "",
      email: "",
      doctorId: "",
      doctor: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "09:00",
      type: "Konsultasi",
      status: "scheduled",
      notes: "",
      poli: "umum",
      height: "",
      weight: "",
      heart_rate: "",
      blood_sugar: "",
      temperature: "",
      complaint: "",
    });
  };

  const highlightMatch = (text, search) => {
    if (!text) return "";
    if (!search || search.length < 3) return text;

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedSearch})`, "gi");
    const parts = String(text).split(regex);

    return (
      <span>
        {parts
          .filter((part) => part)
          .map((part, i) =>
            regex.test(part) ? (
              <span key={i} className="bg-yellow-200">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
      </span>
    );
  };

  // State untuk pencarian pasien
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fungsi pencarian pasien
  const searchPatients = async (term) => {
    try {
      if (!term || term.length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${config.apiUrl}/rm/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { keyword: term },
      });

      if (response.data.status === "success") {
        setSearchResults(response.data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Effect untuk pencarian pasien
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchPatients(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Modifikasi handlePatientSelect
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setShowNewPatientForm(false);

    // Jika ada slot yang dipilih, gunakan data dari slot tersebut
    if (selectedSlot) {
      setSelectedDoctor(selectedSlot.doctor.id);
      setAppointmentDate(selectedSlot.date);
      setSelectedTime(selectedSlot.time);
      setPoli(selectedSlot.doctor.poli || "umum");
      setNewAppointment((prev) => ({
        ...prev,
        doctorId: selectedSlot.doctor.id,
        doctor: selectedSlot.doctor.name,
        date: selectedSlot.date,
        time: selectedSlot.time,
        poli: selectedSlot.doctor.poli || "umum",
      }));
    } else {
      // Reset form pendaftaran jika tidak ada slot yang dipilih
      setSelectedDoctor("");
      setAppointmentDate("");
      setSelectedTime("");
      setPoli("");
      setNewAppointment((prev) => ({
        ...prev,
        doctorId: "",
        doctor: "",
        date: "",
        time: "",
        poli: "",
      }));
    }
    setComplaint("");
    setNotes("");
  };

  // Fungsi untuk menangani perubahan input
  const handleInputChange = (e, field) => {
    const value = e.target.value;
    switch (field) {
      case "poli":
        setPoli(value);
        setNewAppointment(prev => ({
          ...prev,
          poli: value
        }));
        setFormData(prev => ({
          ...prev,
          poli: value
        }));
        break;
      case "complaint":
        setComplaint(value);
        setNewAppointment(prev => ({
          ...prev,
          complaint: value
        }));
        break;
      case "notes":
        setNotes(value);
        setNewAppointment(prev => ({
          ...prev,
          notes: value
        }));
        break;
      case "appointmentDate":
        setAppointmentDate(value);
        setNewAppointment(prev => ({
          ...prev,
          date: value
        }));
        setFormData(prev => ({
          ...prev,
          appointment_date: value
        }));
        // Reset waktu saat tanggal berubah
        setSelectedTime("");
        // Update available time slots
        if (selectedDoctor) {
          updateAvailableTimeSlots(selectedDoctor, value);
        }
        break;
      case "selectedTime":
        // Format waktu ke format jam saja
        const formattedTime = value + ":00";
        setSelectedTime(formattedTime);
        setNewAppointment(prev => ({
          ...prev,
          time: formattedTime
        }));
        setFormData(prev => ({
          ...prev,
          appointment_time: formattedTime
        }));
        break;
      default:
        break;
    }
  };

  // Fungsi untuk update available time slots
  const updateAvailableTimeSlots = async (doctorId, date) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${config.apiUrl}/appointments/available-slots`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { doctorId, date },
        },
      );

      if (response.data.status === "success") {
        setAvailableTimeSlots(response.data.data);
      } else {
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error("Error fetching available time slots:", error);
      setAvailableTimeSlots([]);
    }
  };

  // Fungsi untuk menangani pemilihan dokter
  const handleDoctorSelect = (doctorId) => {
    const selectedDoctor = doctors.find(doc => doc.id === doctorId);
    if (selectedDoctor) {
    setSelectedDoctor(doctorId);
      setSelectedDoctorName(selectedDoctor.name);
      setPoli(selectedDoctor.poli || "umum");

      // Update newAppointment dengan data dokter
      setNewAppointment(prev => ({
        ...prev,
        doctorId: selectedDoctor.id,
        doctor: selectedDoctor.name,
        poli: selectedDoctor.poli || "umum"
      }));

      // Update form data
      setFormData(prev => ({
        ...prev,
        doctor_id: selectedDoctor.id,
        poli: selectedDoctor.poli || "umum"
      }));

    // Reset waktu saat dokter berubah
    setSelectedTime("");
      
    // Update available time slots jika tanggal sudah dipilih
    if (appointmentDate) {
      updateAvailableTimeSlots(doctorId, appointmentDate);
      }
    }
  };

  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState("success");
  const [notificationMessage, setNotificationMessage] = useState("");

  const showSuccessNotification = (message) => {
    setNotificationType("success");
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  const showErrorNotification = (message) => {
    setNotificationType("error");
    setNotificationMessage(message);
    setShowNotification(true);
  };

  const handleSubmit = async () => {
    try {
      if (!selectedPatient && !showNewPatientForm) {
        showErrorNotification("Silakan pilih pasien terlebih dahulu");
        return;
      }

      if (!selectedDoctor) {
        showErrorNotification("Silakan pilih dokter terlebih dahulu");
        return;
      }

      if (!appointmentDate) {
        showErrorNotification("Silakan pilih tanggal kunjungan");
        return;
      }

      if (!selectedTime) {
        showErrorNotification("Silakan pilih waktu kunjungan");
        return;
      }

      if (!poli) {
        showErrorNotification("Silakan pilih poli");
        return;
      }

      if (!complaint) {
        showErrorNotification("Silakan isi keluhan");
        return;
      }

      // Update newAppointment dengan data terbaru
      setNewAppointment((prev) => ({
        ...prev,
        doctorId: selectedDoctor,
        date: appointmentDate,
        time: selectedTime,
        poli: poli,
        complaint: complaint,
        notes: notes,
      }));

      // Panggil handleCreateAppointment
      await handleCreateAppointment();
      showSuccessNotification("Pendaftaran berhasil dibuat!");
    } catch (error) {
      console.error("Error creating appointment:", error);
      showErrorNotification("Terjadi kesalahan saat melakukan pendaftaran");
    }
  };

  // Fungsi untuk reset form
  const resetForm = () => {
    setSelectedPatient(null);
    setShowNewPatientForm(false);
    setSelectedDoctor("");
    setAppointmentDate("");
    setSelectedTime("");
    setPoli("");
    setComplaint("");
    setNotes("");
    setAvailableTimeSlots([]);
    setNewPatient({
      nik: "",
      nama_lengkap: "",
      tanggal_lahir: format(new Date(), "yyyy-MM-dd"),
      jenis_kelamin: "L",
      alamat: "",
      no_telepon: "",
      email: "",
    });
  };

  // Tambahkan useEffect untuk menutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showDoctorSearch &&
        !event.target.closest(".doctor-search-container")
      ) {
        setShowDoctorSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDoctorSearch]);

  

  return (
    <PageTemplate>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="min-h-screen bg-gray-50">
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
                {format(dateRange.start, "EEEE", { locale: id })},{" "}
                {format(dateRange.start, "dd MMM yyyy", { locale: id })} -{" "}
                {format(dateRange.end, "EEEE", { locale: id })},{" "}
                {format(dateRange.end, "dd MMM yyyy", { locale: id })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  className={`bg-white/10 backdrop-blur-sm hover:bg-white/20 px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 text-white transition-all duration-200 ${format(dateRange.start, "yyyy-MM-dd") === format(now, "yyyy-MM-dd") ? "ring-2 ring-white/50" : ""}`}
                  onClick={(e) => {
                    const datePicker =
                      e.currentTarget.querySelector('input[type="date"]');
                    datePicker.showPicker();
                  }}
                >
                  <Calendar size={18} />
                  <span>
                    {format(dateRange.start, "yyyy-MM-dd") ===
                    format(now, "yyyy-MM-dd")
                      ? "Hari Ini, "
                      : ""}
                    {format(dateRange.start, "d MMM yyyy", { locale: id })}
                  </span>
                  <input
                    type="date"
                    value={format(dateRange.start, "yyyy-MM-dd")}
                    onChange={(e) => {
                      const newStart = new Date(e.target.value);
                      setDateRange({
                        start: newStart,
                        end: addDays(newStart, 6),
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
                      end: addDays(startOfToday(), 6),
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
              const isToday =
                format(day, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
              return (
                <div
                  key={i}
                  className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all duration-200 min-w-[80px] ${isToday ? "bg-white/20 shadow-md" : "hover:bg-white/10"}`}
                  onClick={() => {
                    setDateRange({
                      start: day,
                      end: addDays(day, 6),
                    });
                  }}
                >
                  <div className="text-xs text-blue-100">
                    {format(day, "EEEE", { locale: id })}
                  </div>
                  <div
                    className={`text-xl font-bold ${isToday ? "text-white" : "text-blue-100"} mt-1`}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="text-xs text-blue-100">
                    {format(day, "MMM", { locale: id })}
                  </div>
                  {isToday && (
                    <div className="h-1 w-6 bg-white rounded-full mt-1"></div>
                  )}
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
                <div className="text-2xl font-bold">
                  {selectedDoctors.filter((d) => d !== null).length}
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="bg-white/20 rounded-full p-3 mr-3">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-sm text-blue-100">Kunjungan Hari Ini</div>
                <div className="text-2xl font-bold">
                  {
                    appointments.filter(
                      (apt) => apt.date === format(new Date(), "yyyy-MM-dd"),
                    ).length
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="min-w-[700px] grid grid-cols-[80px_repeat(3,1fr)] border-b border-gray-100">
            <div className="p-4 border-r border-gray-100 bg-gray-50 flex items-center justify-center">
              <div className="text-gray-500 font-medium text-sm">
                GMT +07:00
              </div>
            </div>
            {[0, 1, 2].map((sectionIdx) => {
              const doctor = selectedDoctors[sectionIdx];
              const appointmentCount = doctor
                ? appointments.filter(
                    (apt) =>
                      Number(apt.doctorId) === Number(doctor.id) &&
                      apt.date === format(dateRange.start, "yyyy-MM-dd"),
                  ).length || 0
                : 0;

              return (
                <div
                  key={sectionIdx}
                  className={`${sectionIdx !== 2 ? "border-r border-gray-100" : ""}`}
                >
                  <div className="relative">
                    <button
                      onClick={() => {
                        setSelectedSection(sectionIdx);
                        setShowDoctorModal(!showDoctorModal);
                      }}
                      className={`w-full p-5 ${doctor ? "bg-white hover:bg-blue-50/30" : "bg-gray-50/50 hover:bg-gray-100/50"} transition-all duration-200`}
                    >
                      {doctor ? (
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-medium text-xl shrink-0 shadow-md">
                            {doctor.name.charAt(0)}
                          </div>
                          <div className="flex flex-col items-start flex-1 text-left">
                            <span className="font-semibold text-gray-800 text-lg">
                              Dr. {doctor.name}
                            </span>
                            <span className="text-sm text-gray-500 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                              {doctor.specialization || "Spesialis Umum"}
                            </span>
                            <div className="flex items-center mt-2">
                              <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                <Calendar size={14} className="mr-1" />
                                <span>
                                  {appointmentCount}{" "}
                                  {appointmentCount === 1 ? "Pasien" : "Pasien"}
                                </span>
                              </div>
                              <div
                                className={`ml-2 text-xs px-2 py-1 rounded-lg flex items-center ${getDoctorStatusOnDate(doctor, dateRange.start) === "available" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
                              >
                                {getDoctorStatusOnDate(
                                  doctor,
                                  dateRange.start,
                                ) === "available" ? (
                                  <>
                                    <CheckCircle size={12} className="mr-1" />{" "}
                                    Tersedia
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle size={12} className="mr-1" />{" "}
                                    Tidak Tersedia
                                  </>
                                )}
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
                              onChange={(e) =>
                                setDoctorSearchTerm(e.target.value)
                              }
                              placeholder="Cari dokter..."
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-[300px] doctor-list-scrollable">
                          {(() => {
                            const availableDoctorsForSection =
                              getAvailableDoctors(selectedSection);
                            let doctorsToDisplay = availableDoctorsForSection;

                            if (doctorSearchTerm) {
                              doctorsToDisplay =
                                availableDoctorsForSection.filter((d) =>
                                  d.name
                                    .toLowerCase()
                                    .includes(doctorSearchTerm.toLowerCase()),
                                );
                            }

                            // Sort doctors: available first, then by name
                            doctorsToDisplay.sort((a, b) => {
                              const statusA = getDoctorStatusOnDate(
                                a,
                                dateRange.start,
                              );
                              const statusB = getDoctorStatusOnDate(
                                b,
                                dateRange.start,
                              );
                              if (
                                statusA === "available" &&
                                statusB !== "available"
                              )
                                return -1;
                              if (
                                statusA !== "available" &&
                                statusB === "available"
                              )
                                return 1;
                              return a.name.localeCompare(b.name); // Alphabetical sort for same status
                            });

                            if (doctorsToDisplay.length === 0) {
                              return (
                                <div className="p-6 text-center text-gray-500">
                                  {doctorSearchTerm ? (
                                    <Search
                                      size={40}
                                      className="mx-auto mb-2 text-gray-300"
                                    />
                                  ) : (
                                    <Stethoscope
                                      size={40}
                                      className="mx-auto mb-2 text-gray-300"
                                    />
                                  )}
                                  <p>
                                    {doctorSearchTerm
                                      ? "Tidak ada dokter yang cocok."
                                      : "Tidak ada dokter tersedia."}
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="p-2 grid gap-2">
                                {doctorsToDisplay.map((doc) => (
                                  <div
                                    key={doc.id}
                                    onClick={() => {
                                      handleSelectDoctor(
                                        doc.id,
                                        selectedSection,
                                      );
                                      setShowDoctorModal(false);
                                      setDoctorSearchTerm("");
                                    }}
                                    className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors duration-150 ease-in-out border border-transparent hover:border-blue-100"
                                  >
                                    <div className="flex-grow pr-3">
                                      <div className="font-semibold text-gray-800">
                                        Dr. {doc.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {doc.specialization || "Spesialis Umum"}
                                      </div>
                                    </div>
                                    <div
                                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center ${getDoctorStatusOnDate(doc, dateRange.start) === "available" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
                                    >
                                      {getDoctorStatusOnDate(
                                        doc,
                                        dateRange.start,
                                      ) === "available" ? (
                                        <>
                                          <CheckCircle
                                            size={12}
                                            className="mr-1"
                                          />{" "}
                                          Tersedia
                                        </>
                                      ) : (
                                        <>
                                          <AlertCircle
                                            size={12}
                                            className="mr-1"
                                          />{" "}
                                          Tidak Tersedia
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
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
                const isCurrentHour =
                  format(dateRange.start, "yyyy-MM-dd") ===
                    format(now, "yyyy-MM-dd") &&
                  parseInt(slot.time.split(":")[0]) ===
                    parseInt(format(now, "HH"));
                return (
                  <div
                    key={idx}
                    className={`h-24 border-b border-gray-100 flex items-center justify-center text-gray-500 font-medium relative ${isCurrentHour ? "bg-blue-50" : ""}`}
                  >
                    <div
                      className={`flex items-center ${isCurrentHour ? "text-blue-600 font-bold" : ""}`}
                    >
                      {isCurrentHour && (
                        <div className="relative mr-2">
                          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                          <div className="relative h-3 w-3 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                      {slot.time}
                    </div>

                    {/* Current time indicator */}
                    {format(dateRange.start, "yyyy-MM-dd") ===
                      format(now, "yyyy-MM-dd") &&
                      slot.time <= format(now, "HH:mm") &&
                      parseInt(slot.time.split(":")[0]) + 1 >
                        parseInt(format(now, "HH")) && (
                        <div
                          className="ml-1"
                          style={{
                            top: `${(parseInt(format(now, "mm")) / 60) * 100}%`,
                          }}
                        >
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
                <div
                  key={sectionIdx}
                  className={`${sectionIdx !== 2 ? "border-r border-gray-100" : ""}`}
                >
                  {timeSlots.map((slot, timeIdx) => {
                    const { isAvailable, isBreakTime, existingAppointment } =
                      checkSlotStatus(slot, doctor, dateRange.start);

                    return (
                      <div
                        key={timeIdx}
                        className={`h-24 border-b border-gray-100 relative ${
                          !doctor
                            ? "bg-gray-50/30"
                            : isBreakTime
                              ? "bg-amber-50/50"
                              : !isAvailable
                                ? "bg-gray-100/70"
                                : !existingAppointment
                                  ? "group hover:bg-blue-50 transition-colors duration-200"
                                  : ""
                        } ${
                          format(dateRange.start, "yyyy-MM-dd") ===
                            format(now, "yyyy-MM-dd") &&
                          slot.time === format(now, "HH:00")
                            ? "ring-2 ring-blue-400 ring-inset"
                            : ""
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
                            onClick={() =>
                              handleAppointmentClick(existingAppointment)
                            }
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

                        {!isBreakTime &&
                          isAvailable &&
                          !existingAppointment &&
                          doctor && (
                            <button
                              onClick={() =>
                                handleSlotClick({
                                  time: slot.time,
                                  date: dateRange.start,
                                  doctorId: doctor.id,
                                  doctor: doctor
                                })
                              }
                              className="absolute inset-0 z-10 flex items-center justify-center p-3"
                            >
                              <div className="border-2 border-dashed border-blue-200 rounded-lg w-full h-full flex items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50/50 transition-all duration-200">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform group-hover:scale-105 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2">
                                  <Plus size={16} />
                                  <span className="font-medium">
                                    Tambah Kunjungan
                                  </span>
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

      {/* Modal View Mode - untuk menampilkan data pasien yang sudah ada */}
      {showViewModal && selectedAppointmentData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100 animate-slideUp">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <FileText size={22} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Detail Kunjungan</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Lihat detail kunjungan pasien</p>
                </div>
              </div>
              <button
                onClick={handleCloseViewModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Patient Info */}
                <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <User size={18} className="text-blue-600" />
                    Informasi Pasien
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Nama Lengkap</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.patient_name}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">No. RM</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.patient_no_rm}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">NIK</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.nik}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Tanggal Lahir</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(selectedAppointmentData.tanggal_lahir), "dd MMM yyyy", {
                          locale: id,
                        })}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Jenis Kelamin</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.jenis_kelamin}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Alamat</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.alamat}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">No. Telepon</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.phone}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.email}</p>
                    </div>
                  </div>
                </div>

                {/* Visit Info */}
                <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600" />
                    Informasi Kunjungan
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Tanggal</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(selectedAppointmentData.appointment_date), "dd MMM yyyy", {
                          locale: id,
                        })}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Waktu</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(`2000-01-01T${selectedAppointmentData.appointment_time}`), "HH:mm")}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Dokter</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.doctor}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Poli</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.poli}</p>
                    </div>
                  </div>
                </div>

                {/* Vitals */}
                <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-blue-600" />
                    Vital Signs
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Tinggi Badan</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.height} cm</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Berat Badan</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.weight} kg</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Detak Jantung</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.heart_rate} bpm</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Gula Darah</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.blood_sugar} mg/dL</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Suhu Tubuh</p>
                      <p className="font-medium text-gray-900">{selectedAppointmentData.temperature} °C</p>
                    </div>
                  </div>
                </div>

                {/* Complaint */}
                <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />
                    Keluhan
                  </h3>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-gray-700">{selectedAppointmentData.complaint}</p>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Clipboard size={18} className="text-blue-600" />
                    Catatan
                  </h3>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-gray-700">{selectedAppointmentData.notes || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gradient-to-r from-white to-blue-50">
              <button
                onClick={handleCloseViewModal}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Pendaftaran - untuk membuat kunjungan baru */}
      {showModal && !viewMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <FileText size={22} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {isEditing ? "Edit Kunjungan" : "Pendaftaran Baru"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {isEditing
                      ? "Ubah detail kunjungan pasien"
                      : "Buat jadwal kunjungan baru"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left Side - Patient Selection */}
              <div className="w-1/2 border-r border-gray-100 p-6 overflow-y-auto">
                <div className="mb-6">
                  {selectedPatient ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <UserCircle size={20} className="text-blue-600" />
                          <h3 className="text-lg font-medium text-gray-800">
                            Data Pasien
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPatient(null);
                            setSearchTerm("");
                            setSearchResults([]);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={18} className="text-gray-500" />
                        </button>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1 items-center gap-1">
                              <CreditCard size={14} className="text-gray-400" />
                              No. RM
                            </label>
                            <div className="text-sm text-gray-800 font-medium">
                              {selectedPatient.no_rm}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1 items-center gap-1">
                              <Activity size={14} className="text-gray-400" />
                              NIK
                            </label>
                            <div className="text-sm text-gray-800 font-medium">
                              {selectedPatient.nik}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1 items-center gap-1">
                            <User size={14} className="text-gray-400" />
                            Nama Lengkap
                          </label>
                          <div className="text-sm text-gray-800 font-medium">
                            {selectedPatient.nama_lengkap}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1 items-center gap-1">
                              <Calendar size={14} className="text-gray-400" />
                              Tanggal Lahir
                            </label>
                            <div className="text-sm text-gray-800 font-medium">
                              {selectedPatient.tanggal_lahir}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1 items-center gap-1">
                              <Heart size={14} className="text-gray-400" />
                              Jenis Kelamin
                            </label>
                            <div className="text-sm text-gray-800 font-medium">
                              {selectedPatient.jenis_kelamin === "L"
                                ? "Laki-laki"
                                : "Perempuan"}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1 items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            Alamat
                          </label>
                          <div className="text-sm text-gray-800 font-medium">
                            {selectedPatient.alamat}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1 items-center gap-1">
                              <Phone size={14} className="text-gray-400" />
                              No. Telepon
                            </label>
                            <div className="text-sm text-gray-800 font-medium">
                              {selectedPatient.no_telepon}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1 items-center gap-1">
                              <Mail size={14} className="text-gray-400" />
                              Email
                            </label>
                            <div className="text-sm text-gray-800 font-medium">
                              {selectedPatient.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <button
                          onClick={() => setShowNewPatientForm(false)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                            !showNewPatientForm
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <Search size={16} />
                          Pilih Pasien
                        </button>
                        <button
                          onClick={() => setShowNewPatientForm(true)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                            showNewPatientForm
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <UserPlus size={16} />
                          Pasien Baru
                        </button>
                      </div>

                      {!showNewPatientForm ? (
                        <div className="space-y-4">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Cari pasien..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            />
                            <Search
                              size={16}
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            {isSearching && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <RefreshCw
                                  size={16}
                                  className="text-gray-400 animate-spin"
                                />
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {searchResults.length === 0 &&
                            searchTerm.length >= 3 &&
                            !isSearching ? (
                              <div className="text-center py-8 text-gray-500">
                                <Search
                                  size={40}
                                  className="mx-auto mb-2 text-gray-300"
                                />
                                <p className="text-sm">
                                  Tidak ada pasien ditemukan
                                </p>
                              </div>
                            ) : (
                              searchResults.map((patient) => (
                                <div
                                  key={patient.no_rm}
                                  onClick={() => handlePatientSelect(patient)}
                                  className="p-4 rounded-xl cursor-pointer transition-all bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-medium">
                                      {patient.nama_lengkap.charAt(0)}
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-gray-800">
                                        {patient.nama_lengkap}
                                      </h3>
                                      <p className="text-sm text-gray-500 mt-1">
                                        No. RM: {patient.no_rm}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        NIK: {patient.nik}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                                <Activity size={14} className="text-gray-400" />
                                NIK
                              </label>
                              <input
                                type="text"
                                value={newPatient.nik}
                                onChange={(e) =>
                                  setNewPatient({
                                    ...newPatient,
                                    nik: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                placeholder="Masukkan NIK"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                                <User size={14} className="text-gray-400" />
                                Nama Lengkap
                              </label>
                              <input
                                type="text"
                                value={newPatient.nama_lengkap}
                                onChange={(e) =>
                                  setNewPatient({
                                    ...newPatient,
                                    nama_lengkap: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                placeholder="Masukkan nama lengkap"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                                <Calendar size={14} className="text-gray-400" />
                                Tanggal Lahir
                              </label>
                              <input
                                type="date"
                                value={newPatient.tanggal_lahir}
                                onChange={(e) =>
                                  setNewPatient({
                                    ...newPatient,
                                    tanggal_lahir: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                                <Heart size={14} className="text-gray-400" />
                                Jenis Kelamin
                              </label>
                              <select
                                value={newPatient.jenis_kelamin}
                                onChange={(e) =>
                                  setNewPatient({
                                    ...newPatient,
                                    jenis_kelamin: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                              >
                                <option value="">Pilih jenis kelamin</option>
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                              <MapPin size={14} className="text-gray-400" />
                              Alamat
                            </label>
                            <textarea
                              value={newPatient.alamat}
                              onChange={(e) =>
                                setNewPatient({
                                  ...newPatient,
                                  alamat: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                              rows="3"
                              placeholder="Masukkan alamat lengkap"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                                <Phone size={14} className="text-gray-400" />
                                No. Telepon
                              </label>
                              <input
                                type="tel"
                                value={newPatient.no_telepon}
                                onChange={(e) =>
                                  setNewPatient({
                                    ...newPatient,
                                    no_telepon: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                placeholder="Masukkan nomor telepon"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                                <Mail size={14} className="text-gray-400" />
                                Email
                              </label>
                              <input
                                type="email"
                                value={newPatient.email}
                                onChange={(e) =>
                                  setNewPatient({
                                    ...newPatient,
                                    email: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                placeholder="Masukkan email"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right Side - Appointment Form */}
              <div className="w-1/2 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Appointment Details */}
                  <div className="space-y-4">
                    {/* Dokter Section */}
                    <div className="doctor-search-container">
                      <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                        <Stethoscope size={14} className="text-gray-400" />
                        Dokter
                      </label>
                      <div className="relative">
                        {!selectedDoctor ? (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Cari dokter berdasarkan nama atau spesialisasi..."
                            value={doctorSearchTerm}
                            onChange={(e) => {
                              setDoctorSearchTerm(e.target.value);
                              setShowDoctorSearch(true);
                            }}
                            onFocus={() => setShowDoctorSearch(true)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                          />
                          <Search
                            size={16}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          />
                          {doctorSearchTerm && (
                            <button
                              onClick={() => {
                                setDoctorSearchTerm("");
                                setShowDoctorSearch(false);
                              }}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X size={14} className="text-gray-400" />
                            </button>
                          )}
                        </div>
                        ) : null}

                        {showDoctorSearch &&
                          doctorSearchTerm &&
                          !selectedDoctor && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                              <div className="p-2">
                                {(() => {
                                  const filteredDoctors = doctors.filter(
                                    (doc) =>
                                      doc.name
                                        .toLowerCase()
                                        .includes(
                                          doctorSearchTerm.toLowerCase(),
                                        ) ||
                                      (doc.specialization &&
                                        doc.specialization
                                          .toLowerCase()
                                          .includes(
                                            doctorSearchTerm.toLowerCase(),
                                          )),
                                  );

                                  if (filteredDoctors.length === 0) {
                                    return (
                                      <div className="text-center py-6 text-gray-500">
                                        <Search
                                          size={40}
                                          className="mx-auto mb-2 text-gray-300"
                                        />
                                        <p className="text-sm">
                                          Tidak ada dokter ditemukan
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                          Coba kata kunci lain
                                        </p>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="space-y-2">
                                      {filteredDoctors.map((doc) => (
                                        <button
                                          key={doc.id}
                                          onClick={() => {
                                            handleDoctorSelect(doc.id);
                                            setDoctorSearchTerm("");
                                            setShowDoctorSearch(false);
                                          }}
                                          className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-medium text-lg shrink-0 shadow-sm">
                                              {doc.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-gray-800 truncate">
                                                  Dr. {doc.name}
                                                </h4>
                                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                                                  {doc.specialization ||
                                                    "Spesialis Umum"}
                                                </span>
                                              </div>
                                              <div className="mt-1 flex items-center gap-2">
                                                <div className="flex items-center text-xs text-gray-500">
                                                  <Building2
                                                    size={12}
                                                    className="mr-1"
                                                  />
                                                  {doc.poli || "Poli Umum"}
                                                </div>
                                                <div
                                                  className={`flex items-center text-xs px-2 py-0.5 rounded-full ${
                                                    getDoctorStatusOnDate(
                                                      doc,
                                                      dateRange.start,
                                                    ) === "available"
                                                      ? "bg-green-50 text-green-600"
                                                      : "bg-red-50 text-red-500"
                                                  }`}
                                                >
                                                  {getDoctorStatusOnDate(
                                                    doc,
                                                    dateRange.start,
                                                  ) === "available" ? (
                                                    <>
                                                      <CheckCircle
                                                        size={12}
                                                        className="mr-1"
                                                      />
                                                      Tersedia
                                                    </>
                                                  ) : (
                                                    <>
                                                      <AlertCircle
                                                        size={12}
                                                        className="mr-1"
                                                      />
                                                      Tidak Tersedia
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}

                        {selectedDoctor && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-medium text-xl shrink-0 shadow-sm">
                                {doctors
                                  .find((d) => d.id === selectedDoctor)
                                  ?.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-800">
                                    Dr.{" "}
                                    {
                                      doctors.find(
                                        (d) => d.id === selectedDoctor,
                                      )?.name
                                    }
                                  </h4>
                                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                                    {doctors.find(
                                      (d) => d.id === selectedDoctor,
                                    )?.specialization || "Spesialis Umum"}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Building2 size={12} className="mr-1" />
                                    {doctors.find(
                                      (d) => d.id === selectedDoctor,
                                    )?.poli || "Poli Umum"}
                                  </div>
                                  <div
                                    className={`flex items-center text-xs px-2 py-0.5 rounded-full ${
                                      getDoctorStatusOnDate(
                                        doctors.find(
                                          (d) => d.id === selectedDoctor,
                                        ),
                                        dateRange.start,
                                      ) === "available"
                                        ? "bg-green-50 text-green-600"
                                        : "bg-red-50 text-red-500"
                                    }`}
                                  >
                                    {getDoctorStatusOnDate(
                                      doctors.find(
                                        (d) => d.id === selectedDoctor,
                                      ),
                                      dateRange.start,
                                    ) === "available" ? (
                                      <>
                                        <CheckCircle
                                          size={12}
                                          className="mr-1"
                                        />
                                        Tersedia
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle
                                          size={12}
                                          className="mr-1"
                                        />
                                        Tidak Tersedia
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedDoctor("");
                                  setDoctorSearchTerm("");
                                  setShowDoctorSearch(true);
                                }}
                                className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <X size={16} className="text-gray-500" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tanggal & Waktu Section */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          Tanggal Kunjungan
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={appointmentDate}
                            onChange={(e) =>
                              handleInputChange(e, "appointmentDate")
                            }
                            min={format(startOfToday(), "yyyy-MM-dd")}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                          />
                          <Calendar
                            size={16}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                          <Clock size={14} className="text-gray-400" />
                          Waktu Kunjungan
                        </label>
                        <div className="relative">
                          <select
                            value={selectedTime}
                            onChange={(e) =>
                              handleInputChange(e, "selectedTime")
                            }
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                          >
                            <option value="">Pilih Waktu</option>
                            {timeSlots.map((slot) => (
                              <option key={slot.time} value={slot.time}>
                                {slot.label}
                              </option>
                            ))}
                          </select>
                          <Clock
                            size={16}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Vitals Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Activity size={14} className="text-gray-400" />
                        Data Vital
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tinggi Badan (cm)
                      </label>
                          <input
                            type="number"
                            value={newAppointment.height}
                            onChange={(e) =>
                              setNewAppointment({
                                ...newAppointment,
                                height: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            placeholder="Masukkan tinggi badan"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Berat Badan (kg)
                          </label>
                          <input
                            type="number"
                            value={newAppointment.weight}
                            onChange={(e) =>
                              setNewAppointment({
                                ...newAppointment,
                                weight: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            placeholder="Masukkan berat badan"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Detak Jantung (bpm)
                          </label>
                          <input
                            type="number"
                            value={newAppointment.heart_rate}
                            onChange={(e) =>
                              setNewAppointment({
                                ...newAppointment,
                                heart_rate: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            placeholder="Masukkan detak jantung"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gula Darah (mg/dL)
                          </label>
                          <input
                            type="number"
                            value={newAppointment.blood_sugar}
                            onChange={(e) =>
                              setNewAppointment({
                                ...newAppointment,
                                blood_sugar: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            placeholder="Masukkan gula darah"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Suhu Tubuh (°C)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={newAppointment.temperature}
                            onChange={(e) =>
                              setNewAppointment({
                                ...newAppointment,
                                temperature: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            placeholder="Masukkan suhu tubuh"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Keluhan Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                        <MessageSquare size={14} className="text-gray-400" />
                        Keluhan
                      </label>
                      <div className="relative">
                        <textarea
                          value={complaint}
                          onChange={(e) => handleInputChange(e, "complaint")}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                          rows="3"
                          placeholder="Masukkan keluhan pasien"
                        />
                        <MessageSquare
                          size={16}
                          className="absolute left-3 top-3 text-gray-400"
                        />
                      </div>
                    </div>

                    {/* Catatan Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                        <FileText size={14} className="text-gray-400" />
                        Catatan
                      </label>
                      <div className="relative">
                        <textarea
                          value={notes}
                          onChange={(e) => handleInputChange(e, "notes")}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                          rows="2"
                          placeholder="Tambahkan catatan jika diperlukan"
                        />
                        <FileText
                          size={16}
                          className="absolute left-3 top-3 text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gradient-to-r from-white to-blue-50">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2"
              >
                {isEditing ? (
                  <>
                    <Save size={16} />
                    Simpan Perubahan
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Buat Kunjungan
                  </>
                )}
              </button>
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

      {/* Notification */}
      {showNotification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${
            notificationType === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div
            className={`p-2 rounded-full ${
              notificationType === "success" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {notificationType === "success" ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <XCircle size={20} className="text-red-600" />
            )}
          </div>
          <div>
            <p
              className={`font-medium ${
                notificationType === "success"
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {notificationType === "success" ? "Berhasil!" : "Gagal!"}
            </p>
            <p
              className={`text-sm ${
                notificationType === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {notificationMessage}
            </p>
          </div>
        </div>
      )}
    </PageTemplate>
  );
};

export default RawatJalan;
