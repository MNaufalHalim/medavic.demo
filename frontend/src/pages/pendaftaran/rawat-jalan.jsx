import React, { useState, useEffect, useRef } from "react";
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
  ChevronLeft,
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
import { createPortal } from "react-dom";

const ScheduleSkeleton = () => (
  <div className="min-w-[700px]">
    {/* Header part */}
    <div className="grid grid-cols-[80px_repeat(3,1fr)] border-b border-gray-100">
      <div className="p-4 border-r border-gray-100 bg-gray-50 h-[178px]"></div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`p-5 ${i !== 2 ? "border-r border-gray-100" : ""}`}
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mt-2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
    {/* Schedule body part */}
    <div className="grid grid-cols-[80px_repeat(3,1fr)]">
      <div className="border-r border-gray-100 bg-gray-50">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-24 border-b border-gray-100 flex items-center justify-center"
          >
            <div className="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
          </div>
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${i !== 2 ? "border-r border-gray-100" : ""}`}>
          {Array.from({ length: 9 }).map((_, j) => (
            <div key={j} className="h-24 border-b border-gray-100 p-2">
              <div className="h-full bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

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
            selectedDoc.id === doctor.id
        )
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

  // Fungsi baru untuk mendapatkan status detail dokter
  const getDoctorDetailedStatus = (doctor, date) => {
    if (!doctor || !date) return "not_available";

    // Cek apakah dokter memiliki jadwal
    if (!Array.isArray(doctor.schedule) || doctor.schedule.length === 0) {
      return "not_practicing"; // Tidak praktek
    }

    const dayName = format(new Date(date), "EEEE", {
      locale: enUS,
    }).toLowerCase();

    // Cek apakah dokter praktek di hari tersebut
    const daySchedule = doctor.schedule.find(
      (sch) => sch.day_of_week.toLowerCase() === dayName && sch.is_active
    );

    if (!daySchedule) {
      return "not_practicing"; // Tidak praktek di hari tersebut
    }

    // Cek jumlah appointment yang sudah ada untuk dokter di tanggal tersebut
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const existingAppointments = appointments.filter(
      (app) =>
        Number(app.doctorId) === Number(doctor.id) && app.date === formattedDate
    );

    // Hitung slot yang tersedia berdasarkan jadwal
    const startTime = parseInt(daySchedule.start_time.split(":")[0]);
    const endTime = parseInt(daySchedule.end_time.split(":")[0]);
    const totalSlots = endTime - startTime;

    // Jika semua slot sudah terisi
    if (existingAppointments.length >= totalSlots) {
      return "full"; // Full
    }

    // Jika masih ada slot tersedia
    return "available"; // Tersedia
  };

  // Fungsi untuk mendapatkan warna dan icon berdasarkan status
  const getStatusConfig = (status) => {
    switch (status) {
      case "available":
        return {
          bgColor: "bg-green-50",
          textColor: "text-green-600",
          borderColor: "border-green-200",
          icon: CheckCircle,
          label: "Tersedia",
          iconColor: "text-green-600",
        };
      case "full":
        return {
          bgColor: "bg-orange-50",
          textColor: "text-orange-600",
          borderColor: "border-orange-200",
          icon: AlertCircle,
          label: "Full",
          iconColor: "text-orange-600",
        };
      case "not_practicing":
        return {
          bgColor: "bg-gray-50",
          textColor: "text-gray-600",
          borderColor: "border-gray-200",
          icon: XCircle,
          label: "Tidak Praktek",
          iconColor: "text-gray-600",
        };
      case "not_available":
      default:
        return {
          bgColor: "bg-red-50",
          textColor: "text-red-600",
          borderColor: "border-red-200",
          icon: AlertCircle,
          label: "Tidak Tersedia",
          iconColor: "text-red-600",
        };
    }
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
  const [poliId, setPoliId] = useState("");
  const [poliName, setPoliName] = useState("");
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
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState("success");
  const [notificationMessage, setNotificationMessage] = useState("");
  const dateInputRef = useRef(null);

  const handlePreviousWeek = () => {
    const newStart = addDays(dateRange.start, -7);
    setDateRange({
      start: newStart,
      end: addDays(newStart, 6),
    });
  };

  const handleNextWeek = () => {
    const newStart = addDays(dateRange.start, 7);
    setDateRange({
      start: newStart,
      end: addDays(newStart, 6),
    });
  };

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
        app.time === time
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
        console.error(
          "Gagal mengambil detail appointment:",
          response.data.message
        );
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
      const appointmentDetails = await fetchAppointmentDetails(
        slot.appointment.appointment_code
      );
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
      const selectedDoctor = doctors.find((doc) => doc.id === slot.doctorId);
      if (selectedDoctor) {
        console.log("Doctor ditemukan:", selectedDoctor);

        // Set doctor data
        setSelectedDoctor(selectedDoctor.id);
        setSelectedDoctorName(selectedDoctor.name);
        setPoli(selectedDoctor.poli || "umum");
        setPoliId(selectedDoctor.poli || "");
        setPoliName(selectedDoctor.poli_name || "Umum");

        // Set appointment data
        setNewAppointment((prev) => ({
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
          complaint: "",
        }));

        // Set form data
        setFormData((prev) => ({
          ...prev,
          doctor_id: selectedDoctor.id,
          appointment_date: format(slot.date, "yyyy-MM-dd"),
          appointment_time: slot.time,
          poli: selectedDoctor.poli || "umum",
        }));

        console.log("Form Data setelah update:", formData);

        // Set selected date and time
        setAppointmentDate(format(slot.date, "yyyy-MM-dd"));
        setSelectedTime(slot.time);
        setSelectedSlot({
          time: slot.time,
          date: slot.date,
          doctor: selectedDoctor,
        });

        // Update available time slots
        await updateAvailableTimeSlots(
          selectedDoctor.id,
          format(slot.date, "yyyy-MM-dd")
        );
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
    const appointmentDetails = await fetchAppointmentDetails(
      appointment.appointment_code
    );
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
        showErrorNotification("Gagal memuat data janji temu.");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
      showErrorNotification("Gagal memuat data janji temu.");
    } finally {
      setIsLoading(false);
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
      showErrorNotification("Gagal memuat data dokter.");
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
        }
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
            doc.id === doctorId ? { ...doc, schedule: formattedSchedule } : doc
          )
        );
      }
    } catch (error) {
      console.error("Error fetching doctor schedule:", error);
      showErrorNotification("Gagal memuat jadwal dokter.");
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
          }
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
        { headers: { Authorization: `Bearer ${token}` } }
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
      showErrorNotification(
        error.response?.data?.message || "Gagal membuat janji temu"
      );
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
        }
      );

      console.log("Update Appointment Response:", response.data);

      if (response.data.status === "success") {
        await fetchAppointments(); // Refresh appointments to reflect changes
        setShowModal(false);
        setIsEditing(false);
        setEditedAppointment(null);
      } else {
        throw new Error(
          response.data.message || "Failed to update appointment"
        );
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      showErrorNotification(
        error.response?.data?.message || "Gagal memperbarui janji temu"
      );
    }
  };

  const handleDeleteAppointment = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${config.apiUrl}/rm/appointments/${selectedAppointment.appointment_code}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchAppointments();
      setShowModal(false);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      showErrorNotification(
        error.response?.data?.message || "Gagal menghapus janji temu"
      );
    }
  };

  // Modifikasi handleAddClick untuk menangani klik tombol tambah kunjungan
  const handleAddClick = () => {
    setViewMode(false);
    setSelectedAppointmentData(null);
    setShowModal(true);
    setModalType("new");
    setSelectedSlot(null);
    setAppointmentDate(format(new Date(), "yyyy-MM-dd"));
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

    // Reset all form-related states
    setSelectedDoctor("");
    setSelectedDoctorName("");
    setAppointmentDate("");
    setSelectedTime("");
    setAvailableTimeSlots([]);
    setComplaint("");
    setNotes("");
    setPoli("");
    setPoliId("");
    setPoliName("");
    setDoctorSearchTerm(""); // Reset doctor search input
    setSearchTerm(""); // Reset patient search input
    setSearchResults([]); // Reset patient search results

    // Reset patient and appointment data objects
    setNewPatient({
      nik: "",
      nama_lengkap: "",
      tanggal_lahir: format(new Date(), "yyyy-MM-dd"),
      jenis_kelamin: "L",
      alamat: "",
      no_telepon: "",
      email: "",
    });

    setFormData({
      doctor_id: "",
      appointment_date: "",
      appointment_time: "",
      poli: "",
      complaint: "",
      notes: "",
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
    if (!search || search.length < 2) return text;

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedSearch})`, "gi");
    const parts = String(text).split(regex);

    return (
      <span>
        {parts
          .filter((part) => part)
          .map((part, i) =>
            regex.test(part) ? (
              <span key={i} className="bg-yellow-200 font-semibold">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
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
      const formattedDate = format(selectedSlot.date, "yyyy-MM-dd");
      setSelectedDoctor(selectedSlot.doctor.id);
      setAppointmentDate(formattedDate);
      setSelectedTime(selectedSlot.time);
      setPoli(selectedSlot.doctor.poli || "umum");
      setNewAppointment((prev) => ({
        ...prev,
        doctorId: selectedSlot.doctor.id,
        doctor: selectedSlot.doctor.name,
        date: formattedDate,
        time: selectedSlot.time,
        poli: selectedSlot.doctor.poli || "umum",
      }));
    } else {
      // Reset form pendaftaran jika tidak ada slot yang dipilih
      setSelectedDoctor("");
      setAppointmentDate("");
      setSelectedTime("");
      setPoli("");
      setPoliId("");
      setPoliName("");
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
        setNewAppointment((prev) => ({
          ...prev,
          poli: value,
        }));
        setFormData((prev) => ({
          ...prev,
          poli: value,
        }));
        break;
      case "complaint":
        setComplaint(value);
        setNewAppointment((prev) => ({
          ...prev,
          complaint: value,
        }));
        break;
      case "notes":
        setNotes(value);
        setNewAppointment((prev) => ({
          ...prev,
          notes: value,
        }));
        break;
      case "appointmentDate":
        setAppointmentDate(value);
        setNewAppointment((prev) => ({
          ...prev,
          date: value,
        }));
        setFormData((prev) => ({
          ...prev,
          appointment_date: value,
        }));
        // Reset waktu saat tanggal berubah
        setSelectedTime("");
        // Update available time slots
        if (selectedDoctor) {
          updateAvailableTimeSlots(selectedDoctor, value);
        }
        break;
      case "selectedTime":
        setSelectedTime(value);
        setNewAppointment((prev) => ({
          ...prev,
          time: value,
        }));
        setFormData((prev) => ({
          ...prev,
          appointment_time: value,
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
      // Ambil jadwal umum dokter
      const scheduleResponse = await axios.get(
        `${config.apiUrl}/master/doctor-schedules`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { doctor_id: doctorId },
        }
      );

      if (scheduleResponse.data.status !== "success") {
        setAvailableTimeSlots([]);
        setSelectedTime("");
        return;
      }

      const scheduleData = scheduleResponse.data.data;
      const dayName = format(new Date(date), "EEEE", {
        locale: enUS,
      }).toLowerCase();
      const daySchedules = scheduleData[dayName];

      // Jika tidak ada jadwal di hari itu
      if (!daySchedules || daySchedules.length === 0) {
        setAvailableTimeSlots([]);
        setSelectedTime("");
        return;
      }

      // Generate semua slot per jam dari jadwal
      let potentialSlots = [];
      daySchedules.forEach((schedule) => {
        const startTime = parseInt(schedule.start_time.split(":")[0]);
        const endTime = parseInt(schedule.end_time.split(":")[0]);
        for (let hour = startTime; hour < endTime; hour++) {
          potentialSlots.push(`${String(hour).padStart(2, "0")}:00`);
        }
      });
      const uniquePotentialSlots = [...new Set(potentialSlots)];

      // Filter slot yang sudah di-booking
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      const takenSlots = appointments
        .filter(
          (app) =>
            Number(app.doctorId) === Number(doctorId) &&
            app.date === formattedDate
        )
        .map((app) => app.time);

      const availableSlots = uniquePotentialSlots.filter(
        (slot) => !takenSlots.includes(slot)
      );

      setAvailableTimeSlots(availableSlots);

      // Reset waktu terpilih jika tidak lagi tersedia
      if (selectedTime && !availableSlots.includes(selectedTime)) {
        setSelectedTime("");
      }
    } catch (error) {
      console.error("Error processing doctor schedule for slots:", error);
      setAvailableTimeSlots([]);
      setSelectedTime("");
    }
  };

  // Fungsi untuk menangani pemilihan dokter
  const handleDoctorSelect = (doctorId) => {
    const selectedDoctorObj = doctors.find((doc) => doc.id === doctorId);
    if (selectedDoctorObj) {
      setSelectedDoctor(doctorId);
      setSelectedDoctorName(selectedDoctorObj.name);
      setPoliId(selectedDoctorObj.poli || "");
      setPoliName(selectedDoctorObj.poli_name || "N/A");
      setNewAppointment((prev) => ({
        ...prev,
        doctorId: selectedDoctorObj.id,
        doctor: selectedDoctorObj.name,
        poli: selectedDoctorObj.poli || "",
      }));
      setFormData((prev) => ({
        ...prev,
        doctor_id: selectedDoctorObj.id,
        poli: selectedDoctorObj.poli || "",
      }));
      setSelectedTime("");
      if (appointmentDate) {
        updateAvailableTimeSlots(doctorId, appointmentDate);
      }
    }
  };

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

      if (!poliId) {
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
        poli: poliId,
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
    setPoliId("");
    setPoliName("");
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

  // Fungsi untuk membuka date picker
  const openDatePicker = () => {
    console.log("openDatePicker called");
    console.log("dateInputRef.current:", dateInputRef.current);
    console.log("selectedSlot:", selectedSlot);

    if (dateInputRef.current && !selectedSlot) {
      console.log("Input found and slot not selected");

      // Coba focus dulu, lalu click
      try {
        console.log("Focusing input...");
        dateInputRef.current.focus();

        // Tunggu sebentar lalu coba showPicker atau click
        setTimeout(() => {
          if (typeof dateInputRef.current.showPicker === "function") {
            try {
              console.log("Trying showPicker...");
              dateInputRef.current.showPicker();
            } catch (error) {
              console.log("showPicker failed, trying click");
              dateInputRef.current.click();
            }
          } else {
            console.log("showPicker not supported, using click");
            dateInputRef.current.click();
          }
        }, 100);
      } catch (error) {
        console.log("Error focusing input:", error);
      }
    } else {
      console.log("Date input not found or slot selected");
    }
  };

  // Effect untuk memastikan input date bisa diakses
  useEffect(() => {
    if (dateInputRef.current) {
      console.log("Date input ref is ready:", dateInputRef.current);
    }
  }, [dateInputRef.current]);

  const doctorModalRefs = [useRef(null), useRef(null), useRef(null)];

  // Tambahkan useEffect untuk menutup modal grid dokter saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (showDoctorModal && selectedSection !== null) {
        const ref = doctorModalRefs[selectedSection];
        if (ref && ref.current && !ref.current.contains(event.target)) {
          setShowDoctorModal(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDoctorModal, selectedSection]);

  // State untuk anchor posisi modal
  const [doctorModalAnchor, setDoctorModalAnchor] = useState(null);

  return (
    <PageTemplate>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-3 shadow-lg">
                  <CalendarDays className="text-white" size={24} />
                </div>
                Jadwal Kunjungan
              </h1>
              <p className="text-gray-500 mt-1">
                Pilih tanggal untuk melihat atau menambah jadwal kunjungan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddClick}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
              >
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <Plus size={16} className="text-white" />
                </div>
                Tambah Kunjungan
              </button>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-4">
            {/* Today and Picker Buttons */}
            <div className="flex items-center gap-2">
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                onClick={() => {
                  setDateRange({
                    start: startOfToday(),
                    end: addDays(startOfToday(), 6),
                  });
                }}
              >
                Hari Ini
              </button>
              <button
                className="relative bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg flex items-center gap-2 transition-colors"
                onClick={(e) =>
                  e.currentTarget.querySelector("input").showPicker()
                }
              >
                <Calendar size={16} />
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
            </div>

            {/* Week Calendar with Arrows */}
            <div className="flex-1 flex items-center gap-2">
              <button
                onClick={handlePreviousWeek}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Minggu Sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex-1 grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }, (_, i) => {
                  const day = addDays(dateRange.start, i);
                  const isSelected =
                    format(day, "yyyy-MM-dd") ===
                    format(dateRange.start, "yyyy-MM-dd");
                  const isToday =
                    format(day, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

                  return (
                    <div
                      key={i}
                      className={`flex-shrink-0 flex flex-col items-center py-2 px-1 rounded-lg cursor-pointer transition-all duration-200 min-w-[70px] relative ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => {
                        setDateRange({
                          start: day,
                          end: addDays(day, 6),
                        });
                      }}
                    >
                      <div
                        className={`text-xs font-medium ${
                          isSelected ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {format(day, "EEE", { locale: id })}
                      </div>
                      <div
                        className={`text-lg font-bold mt-0.5 ${
                          isSelected ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                      {isToday && (
                        <div
                          className={`absolute bottom-1 h-1 w-1 rounded-full ${
                            isSelected ? "bg-white" : "bg-blue-500"
                          }`}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Minggu Berikutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {isLoading ? (
            <ScheduleSkeleton />
          ) : (
            <>
              <div className="min-w-[700px] grid grid-cols-[80px_repeat(3,1fr)] border-b border-gray-100">
                <div className="p-4 border-r border-gray-100 bg-gray-50 flex items-center justify-center">
                  <div className="text-gray-500 font-medium text-sm">GMT +07:00</div>
                </div>
                {[0, 1, 2].map((sectionIdx) => {
                  const doctor = selectedDoctors[sectionIdx];
                  const appointmentCount = doctor
                    ? appointments.filter(
                        (apt) =>
                          Number(apt.doctorId) === Number(doctor.id) &&
                          apt.date === format(dateRange.start, "yyyy-MM-dd")
                      ).length || 0
                    : 0;

                  return (
                    <div
                      key={sectionIdx}
                      className={`overflow-hidden flex flex-col justify-center ${
                        sectionIdx !== 2 ? "border-r border-gray-100" : ""
                      }`}
                      style={{ minWidth: 0 }}
                    >
                      <div className="relative w-full h-full">
                        <button
                          onClick={e => {
                            if (selectedSection === sectionIdx) {
                              setShowDoctorModal((prev) => !prev);
                              setDoctorModalAnchor(e.currentTarget);
                            } else {
                              setSelectedSection(sectionIdx);
                              setShowDoctorModal(true);
                              setDoctorModalAnchor(e.currentTarget);
                            }
                          }}
                          className={`w-full p-5 ${
                            doctor
                              ? "bg-white hover:bg-blue-50/30"
                              : "bg-gray-50/50 hover:bg-gray-100/50"
                          } transition-all duration-200 h-full flex flex-col justify-center`}
                          style={{ minWidth: 0 }}
                        >
                          {doctor ? (
                            <div className="relative group flex items-start gap-3 p-3 rounded-xl bg-white/60 backdrop-blur-md shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200 min-h-[90px] max-w-full overflow-hidden">
                              {/* Avatar & Status Dot */}
                              <div className="relative w-12 h-12 flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md border-4 border-white">
                                  {doctor.name.charAt(0)}
                                </div>
                                {/* Status Dot */}
                                {(() => {
                                  const status = getDoctorDetailedStatus(
                                    doctor,
                                    dateRange.start
                                  );
                                  const statusConfig = getStatusConfig(status);
                                  return (
                                    <span
                                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                                        status === "available"
                                          ? "bg-green-400"
                                          : status === "full"
                                          ? "bg-orange-400"
                                          : status === "not_practicing"
                                          ? "bg-gray-400"
                                          : "bg-red-400"
                                      }`}
                                    >
                                      <span className="w-2 h-2 rounded-full bg-white/80"></span>
                                    </span>
                                  );
                                })()}
                              </div>
                              {/* Info & Status Container */}
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="flex flex-col gap-1 max-w-full">
                                  <span
                                    className="font-semibold text-gray-800 text-base truncate text-left block max-w-full"
                                    title={doctor.name}
                                    style={{ maxWidth: "100%" }}
                                  >
                                    Dr. {doctor.name}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-gray-500 truncate block max-w-full" style={{ maxWidth: "100%" }}>
                                    <Building2 size={12} className="text-gray-400 shrink-0" />
                                    <span className="truncate block max-w-full" style={{ maxWidth: "100%" }}>
                                      Poliklinik {doctor.poli_name || "N/A"}
                                    </span>
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <User size={12} className="text-gray-400 shrink-0" />
                                    {appointmentCount} pasien
                                  </span>
                                  {/* Status Badge - Tablet/Mobile */}
                                  <div className="xl:hidden flex justify-start">
                                    {(() => {
                                      const status = getDoctorDetailedStatus(
                                        doctor,
                                        dateRange.start
                                      );
                                      const statusConfig = getStatusConfig(status);
                                      const StatusIcon = statusConfig.icon;
                                      return (
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
                                        >
                                          <StatusIcon size={10} className={statusConfig.iconColor} />
                                          {statusConfig.label}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                              {/* Status Badge - PC */}
                              <div className="hidden xl:block shrink-0">
                                {(() => {
                                  const status = getDoctorDetailedStatus(
                                    doctor,
                                    dateRange.start
                                  );
                                  const statusConfig = getStatusConfig(status);
                                  const StatusIcon = statusConfig.icon;
                                  return (
                                    <span
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
                                    >
                                      <StatusIcon size={10} className={statusConfig.iconColor} />
                                      {statusConfig.label}
                                    </span>
                                  );
                                })()}
                              </div>
                              {/* Hapus Button */}
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newDoctors = [...selectedDoctors];
                                  newDoctors[sectionIdx] = null;
                                  setSelectedDoctors(newDoctors);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    const newDoctors = [...selectedDoctors];
                                    newDoctors[sectionIdx] = null;
                                    setSelectedDoctors(newDoctors);
                                  }
                                }}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white/60 hover:bg-red-100 text-gray-400 hover:text-red-500 p-1.5 rounded-full transition-all duration-200 shadow-sm shrink-0 cursor-pointer"
                                title="Hapus Dokter"
                                aria-label="Hapus Dokter"
                              >
                                <X size={16} />
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-all duration-200 min-h-[90px] group cursor-pointer w-full h-full">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group-hover:scale-105">
                                  <Plus size={24} className="text-gray-400 group-hover:text-blue-500" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors truncate block max-w-full" style={{ maxWidth: "100%" }}>
                                  Pilih Dokter
                                </span>
                              </div>
                            </div>
                          )}
                        </button>
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
                        className={`h-24 border-b border-gray-100 flex items-center justify-center text-gray-500 font-medium relative ${
                          isCurrentHour ? "bg-blue-50" : ""
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            isCurrentHour ? "text-blue-600 font-bold" : ""
                          }`}
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
                                top: `${
                                  (parseInt(format(now, "mm")) / 60) * 100
                                }%`,
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
                      className={`${
                        sectionIdx !== 2 ? "border-r border-gray-100" : ""
                      }`}
                    >
                      {timeSlots.map((slot, timeIdx) => {
                        const {
                          isAvailable,
                          isBreakTime,
                          existingAppointment,
                        } = checkSlotStatus(slot, doctor, dateRange.start);

                        return (
                          <div
                            key={timeIdx}
                            className={`h-24 border-b border-gray-100 relative ${
                              !doctor
                                ? "bg-gray-50/70"
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
                                  <span className="font-medium">
                                    BREAK TIME
                                  </span>
                                </div>
                              </div>
                            )}

                            {!isBreakTime && !isAvailable && (
                              <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#f3f4f6_10px,#f3f4f6_20px)] opacity-30"></div>
                                <div className="bg-gray-100 border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg z-30 shadow-sm flex items-center">
                                  <AlertCircle size={14} className="mr-1.5" />
                                  <span className="font-medium">
                                    NOT AVAILABLE
                                  </span>
                                </div>
                              </div>
                            )}

                            {!isBreakTime &&
                              isAvailable &&
                              existingAppointment && (
                                <button
                                  onClick={() =>
                                    handleAppointmentClick(existingAppointment)
                                  }
                                  className="absolute inset-0 z-10 p-3 text-left transition-transform duration-200 hover:scale-[1.02] focus:scale-[1.02] focus:outline-none"
                                >
                                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 h-full flex flex-col text-white shadow-md">
                                    <div className="flex justify-between items-start">
                                      <span className="font-medium text-white text-base break-words">
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
                                      doctor: doctor,
                                    })
                                  }
                                  className="absolute inset-0 z-10 flex items-center justify-center p-3 group"
                                >
                                  <div className="border-2 border-dashed border-gray-200 rounded-lg w-full h-full flex items-center justify-center group-hover:border-blue-300 group-hover:bg-blue-50/50 transition-all duration-200">
                                    <div className="flex items-center gap-2 text-gray-400 transition-all duration-200 transform group-hover:scale-105 group-hover:text-blue-600">
                                      <Plus size={16} />
                                      <span className="font-medium text-sm">
                                        Kunjungan
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
            </>
          )}
        </div>
      </div>

      {/* Modal View Mode - untuk menampilkan data pasien yang sudah ada */}
      {showViewModal && selectedAppointmentData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100 animate-slideUp">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Detail Kunjungan
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Lihat detail kunjungan pasien
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseViewModal}
                className="p-2 hover:bg-white/50 rounded-xl transition-colors"
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
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                      <User size={18} className="text-white" />
                    </div>
                    Informasi Pasien
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Nama Lengkap</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.patient_name}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">No. RM</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.patient_no_rm}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">NIK</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.nik}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Tanggal Lahir</p>
                      <p className="font-medium text-gray-900">
                        {format(
                          new Date(selectedAppointmentData.tanggal_lahir),
                          "dd MMM yyyy",
                          {
                            locale: id,
                          }
                        )}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Jenis Kelamin</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.jenis_kelamin}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Alamat</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.alamat}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">No. Telepon</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.phone}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visit Info */}
                <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Calendar size={18} className="text-white" />
                    </div>
                    Informasi Kunjungan
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Tanggal</p>
                      <p className="font-medium text-gray-900">
                        {format(
                          new Date(selectedAppointmentData.appointment_date),
                          "dd MMM yyyy",
                          {
                            locale: id,
                          }
                        )}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Waktu</p>
                      <p className="font-medium text-gray-900">
                        {format(
                          new Date(
                            `2000-01-01T${selectedAppointmentData.appointment_time}`
                          ),
                          "HH:mm"
                        )}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Dokter</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.doctor}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Poli</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.poli}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vitals */}
                <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Activity size={18} className="text-white" />
                    </div>
                    Vital Signs
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Tinggi Badan</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.height} cm
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Berat Badan</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.weight} kg
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Detak Jantung</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.heart_rate} bpm
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Gula Darah</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.blood_sugar} mg/dL
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Suhu Tubuh</p>
                      <p className="font-medium text-gray-900">
                        {selectedAppointmentData.temperature} °C
                      </p>
                    </div>
                  </div>
                </div>

                {/* Complaint */}
                <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                      <FileText size={18} className="text-white" />
                    </div>
                    Keluhan
                  </h3>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-gray-700">
                      {selectedAppointmentData.complaint}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Clipboard size={18} className="text-white" />
                    </div>
                    Catatan
                  </h3>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-gray-700">
                      {selectedAppointmentData.notes || "-"}
                    </p>
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
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText size={22} className="text-white" />
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
                className="p-2 hover:bg-white/50 rounded-xl transition-colors"
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
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <CreditCard size={10} className="text-white" />
                              </div>
                              No. RM
                            </label>
                            <div className="text-sm text-gray-800 font-medium">
                              {selectedPatient.no_rm}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1 items-center gap-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <Activity size={10} className="text-white" />
                              </div>
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
                            showNewPatientForm
                              ? "text-gray-600 hover:bg-gray-50"
                              : "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700 border border-green-200"
                          }`}
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Search size={16} className="text-white" />
                          </div>
                          Cari Pasien
                        </button>
                        <button
                          onClick={() => setShowNewPatientForm(true)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                            showNewPatientForm
                              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <UserPlus size={12} className="text-white" />
                          </div>
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
                    {/* Tanggal Kunjungan Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <Calendar size={12} className="text-white" />
                        </div>
                        Tanggal Kunjungan
                      </label>
                      <div className="flex gap-2 group">
                        <div className="relative flex-1">
                          <input
                            ref={dateInputRef}
                            type="date"
                            value={appointmentDate}
                            onChange={(e) =>
                              handleInputChange(e, "appointmentDate")
                            }
                            onFocus={() => console.log("Date input focused")}
                            onBlur={() => console.log("Date input blurred")}
                            min={format(startOfToday(), "yyyy-MM-dd")}
                            disabled={!!selectedSlot}
                            className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                              !!selectedSlot
                                ? "bg-gray-100 cursor-not-allowed"
                                : ""
                            }`}
                          />
                          <Calendar
                            size={16}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Calendar button clicked"); // Debug log
                            openDatePicker();
                          }}
                          onMouseDown={(e) => {
                            // Mencegah input date kehilangan focus
                            e.preventDefault();
                          }}
                          onTouchStart={(e) => {
                            // Untuk mobile devices
                            e.preventDefault();
                            openDatePicker();
                          }}
                          disabled={!!selectedSlot}
                          className={`px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center shadow-sm ${
                            !!selectedSlot
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 hover:shadow-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 active:scale-95"
                          }`}
                          title="Pilih tanggal dari kalender"
                        >
                          <Calendar
                            size={16}
                            className={`${
                              !!selectedSlot
                                ? "text-gray-400"
                                : "text-gray-500 group-hover:text-blue-600"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Dokter Section */}
                    <div className="doctor-search-container">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                          <Stethoscope size={12} className="text-white" />
                        </div>
                        Dokter
                      </label>
                      <div className="relative">
                        {!selectedDoctor ? (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Cari dokter berdasarkan nama atau poliklinik..."
                              value={doctorSearchTerm}
                              onChange={(e) => {
                                setDoctorSearchTerm(e.target.value);
                                setShowDoctorSearch(true);
                              }}
                              onFocus={() => setShowDoctorSearch(true)}
                              disabled={!appointmentDate}
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            <Search
                              size={16}
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            {!appointmentDate && (
                              <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center rounded-xl">
                                <p className="text-sm text-gray-500">
                                  Pilih tanggal terlebih dahulu
                                </p>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {showDoctorSearch &&
                          doctorSearchTerm &&
                          !selectedDoctor && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 max-h-[300px] overflow-y-auto custom-scrollbar max-w-full">
                              <div className="p-2">
                                {(() => {
                                  const filteredDoctors = doctors.filter(
                                    (doc) =>
                                      doc.name
                                        .toLowerCase()
                                        .includes(
                                          doctorSearchTerm.toLowerCase()
                                        ) ||
                                      (doc.poli_name &&
                                        doc.poli_name
                                          .toLowerCase()
                                          .includes(
                                            doctorSearchTerm.toLowerCase()
                                          ))
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
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="space-y-2">
                                      {filteredDoctors.map((doc) => {
                                        const status = getDoctorDetailedStatus(
                                          doc,
                                          appointmentDate
                                        );
                                        const statusConfig =
                                          getStatusConfig(status);
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                          <button
                                            key={doc.id}
                                            onClick={() => {
                                              handleDoctorSelect(doc.id);
                                              setDoctorSearchTerm("");
                                              setShowDoctorSearch(false);
                                            }}
                                            className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex items-center justify-between min-w-0"
                                          >
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-medium text-lg shrink-0 shadow-sm">
                                                {doc.name.charAt(0)}
                                              </div>
                                              <div className="flex-1 min-w-0 overflow-hidden">
                                                <h4 className="font-medium text-gray-800 break-words flex-1">
                                                  Dr.{" "}
                                                  {
                                                    doctors.find(
                                                      (d) =>
                                                        d.id === selectedDoctor
                                                    )?.name
                                                  }
                                                </h4>
                                                <div className="mt-1 flex items-center text-xs text-gray-500 truncate">
                                                  <Building2
                                                    size={12}
                                                    className="mr-1 shrink-0"
                                                  />
                                                  <span className="truncate">
                                                    Poliklinik{" "}
                                                    {highlightMatch(
                                                      doc.poli_name || "N/A",
                                                      doctorSearchTerm
                                                    )}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                            <div
                                              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center border shrink-0 ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
                                            >
                                              <StatusIcon
                                                size={12}
                                                className={`mr-1 ${statusConfig.iconColor}`}
                                              />
                                              {statusConfig.label}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}

                        {selectedDoctor && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100 overflow-hidden">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-medium text-xl shrink-0 shadow-sm">
                                {doctors
                                  .find((d) => d.id === selectedDoctor)
                                  ?.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="flex items-center gap-2 min-w-0">
                                  <h4 className="font-medium text-gray-800 truncate flex-1">
                                    Dr.{" "}
                                    {
                                      doctors.find(
                                        (d) => d.id === selectedDoctor
                                      )?.name
                                    }
                                  </h4>
                                </div>
                                <div className="mt-1 flex items-center gap-2 min-w-0">
                                  <div className="flex items-center text-xs text-gray-500 truncate">
                                    <Building2
                                      size={12}
                                      className="mr-1 shrink-0"
                                    />
                                    <span className="truncate">{`Poliklinik ${
                                      doctors.find(
                                        (d) => d.id === selectedDoctor
                                      )?.poli_name || "Poli Umum"
                                    }`}</span>
                                  </div>
                                  {(() => {
                                    const selectedDoctorData = doctors.find(
                                      (d) => d.id === selectedDoctor
                                    );
                                    const status = getDoctorDetailedStatus(
                                      selectedDoctorData,
                                      appointmentDate
                                    );
                                    const statusConfig =
                                      getStatusConfig(status);
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                      <div
                                        className={`flex items-center text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
                                      >
                                        <StatusIcon
                                          size={12}
                                          className={`mr-1 ${statusConfig.iconColor}`}
                                        />
                                        {statusConfig.label}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedDoctor("");
                                  setSelectedDoctorName("");
                                  setDoctorSearchTerm("");
                                  setShowDoctorSearch(true);
                                  setPoliId("");
                                  setPoliName("");
                                  setSelectedTime("");
                                  if (selectedSlot) {
                                    setSelectedSlot(null);
                                  }
                                }}
                                className="p-1 hover:bg-blue-100 rounded-lg transition-colors shrink-0"
                              >
                                <X size={16} className="text-gray-500" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Waktu Kunjungan Section - New Grid */}
                    {selectedDoctor && appointmentDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Clock size={12} className="text-white" />
                          </div>
                          Waktu Kunjungan
                        </label>
                        {availableTimeSlots.length > 0 ? (
                          <div className="space-y-4">
                            {(() => {
                              const morningSlots = availableTimeSlots.filter(
                                (t) => parseInt(t.split(":")[0]) < 12
                              );
                              const afternoonSlots = availableTimeSlots.filter(
                                (t) => parseInt(t.split(":")[0]) >= 12
                              );

                              return (
                                <>
                                  {morningSlots.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                                        Pagi
                                      </h4>
                                      <div className="grid grid-cols-4 gap-2">
                                        {morningSlots.map((time) => (
                                          <button
                                            key={time}
                                            onClick={() =>
                                              handleInputChange(
                                                { target: { value: time } },
                                                "selectedTime"
                                              )
                                            }
                                            disabled={
                                              !!selectedSlot &&
                                              time !== selectedTime
                                            }
                                            className={`p-2.5 rounded-lg text-center font-semibold transition-all duration-200 text-sm border-2 ${
                                              selectedTime === time
                                                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                                : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-400"
                                            } ${
                                              !!selectedSlot &&
                                              time !== selectedTime
                                                ? "cursor-not-allowed opacity-50 bg-gray-100 border-gray-200 text-gray-400"
                                                : ""
                                            }`}
                                          >
                                            {time.substring(0, 5)}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {afternoonSlots.length > 0 && (
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                                        Siang & Sore
                                      </h4>
                                      <div className="grid grid-cols-4 gap-2">
                                        {afternoonSlots.map((time) => (
                                          <button
                                            key={time}
                                            onClick={() =>
                                              handleInputChange(
                                                { target: { value: time } },
                                                "selectedTime"
                                              )
                                            }
                                            disabled={
                                              !!selectedSlot &&
                                              time !== selectedTime
                                            }
                                            className={`p-2.5 rounded-lg text-center font-semibold transition-all duration-200 text-sm border-2 ${
                                              selectedTime === time
                                                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                                : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-400"
                                            } ${
                                              !!selectedSlot &&
                                              time !== selectedTime
                                                ? "cursor-not-allowed opacity-50 bg-gray-100 border-gray-200 text-gray-400"
                                                : ""
                                            }`}
                                          >
                                            {time.substring(0, 5)}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-4 px-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-500">
                              Tidak ada jadwal tersedia pada tanggal ini.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Silakan pilih tanggal lain.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Poli Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                        <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                          <Building2 size={12} className="text-white" />
                        </div>
                        Poli
                      </label>
                      <input
                        type="text"
                        value={
                          poliName
                            ? `Poliklinik ${poliName}`
                            : "Pilih dokter untuk melihat poli"
                        }
                        readOnly
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-100 cursor-not-allowed focus:outline-none focus:ring-0"
                      />
                    </div>

                    {/* Vitals Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <Activity size={12} className="text-white" />
                        </div>
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
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <MessageSquare size={12} className="text-white" />
                        </div>
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
                        <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                          <FileText size={12} className="text-white" />
                        </div>
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

      {/* Render modal dokter pakai portal */}
      {showDoctorModal && selectedSection !== null && doctorModalAnchor && createPortal(
        <div
          ref={doctorModalRefs[selectedSection]}
          style={{
            position: 'absolute',
            zIndex: 9999,
            left: doctorModalAnchor.getBoundingClientRect().left + window.scrollX,
            top: doctorModalAnchor.getBoundingClientRect().bottom + window.scrollY,
            width: doctorModalAnchor.offsetWidth,
            minWidth: 320,
            maxWidth: 500,
          }}
          className="bg-white rounded-lg border border-gray-100 shadow-xl max-h-[300px] overflow-hidden animate-in slide-in-from-top-2 duration-200 backdrop-blur-sm"
        >
          {/* ...modal content, copy dari sebelumnya... */}
          <div className="p-2 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Search size={12} className="text-white" />
                </div>
              </div>
              <input
                type="text"
                value={doctorSearchTerm}
                onChange={(e) => setDoctorSearchTerm(e.target.value)}
                placeholder="Cari dokter berdasarkan nama atau poliklinik..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 shadow-sm text-sm"
              />
            </div>
            <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <Stethoscope size={10} />
              <span>
                {(() => {
                  const availableDoctorsForSection = getAvailableDoctors(selectedSection);
                  const filteredCount = doctorSearchTerm
                    ? availableDoctorsForSection.filter(
                        (d) =>
                          d.name.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
                          (d.poli_name && d.poli_name.toLowerCase().includes(doctorSearchTerm.toLowerCase()))
                      ).length
                    : availableDoctorsForSection.length;
                  return `${filteredCount} dokter tersedia`;
                })()}
              </span>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[200px] doctor-list-scrollable custom-scrollbar">
            {(() => {
              const availableDoctorsForSection = getAvailableDoctors(selectedSection);
              let doctorsToDisplay = availableDoctorsForSection;
              if (doctorSearchTerm) {
                doctorsToDisplay = availableDoctorsForSection.filter(
                  (d) =>
                    d.name.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
                    (d.poli_name && d.poli_name.toLowerCase().includes(doctorSearchTerm.toLowerCase()))
                );
              }
              doctorsToDisplay.sort((a, b) => {
                const statusA = getDoctorDetailedStatus(a, dateRange.start);
                const statusB = getDoctorDetailedStatus(b, dateRange.start);
                if (statusA === "available" && statusB !== "available") return -1;
                if (statusA !== "available" && statusB === "available") return 1;
                return a.name.localeCompare(b.name);
              });
              if (doctorsToDisplay.length === 0) {
                return (
                  <div className="p-4 text-center text-gray-500">
                    {doctorSearchTerm ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <Search size={20} className="text-gray-400" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <Stethoscope size={20} className="text-blue-400" />
                      </div>
                    )}
                    <p className="text-sm">
                      {doctorSearchTerm ? "Tidak ada dokter yang cocok." : "Tidak ada dokter tersedia."}
                    </p>
                  </div>
                );
              }
              return (
                <div className="p-2 grid gap-1.5">
                  {doctorsToDisplay.map((doc) => {
                    const status = getDoctorDetailedStatus(doc, dateRange.start);
                    const statusConfig = getStatusConfig(status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          handleSelectDoctor(doc.id, selectedSection);
                          setShowDoctorModal(false);
                          setDoctorSearchTerm("");
                        }}
                        className="flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer rounded-lg transition-colors duration-150 ease-in-out border border-transparent hover:border-blue-100"
                      >
                        <div className="flex-grow pr-3 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-medium text-sm shrink-0 shadow-sm">
                              {doc.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="font-medium text-gray-800 text-sm leading-tight break-words">
                                Dr. {highlightMatch(doc.name, doctorSearchTerm)}
                              </div>
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                Poliklinik {highlightMatch(doc.poli_name || "N/A", doctorSearchTerm)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center border shrink-0 ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                          <StatusIcon size={11} className={`mr-1 ${statusConfig.iconColor}`} />
                          {statusConfig.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}
    </PageTemplate>
  );
};

export default RawatJalan;
