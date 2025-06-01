import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import config from '../../config';
import PageTemplate from '../../components/PageTemplate';
import { format } from 'date-fns';
import Select from 'react-select';
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
  Pill
} from 'lucide-react';

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
`;

// MedicalRecordModal Component
const MedicalRecordModal = ({ type, title, show, onClose, onSave, selectedItems, recentItems, medicationDetails, onSearch, onSelectItem, onRemoveItem, loading, setMedicalRecord }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commonPresets, setCommonPresets] = useState({}); // Store presets for medications
  const [tempMedication, setTempMedication] = useState(null); // Store temporarily selected medication
  const [tempPreset, setTempPreset] = useState(null); // Store temporarily selected preset
  
  // Modal type specific configurations
  const modalConfig = {
    procedure: {
      icon: <Activity size={22} />,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'from-blue-50 to-white',
      borderColor: 'border-blue-100',
      textColor: 'text-blue-600',
      hoverColor: 'hover:bg-blue-50',
      activeColor: 'bg-blue-100'
    },
    diagnose: {
      icon: <FileText size={22} />,
      color: 'from-green-600 to-green-700',
      bgColor: 'from-green-50 to-white',
      borderColor: 'border-green-100',
      textColor: 'text-green-600',
      hoverColor: 'hover:bg-green-50',
      activeColor: 'bg-green-100'
    },
    medication: {
      icon: <Pill size={22} />,
      color: 'from-purple-600 to-purple-700',
      bgColor: 'from-purple-50 to-white',
      borderColor: 'border-purple-100',
      textColor: 'text-purple-600',
      hoverColor: 'hover:bg-purple-50',
      activeColor: 'bg-purple-100'
    }
  }

  // Fetch presets for medications
  const fetchPresets = useCallback(async (medicationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        return [];
      }
      const response = await axios.get(`${config.apiUrl}/medical/medication-presets/${medicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching presets:', error);
      return [];
    }
  }, []);

  // Debounced search handler
  const handleSearch = useCallback(async (term) => {
    if (term.length < 2) {
      setOptions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await onSearch(type, term);
      setOptions(results || []);
    } catch (error) {
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [type, onSearch]);

  // Debounce search with useEffect
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Search items with debounce
  useEffect(() => {
    const searchItems = async () => {
      if (!searchTerm.trim()) {
        setOptions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await onSearch(type, searchTerm);
        setOptions(results);
      } catch (error) {
        console.error(`Error searching ${type}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchItems, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, type, onSearch]);

  // Handle medication selection
  const handleSelectMedication = (selectedOption) => {
    if (!selectedOption) return;
    setTempMedication(selectedOption);
    // Initialize empty fields for direct input
    setTempPreset({
      dosage: '',
      frequency: '',
      duration: ''
    });
  };

  // Handle preset confirmation
  const handleConfirmPreset = () => {
    if (!tempMedication || !tempPreset) return;
    if (!tempPreset.dosage || !tempPreset.frequency || !tempPreset.duration) return;

    // Buat objek obat dengan detail lengkap
    const medicationWithDetails = {
      ...tempMedication,
      value: tempMedication.value,
      details: {
        dosage: tempPreset.dosage,
        frequency: tempPreset.frequency,
        duration: tempPreset.duration
      }
    };

    // Tambahkan obat ke daftar terpilih
    onSelectItem(type, medicationWithDetails);
    
    // Tambahkan juga ke medicalRecord untuk preview
    if (type === 'medication') {
      setMedicalRecord(prev => ({
        ...prev,
        medications: [
          ...prev.medications,
          {
            name: tempMedication.label,
            details: {
              dosage: tempPreset.dosage,
              frequency: tempPreset.frequency,
              duration: tempPreset.duration
            }
          }
        ]
      }));
    }
    
    // Reset state
    setTempMedication(null);
    setTempPreset(null);
  };

  // Format selected medication display
  const formatSelectedMedication = (item) => {
    if (type === 'medication') {
      // Handle if item is an object with details
      if (item && typeof item === 'object' && item.details) {
        const { dosage, frequency, duration } = item.details;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{item.label || item.name || item.value}</span>
            <div className="text-xs text-gray-500 mt-1">
              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded mr-1">{dosage}</span>
              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded mr-1">{frequency}</span>
              <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{duration}</span>
            </div>
          </div>
        );
      }
      // Check if medicationDetails has this item
      else if (medicationDetails && medicationDetails[item]) {
        const { dosage, frequency, duration } = medicationDetails[item];
        return (
          <div className="flex flex-col">
            <span className="font-medium">{item}</span>
            <div className="text-xs text-gray-500 mt-1">
              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded mr-1">{dosage}</span>
              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded mr-1">{frequency}</span>
              <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{duration}</span>
            </div>
          </div>
        );
      }
    }
    return typeof item === 'object' && item.name ? item.name : item;
  };

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 ${show ? 'flex' : 'hidden'} items-center justify-center p-4 animate-fade-in`}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl z-10 relative border border-gray-100 overflow-hidden animate-fade-in">
        <div className={`bg-gradient-to-r ${modalConfig[type].color} px-6 py-4 flex justify-between items-center`}>
          <h2 className="text-lg font-bold text-white flex items-center">
            <span className="mr-2">{modalConfig[type].icon}</span>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 custom-scrollbar" style={{ maxHeight: 'calc(80vh - 60px)', overflowY: 'auto' }}>
          <div className={`bg-gradient-to-r ${modalConfig[type].bgColor} p-4 rounded-xl border ${modalConfig[type].borderColor} shadow-sm mb-5`}>
            <label className="text-sm font-medium mb-2 flex items-center">
              <Search className="mr-1.5 text-gray-500" size={16} />
              Cari {title.toLowerCase()}
            </label>
            <div className="relative">
              <Select
                isClearable
                isSearchable
                placeholder={`Ketik untuk mencari ${title.toLowerCase()}...`}
                options={options}
                inputValue={searchTerm}
                onInputChange={(value, { action }) => {
                  if (action === 'input-change') {
                    setSearchTerm(value);
                  }
                }}
                onChange={handleSelectMedication}
                isLoading={isLoading}
                noOptionsMessage={({ inputValue }) => {
                  if (!inputValue) return "Masukkan kata pencarian...";
                  if (inputValue.length < 2) return "Masukkan minimal 2 huruf...";
                  if (isLoading) return "Memuat data...";
                  return "Tidak ada hasil";
                }}
                className="text-sm"
                classNames={{
                  control: (state) => `border ${state.isFocused ? `border-${type === 'procedure' ? 'blue' : type === 'diagnose' ? 'green' : 'purple'}-500` : 'border-gray-300'} rounded-lg shadow-sm`,
                  option: (state) => `${state.isFocused ? `bg-${type === 'procedure' ? 'blue' : type === 'diagnose' ? 'green' : 'purple'}-50` : 'bg-white'} cursor-pointer`,
                  menu: () => 'rounded-lg shadow-lg border border-gray-200 mt-1 z-50 overflow-hidden',
                  menuList: () => 'py-1',
                }}
                filterOption={null}
                formatOptionLabel={({ label, stock, price }) => (
                  <div className="flex justify-between items-center py-1">
                    <div className="font-medium">{label}</div>
                    {type === 'medication' && (
                      <div className="text-right">
                        <div className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full inline-block mr-1">Stok: {stock || 'N/A'}</div>
                        <div className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full inline-block">Harga: {price || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
          
          {type === 'medication' && tempMedication && (
            <div className="bg-gradient-to-r from-purple-50 to-white p-4 rounded-xl border border-purple-100 shadow-sm mb-5 animate-fade-in">
              <div className="text-sm font-medium mb-3 flex items-center text-purple-700">
                <Pill className="mr-1.5 text-purple-500" size={16} />
                Detail penggunaan obat: {tempMedication.label}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Dosis</label>
                  <input
                    type="text"
                    placeholder="Contoh: 3x1"
                    value={tempPreset?.dosage || ''}
                    onChange={(e) => setTempPreset(prev => ({ ...prev || {}, dosage: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Frekuensi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Setelah makan"
                    value={tempPreset?.frequency || ''}
                    onChange={(e) => setTempPreset(prev => ({ ...prev || {}, frequency: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Durasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: 5 hari"
                    value={tempPreset?.duration || ''}
                    onChange={(e) => setTempPreset(prev => ({ ...prev || {}, duration: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-100">
                <div className="text-xs text-gray-500 italic">
                  <div className="flex items-center">
                    <FileText size={12} className="mr-1 text-purple-400" />
                    Masukkan detail penggunaan obat
                  </div>
                </div>
                <button
                  onClick={handleConfirmPreset}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${tempPreset?.dosage && tempPreset?.frequency && tempPreset?.duration ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  disabled={!tempPreset?.dosage || !tempPreset?.frequency || !tempPreset?.duration}
                >
                  Tambahkan
                </button>
              </div>
            </div>
          )}

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center">
                <ClipboardList className={`mr-1.5 ${modalConfig[type].textColor}`} size={16} />
                {title} Terpilih
              </label>
              {selectedItems.length > 0 && (
                <div className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {selectedItems.length} item
                </div>
              )}
            </div>
            <div className={`flex flex-wrap gap-2 border border-gray-200 rounded-lg p-3 min-h-[60px] ${modalConfig[type].bgColor} bg-opacity-30`}>
              {selectedItems.length > 0 ? (
                selectedItems.map((item, index) => (
                  <div 
                    key={index} 
                    className={`px-3 py-2 rounded-lg text-sm flex items-start justify-between bg-white border ${modalConfig[type].borderColor} shadow-sm animate-fade-in w-full md:w-auto`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="mr-2">
                      {formatSelectedMedication(item)}
                    </div>
                    <button 
                      onClick={() => onRemoveItem(type, item)} 
                      className="text-gray-400 hover:text-gray-700 ml-1 p-0.5 rounded-full hover:bg-gray-100 flex-shrink-0 self-start"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 flex items-center justify-center w-full py-3">
                  Belum ada {title.toLowerCase()} yang dipilih
                </div>
              )}
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center">
                <Clock className={`mr-1.5 ${modalConfig[type].textColor}`} size={16} />
                {title} Terakhir Digunakan
              </label>
              {recentItems.length > 0 && (
                <div className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {recentItems.length} item
                </div>
              )}
            </div>
            <div className={`flex flex-wrap gap-2 border border-gray-200 rounded-lg p-3 min-h-[60px] ${modalConfig[type].bgColor} bg-opacity-20`}>
              {recentItems.length > 0 ? (
                recentItems.map((item, index) => (
                  <div
                    key={index}
                    className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer border border-gray-100 ${modalConfig[type].hoverColor} transition-colors duration-200 flex items-center animate-fade-in`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => onSelectItem(type, { value: item, label: item })}
                  >
                    <PlusCircle className={`mr-1.5 ${modalConfig[type].textColor}`} size={14} />
                    {item}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 flex items-center justify-center w-full py-3">
                  Belum ada riwayat {title.toLowerCase()}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center"
            >
              <X className="mr-1.5" size={16} />
              Batal
            </button>
            <button
              onClick={() => onSave(type, medicationDetails)}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200 flex items-center ${loading ? 'bg-gray-400 cursor-not-allowed' : `bg-gradient-to-r ${modalConfig[type].color} hover:shadow-md`}`}
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-1.5 animate-spin" size={16} />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-1.5" size={16} />
                  Simpan
                </>
              )}
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
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientOptions, setPatientOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [vitals, setVitals] = useState({
    height: 'Belum diisi',
    weight: 'Belum diisi',
    heartRate: 'Belum diisi',
    bloodSugar: 'Belum diisi',
    temperature: 'Belum diisi',
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

  const handleSearchMedicalRecord = useCallback(async (type, term) => {
    if (term.length < 2) {
      return [];
    }
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      switch (type) {
        case 'procedure':
          endpoint = `${config.apiUrl}/medical/procedures/search?search=${term}`;
          break;
        case 'medication':
          endpoint = `${config.apiUrl}/medical/medications/search?search=${term}`;
          break;
        case 'diagnose':
          endpoint = `${config.apiUrl}/medical/diagnoses/search?search=${term}`;
          break;
        default:
          throw new Error('Tipe tidak valid');
      }
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        return response.data.data.map((item) => {
          if (type === 'diagnose') {
            return { value: `${item.code} - ${item.name}`, label: `${item.code} - ${item.name}`, id: item.id };
          }
          return { value: item.name, label: item.name, id: item.id, stock: item.stock, price: item.price };
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
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Token autentikasi tidak ditemukan. Silakan login kembali.');
          return;
        }
        const payload = {
          visit_id: visitHistory[0]?.visit_id,
          items: modalState[type].selected.map((item) => ({
            name: item,
            ...(type === 'medication' && details[item]
              ? {
                  dosage: details[item].dosage,
                  frequency: details[item].frequency,
                  duration: details[item].duration,
                }
              : {}),
          })),
        };
        console.log('Payload before send:', payload); // Debug
        if (!payload.visit_id) {
          setError('Tidak ada kunjungan untuk pasien ini. Silakan buat kunjungan terlebih dahulu.');
          return;
        }
        const endpoint = `${config.apiUrl}/medical/visit-${type}s`;
        const response = await axios.post(endpoint, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          updateModalState(type, { selected: [], show: false, details: {} });
          setMedicalRecord((prev) => {
            // For medications, store the full object with details
            if (type === 'medication') {
              return {
                ...prev,
                [`${type}s`]: payload.items.map((item) => ({
                  name: item.name,
                  details: {
                    dosage: item.dosage || '',
                    frequency: item.frequency || '',
                    duration: item.duration || ''
                  }
                }))
              };
            } else {
              // For other types, just store the name
              return {
                ...prev,
                [`${type}s`]: payload.items.map((item) => item.name),
              };
            }
          });
          await fetchPatientData(selectedPatientId);
        } else {
          setError(response.data.message || `Gagal menyimpan ${type}`);
        }
      } catch (error) {
        console.error(`Error saving ${type}:`, error);
        setError(error.response?.data?.message || `Gagal menyimpan ${type}`);
      } finally {
        setLoading(false);
      }
    },
    [visitHistory, modalState, selectedPatientId, updateModalState]
  );

  const handleSelectItem = useCallback(
    (type, item) => {
      if (!item) return;
      const selectedItems = modalState[type].selected;
      
      // Handle medication with details
      if (type === 'medication' && item.details) {
        // Store medication with its details
        if (selectedItems.includes(item.value)) return;
        
        updateModalState(type, {
          selected: [...selectedItems, item.value],
          recent: [item.value, ...modalState[type].recent.filter((rec) => rec !== item.value)].slice(0, 10),
        });
        
        // Update medication details in modalState
        updateModalState(type, {
          details: {
            ...modalState[type].details,
            [item.value]: item.details
          }
        });
      } else {
        // Handle regular items (procedures, diagnoses)
        if (selectedItems.includes(item.value)) return;
        updateModalState(type, {
          selected: [...selectedItems, item.value],
          recent: [item.value, ...modalState[type].recent.filter((rec) => rec !== item.value)].slice(0, 10),
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
      if (type === 'medication') {
        // Remove medication details from modalState
        const newDetails = { ...modalState[type].details };
        delete newDetails[item];
        updateModalState(type, {
          details: newDetails
        });
      }
    },
    [modalState, updateModalState]
  );

  const EditVitalsModal = ({ vitals, visitId, onSave, onClose }) => {
    const [tempVitals, setTempVitals] = useState({
      height: vitals.height.replace(' cm', '') || '',
      weight: vitals.weight.replace(' kg', '') || '',
      heartRate: vitals.heartRate.replace(' bpm', '') || '',
      bloodSugar: vitals.bloodSugar.replace(' mg/dl', '') || '',
      temperature: vitals.temperature.replace('° C', '') || '',
    });
    const [errorMessage, setErrorMessage] = useState(null);

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
        setLoading(true);
        setErrorMessage(null);
        const token = localStorage.getItem('token');
        if (!visitId) {
          setErrorMessage('Tidak ada kunjungan untuk pasien ini. Silakan buat kunjungan terlebih dahulu.');
          return;
        }
        if (!isFormValid()) {
          setErrorMessage('Semua field wajib diisi.');
          return;
        }
        const payload = {
          visit_id: visitId,
          height: tempVitals.height,
          weight: tempVitals.weight,
          heart_rate: tempVitals.heartRate,
          blood_sugar: tempVitals.bloodSugar,
          temperature: tempVitals.temperature,
        };
        await axios.post(`${config.apiUrl}/medical/editvitals`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        onSave({
          height: tempVitals.height ? `${tempVitals.height} cm` : 'Belum diisi',
          weight: tempVitals.weight ? `${tempVitals.weight} kg` : 'Belum diisi',
          heartRate: tempVitals.heartRate ? `${tempVitals.heartRate} bpm` : 'Belum diisi',
          bloodSugar: tempVitals.bloodSugar ? `${tempVitals.bloodSugar} mg/dl` : 'Belum diisi',
          temperature: tempVitals.temperature ? `${tempVitals.temperature}° C` : 'Belum diisi',
        });
        await fetchPatientData(selectedPatientId);
        onClose();
      } catch (error) {
        console.error('Error saving vitals:', error);
        setErrorMessage('Gagal menyimpan vital signs. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h2 className="text-xl font-bold mb-4">Edit Vital Signs</h2>
          {errorMessage && (
            <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
          )}
          <div className="space-y-4">
            {[
              { label: 'Tinggi (cm)', field: 'height' },
              { label: 'Berat (kg)', field: 'weight' },
              { label: 'Detak Jantung (bpm)', field: 'heartRate' },
              { label: 'Gula Darah (mg/dl)', field: 'bloodSugar' },
              { label: 'Suhu (°C)', field: 'temperature' },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                  type="number"
                  value={tempVitals[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            ))}
            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !isFormValid()}
                className={`px-4 py-2 text-sm font-medium text-white rounded ${
                  loading || !isFormValid()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/medical/patients/search?search=${term}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        const options = response.data.data.map((patient) => ({
          value: patient.no_rm,
          label: `${patient.nama_lengkap} (${patient.no_rm})`,
          patient: {
            id: patient.id,
            no_rm: patient.no_rm,
            name: patient.nama_lengkap,
            age: `${patient.umur} Tahun`,
            complaint: '',
          },
        }));
        setPatientOptions(options);
        setPatients(options.map((option) => option.patient));
      } else {
        setError('Gagal mencari pasien: Tidak ada data yang ditemukan.');
        setPatientOptions([]);
        setPatients([]);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setError('Gagal mencari pasien');
      setPatientOptions([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (selectedOption) => {
    if (!selectedOption) {
      setSelectedPatient(null);
      setSelectedPatientId(null);
      setVitals({
        height: 'Belum diisi',
        weight: 'Belum diisi',
        heartRate: 'Belum diisi',
        bloodSugar: 'Belum diisi',
        temperature: 'Belum diisi',
      });
      setMedicalRecord({ procedures: [], diagnoses: [], medications: [] });
      updateModalState('procedure', { selected: [], recent: [] });
      updateModalState('diagnose', { selected: [], recent: [] });
      updateModalState('medication', { selected: [], recent: [] });
      setVisitHistory([]);
      setError(null);
      return;
    }

    const patient = selectedOption.patient;
    setSelectedPatient(patient.name);
    setSelectedPatientId(patient.no_rm);
    setVitals({
      height: 'Belum diisi',
      weight: 'Belum diisi',
      heartRate: 'Belum diisi',
      bloodSugar: 'Belum diisi',
      temperature: 'Belum diisi',
    });
    setMedicalRecord({ procedures: [], diagnoses: [], medications: [] });
    updateModalState('procedure', { selected: [], recent: [] });
    updateModalState('diagnose', { selected: [], recent: [] });
    updateModalState('medication', { selected: [], recent: [] });
    setVisitHistory([]);
    setError(null);
    fetchPatientData(patient.no_rm);
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      const token = localStorage.getItem('token');
      
      // Using the getWaitingPatients endpoint with date filter
      const response = await axios.post(`${config.apiUrl}/medical/patients/waiting`, 
        { date: dateFilter },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const options = response.data.data.map((patient) => ({
          value: patient.no_rm,
          label: `${patient.nama_lengkap} (${patient.no_rm})`,
          patient: {
            id: patient.id,
            no_rm: patient.no_rm,
            name: patient.nama_lengkap,
            age: `${patient.umur} Tahun`,
            appointmentTime: patient.appointment_time,
            doctorName: patient.doctor_name || 'Tidak ada dokter',
            complaint: '',
          },
        }));
        setPatientOptions(options);
        setPatients(options.map((option) => option.patient));
        
        // Clear any previous errors
        setError(null);
      } else {
        setPatientOptions([]);
        setPatients([]);
        setError('Tidak ada pasien terjadwal untuk tanggal yang dipilih.');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Gagal mengambil data pasien: ' + (error.response?.data?.message || error.message));
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
      const token = localStorage.getItem('token');
      const combinedResponse = await axios.get(`${config.apiUrl}/medical/patients/${patientNoRM}/combined-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (combinedResponse.data.success && combinedResponse.data.data) {
        const { vitals: vitalData, procedures, diagnoses, medications } = combinedResponse.data.data;
        console.log('Fetched medications:', medications); // Debug: Check the data structure
        setVitals({
          height: vitalData?.height ? `${vitalData.height} cm` : 'Belum diisi',
          weight: vitalData?.weight ? `${vitalData.weight} kg` : 'Belum diisi',
          heartRate: vitalData?.heart_rate ? `${vitalData.heart_rate} bpm` : 'Belum diisi',
          bloodSugar: vitalData?.blood_sugar ? `${vitalData.blood_sugar} mg/dl` : 'Belum diisi',
          temperature: vitalData?.temperature ? `${vitalData.temperature}° C` : 'Belum diisi',
        });
        // Format medications as objects with name and details for the medical record
        setMedicalRecord({
          procedures: procedures || [],
          diagnoses: diagnoses || [],
          medications: medications.map(m => ({
            name: m.name,
            details: {
              dosage: m.dosage || '',
              frequency: m.frequency || '',
              duration: m.duration || ''
            }
          })) || [],
        });
        
        // Update modal state for procedures and diagnoses
        updateModalState('procedure', { selected: procedures || [] });
        updateModalState('diagnose', { selected: diagnoses || [] });
        
        // Update modal state for medications with their details
        updateModalState('medication', {
          selected: medications.map(m => m.name) || [],
          details: medications.reduce((acc, m) => ({
            ...acc,
            [m.name]: {
              dosage: m.dosage || '',
              frequency: m.frequency || '',
              duration: m.duration || '',
            },
          }), {}),
        });
      } else {
        setError('Gagal mengambil data pasien: Data tidak ditemukan.');
      }
  
      const visitsResponse = await axios.get(`${config.apiUrl}/medical/patients/${patientNoRM}/visits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (visitsResponse.data.success && visitsResponse.data.data) {
        setVisitHistory(
          visitsResponse.data.data.map((visit) => {
            const visitDate = new Date(visit.visit_date);
            return {
              visit_id: visit.visit_id,
              month: format(visitDate, 'MMM'),
              day: format(visitDate, 'd'),
              year: format(visitDate, 'yyyy'),
              time: format(visitDate, 'HH:mm'),
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
      console.error('Error fetching patient data:', error);
      setError('Gagal mengambil data pasien');
      setVitals({
        height: 'Belum diisi',
        weight: 'Belum diisi',
        heartRate: 'Belum diisi',
        bloodSugar: 'Belum diisi',
        temperature: 'Belum diisi',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [dateFilter]); // Re-fetch when date filter changes

  const activeModalType = ['procedure', 'diagnose', 'medication'].find((type) => modalState[type].show);

  return (
    <PageTemplate>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="mx-auto p-4">
        {/* Modern Header with Gradient Background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-md p-6 mb-8 text-white animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <ClipboardList className="mr-3" size={28} />
                Input Rekam Medis
              </h1>
              <p className="mt-1 text-blue-100">Kelola data rekam medis pasien dengan mudah</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-blue-400 bg-blue-50/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-100" size={18} />
              </div>
              <button 
                onClick={fetchPatients}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-all duration-200"
                disabled={loading}
              >
                <RefreshCw className={`${isRefreshing ? 'animate-spin' : ''}`} size={18} />
                Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-10 md:grid-cols-10 gap-4">
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 animate-fade-in">
              <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                <UserCircle className="mr-2 text-blue-500" size={22} />
                Daftar Pasien
              </h2>
              <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                  <Search className="text-gray-400" size={18} />
                </div>
                <Select
                  isClearable
                  isSearchable
                  placeholder="Cari pasien berdasarkan nama atau no. RM"
                  options={patientOptions}
                  onChange={handlePatientSelect}
                  onInputChange={(value) => {
                    if (value.length >= 3) {
                      // searchPatients(value);
                    }
                  }}
                  className="basic-single"
                  classNamePrefix="select"
                  styles={{
                    control: (baseStyles, state) => ({
                      ...baseStyles,
                      borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
                      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                      borderRadius: '0.5rem',
                      paddingLeft: '2rem',
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
              <div className="space-y-4 custom-scrollbar overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {loading ? (
                  <div className="text-center p-8 bg-gray-50 rounded-lg animate-pulse">
                    <RefreshCw className="mx-auto mb-3 text-blue-400 animate-spin" size={24} />
                    <div className="text-gray-500">Memuat data pasien...</div>
                  </div>
                ) : error ? (
                  <div className="text-center p-6 bg-red-50 rounded-lg border border-red-100 animate-fade-in">
                    <div className="text-red-500 font-medium">{error}</div>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center p-8 bg-gray-50 rounded-lg animate-fade-in">
                    <UserCircle className="mx-auto mb-3 text-gray-300" size={32} />
                    <div className="text-gray-500">Tidak ada pasien yang terdaftar pada tanggal ini</div>
                    <div className="text-xs text-gray-400 mt-2">Coba ubah tanggal filter atau tambahkan pasien baru</div>
                  </div>
                ) : (
                  patients.map((patient, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-xl mb-3 cursor-pointer transition-all duration-200 animate-fade-in shadow-sm ${selectedPatientId === patient.no_rm ? 'bg-gradient-to-r from-blue-50 to-white border-blue-300' : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'}`}
                      onClick={() => handlePatientSelect({ value: patient.no_rm, label: patient.name, patient })}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${selectedPatientId === patient.no_rm ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{patient.name}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                              <ClipboardList className="mr-1" size={12} />
                              No. RM: {patient.no_rm}
                            </div>
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${selectedPatientId === patient.no_rm ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}>
                          {patient.status || 'Menunggu'}
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-600 grid grid-cols-2 gap-2">
                        <div className="flex items-center">
                          <User className="mr-1.5 text-blue-500" size={12} />
                          <span className="font-medium mr-1">Umur:</span> {patient.age || '-'}
                        </div>
                        <div className="flex items-center">
                          {patient.gender === 'Laki-laki' ? 
                            <User className="mr-1.5 text-blue-500" size={12} /> : 
                            <User className="mr-1.5 text-pink-500" size={12} />
                          }
                          <span className="font-medium mr-1">Gender:</span> {patient.gender || '-'}
                        </div>
                        {patient.appointment_time && (
                          <div className="flex items-center">
                            <Clock className="mr-1.5 text-blue-500" size={12} />
                            <span className="font-medium mr-1">Jam:</span> {patient.appointment_time}
                          </div>
                        )}
                        {patient.doctor_name && (
                          <div className="flex items-center">
                            <Stethoscope className="mr-1.5 text-blue-500" size={12} />
                            <span className="font-medium mr-1">Dokter:</span> {patient.doctor_name}
                          </div>
                        )}
                      </div>
                      {selectedPatientId === patient.no_rm && (
                        <div className="mt-3 pt-2 border-t border-blue-100 flex justify-end">
                          <div className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full flex items-center">
                            <ChevronRight size={12} />
                            <span className="ml-0.5">Terpilih</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="md:col-span-7">
            {selectedPatient ? (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-white p-5 mb-6 flex items-center rounded-xl border border-blue-100 shadow-sm animate-fade-in">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mr-5 shadow-md">
                    {selectedPatient.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {patients.find((p) => p.name === selectedPatient)?.no_rm || ''}
                      </div>
                      <div className="mx-2 w-1 h-1 bg-gray-300 rounded-full"></div>
                      <div className="text-gray-500 text-sm flex items-center">
                        <Calendar className="mr-1" size={14} />
                        {patients.find((p) => p.name === selectedPatient)?.age || ''}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-800 mt-1">{selectedPatient}</div>
                    <div className="mt-2 text-sm text-gray-600 flex items-center">
                      <Stethoscope className="mr-1" size={14} />
                      {patients.find((p) => p.name === selectedPatient)?.doctorName || 'Tidak ada dokter'}
                    </div>
                  </div>
                  <div className="ml-auto bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-100 max-w-xs">
                    <div className="text-sm font-medium text-gray-700 flex items-center mb-1">
                      <FileText className="mr-1 text-blue-500" size={14} />
                      Keluhan:
                    </div>
                    <div className="text-sm text-gray-600">
                      {visitHistory.length > 0 ? visitHistory[0].notes : 'Tidak ada keluhan'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                      <ClipboardList className="mr-2 text-blue-500" size={20} />
                      Rekam Medis
                    </h2>
                    {['procedure', 'diagnose', 'medication'].map((type, idx) => {
                      const icons = {
                        procedure: <Activity size={18} />,
                        diagnose: <FileText size={18} />,
                        medication: <Pill size={18} />
                      };
                      const titles = {
                        procedure: 'Tindakan',
                        diagnose: 'Diagnosa',
                        medication: 'Obat'
                      };
                      const colors = {
                        procedure: 'from-blue-50 to-white border-blue-100 hover:border-blue-300',
                        diagnose: 'from-green-50 to-white border-green-100 hover:border-green-300',
                        medication: 'from-purple-50 to-white border-purple-100 hover:border-purple-300'
                      };
                      const iconColors = {
                        procedure: 'text-blue-500',
                        diagnose: 'text-green-500',
                        medication: 'text-purple-500'
                      };
                      
                      return (
                        <div
                          key={type}
                          className={`bg-gradient-to-r ${colors[type]} p-4 rounded-xl mb-4 border shadow-sm animate-fade-in`}
                          style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="font-medium flex items-center text-gray-800">
                              <span className={`mr-2 ${iconColors[type]}`}>{icons[type]}</span>
                              {titles[type]}
                            </div>
                            <button
                              className={`p-2 rounded-full transition-all duration-200 ${visitHistory.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 hover:shadow-sm'}`}
                              onClick={() => updateModalState(type, { show: true })}
                              disabled={visitHistory.length === 0}
                              title={visitHistory.length === 0 ? 'Tidak ada kunjungan aktif' : `Tambah ${titles[type]}`}
                            >
                              <PlusCircle size={18} />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {medicalRecord[`${type}s`].length > 0 ? (
                              medicalRecord[`${type}s`].map((item, index) => {
                                // Check if this is a medication with details
                                const isMedication = type === 'medication';
                                const medicationDetails = isMedication && typeof item === 'object' ? item.details : null;
                                
                                return (
                                  <div
                                    key={index}
                                    className={`bg-white px-3 py-2 rounded-lg text-sm border border-gray-200 shadow-sm animate-fade-in ${isMedication ? 'w-full' : ''}`}
                                    style={{ animationDelay: `${index * 0.05 + 0.2}s` }}
                                  >
                                    {isMedication && medicationDetails ? (
                                      <div className="flex flex-col">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                          <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-xs">
                                            <span className="font-medium">Dosis:</span> {medicationDetails.dosage}
                                          </span>
                                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                                            <span className="font-medium">Frekuensi:</span> {medicationDetails.frequency}
                                          </span>
                                          <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs">
                                            <span className="font-medium">Durasi:</span> {medicationDetails.duration}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      typeof item === 'object' ? item.name : item
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-sm text-gray-500 py-2">Tidak ada data {titles[type].toLowerCase()}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="md:col-span-1">
                    <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                      <Activity className="mr-2 text-blue-500" size={20} />
                      Tanda Vital
                    </h2>
                    <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm animate-fade-in">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-600 flex items-center">
                          <Calendar className="mr-1 text-blue-500" size={14} />
                          {visitHistory.length > 0
                            ? `${visitHistory[0].day} ${visitHistory[0].month} ${visitHistory[0].year} · ${visitHistory[0].time}`
                            : 'Tidak ada data'}
                        </div>
                        {visitHistory.length > 0 ? (
                          <button
                            className="bg-white text-blue-600 px-3 py-1.5 rounded-lg font-medium border border-blue-200 hover:bg-blue-50 transition-colors duration-200 flex items-center shadow-sm"
                            onClick={() => setShowEditVitalsModal(true)}
                          >
                            <Edit3 className="mr-1" size={14} />
                            Edit
                          </button>
                        ) : (
                          <div className="text-sm bg-gray-100 px-3 py-1 rounded-lg text-gray-500">Belum ada kunjungan</div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {
                          [
                            { label: 'Tinggi Badan', value: vitals.height, icon: <Ruler size={18} className="text-blue-500" /> },
                            { label: 'Detak Jantung', value: vitals.heartRate, icon: <Heart size={18} className="text-red-500" /> },
                            { label: 'Berat Badan', value: vitals.weight, icon: <Weight size={18} className="text-green-500" /> },
                            { label: 'Gula Darah', value: vitals.bloodSugar, icon: <Droplet size={18} className="text-purple-500" /> },
                            { label: 'Suhu Tubuh', value: vitals.temperature, icon: <Thermometer size={18} className="text-orange-500" /> },
                          ].map((vital, index) => (
                            <div 
                              key={index} 
                              className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm flex items-start animate-fade-in" 
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <div className="mr-3 mt-0.5">{vital.icon}</div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{vital.label}</div>
                                <div className="font-medium text-gray-800">{vital.value}</div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    {showEditVitalsModal && visitHistory.length > 0 && (
                      <EditVitalsModal
                        vitals={vitals}
                        visitId={visitHistory[0].visit_id}
                        onSave={setVitals}
                        onClose={() => setShowEditVitalsModal(false)}
                      />
                    )}
                    {activeModalType && (
                      <MedicalRecordModal
                        key={activeModalType}
                        type={activeModalType}
                        title={activeModalType.charAt(0).toUpperCase() + activeModalType.slice(1)}
                        show={modalState[activeModalType].show}
                        onClose={() => updateModalState(activeModalType, { show: false })}
                        onSave={handleSaveMedicalRecord}
                        selectedItems={modalState[activeModalType].selected}
                        recentItems={modalState[activeModalType].recent}
                        medicationDetails={modalState.medication.details} // New prop
                        onSearch={handleSearchMedicalRecord}
                        onSelectItem={handleSelectItem}
                        onRemoveItem={handleRemoveItem}
                        loading={loading}
                        setMedicalRecord={setMedicalRecord}
                      />
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                      <Clock className="mr-2 text-blue-500" size={20} />
                      Riwayat Kunjungan
                    </h2>
                    <div className="relative bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm animate-fade-in">
                      <div className="absolute left-7 top-14 bottom-5 w-0.5 bg-gradient-to-b from-blue-400 to-blue-100 rounded-full"></div>
                      {visitHistory.length > 0 ? (
                        visitHistory.map((visit, index) => (
                          <div key={index} className="relative pl-8 mb-6 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div
                              className={`absolute left-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                index === 0 ? 'bg-blue-500 animate-pulse shadow-md' : 'bg-gray-200'
                              }`}
                            >
                              {index === 0 && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-all duration-200">
                              <div className="flex items-baseline mb-2">
                                <div className="text-sm font-medium text-blue-500">{visit.month}</div>
                                <div className="text-xl font-bold ml-1 text-gray-800">{visit.day}</div>
                                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">{visit.time}</div>
                              </div>
                              <div className="font-medium text-gray-800 flex items-center">
                                <Stethoscope className="mr-1 text-blue-500" size={14} />
                                {visit.doctor}
                              </div>
                              {visit.specialty && (
                                <div className="text-xs text-gray-500 mt-1">{visit.specialty}</div>
                              )}
                              <div className="mt-3 bg-gradient-to-r from-blue-50 to-white p-3 rounded-lg border border-blue-100 text-sm text-gray-600">
                                <div className="font-medium text-gray-700 flex items-center mb-1">
                                  <FileText className="mr-1 text-blue-500" size={14} />
                                  Keluhan:
                                </div>
                                {visit.notes || 'Tidak ada catatan'}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 animate-fade-in">
                          <Clock className="mx-auto mb-3 text-gray-300" size={32} />
                          <div>Tidak ada riwayat kunjungan</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 mb-2">Silakan pilih pasien dari daftar</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default InputRM;