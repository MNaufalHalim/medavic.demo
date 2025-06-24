import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import config from "../../config";
import PageTemplate from "../../components/PageTemplate";
import { format } from "date-fns";
import Select from "react-select";
import {
  UserCircle,
  Calendar,
  Clock,
  Stethoscope,
  Activity,
  Thermometer,
  Weight,
  Ruler,
  Heart,
  Droplet,
  ClipboardList,
  FileText,
  PlusCircle,
  Search,
  ChevronRight,
  Edit3,
  X,
  Save,
  RefreshCw,
  Filter,
  User,
  Pill,
  CreditCard,
  Check,
  Lock,
} from "lucide-react";

// CSS for animations and styling
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .animate-slide-in {
    animation: slideIn 0.4s ease-out forwards;
  }
  
  .animate-pulse {
    animation: pulse 2s infinite;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
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
  
  /* Line clamp utility */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Datepicker styling for better browser compatibility */
  input[type="date"] {
    position: relative;
    background-color: white;
  }
  
  input[type="date"]::-webkit-calendar-picker-indicator {
    background: transparent;
    bottom: 0;
    color: transparent;
    cursor: pointer;
    height: auto;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    width: auto;
  }
  
  input[type="date"]::-webkit-datetime-edit {
    padding: 0;
  }
  
  input[type="date"]::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
  }
  
  input[type="date"]::-webkit-datetime-edit-text {
    padding: 0 2px;
  }
  
  input[type="date"]::-webkit-datetime-edit-month-field,
  input[type="date"]::-webkit-datetime-edit-day-field,
  input[type="date"]::-webkit-datetime-edit-year-field {
    padding: 0 2px;
  }
  
  /* Firefox datepicker styling */
  input[type="date"]::-moz-calendar-picker-indicator {
    background: transparent;
    border: none;
    cursor: pointer;
    height: 100%;
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
  }
  
  /* Edge datepicker styling */
  input[type="date"]::-ms-clear,
  input[type="date"]::-ms-expand {
    display: none;
  }
  
  input[type="date"]::-ms-calendar-picker-indicator {
    background: transparent;
    border: none;
    cursor: pointer;
    height: 100%;
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
  }
`;

// MedicalRecordModal Component
const MedicalRecordModal = ({
  type,
  title,
  show,
  onClose,
  onSave,
  selectedItems,
  recentItems,
  medicationDetails,
  onSearch,
  onSelectItem,
  onRemoveItem,
  loading,
  setMedicalRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempMedication, setTempMedication] = useState(null);
  const [tempPreset, setTempPreset] = useState(null);

  // Reset modal state when modal is closed or opened
  useEffect(() => {
    if (!show) {
      // Reset internal state when modal is closed
      setSearchTerm("");
      setOptions([]);
      setIsLoading(false);
      setIsSubmitting(false);
      setTempMedication(null);
      setTempPreset(null);
    }
  }, [show]);

  // Sync selected items when modal is opened
  useEffect(() => {
    if (show && selectedItems) {
      console.log(`Modal opened for ${type}, selected items:`, selectedItems);
    }
  }, [show, selectedItems, type]);

  // Modal config
  const modalConfig = {
    procedure: {
      icon: <Activity size={20} />,
      color: "blue",
      gradient: "from-blue-50 to-indigo-50",
      accent: "blue",
    },
    diagnose: {
      icon: <FileText size={20} />,
      color: "green",
      gradient: "from-green-50 to-emerald-50",
      accent: "green",
    },
    medication: {
      icon: <Pill size={20} />,
      color: "purple",
      gradient: "from-purple-50 to-violet-50",
      accent: "purple",
    },
  };

  // Filter out already selected items from search results
  const filteredOptions = useMemo(() => {
    if (!options) return [];
    return options.filter((opt) => !selectedItems.includes(opt.value));
  }, [options, selectedItems]);

  // Debounced search
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setOptions([]);
      return;
    }
    setIsLoading(true);
    const timeout = setTimeout(async () => {
      const results = await onSearch(type, searchTerm);
      setOptions(results || []);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, type, onSearch]);

  // Handle medication selection
  const handleSelectMedication = (selectedOption) => {
    if (!selectedOption) return;
    setTempMedication(selectedOption);
    setTempPreset({ dosage: "", frequency: "", duration: "" });
  };

  // Confirm medication preset
  const handleConfirmPreset = () => {
    if (!tempMedication || !tempPreset) return;
    if (!tempPreset.dosage || !tempPreset.frequency || !tempPreset.duration)
      return;
    const medicationWithDetails = {
      ...tempMedication,
      value: tempMedication.value,
      details: {
        dosage: tempPreset.dosage,
        frequency: tempPreset.frequency,
        duration: tempPreset.duration,
      },
    };
    onSelectItem(type, medicationWithDetails);
    setMedicalRecord((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          name: tempMedication.label,
          details: { ...tempPreset },
        },
      ],
    }));
    setTempMedication(null);
    setTempPreset(null);
    setSearchTerm("");
  };

  // Format selected medication display
  const formatSelectedMedication = (item) => {
    if (type === "medication") {
      // Handle if item is an object with details
      if (item && typeof item === "object" && item.details) {
        const { dosage, frequency, duration } = item.details;
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">
              {item.label || item.name || item.value}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-medium">
                Dosis: {dosage}
              </span>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                Frek: {frequency}
              </span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-medium">
                Durasi: {duration}
              </span>
            </div>
          </div>
        );
      }
      // Check if medicationDetails has this item
      else if (medicationDetails && medicationDetails[item]) {
        const { dosage, frequency, duration } = medicationDetails[item];
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{item}</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-medium">
                Dosis: {dosage}
              </span>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                Frek: {frequency}
              </span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-medium">
                Durasi: {duration}
              </span>
            </div>
          </div>
        );
      }
      // Handle string items (from recent items)
      else if (typeof item === "string") {
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{item}</span>
            <div className="text-xs text-gray-500 mt-1">
              Detail tidak tersedia
            </div>
          </div>
        );
      }
    } else if (type === "diagnose") {
      // For diagnoses, display the full value (code + name)
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{item}</span>
        </div>
      );
    }
    return typeof item === "object" && item.name ? item.name : item;
  };

  // Handle save with local loading state
  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await onSave(type, medicationDetails);
    } catch (error) {
      console.error("Error saving medical record:", error);
      // Error handling is done in the parent component (handleSaveMedicalRecord)
      // Modal will be closed automatically on success, or error will be shown
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto p-0 animate-fade-in`}
      >
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${modalConfig[type].gradient} px-6 py-4 rounded-t-2xl`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 bg-gradient-to-br from-${
                  modalConfig[type].accent
                }-500 to-${
                  modalConfig[type].accent === "blue"
                    ? "indigo"
                    : modalConfig[type].accent === "green"
                    ? "emerald"
                    : "indigo"
                }-600 rounded-xl flex items-center justify-center shadow-lg`}
              >
                {React.cloneElement(modalConfig[type].icon, {
                  className: "text-white",
                })}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Tambah {title}
                </h2>
                <p className="text-sm text-gray-600">
                  Pilih dan kelola {title.toLowerCase()} untuk pasien
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isSubmitting
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-400 hover:text-gray-700 hover:bg-white/50"
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Search Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Search size={12} className="text-white" />
              </div>
              Cari {title.toLowerCase()}
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                placeholder={`Ketik untuk mencari ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      Memuat hasil...
                    </div>
                  ) : filteredOptions.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      Tidak ada hasil ditemukan
                    </div>
                  ) : (
                    filteredOptions.map((opt, idx) => (
                      <div
                        key={opt.value}
                        className="px-4 py-3 cursor-pointer hover:bg-slate-50 text-sm flex justify-between items-center border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                        onClick={() => {
                          if (type === "medication")
                            handleSelectMedication(opt);
                          else onSelectItem(type, opt);
                          setSearchTerm("");
                        }}
                      >
                        <span className="font-medium text-gray-800">
                          {opt.label}
                        </span>
                        {type === "medication" && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            Stok: {opt.stock || "N/A"}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Medication Detail Input */}
          {type === "medication" && tempMedication && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Pill size={18} className="text-purple-600" />
                <span className="text-sm font-semibold text-purple-800">
                  Detail Penggunaan: {tempMedication.label}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Dosis
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 3x1"
                    value={tempPreset?.dosage || ""}
                    onChange={(e) =>
                      setTempPreset((prev) => ({
                        ...prev,
                        dosage: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Frekuensi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Setelah makan"
                    value={tempPreset?.frequency || ""}
                    onChange={(e) =>
                      setTempPreset((prev) => ({
                        ...prev,
                        frequency: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Durasi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 5 hari"
                    value={tempPreset?.duration || ""}
                    onChange={(e) =>
                      setTempPreset((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <button
                onClick={handleConfirmPreset}
                disabled={
                  !tempPreset?.dosage ||
                  !tempPreset?.frequency ||
                  !tempPreset?.duration
                }
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tempPreset?.dosage &&
                  tempPreset?.frequency &&
                  tempPreset?.duration
                    ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Tambahkan ke Daftar
              </button>
            </div>
          )}

          {/* Selected Items Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ClipboardList size={16} className="text-gray-500" />
                {title} Terpilih
                {selectedItems.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {selectedItems.length}
                  </span>
                )}
              </label>
            </div>
            <div className="min-h-[60px] p-4 bg-slate-50 rounded-xl shadow-sm">
              {selectedItems.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {selectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3 w-full"
                    >
                      <div className="flex-1">
                        {formatSelectedMedication(item)}
                      </div>
                      <button
                        onClick={() => onRemoveItem(type, item)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors duration-200 flex-shrink-0"
                        title="Hapus item"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <ClipboardList
                    size={24}
                    className="mx-auto mb-2 text-gray-300"
                  />
                  <p className="text-sm">
                    Belum ada {title.toLowerCase()} yang dipilih
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Items Section */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Clock size={16} className="text-gray-500" />
              {title} Terakhir Digunakan
            </label>
            <div className="flex flex-wrap gap-2">
              {recentItems.length > 0 ? (
                recentItems.map((item, idx) => (
                  <button
                    key={idx}
                    className="bg-white rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:shadow-md transition-all duration-200 flex items-center gap-2 shadow-sm"
                    onClick={() => {
                      if (type === "medication") {
                        // For medications, pass the string directly to handleSelectItem
                        onSelectItem(type, item);
                      } else {
                        // For other types, pass as object
                        onSelectItem(type, { value: item, label: item });
                      }
                    }}
                  >
                    <PlusCircle size={14} className="text-gray-400" />
                    {item}
                  </button>
                ))
              ) : (
                <div className="text-sm text-gray-400 italic">
                  Belum ada riwayat penggunaan
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-5 py-2 text-sm font-semibold rounded-lg border transition-all duration-200 flex items-center gap-2 shadow-none
                ${
                  isSubmitting
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                }
              `}
            >
              <X size={16} />
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={`px-5 py-2 text-sm font-semibold rounded-lg border transition-all duration-200 flex items-center gap-2 shadow-none
                ${
                  isSubmitting
                    ? "bg-blue-100 text-blue-300 border-blue-100 cursor-not-allowed"
                    : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700"
                }
              `}
            >
              {isSubmitting ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Simpan {title}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// InputRM Component
const InputRM = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientOptions, setPatientOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [dateFilter, setDateFilter] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedPatientData = useMemo(() => {
    if (!selectedAppointmentId) return null;
    return (
      patients.find((p) => p.appointment_id === selectedAppointmentId) || null
    );
  }, [selectedAppointmentId, patients]);

  const [vitals, setVitals] = useState({
    height: "Belum diisi",
    weight: "Belum diisi",
    heartRate: "Belum diisi",
    bloodSugar: "Belum diisi",
    temperature: "Belum diisi",
  });
  const [showEditVitalsModal, setShowEditVitalsModal] = useState(false);

  const [medicalRecord, setMedicalRecord] = useState({
    procedures: [],
    diagnoses: [],
    medications: [],
  });

  const [modalState, setModalState] = useState({
    procedure: { show: false, selected: [], recent: [] },
    diagnose: { show: false, selected: [], recent: [] },
    medication: { show: false, selected: [], recent: [], details: {} },
  });

  const [visitHistory, setVisitHistory] = useState([]);

  const updateModalState = useCallback((type, updates) => {
    setModalState((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...updates },
    }));
  }, []);

  // Function to reset modal state
  const resetModalState = useCallback((type) => {
    setModalState((prev) => ({
      ...prev,
      [type]: {
        show: false,
        selected: [],
        recent: prev[type].recent, // Keep recent items
        details: type === "medication" ? {} : undefined,
      },
    }));
  }, []);

  // Function to handle modal close with reset
  const handleModalClose = useCallback(
    (type) => {
      resetModalState(type);
    },
    [resetModalState]
  );

  const handleSearchMedicalRecord = useCallback(async (type, term) => {
    if (term.length < 2) {
      return [];
    }
    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      switch (type) {
        case "procedure":
          endpoint = `${config.apiUrl}/medical/procedures/search?search=${term}`;
          break;
        case "medication":
          endpoint = `${config.apiUrl}/medical/medications/search?search=${term}`;
          break;
        case "diagnose":
          endpoint = `${config.apiUrl}/medical/diagnoses/search?search=${term}`;
          break;
        default:
          throw new Error("Tipe tidak valid");
      }
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        return response.data.data.map((item) => {
          if (type === "diagnose") {
            return {
              value: `${item.code} - ${item.name}`,
              label: `${item.code} - ${item.name}`,
              id: item.id,
            };
          }
          return {
            value: item.name,
            label: item.name,
            id: item.id,
            stock: item.stock,
            price: item.price,
          };
        });
      }
      return [];
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      setError(`Gagal mencari ${type}`);
      return [];
    }
  }, []);

  const handleSaveMedicalRecord = useCallback(
    async (type, details = {}) => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Token autentikasi tidak ditemukan. Silakan login kembali.");
          return;
        }

        console.log(
          `Saving ${type} - selected items:`,
          modalState[type].selected
        ); // Debug log

        // Get the correct visit_id for the current appointment
        let visit_id = null;

        if (selectedPatientData?.appointment_id) {
          try {
            const visitResponse = await axios.get(
              `${config.apiUrl}/medical/visits/appointment/${selectedPatientData.appointment_id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (visitResponse.data.success) {
              visit_id = visitResponse.data.data.visit_id;
              console.log("Found visit_id from appointment:", visit_id);
            }
          } catch (error) {
            console.warn(
              "Could not get visit_id from appointment, falling back to latest visit"
            );
          }
        }

        // Fallback to latest visit if no appointment-specific visit found
        if (!visit_id && visitHistory.length > 0) {
          visit_id = visitHistory[0]?.visit_id;
          console.log("Using latest visit_id as fallback:", visit_id);
        }

        if (!visit_id) {
          setError(
            "Tidak ada kunjungan untuk pasien ini. Silakan buat kunjungan terlebih dahulu."
          );
          return;
        }

        let payload;

        if (type === "medication") {
          // For medications, send objects with details
          payload = {
            visit_id: visit_id,
            items: modalState[type].selected.map((item) => ({
              name: item,
              ...(details[item]
                ? {
                    dosage: details[item].dosage,
                    frequency: details[item].frequency,
                    duration: details[item].duration,
                  }
                : {}),
            })),
          };
        } else {
          // For procedures and diagnoses, send array of strings
          payload = {
            visit_id: visit_id,
            items: modalState[type].selected,
          };
        }

        console.log("Payload before send:", payload); // Debug
        console.log(
          `Payload type: ${type}, items count: ${payload.items.length}`
        ); // Debug log
        console.log("Payload items:", payload.items); // Debug log

        const endpoint = `${config.apiUrl}/medical/visit-${type}s`;
        const response = await axios.post(endpoint, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          console.log(`Successfully saved ${type}:`, response.data); // Debug log

          // Update appointment status to examined using appointment_code
          if (selectedPatientData?.appointment_id) {
            await updateAppointmentStatus(selectedPatientData.appointment_id);
          }

          // Reset modal state after successful save
          resetModalState(type);
          
          // Show success message
          const titleMap = {
            procedure: "Tindakan",
            diagnose: "Diagnosa", 
            medication: "Obat"
          };
          const title = titleMap[type] || type;
          setSuccessMessage(`${title} berhasil disimpan!`);
          setTimeout(() => setSuccessMessage(null), 3000);

          setMedicalRecord((prev) => {
            // For medications, store the full object with details
            if (type === "medication") {
              return {
                ...prev,
                [`${type}s`]: payload.items.map((item) => ({
                  name: item.name,
                  details: {
                    dosage: item.dosage || "",
                    frequency: item.frequency || "",
                    duration: item.duration || "",
                  },
                })),
              };
            } else {
              // For other types, store the full value (including code for diagnoses)
              return {
                ...prev,
                [`${type}s`]: payload.items,
              };
            }
          });

          // Fetch updated data from server to ensure consistency
          await fetchPatientData(selectedPatientData?.no_rm);
        } else {
          const titleMap = {
            procedure: "Tindakan",
            diagnose: "Diagnosa", 
            medication: "Obat"
          };
          const title = titleMap[type] || type;
          const errorMessage =
            response.data.message ||
            `Gagal menyimpan ${title}. Silakan coba lagi.`;
          setError(errorMessage);
          console.error(`Failed to save ${type}:`, response.data);
        }
      } catch (error) {
        console.error(`Error saving ${type}:`, error);
        const titleMap = {
          procedure: "Tindakan",
          diagnose: "Diagnosa", 
          medication: "Obat"
        };
        const title = titleMap[type] || type;
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          `Gagal menyimpan ${title}. Silakan coba lagi.`;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [visitHistory, modalState, selectedPatientData, updateModalState, resetModalState]
  );

  const handleSelectItem = useCallback(
    (type, item) => {
      if (!item) return;
      const selectedItems = modalState[type].selected;

      console.log(`handleSelectItem - type: ${type}, item:`, item); // Debug log

      // Handle medication with details
      if (type === "medication" && item.details) {
        // Store medication with its details
        if (selectedItems.includes(item.value)) return;

        updateModalState(type, {
          selected: [...selectedItems, item.value],
          recent: [
            item.value,
            ...modalState[type].recent.filter((rec) => rec !== item.value),
          ].slice(0, 10),
        });

        // Update medication details in modalState
        updateModalState(type, {
          details: {
            ...modalState[type].details,
            [item.value]: item.details,
          },
        });
      } else if (type === "medication" && typeof item === "string") {
        // Handle medication from recent items (string format)
        if (selectedItems.includes(item)) return;

        updateModalState(type, {
          selected: [...selectedItems, item],
          recent: [
            item,
            ...modalState[type].recent.filter((rec) => rec !== item),
          ].slice(0, 10),
        });

        // For recent items, we don't have details, so we'll add empty details
        updateModalState(type, {
          details: {
            ...modalState[type].details,
            [item]: {
              dosage: "Belum diisi",
              frequency: "Belum diisi",
              duration: "Belum diisi",
            },
          },
        });
      } else {
        // Handle regular items (procedures, diagnoses)
        // For diagnoses, we want to store the full value (code + name)
        const itemValue = item.value || item;
        console.log(`Selected item value: ${itemValue}`); // Debug log

        if (selectedItems.includes(itemValue)) {
          console.log(`Item already selected: ${itemValue}`); // Debug log
          return;
        }

        updateModalState(type, {
          selected: [...selectedItems, itemValue],
          recent: [
            itemValue,
            ...modalState[type].recent.filter((rec) => rec !== itemValue),
          ].slice(0, 10),
        });
      }
    },
    [modalState, updateModalState]
  );

  const handleRemoveItem = useCallback(
    (type, item) => {
      updateModalState(type, {
        selected: modalState[type].selected.filter((i) => i !== item),
      });
      if (type === "medication") {
        // Remove medication details from modalState
        const newDetails = { ...modalState[type].details };
        delete newDetails[item];
        updateModalState(type, {
          details: newDetails,
        });
      }
    },
    [modalState, updateModalState]
  );

  const EditVitalsModal = ({
    vitals,
    visitId,
    onSave,
    onClose,
    updateAppointmentStatus,
  }) => {
    const [tempVitals, setTempVitals] = useState({
      height:
        vitals.height === "Belum diisi" ? "" : vitals.height.replace(" cm", ""),
      weight:
        vitals.weight === "Belum diisi" ? "" : vitals.weight.replace(" kg", ""),
      heartRate:
        vitals.heartRate === "Belum diisi"
          ? ""
          : vitals.heartRate.replace(" bpm", ""),
      bloodSugar:
        vitals.bloodSugar === "Belum diisi"
          ? ""
          : vitals.bloodSugar.replace(" mg/dl", ""),
      temperature:
        vitals.temperature === "Belum diisi"
          ? ""
          : vitals.temperature.replace("° C", ""),
    });
    const [errorMessage, setErrorMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field, value) => {
      setTempVitals((prev) => ({ ...prev, [field]: value }));
      setErrorMessage(null);
    };

    const isFormValid = () => {
      return (
        tempVitals.height &&
        tempVitals.weight &&
        tempVitals.heartRate &&
        tempVitals.bloodSugar &&
        tempVitals.temperature
      );
    };

    const handleSubmit = async () => {
      try {
        setIsSubmitting(true);
        setErrorMessage(null);
        const token = localStorage.getItem("token");

        // Get the correct visit_id for the current appointment
        let finalVisitId = visitId;

        if (!finalVisitId && selectedPatientData?.appointment_id) {
          try {
            const visitResponse = await axios.get(
              `${config.apiUrl}/medical/visits/appointment/${selectedPatientData.appointment_id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (visitResponse.data.success) {
              finalVisitId = visitResponse.data.data.visit_id;
              console.log(
                "Found visit_id for vitals from appointment:",
                finalVisitId
              );
            }
          } catch (error) {
            console.warn("Could not get visit_id from appointment for vitals");
          }
        }

        if (!finalVisitId) {
          setErrorMessage(
            "Tidak ada kunjungan untuk pasien ini. Silakan buat kunjungan terlebih dahulu."
          );
          return;
        }

        if (!isFormValid()) {
          setErrorMessage("Semua field wajib diisi.");
          return;
        }
        const payload = {
          visit_id: finalVisitId,
          height: tempVitals.height,
          weight: tempVitals.weight,
          heart_rate: tempVitals.heartRate,
          blood_sugar: tempVitals.bloodSugar,
          temperature: tempVitals.temperature,
        };

        console.log("Sending vitals payload:", payload); // Debug log

        const response = await axios.post(
          `${config.apiUrl}/medical/editvitals`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Vitals response:", response.data); // Debug log

        // Update appointment status to examined using appointment_code
        if (selectedPatientData?.appointment_id) {
          await updateAppointmentStatus(selectedPatientData.appointment_id);
        }

        onSave({
          height: tempVitals.height ? `${tempVitals.height} cm` : "Belum diisi",
          weight: tempVitals.weight ? `${tempVitals.weight} kg` : "Belum diisi",
          heartRate: tempVitals.heartRate
            ? `${tempVitals.heartRate} bpm`
            : "Belum diisi",
          bloodSugar: tempVitals.bloodSugar
            ? `${tempVitals.bloodSugar} mg/dl`
            : "Belum diisi",
          temperature: tempVitals.temperature
            ? `${tempVitals.temperature}° C`
            : "Belum diisi",
        });
        await fetchPatientData(selectedPatientData?.no_rm);

        // Show success message
        setSuccessMessage("Tanda vital berhasil disimpan!");
        setTimeout(() => setSuccessMessage(null), 3000);

        onClose();
      } catch (error) {
        console.error("Error saving vitals:", error);
        const errorMsg =
          error.response?.data?.message ||
          "Gagal menyimpan vital signs. Silakan coba lagi.";
        setErrorMessage(errorMsg);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto p-0 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Activity className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Edit Tanda Vital
                  </h2>
                  <p className="text-sm text-gray-600">
                    Update data vital signs pasien
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isSubmitting
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-400 hover:text-gray-700 hover:bg-white/50"
                }`}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl text-red-600 text-sm shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {errorMessage}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                {
                  label: "Tinggi Badan",
                  field: "height",
                  unit: "cm",
                  icon: <Ruler size={18} className="text-blue-500" />,
                  color: "from-blue-500 to-indigo-600",
                },
                {
                  label: "Berat Badan",
                  field: "weight",
                  unit: "kg",
                  icon: <Weight size={18} className="text-green-500" />,
                  color: "from-green-500 to-emerald-600",
                },
                {
                  label: "Detak Jantung",
                  field: "heartRate",
                  unit: "bpm",
                  icon: <Heart size={18} className="text-red-500" />,
                  color: "from-red-500 to-pink-600",
                },
                {
                  label: "Gula Darah",
                  field: "bloodSugar",
                  unit: "mg/dl",
                  icon: <Droplet size={18} className="text-purple-500" />,
                  color: "from-purple-500 to-indigo-600",
                },
                {
                  label: "Suhu Tubuh",
                  field: "temperature",
                  unit: "°C",
                  icon: <Thermometer size={18} className="text-orange-500" />,
                  color: "from-amber-500 to-orange-600",
                },
              ].map(({ label, field, unit, icon, color }) => (
                <div key={field} className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <div
                      className={`w-5 h-5 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center shadow-sm`}
                    >
                      {React.cloneElement(icon, {
                        size: 12,
                        className: "text-white",
                      })}
                    </div>
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={tempVitals[field]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                      placeholder={`Masukkan ${label.toLowerCase()}`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-medium">
                      {unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
                  isSubmitting
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300"
                }`}
              >
                <div className="w-4 h-4 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                  <X size={12} className="text-white" />
                </div>
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting}
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
                  isFormValid() && !isSubmitting
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 bg-white/20 rounded-lg flex items-center justify-center">
                      <RefreshCw
                        size={12}
                        className="animate-spin text-white"
                      />
                    </div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 bg-white/20 rounded-lg flex items-center justify-center">
                      <Save size={12} className="text-white" />
                    </div>
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const searchPatients = async (term) => {
    if (term.length < 3) {
      setPatientOptions([]);
      setPatients([]);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${config.apiUrl}/medical/patients/search?search=${term}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        const options = response.data.data.map((patient) => ({
          value: patient.appointment_id,
          label: `${patient.nama_lengkap} (${patient.no_rm})`,
          patient: {
            id: patient.id,
            appointment_id: patient.appointment_id,
            no_rm: patient.no_rm,
            name: patient.nama_lengkap,
            age: `${patient.umur} Tahun`,
            appointmentTime: patient.appointment_time,
            doctorName: patient.doctor_name || "Tidak ada dokter",
            complaint: "",
            status: patient.status || "scheduled",
          },
        }));
        setPatientOptions(options);
        setPatients(options.map((option) => option.patient));
      } else {
        setError("Gagal mencari pasien: Tidak ada data yang ditemukan.");
        setPatientOptions([]);
        setPatients([]);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
      setError("Gagal mencari pasien");
      setPatientOptions([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (selectedOption) => {
    if (!selectedOption) {
      setSelectedPatient(null);
      setSelectedAppointmentId(null);
      setVitals({
        height: "Belum diisi",
        weight: "Belum diisi",
        heartRate: "Belum diisi",
        bloodSugar: "Belum diisi",
        temperature: "Belum diisi",
      });
      setMedicalRecord({ procedures: [], diagnoses: [], medications: [] });
      setVisitHistory([]);
      setError(null);
      setSuccessMessage(null);
      return;
    }

    const patient = selectedOption.patient;
    setSelectedPatient(patient.name);
    setSelectedAppointmentId(patient.appointment_id);
    setVitals({
      height: "Belum diisi",
      weight: "Belum diisi",
      heartRate: "Belum diisi",
      bloodSugar: "Belum diisi",
      temperature: "Belum diisi",
    });
    setMedicalRecord({ procedures: [], diagnoses: [], medications: [] });
    setVisitHistory([]);
    setError(null);
    setSuccessMessage(null);
    fetchPatientData(patient.no_rm);
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);
      setSuccessMessage(null);
      const token = localStorage.getItem("token");

      // Using the getWaitingPatients endpoint with date filter
      const response = await axios.post(
        `${config.apiUrl}/medical/patients/waiting`,
        { date: dateFilter },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const options = response.data.data.map((patient) => ({
          value: patient.appointment_code,
          label: `${patient.nama_lengkap} (${patient.no_rm})`,
          patient: {
            id: patient.id,
            appointment_id: patient.appointment_code,
            no_rm: patient.no_rm,
            name: patient.nama_lengkap,
            age: `${patient.umur} Tahun`,
            appointmentTime: patient.appointment_time,
            doctorName: patient.doctor_name || "Tidak ada dokter",
            complaint: "",
            status: patient.status,
          },
        }));

        // Sort patients by status priority
        const statusPriority = {
          examined: 1, // Highest priority - ready for medical record
          confirmed: 2, // Second priority - confirmed
          "checked-in": 3, // Third priority - checked in
          scheduled: 4, // Fourth priority - scheduled
          dispensed: 5, // Fifth priority - dispensed
          completed: 6, // Lowest priority - completed/final
          cancelled: 7, // Lowest priority - cancelled
        };

        const sortedOptions = options.sort((a, b) => {
          const priorityA = statusPriority[a.patient.status] || 8;
          const priorityB = statusPriority[b.patient.status] || 8;

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          return a.patient.name.localeCompare(b.patient.name);
        });

        setPatientOptions(sortedOptions);
        setPatients(sortedOptions.map((option) => option.patient));

        // Clear any previous errors
        setError(null);
      } else {
        setPatientOptions([]);
        setPatients([]);
        setError("Tidak ada pasien terjadwal untuk tanggal yang dipilih.");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Gagal mengambil data pasien. Silakan coba lagi.";
      setError(errorMessage);
      setPatientOptions([]);
      setPatients([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchPatientData = async (patientNoRM) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Include appointment_code in the request if available
      const appointmentCode = selectedPatientData?.appointment_id;
      const url = appointmentCode
        ? `${config.apiUrl}/medical/patients/${patientNoRM}/combined-data?appointment_code=${appointmentCode}`
        : `${config.apiUrl}/medical/patients/${patientNoRM}/combined-data`;

      const combinedResponse = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (combinedResponse.data.success && combinedResponse.data.data) {
        const {
          vitals: vitalData,
          procedures,
          diagnoses,
          medications,
          visit_id,
        } = combinedResponse.data.data;
        console.log("Fetched data:", {
          procedures,
          diagnoses,
          medications,
          visit_id,
        }); // Debug: Check the data structure

        // Remove duplicates from diagnoses if any
        const uniqueDiagnoses = diagnoses ? [...new Set(diagnoses)] : [];
        console.log("Unique diagnoses:", uniqueDiagnoses); // Debug log
        console.log("Raw diagnoses from server:", diagnoses); // Debug log for raw data

        setVitals({
          height: vitalData?.height ? `${vitalData.height} cm` : "Belum diisi",
          weight: vitalData?.weight ? `${vitalData.weight} kg` : "Belum diisi",
          heartRate: vitalData?.heart_rate
            ? `${vitalData.heart_rate} bpm`
            : "Belum diisi",
          bloodSugar: vitalData?.blood_sugar
            ? `${vitalData.blood_sugar} mg/dl`
            : "Belum diisi",
          temperature: vitalData?.temperature
            ? `${vitalData.temperature}° C`
            : "Belum diisi",
        });

        // Format medications as objects with name and details for the medical record
        setMedicalRecord({
          procedures: procedures || [],
          diagnoses: uniqueDiagnoses,
          medications:
            medications.map((m) => ({
              name: m.name,
              details: {
                dosage: m.dosage || "",
                frequency: m.frequency || "",
                duration: m.duration || "",
              },
            })) || [],
        });

        // Update modal state for procedures and diagnoses
        updateModalState("procedure", { selected: procedures || [] });
        updateModalState("diagnose", { selected: uniqueDiagnoses });

        // Update modal state for medications with their details
        updateModalState("medication", {
          selected: medications.map((m) => m.name) || [],
          details: medications.reduce(
            (acc, m) => ({
              ...acc,
              [m.name]: {
                dosage: m.dosage || "",
                frequency: m.frequency || "",
                duration: m.duration || "",
              },
            }),
            {}
          ),
        });
      } else {
        setError("Gagal mengambil data pasien: Data tidak ditemukan.");
      }

      const visitsResponse = await axios.get(
        `${config.apiUrl}/medical/patients/${patientNoRM}/visits`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (visitsResponse.data.success && visitsResponse.data.data) {
        setVisitHistory(
          visitsResponse.data.data.map((visit) => {
            const visitDate = new Date(visit.visit_date);
            return {
              visit_id: visit.visit_id,
              appointment_id: visit.appointment_id, // Include appointment_id
              month: format(visitDate, "MMM"),
              day: format(visitDate, "d"),
              year: format(visitDate, "yyyy"),
              time: format(visitDate, "HH:mm"),
              doctor: visit.doctor_name,
              specialty: visit.doctor_specialty,
              notes: visit.complaint || visit.notes,
            };
          })
        );
      } else {
        setVisitHistory([]);
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Gagal mengambil data pasien. Silakan coba lagi.";
      setError(errorMessage);
      setVitals({
        height: "Belum diisi",
        weight: "Belum diisi",
        heartRate: "Belum diisi",
        bloodSugar: "Belum diisi",
        temperature: "Belum diisi",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    // Close patient detail when date changes to avoid showing outdated info
    setSelectedAppointmentId(null);
    setSelectedPatient(null);
  }, [dateFilter]); // Re-fetch when date filter changes

  // Clear notifications when patient or date changes
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [selectedAppointmentId, dateFilter]);

  const activeModalType = ["procedure", "diagnose", "medication"].find(
    (type) => modalState[type].show
  );

  // Handle date change with validation
  const handleDateChange = useCallback((newDate) => {
    if (!newDate) return;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDate)) {
      console.warn("Invalid date format:", newDate);
      return;
    }

    // Validate date range
    const selectedDate = new Date(newDate);
    const minDate = new Date("2020-01-01");
    const maxDate = new Date("2030-12-31");

    if (selectedDate < minDate || selectedDate > maxDate) {
      console.warn("Date out of range:", newDate);
      return;
    }

    setDateFilter(newDate);
  }, []);

  const handleComplete = async () => {
    if (selectedPatientData) {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        await updateAppointmentStatus(selectedPatientData.appointment_id);
        await fetchPatients(); // Refresh patient list to update status
        setSuccessMessage("Pemeriksaan pasien berhasil diselesaikan");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error("Error completing appointment:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Gagal menyelesaikan pemeriksaan pasien. Silakan coba lagi.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReactivate = async () => {
    if (selectedPatientData) {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        const token = localStorage.getItem("token");
        await axios.post(
          `${config.apiUrl}/medical/reactivate-appointment`,
          { appointment_code: selectedPatientData.appointment_id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchPatients(); // Refresh patient list to update status
        setSuccessMessage("Pemeriksaan pasien berhasil diaktifkan kembali");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error("Error reactivating appointment:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Gagal mengaktifkan kembali pemeriksaan. Silakan coba lagi.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper function to update appointment status
  const updateAppointmentStatus = useCallback(async (appointmentCode) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found for appointment status update");
        return false;
      }

      const response = await axios.post(
        `${config.apiUrl}/medical/update-appointment-status`,
        { appointment_code: appointmentCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        console.log("Appointment status updated successfully:", response.data);
        return true;
      } else {
        console.warn(
          "Failed to update appointment status:",
          response.data.message
        );
        return false;
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      return false;
    }
  }, []);

  const isExamined = selectedPatientData?.status === "examined";
  const isDispensed = selectedPatientData?.status === "dispensed";
  const isCompleted = selectedPatientData?.status === "completed";
  const isReadOnly = isExamined || isDispensed || isCompleted;
  const shouldShowReactivate = isExamined || isDispensed;

  return (
    <PageTemplate>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="mx-auto bg-slate-50 min-h-screen">
        {/* Modern Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-3 shadow-lg">
                  <ClipboardList className="text-white" size={24} />
                </div>
                Input Rekam Medis
              </h1>
              <p className="mt-1 text-gray-500 text-sm">
                Pilih pasien dari antrian untuk memulai sesi rekam medis.
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-auto">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                    <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Calendar className="text-white" size={12} />
                    </div>
                  </div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full sm:w-auto pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-gray-400 text-sm"
                    min="2020-01-01"
                    max="2030-12-31"
                    title="Pilih tanggal untuk melihat antrian pasien"
                  />
                </div>
                <button
                  onClick={() =>
                    handleDateChange(format(new Date(), "yyyy-MM-dd"))
                  }
                  className={`w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${
                    dateFilter === format(new Date(), "yyyy-MM-dd")
                      ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  }`}
                  title="Kembali ke hari ini"
                >
                  <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Calendar size={8} className="text-white" />
                  </div>
                  Hari Ini
                </button>
              </div>
              <button
                onClick={fetchPatients}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg transition-all duration-200 text-sm"
                disabled={loading}
              >
                <div className="w-3 h-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                  <RefreshCw
                    className={`${
                      isRefreshing ? "animate-spin" : ""
                    } text-white`}
                    size={8}
                  />
                </div>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl text-green-700 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
                <span className="font-medium text-sm">{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-400 hover:text-green-600 transition-colors duration-200"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl text-red-700 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <X size={10} className="text-white" />
                </div>
                <span className="font-medium text-sm">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors duration-200"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Patient List Column */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center text-gray-800">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-2 shadow-lg">
                  <UserCircle className="text-white" size={14} />
                </div>
                Antrian Pasien
              </h2>
              <div className="mb-3">
                <Select
                  isClearable
                  isSearchable
                  placeholder="Cari pasien..."
                  options={patientOptions}
                  onChange={handlePatientSelect}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderRadius: "0.5rem",
                      padding: "0.25rem",
                      border: state.isFocused
                        ? "2px solid #3b82f6"
                        : "2px solid #e5e7eb",
                      boxShadow: "none",
                      "&:hover": { borderColor: "#3b82f6" },
                    }),
                    option: (base, state) => ({
                      ...base,
                      borderRadius: "0.375rem",
                      margin: "0 4px",
                      backgroundColor: state.isSelected
                        ? "#3b82f6"
                        : state.isFocused
                        ? "#dbeafe"
                        : "white",
                      color: state.isSelected ? "white" : "black",
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: "0.5rem",
                      zIndex: 50,
                    }),
                  }}
                />
              </div>
              <div
                className="space-y-1.5 sm:space-y-2 custom-scrollbar overflow-y-auto"
                style={{ maxHeight: "60vh" }}
              >
                {loading && patients.length === 0 ? (
                  <div className="text-center p-4 sm:p-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                      <RefreshCw
                        className="text-white animate-spin"
                        size={16}
                      />
                    </div>
                    <p className="mt-1 text-gray-500 text-xs sm:text-sm">
                      Memuat antrian...
                    </p>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center p-4 sm:p-6 text-gray-500">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <UserCircle className="text-gray-400" size={20} />
                    </div>
                    <p className="mt-1 text-xs sm:text-sm">
                      Tidak ada pasien dalam antrian.
                    </p>
                  </div>
                ) : (
                  patients.map((patient, index) => (
                    <div
                      key={patient.appointment_id}
                      className={`p-2.5 sm:p-3 border-l-4 rounded-r-lg cursor-pointer transition-all duration-200 ${
                        selectedAppointmentId === patient.appointment_id
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md"
                          : "border-transparent bg-gray-50 hover:bg-gray-100 shadow-sm"
                      }`}
                      onClick={() => handlePatientSelect({ patient })}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                            {patient.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            RM: {patient.no_rm}
                          </p>
                          <div className="mt-1.5 text-xs text-gray-600 flex items-center">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-1.5 shadow-sm">
                              <Clock
                                size={6}
                                className="text-white sm:w-2 sm:h-2"
                              />
                            </div>
                            <span className="truncate">
                              {patient.appointmentTime} - Dr.{" "}
                              {patient.doctorName}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                            patient.status === "completed"
                              ? "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 border border-slate-300"
                              : patient.status === "examined"
                              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                              : patient.status === "dispensed"
                              ? "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-200"
                              : patient.status === "confirmed"
                              ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200"
                              : patient.status === "checked-in"
                              ? "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200"
                              : patient.status === "cancelled"
                              ? "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
                              : selectedAppointmentId === patient.appointment_id
                              ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300"
                          }`}
                        >
                          {patient.status === "completed"
                            ? "Final"
                            : patient.status === "examined"
                            ? "Selesai"
                            : patient.status === "dispensed"
                            ? "Dispensed"
                            : patient.status === "confirmed"
                            ? "Confirmed"
                            : patient.status === "checked-in"
                            ? "Checked In"
                            : patient.status === "cancelled"
                            ? "Cancelled"
                            : patient.status === "scheduled"
                            ? "Menunggu"
                            : patient.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content Column */}
          <div className="lg:col-span-8 xl:col-span-9">
            {!selectedPatient ? (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/10 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-center p-12 text-gray-500">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <UserCircle className="text-gray-400" size={40} />
                  </div>
                  <h3 className="mt-4 text-xl font-medium">Pilih Pasien</h3>
                  <p>
                    Silakan pilih pasien dari daftar antrian untuk melihat dan
                    menginput data rekam medis.
                  </p>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                {/* Patient Header */}
                <div className="bg-white p-4 mb-6 rounded-xl shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Avatar and Basic Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg flex-shrink-0">
                        {selectedPatient.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                          {selectedPatient}
                        </p>
                        <div className="flex flex-wrap gap-2 sm:gap-3 mt-1">
                          <span className="flex items-center text-xs sm:text-sm text-gray-500">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-1 shadow-sm flex-shrink-0">
                              <CreditCard
                                size={6}
                                className="text-white sm:w-2 sm:h-2"
                              />
                            </div>
                            <span className="truncate">
                              {selectedPatientData?.no_rm || ""}
                            </span>
                          </span>
                          <span className="flex items-center text-xs sm:text-sm text-gray-500">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-1 shadow-sm flex-shrink-0">
                              <Calendar
                                size={6}
                                className="text-white sm:w-2 sm:h-2"
                              />
                            </div>
                            <span className="truncate">
                              {selectedPatientData?.age || ""}
                            </span>
                          </span>
                          <span className="flex items-center text-xs sm:text-sm text-gray-500">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-1 shadow-sm flex-shrink-0">
                              <Stethoscope
                                size={6}
                                className="text-white sm:w-2 sm:h-2"
                              />
                            </div>
                            <span className="truncate">
                              Dr. {selectedPatientData?.doctorName || "N/A"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Complaint and Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      {/* Complaint Section */}
                      <div className="flex-1 sm:flex-none sm:min-w-[200px] sm:max-w-[250px]">
                        <div className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center mb-1">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-1.5 shadow-sm flex-shrink-0">
                            <FileText size={6} className="text-white sm:w-2 sm:h-2" />
                          </div>
                          <span>Keluhan Utama</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {visitHistory.length > 0
                            ? visitHistory[0].notes
                            : "Tidak ada keluhan"}
                        </p>
                      </div>

                      {/* Complete/Reactivate Button */}
                      <button
                        onClick={
                          shouldShowReactivate
                            ? handleReactivate
                            : handleComplete
                        }
                        disabled={
                          loading || !selectedPatientData || isCompleted
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 w-full sm:w-28 justify-center flex-shrink-0 ${
                          loading || !selectedPatientData
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : isCompleted
                            ? "bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg"
                            : shouldShowReactivate
                            ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl"
                            : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                        }`}
                        title={
                          !selectedPatientData
                            ? "Pilih pasien terlebih dahulu"
                            : isCompleted
                            ? "Pemeriksaan sudah final"
                            : shouldShowReactivate
                            ? "Aktifkan kembali pemeriksaan"
                            : "Selesaikan pemeriksaan pasien"
                        }
                      >
                        {loading ? (
                          <div className="w-3 h-3 bg-white/20 rounded-lg flex items-center justify-center">
                            <RefreshCw
                              size={10}
                              className="animate-spin text-white"
                            />
                          </div>
                        ) : isCompleted ? (
                          <div className="w-3 h-3 bg-white/20 rounded-lg flex items-center justify-center">
                            <Lock size={10} className="text-white" />
                          </div>
                        ) : shouldShowReactivate ? (
                          <div className="w-3 h-3 bg-white/20 rounded-lg flex items-center justify-center">
                            <RefreshCw size={10} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-3 h-3 bg-white/20 rounded-lg flex items-center justify-center">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                        {isCompleted
                          ? "Final"
                          : shouldShowReactivate
                          ? "Reactivate"
                          : "Complete"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Grid for Vitals, Records, History */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
                  {/* Left Side: Vitals & Medical Records */}
                  <div className="xl:col-span-3 space-y-4 sm:space-y-6">
                    {/* Vital Signs Card */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                      <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <h2 className="text-sm sm:text-base font-bold text-gray-800 flex items-center">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                            <Activity
                              size={12}
                              className="text-white sm:w-3 sm:h-3"
                            />
                          </div>
                          Tanda Vital
                        </h2>
                        <button
                          className={`flex items-center gap-1 text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors ${
                            visitHistory.length > 0 && !isReadOnly
                              ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 hover:from-blue-100 hover:to-indigo-100 border border-blue-200"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                          onClick={() => setShowEditVitalsModal(true)}
                          disabled={visitHistory.length === 0 || isReadOnly}
                        >
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Edit3
                              size={6}
                              className="text-white sm:w-2 sm:h-2"
                            />
                          </div>
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                        {[
                          {
                            label: "Tinggi",
                            value: vitals.height,
                            icon: (
                              <Ruler
                                size={16}
                                className="text-blue-500 sm:w-4 sm:h-4"
                              />
                            ),
                            color: "from-blue-500 to-indigo-600",
                          },
                          {
                            label: "Berat",
                            value: vitals.weight,
                            icon: (
                              <Weight
                                size={16}
                                className="text-green-500 sm:w-4 sm:h-4"
                              />
                            ),
                            color: "from-green-500 to-emerald-600",
                          },
                          {
                            label: "Suhu",
                            value: vitals.temperature,
                            icon: (
                              <Thermometer
                                size={16}
                                className="text-orange-500 sm:w-4 sm:h-4"
                              />
                            ),
                            color: "from-amber-500 to-orange-600",
                          },
                          {
                            label: "Jantung",
                            value: vitals.heartRate,
                            icon: (
                              <Heart
                                size={16}
                                className="text-red-500 sm:w-4 sm:h-4"
                              />
                            ),
                            color: "from-red-500 to-pink-600",
                          },
                          {
                            label: "Gula Darah",
                            value: vitals.bloodSugar,
                            icon: (
                              <Droplet
                                size={16}
                                className="text-purple-500 sm:w-4 sm:h-4"
                              />
                            ),
                            color: "from-purple-500 to-indigo-600",
                          },
                        ].map((vital, index) => (
                          <div
                            key={index}
                            className="p-2 sm:p-3 bg-slate-50 rounded-lg flex items-center shadow-sm"
                          >
                            <div
                              className={`w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br ${vital.color} rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-sm`}
                            >
                              {React.cloneElement(vital.icon, {
                                size: 12,
                                className: "text-white sm:w-3 sm:h-3",
                              })}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                {vital.label}
                              </p>
                              <p className="font-bold text-gray-800 text-sm sm:text-base">
                                {vital.value.split(" ")[0]}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Medical Records Input Section */}
                    <div className="space-y-3 sm:space-y-4">
                      <h2 className="text-sm sm:text-base font-bold text-gray-800 flex items-center">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                          <ClipboardList
                            size={12}
                            className="text-white sm:w-3 sm:h-3"
                          />
                        </div>
                        Input Rekam Medis
                      </h2>
                      {["procedure", "diagnose", "medication"].map((type) => {
                        const config = {
                          procedure: {
                            icon: <Activity />,
                            title: "Tindakan",
                            color: "blue",
                            gradient: "from-blue-500 to-indigo-600",
                          },
                          diagnose: {
                            icon: <FileText />,
                            title: "Diagnosa",
                            color: "green",
                            gradient: "from-green-500 to-emerald-600",
                          },
                          medication: {
                            icon: <Pill />,
                            title: "Obat",
                            color: "purple",
                            gradient: "from-purple-500 to-indigo-600",
                          },
                        };
                        const { icon, title, color, gradient } = config[type];
                        return (
                          <div
                            key={type}
                            className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <h3
                                className={`font-bold text-gray-800 flex items-center text-sm sm:text-base`}
                              >
                                <div
                                  className={`w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-sm`}
                                >
                                  {React.cloneElement(icon, {
                                    size: 12,
                                    className: "text-white sm:w-3 sm:h-3",
                                  })}
                                </div>
                                {title}
                              </h3>
                              <button
                                className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                                  visitHistory.length === 0 || isReadOnly
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : `bg-gradient-to-r from-${color}-50 to-${
                                        color === "blue"
                                          ? "indigo"
                                          : color === "green"
                                          ? "emerald"
                                          : "indigo"
                                      }-50 text-${color}-600 hover:from-${color}-100 hover:to-${
                                        color === "blue"
                                          ? "indigo"
                                          : color === "green"
                                          ? "emerald"
                                          : "indigo"
                                      }-100 border border-${color}-200`
                                }`}
                                onClick={() =>
                                  updateModalState(type, { show: true })
                                }
                                disabled={
                                  visitHistory.length === 0 || isReadOnly
                                }
                                title={
                                  visitHistory.length === 0
                                    ? "Tidak ada kunjungan aktif"
                                    : isReadOnly
                                    ? "Pemeriksaan sudah selesai"
                                    : `Tambah ${title}`
                                }
                              >
                                <div
                                  className={`w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center`}
                                >
                                  <PlusCircle
                                    size={10}
                                    className="text-white sm:w-3 sm:h-3"
                                  />
                                </div>
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[32px] sm:min-h-[40px]">
                              {(() => {
                                const items = medicalRecord[`${type}s`];
                                console.log(`Rendering ${type}s:`, items); // Debug log
                                return items.length > 0 ? (
                                  items.map((item, index) => (
                                    <div
                                      key={index}
                                      className={`bg-slate-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm shadow-sm ${
                                        type === "medication" ? "w-full" : ""
                                      }`}
                                    >
                                      {type === "medication" &&
                                      typeof item === "object" ? (
                                        <div>
                                          <p className="font-semibold text-gray-800 text-xs sm:text-sm">
                                            {item.name}
                                          </p>
                                          <div className="flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-1 text-xs mt-1 text-gray-600">
                                            <span>
                                              Dosis: {item.details.dosage}
                                            </span>
                                            <span>
                                              Frek: {item.details.frequency}
                                            </span>
                                            <span>
                                              Durasi: {item.details.duration}
                                            </span>
                                          </div>
                                        </div>
                                      ) : type === "diagnose" ? (
                                        <div>
                                          <p className="font-semibold text-gray-800 text-xs sm:text-sm">
                                            {item}
                                          </p>
                                        </div>
                                      ) : (
                                        <p className="text-xs sm:text-sm">
                                          {typeof item === "object"
                                            ? item.name
                                            : item}
                                        </p>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs sm:text-sm text-gray-400 italic">
                                    Belum ada data {title.toLowerCase()}.
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Side: Visit History */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                      <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center mb-4 sm:mb-6">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                          <Clock
                            size={14}
                            className="text-white sm:w-4 sm:h-4"
                          />
                        </div>
                        Riwayat Kunjungan
                      </h2>
                      <div className="relative border-l-2 border-gray-200 pl-6 sm:pl-8 space-y-6 sm:space-y-8">
                        {visitHistory.length > 0 ? (
                          visitHistory.map((visit, index) => (
                            <div key={index} className="relative">
                              <div
                                className={`absolute -left-[29px] sm:-left-[37px] top-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-lg ${
                                  index === 0
                                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                                    : "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600"
                                }`}
                              >
                                {visit.day}
                              </div>
                              <div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                                  <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                    {visit.month} {visit.year} - {visit.time}
                                  </p>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full self-start sm:self-auto">
                                    {visit.specialty || "Umum"}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Dokter:</span>{" "}
                                  <span className="truncate">
                                    {visit.doctor}
                                  </span>
                                </p>
                                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-2 sm:p-3 rounded-md shadow-sm border border-gray-100">
                                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Keluhan:
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                    {visit.notes || "Tidak ada catatan"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 sm:py-8 text-gray-500">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                              <Clock className="text-gray-400" size={20} />
                            </div>
                            <p className="text-sm sm:text-base">
                              Tidak ada riwayat kunjungan
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showEditVitalsModal && visitHistory.length > 0 && (
          <EditVitalsModal
            vitals={vitals}
            visitId={(() => {
              // Try to get visit_id from current appointment first
              if (selectedPatientData?.appointment_id) {
                // This will be resolved in the modal itself
                return null;
              }
              // Fallback to latest visit
              return visitHistory[0].visit_id;
            })()}
            onSave={setVitals}
            onClose={() => setShowEditVitalsModal(false)}
            updateAppointmentStatus={updateAppointmentStatus}
          />
        )}

        {activeModalType && (
          <MedicalRecordModal
            key={activeModalType}
            type={activeModalType}
            title={
              activeModalType === "procedure"
                ? "Tindakan"
                : activeModalType === "diagnose"
                ? "Diagnosa"
                : "Obat"
            }
            show={modalState[activeModalType].show}
            onClose={() => handleModalClose(activeModalType)}
            onSave={handleSaveMedicalRecord}
            selectedItems={modalState[activeModalType].selected}
            recentItems={modalState[activeModalType].recent}
            medicationDetails={modalState.medication.details}
            onSearch={handleSearchMedicalRecord}
            onSelectItem={handleSelectItem}
            onRemoveItem={handleRemoveItem}
            loading={loading}
            setMedicalRecord={setMedicalRecord}
          />
        )}
      </div>
    </PageTemplate>
  );
};

export default InputRM;
