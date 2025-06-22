import { useState, useEffect, useMemo, useCallback } from "react";
import PageTemplate from "../../components/PageTemplate";
import axios from "axios";
import config from "../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Calendar,
  Search,
  Pill,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Save,
  FileText,
  RefreshCw,
  ChevronRight,
  Edit,
  Clipboard,
  Activity,
  Stethoscope,
  Loader2,
  Package,
  PackageCheck,
  PackageX,
  Users,
  AlertTriangle,
  Lock,
} from "lucide-react";

const ResepObat = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visitMedications, setVisitMedications] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState({});
  const [newMedications, setNewMedications] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [medicineSearches, setMedicineSearches] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editQuantities, setEditQuantities] = useState({});

  useEffect(() => {
    fetchPatients();
    fetchMedicines();
  }, [selectedDate]);

  useEffect(() => {
    const timeouts = {};
    Object.keys(medicineSearches).forEach((id) => {
      timeouts[id] = setTimeout(async () => {
        const searchTerm = medicineSearches[id];
        if (!searchTerm || searchTerm.length < 2) {
          setFilteredMedicines((prev) => ({ ...prev, [id]: [] }));
          return;
        }

        try {
          const response = await axios.get(
            `${
              config.apiUrl
            }/billing/medicines/search?search=${encodeURIComponent(
              searchTerm
            )}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (response.data.success) {
            setFilteredMedicines((prev) => ({
          ...prev,
              [id]: response.data.data || [],
            }));
          } else {
            setFilteredMedicines((prev) => ({ ...prev, [id]: [] }));
          }
        } catch (error) {
          console.error("Error searching medicines:", error);
          setFilteredMedicines((prev) => ({ ...prev, [id]: [] }));
        }
      }, 300);
    });
    return () => Object.values(timeouts).forEach(clearTimeout);
  }, [medicineSearches]);

  const handleDateChange = (date) => {
    setSelectedDate(date || new Date());
    setSelectedPatient(null); // Reset patient selection when date changes
  };

  const fetchPatients = async () => {
    setLoadingPatients(true);
    setError("");
    try {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      const response = await axios.get(
        `${config.apiUrl}/billing/patients?date=${formattedDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        const patientList = response.data.data || [];
        setPatients(patientList);
        setFilteredPatients(patientList);
      } else {
        setPatients([]);
        setFilteredPatients([]);
        setError(response.data.message || "Tidak ada pasien untuk tanggal ini");
      }
    } catch (err) {
      console.error("Fetch patients error:", err.response?.data || err.message);
      setPatients([]);
      setFilteredPatients([]);
      setError("Gagal memuat daftar pasien");
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/billing/medicines`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) setMedicines(response.data.data || []);
    } catch (err) {
      console.error(
        "Fetch medicines error:",
        err.response?.data || err.message
      );
      setMedicines([]);
    }
  };

  const fetchVisitMedications = async (visitId) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${config.apiUrl}/billing/visit/${visitId}/medications`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setSelectedPatient(response.data.patient || null);
        const meds = (response.data.medications || []).map((vm) => ({
          ...vm,
          selected: false,
        }));
        setVisitMedications(meds);
        const quantities = {};
        meds.forEach((vm) => {
          quantities[vm.id] = vm.quantity || 0;
        });
        setEditQuantities(quantities);
        setNewMedications([]);
        setMedicineSearches({});
        setFilteredMedicines({});
      } else {
        handleDeselectPatient();
        setError(response.data.message || "Tidak ada data obat");
      }
    } catch (err) {
      console.error(
        "Fetch visit medications error:",
        err.response?.data || err.message
      );
      handleDeselectPatient();
      setError("Gagal memuat data obat");
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    fetchVisitMedications(patient.visit_id);
  };

  const handleDeselectPatient = useCallback(() => {
    setSelectedPatient(null);
    setVisitMedications([]);
    setNewMedications([]);
    setEditQuantities({});
  }, []);

  // Function to fetch updated patient data with appointment status
  const fetchUpdatedPatientData = async (visitId) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/billing/patients?date=${selectedDate.toISOString().split("T")[0]}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        const patientList = response.data.data || [];
        const updatedPatient = patientList.find(p => p.visit_id === visitId);
        if (updatedPatient) {
          setSelectedPatient(updatedPatient);
        }
      }
    } catch (err) {
      console.error("Fetch updated patient data error:", err.response?.data || err.message);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredPatients(
      patients.filter(
        (p) =>
          p.nama_lengkap.toLowerCase().includes(query) ||
          p.no_rm.includes(query)
      )
    );
  };

  const handleMedicineSearch = (id, value) => {
    // Clear medicine_name when user starts typing again
    if (value !== "") {
      setNewMedications(
        newMedications.map((m) =>
          m.id === id
            ? {
                ...m,
                medicine_id: "",
                medicine_name: "",
              }
            : m
        )
      );
    }
    setMedicineSearches((prev) => ({ ...prev, [id]: value }));
  };

  const handleQuantityChange = (medicationId, value) => {
    setEditQuantities((prev) => ({
      ...prev,
      [medicationId]: parseInt(value) || 0,
    }));
  };

  const handleNewMedQuantityChange = (id, value) => {
    const quantity = parseInt(value, 10);
    setNewMedications(
      newMedications.map((m) =>
        m.id === id ? { ...m, quantity: isNaN(quantity) ? "" : quantity } : m
      )
    );
  };

  const addNewMedicationRow = () => {
    const newId = `new_${Date.now()}`;
    setNewMedications([
      ...newMedications,
      {
        id: newId,
        medicine_id: "",
        dosage: "",
        frequency: "",
        duration: "",
        quantity: "",
        selected: false,
        medicine_name: "",
      },
    ]);
    setMedicineSearches((prev) => ({ ...prev, [newId]: "" }));
  };

  const handleInputChange = (id, field, value) => {
    setNewMedications(
      newMedications.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleMedicineSelect = (id, medicine) => {
    setNewMedications(
      newMedications.map((m) =>
        m.id === id
          ? {
              ...m,
              medicine_id: medicine.id,
              medicine_name: medicine.name,
            }
          : m
      )
    );
    setMedicineSearches((prev) => ({ ...prev, [id]: "" }));
    setFilteredMedicines((prev) => ({ ...prev, [id]: [] }));
  };

  const handleRemoveSelected = () => {
    setVisitMedications(visitMedications.filter((vm) => !vm.selected));
    setNewMedications(newMedications.filter((m) => !m.selected));
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setVisitMedications(
      visitMedications.map((vm) => ({ ...vm, selected: isChecked }))
    );
    setNewMedications(
      newMedications.map((m) => ({ ...m, selected: isChecked }))
    );
  };

  const handleToggleSelect = (type, id) => {
    if (type === "existing") {
      setVisitMedications(
        visitMedications.map((vm) =>
          vm.id === id ? { ...vm, selected: !vm.selected } : vm
        )
      );
    } else {
      setNewMedications(
        newMedications.map((m) =>
          m.id === id ? { ...m, selected: !m.selected } : m
        )
      );
    }
  };

  // New function to remove existing medication
  const handleRemoveExistingMedication = (id) => {
    setVisitMedications(visitMedications.filter((vm) => vm.id !== id));
  };

  // New function to remove new medication
  const handleRemoveNewMedication = (id) => {
    setNewMedications(newMedications.filter((m) => m.id !== id));
    setMedicineSearches((prev) => {
      const newSearches = { ...prev };
      delete newSearches[id];
      return newSearches;
    });
    setFilteredMedicines((prev) => {
      const newFiltered = { ...prev };
      delete newFiltered[id];
      return newFiltered;
    });
  };

  const saveChanges = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Get all existing medications that are still in the list (not deleted)
      const itemsToUpdate = visitMedications.map((vm) => ({
          id: vm.id,
        quantity: editQuantities[vm.id] ?? vm.quantity,
      }));

      // Get new medications that have valid data
      const itemsToAdd = newMedications
        .filter((m) => m.medicine_id && m.quantity > 0)
        .map((m) => ({
          visit_id: selectedPatient.visit_id,
          medicine_id: m.medicine_id,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          quantity: m.quantity,
        }));

      const response = await axios.post(
        `${config.apiUrl}/billing/process-medications`,
        {
          visit_id: selectedPatient.visit_id,
          updates: itemsToUpdate,
          adds: itemsToAdd,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        // Check if status changed from examined to dispensed
        const wasExamined = selectedPatient.appointment_status === "examined";
        const totalMedications = itemsToUpdate.length + itemsToAdd.length;
        
        let successMessage = "Data resep berhasil disimpan.";
        if (wasExamined && totalMedications > 0) {
          successMessage = "Data resep berhasil disimpan. Status pasien berubah dari 'Diperiksa' menjadi 'Siap Diambil'.";
        }
        
        setSuccess(successMessage);
        
        // Refresh patient list first to get updated statuses
        await fetchPatients();
        
        // Then fetch updated patient data and medications
        await fetchUpdatedPatientData(selectedPatient.visit_id);
        await fetchVisitMedications(selectedPatient.visit_id);
        
        setTimeout(() => setSuccess(""), 5000); // Show message longer for status change
      } else {
        setError(response.data.message || "Gagal menyimpan data");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Terjadi kesalahan saat menyimpan data"
      );
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sortedPatients = useMemo(() => {
    return [...filteredPatients].sort((a, b) => {
      // Define status priority (lower number = higher priority)
      const statusPriority = {
        'examined': 1,      // Highest priority - waiting for medication
        'dispensed': 2,     // Second priority - medication ready
        'confirmed': 3,     // Third priority - confirmed but not examined
        'checked-in': 4,    // Fourth priority - checked in
        'scheduled': 5,     // Fifth priority - scheduled
        'completed': 6,     // Lowest priority - completed/final
        'cancelled': 7      // Lowest priority - cancelled
      };
      
      const priorityA = statusPriority[a.appointment_status] || 8;
      const priorityB = statusPriority[b.appointment_status] || 8;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same status, sort by name
      return a.nama_lengkap.localeCompare(b.nama_lengkap);
    });
  }, [filteredPatients]);

  const patientStats = useMemo(() => {
    const total = patients.length;
    const waiting = patients.filter(
      (p) => p.appointment_status === "examined"
    ).length;
    const completed = patients.filter(
      (p) => p.appointment_status === "completed"
    ).length;
    const dispensed = patients.filter(
      (p) => p.appointment_status === "dispensed"
    ).length;
    const processed = waiting + dispensed;
    return { total, waiting, processed, completed, dispensed };
  }, [patients]);

  const isAllSelected = useMemo(() => {
    const allMeds = [...visitMedications, ...newMedications];
    return allMeds.length > 0 && allMeds.every((m) => m.selected);
  }, [visitMedications, newMedications]);

  const selectedPatientStatus = useMemo(() => {
    if (!selectedPatient) return null;
    // Map appointment status to display status
    if (selectedPatient.appointment_status === "examined") {
      return "waiting"; // Shows as 'Menunggu'
    } else if (selectedPatient.appointment_status === "dispensed") {
      return "completed"; // Shows as 'Selesai'
    }
    return "waiting";
  }, [selectedPatient]);

  // Check if status will change when saving
  const willStatusChange = useMemo(() => {
    if (!selectedPatient || selectedPatient.appointment_status !== "examined") {
      return false;
    }
    const totalMedications = visitMedications.length + newMedications.filter(m => m.medicine_id && m.quantity > 0).length;
    return totalMedications > 0;
  }, [selectedPatient, visitMedications, newMedications]);

  const isCompleted = useMemo(() => {
    return selectedPatient?.appointment_status === 'completed';
  }, [selectedPatient]);

  return (
    <PageTemplate>
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-2xl shadow-xl p-6 mb-6 backdrop-blur-sm border border-blue-100/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <Pill className="text-white" size={24} />
              </div>
              Resep Obat
            </h1>
            <p className="mt-2 text-gray-600 font-medium">
              Kelola dan proses resep obat untuk pasien yang sudah diperiksa
              (examined) dan siap diproses (dispensed).
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <Users size={18} className="text-white" />
            </div>
              <div>
                <span className="font-bold text-gray-800 text-lg">
                  {patientStats.total}
                </span>
                <span className="text-gray-600 text-sm block">Total</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Package size={18} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-amber-800 text-lg">
                  {patientStats.waiting}
                </span>
                <span className="text-amber-700 text-sm block">Menunggu</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <PackageCheck size={18} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-cyan-800 text-lg">
                  {patientStats.dispensed}
                </span>
                <span className="text-cyan-700 text-sm block">Dispensed</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-green-800 text-lg">
                  {patientStats.completed}
                </span>
                <span className="text-green-700 text-sm block">Final</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-5 sticky top-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <Users size={20} className="text-white" />
              </div>
              Antrian Pasien Diperiksa
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                  <Calendar className="text-gray-500" size={18} />
              </div>
              <DatePicker
                selected={selectedDate}
                  onChange={handleDateChange}
                dateFormat="dd MMMM yyyy"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 cursor-pointer hover:border-blue-400 text-sm font-medium shadow-sm"
                placeholderText="Pilih tanggal"
              />
            </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className="text-gray-500" size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                  placeholder="Cari nama atau No. RM..."
                  className="w-full p-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 hover:border-blue-400 text-sm font-medium bg-white/80 backdrop-blur-sm shadow-sm"
                />
            </div>
          </div>
            <div
              className="mt-4 space-y-2 custom-scrollbar overflow-y-auto p-1"
              style={{ maxHeight: "55vh" }}
            >
              {loadingPatients ? (
                <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 shadow-lg">
                    <Loader2 size={24} className="text-white animate-spin" />
            </div>
                  <span className="text-sm font-medium">
                    Memuat data pasien...
                  </span>
          </div>
              ) : sortedPatients.length === 0 ? (
                <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 shadow-lg">
                    <PackageX size={32} className="text-gray-400" />
                  </div>
                  <span className="text-sm font-bold text-gray-600">
                    Tidak ada pasien
                  </span>
                  <span className="text-xs text-gray-500">
                    Tidak ada pasien yang sudah diperiksa untuk tanggal ini.
                  </span>
                </div>
              ) : (
                sortedPatients.map((patient) => {
                  const isSelected =
                    selectedPatient?.visit_id === patient.visit_id;
                  // Use appointment_status to determine waiting status
                  // 'examined' = waiting for medication processing
                  // 'dispensed' = completed medication processing
                  const patientStatus = patient.appointment_status;
              return (
                <div
                      key={patient.visit_id}
                      className={`group p-4 border-l-4 cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                        isSelected
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg scale-[1.02]"
                          : `border-transparent ${
                              patientStatus === "examined"
                                ? "bg-gradient-to-r from-amber-50/50 to-orange-50/30"
                                : "bg-gradient-to-r from-gray-50 to-white"
                            } hover:bg-gray-100 hover:scale-[1.01] shadow-sm`
                      }`}
                  onClick={() => handlePatientSelect(patient)}
                >
                      <div className="flex justify-between items-center">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {patient.nama_lengkap}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">
                            RM: {patient.no_rm}
                          </p>
                  </div>
                        <div
                          className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${
                            patientStatus === "examined"
                              ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200"
                              : patientStatus === "completed"
                              ? "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 border border-slate-300"
                              : patientStatus === "dispensed"
                              ? "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-200"
                              : patientStatus === "confirmed"
                              ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200"
                              : patientStatus === "checked-in"
                              ? "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200"
                              : patientStatus === "cancelled"
                              ? "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
                              : "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                          }`}
                        >
                          {patientStatus === "examined"
                            ? "⏳ Menunggu"
                            : patientStatus === "completed"
                            ? "✓ Final"
                            : patientStatus === "dispensed"
                            ? "✓ Dispensed"
                            : patientStatus === "confirmed"
                            ? "✓ Confirmed"
                            : patientStatus === "checked-in"
                            ? "✓ Checked In"
                            : patientStatus === "cancelled"
                            ? "✗ Cancelled"
                            : "✓ Selesai"}
                    </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 flex items-center">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                          <Stethoscope size={12} className="text-white" />
                        </div>
                        <span className="font-medium">
                          Dr. {patient.doctor_name}
                        </span>
                  </div>
                </div>
              );
                })
              )}
          </div>
        </div>
        </div>
        <div className="lg:col-span-8 xl:col-span-9">
          {!selectedPatient ? (
            <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/10 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="text-center p-10 text-gray-500">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <User size={40} className="text-gray-400" />
              </div>
                <h3 className="text-xl font-bold text-gray-700 mb-3">
                  Pilih Pasien
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Silakan pilih pasien dari antrian untuk melihat dan memproses
                  resep obat.
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in space-y-6">
              <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 p-5 flex items-start rounded-2xl shadow-xl border border-blue-100/50 backdrop-blur-sm">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mr-5 shadow-lg shrink-0">
                  {selectedPatient.nama_lengkap.charAt(0)}
                    </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 truncate">
                      {selectedPatient.nama_lengkap}
                    </h2>
                    <div
                      className={`text-sm px-3 py-1.5 rounded-full flex items-center font-bold shadow-sm ${
                        selectedPatient.appointment_status === "completed"
                          ? "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 border border-slate-300"
                          : selectedPatientStatus === "completed"
                          ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                          : willStatusChange
                          ? "bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200 animate-pulse"
                          : "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {selectedPatient.appointment_status === "completed" ? (
                        <>
                          <Lock size={14} className="mr-1.5" /> Final
                        </>
                      ) : selectedPatientStatus === "completed" ? (
                        <>
                          {" "}
                          <CheckCircle size={14} className="mr-1.5" /> Selesai{" "}
                        </>
                      ) : willStatusChange ? (
                        <>
                          {" "}
                          <RefreshCw
                            size={14}
                            className="mr-1.5 animate-spin"
                          />{" "}
                          Akan Diupdate{" "}
                            </>
                          ) : (
                            <>
                          {" "}
                          <Clock size={14} className="mr-1.5" /> Menunggu{" "}
                            </>
                          )}
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-slate-100 to-gray-100 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                        <Lock size={14} className="text-slate-600" />
                        <span>
                          Resep sudah final dan tidak dapat diubah lagi.
                        </span>
                      </div>
                        </div>
                  )}
                  {willStatusChange && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl">
                      <div className="flex items-center gap-2 text-sm text-orange-800 font-medium">
                        <AlertTriangle size={14} className="text-orange-600" />
                        <span>Status akan berubah dari "Diperiksa" menjadi "Siap Diambil" setelah menyimpan resep</span>
                        </div>
                        </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600 mt-2 gap-4 flex-wrap">
                    <span className="flex items-center font-medium">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                        <Clipboard size={12} className="text-white" />
                      </div>
                      {selectedPatient.no_rm}
                    </span>
                    <span className="flex items-center font-medium">
                      <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                        <Activity size={12} className="text-white" />
                        </div>
                      {selectedPatient.age || "N/A"} Tahun
                    </span>
                    <span className="flex items-center font-medium">
                      <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                        <Stethoscope size={12} className="text-white" />
                      </div>
                      Dr. {selectedPatient.doctor_name || "N/A"}
                    </span>
                    <span className="flex items-center font-medium">
                      <div className="w-5 h-5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                        <FileText size={12} className="text-white" />
                    </div>
                      Appointment: {selectedPatient.appointment_code || "N/A"}
                    </span>
                  </div>
                  </div>
                  <button 
                  onClick={handleDeselectPatient}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110"
                  >
                  <XCircle size={18} />
                  </button>
                </div>

              <div className="bg-white rounded-xl shadow-lg p-6 backdrop-blur-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    <FileText className="mr-3 text-blue-500" size={24} />
                    Daftar Resep
                  </h3>
                  <div className="flex items-center gap-3">
                  <button 
                      onClick={addNewMedicationRow}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl hover:scale-105 transform disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                      disabled={loading || isCompleted}
                  >
                      <Plus size={16} className="mr-2" /> Tambah Obat
                  </button>
                  <button 
                      onClick={saveChanges}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center transform disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none ${
                        willStatusChange 
                          ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                      }`}
                      disabled={loading || isCompleted}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : willStatusChange ? (
                        <RefreshCw size={16} className="mr-2" />
                      ) : (
                        <Save size={16} className="mr-2" />
                      )}
                      {willStatusChange ? 'Simpan & Update Status' : 'Simpan Resep'}
                  </button>
                  </div>
                </div>

                {/* Existing Medications Cards - Simplified for tablet */}
                {visitMedications.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"></div>
                      <h4 className="text-base font-bold text-gray-800 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Obat yang Sudah Ada ({visitMedications.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {visitMedications.map((vm) => (
                        <div
                          key={vm.id}
                          className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                  <Pill size={14} className="text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-bold text-gray-900 text-base truncate">
                                    {vm.medicine_name}
                                  </h5>
                                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                    <span className="flex items-center gap-1">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      Stok: {vm.stock}
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        vm.status === "processed"
                                          ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200"
                                          : "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200"
                                      }`}
                                    >
                                      {vm.status === "processed"
                                        ? "✓ Selesai"
                                        : "⏳ Menunggu"}
                                    </span>
                                  </div>
                                </div>
                </div>
                <button 
                                onClick={() =>
                                  handleRemoveExistingMedication(vm.id)
                                }
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isCompleted}
                              >
                                <Trash2 size={14} />
                </button>
              </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1 font-medium">
                                  Dosis
                                </p>
                                <p className="font-bold text-gray-800 text-sm">
                                  {vm.dosage || "-"}
                                </p>
                              </div>
                              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1 font-medium">
                                  Frekuensi
                                </p>
                                <p className="font-bold text-gray-800 text-sm">
                                  {vm.frequency || "-"}
                                </p>
                              </div>
                              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1 font-medium">
                                  Durasi
                                </p>
                                <p className="font-bold text-gray-800 text-sm">
                                  {vm.duration || "-"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                              <span className="text-sm font-bold text-gray-700">
                                Kuantitas:
                              </span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={editQuantities[vm.id] || 0}
                                  onChange={(e) =>
                                    handleQuantityChange(vm.id, e.target.value)
                                  }
                                  className="w-20 p-2 border border-gray-200 rounded-lg text-center font-bold text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-white"
                                  min="0"
                                  max={vm.stock || undefined}
                                  readOnly={isCompleted}
                                />
                                <span className="text-xs text-gray-500 font-medium">
                                  unit
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Medications Cards - Simplified for tablet */}
                {newMedications.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-lg"></div>
                      <h4 className="text-base font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Obat Baru ({newMedications.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {newMedications.map((m) => (
                        <div
                          key={m.id}
                          className="group bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                  <Plus size={14} className="text-white" />
                                </div>
                                <div className="flex-1 relative">
                                  <input
                                    type="text"
                                    value={medicineSearches[m.id] || ""}
                                    onChange={(e) =>
                                      handleMedicineSearch(m.id, e.target.value)
                                    }
                                    placeholder="Cari obat..."
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium"
                                    autoComplete="off"
                                    readOnly={isCompleted}
                                  />

                                  {m.medicine_name && (
                                    <div className="mt-2 p-2 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl">
                                      <p className="text-sm font-bold text-green-800 flex items-center">
                                        <CheckCircle
                                          size={12}
                                          className="mr-2 text-green-600"
                                        />
                                        {m.medicine_name}
                                      </p>
                                    </div>
                                  )}

                                  {/* Tooltip Dropdown Obat */}
                                  {medicineSearches[m.id] &&
                                    medicineSearches[m.id].length >= 2 &&
                                    filteredMedicines[m.id] && (
                                      <div className="absolute left-0 top-full mt-2 w-full bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                                        {filteredMedicines[m.id].length > 0 ? (
                                          filteredMedicines[m.id].map((med) => (
                                <div
                                  key={med.id}
                                              onClick={() =>
                                                handleMedicineSelect(m.id, med)
                                              }
                                              className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-blue-50/80 border-b border-gray-100 last:border-b-0 transition-all duration-200"
                                            >
                                              <span className="font-bold text-gray-800 text-sm">
                                                {med.name}
                                              </span>
                                              <span
                                                className={`ml-3 px-2 py-1 rounded-full text-xs font-bold ${
                                                  med.stock <= 0
                                                    ? "bg-red-100 text-red-700 border border-red-200"
                                                    : "bg-green-100 text-green-700 border border-green-200"
                                                }`}
                                              >
                                                {med.stock <= 0
                                                  ? "❌ Habis"
                                                  : `✓ ${med.stock}`}
                                              </span>
                                </div>
                                          ))
                                        ) : (
                                          <div className="p-4 text-center text-gray-500 text-sm">
                                            Tidak ada obat ditemukan
                            </div>
                          )}
                                      </div>
                                    )}
                                </div>
                              </div>
                <button 
                                onClick={() => handleRemoveNewMedication(m.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isCompleted}
                              >
                                <Trash2 size={14} />
                </button>
              </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                              <div>
                                <input
                                  type="text"
                                  value={m.dosage}
                                  onChange={(e) =>
                                    handleInputChange(
                                      m.id,
                                      "dosage",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium"
                                  placeholder="Dosis"
                                  readOnly={isCompleted}
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={m.frequency}
                                  onChange={(e) =>
                                    handleInputChange(
                                      m.id,
                                      "frequency",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium"
                                  placeholder="Frekuensi"
                                  readOnly={isCompleted}
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={m.duration}
                                  onChange={(e) =>
                                    handleInputChange(
                                      m.id,
                                      "duration",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium"
                                  placeholder="Durasi"
                                  readOnly={isCompleted}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                              <span className="text-sm font-bold text-gray-700">
                                Kuantitas:
                              </span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={m.quantity}
                                  onChange={(e) =>
                                    handleNewMedQuantityChange(
                                      m.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-20 p-2 border border-gray-200 rounded-lg text-center font-bold text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
                                  min="1"
                                  placeholder="Jumlah"
                                  readOnly={isCompleted}
                                />
                                <span className="text-xs text-gray-500 font-medium">
                                  unit
                                </span>
                              </div>
                            </div>
                          </div>
                                </div>
                              ))}
                    </div>
                            </div>
                          )}

                {/* Empty State */}
                {visitMedications.length === 0 &&
                  newMedications.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Pill size={28} className="text-gray-400" />
        </div>
                      <h3 className="text-lg font-bold text-gray-700 mb-2">
                        Belum Ada Obat
                      </h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                        Tambahkan obat untuk pasien ini dengan mengklik tombol
                        di atas
                      </p>
                <button 
                        onClick={addNewMedicationRow}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-300 flex items-center mx-auto shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                        <Plus size={18} className="mr-2" /> Tambah Obat Pertama
                </button>
      </div>
                  )}
              </div>
        </div>
      )}
        </div>
      </div>
      {(success || error) && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl shadow-lg px-6 py-4 animate-fade-in flex items-center gap-3 ${
            success
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {success ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
          <div>
            <p className="font-bold">{success ? "Berhasil" : "Gagal"}</p>
            <p>{success || error}</p>
        </div>
          <button
            onClick={() => {
              setSuccess("");
              setError("");
            }}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}
    </PageTemplate>
  );
};

export default ResepObat;
