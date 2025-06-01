import { useState, useEffect } from 'react';
import PageTemplate from '../../components/PageTemplate';
import axios from 'axios';
import config from '../../config';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Search, Pill, Clock, User, CheckCircle, XCircle, Plus, Trash2, Save, FileText, AlertTriangle, RefreshCw, Filter, ChevronRight, ChevronDown, Edit, Clipboard, Activity, Stethoscope, Shield, RotateCw, Heart, Loader } from 'lucide-react';

const ResepObat = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visitMedications, setVisitMedications] = useState([]);
  const [originalMedications, setOriginalMedications] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState({});
  const [newMedications, setNewMedications] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [medicineSearches, setMedicineSearches] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editQuantities, setEditQuantities] = useState({});

  useEffect(() => {
    fetchPatients();
    fetchMedicines();
  }, [selectedDate]);

  // Debounce untuk pencarian obat
  useEffect(() => {
    const timeouts = {};
    Object.keys(medicineSearches).forEach(id => {
      timeouts[id] = setTimeout(() => {
        if (medicineSearches[id].length < 2) {
          setFilteredMedicines(prev => ({ ...prev, [id]: [] }));
          return;
        }
        setFilteredMedicines(prev => ({
          ...prev,
          [id]: medicines.filter(m => m.name.toLowerCase().includes(medicineSearches[id].toLowerCase()))
        }));
      }, 300);
    });
    return () => Object.values(timeouts).forEach(clearTimeout);
  }, [medicineSearches, medicines]);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    setSelectedPatient(null);
    setVisitMedications([]);
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      console.log('Fetching patients for date:', formattedDate);
      const response = await axios.get(`${config.apiUrl}/billing/patients?date=${formattedDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        const patientList = response.data.data || [];
        setPatients(patientList);
        setFilteredPatients(patientList); // Sinkronkan filteredPatients dengan patients awal
      } else {
        setPatients([]);
        setFilteredPatients([]);
        setError(response.data.message || 'Tidak ada pasien untuk tanggal ini');
      }
    } catch (err) {
      console.error('Fetch patients error:', err.response?.data || err.message);
      setPatients([]);
      setFilteredPatients([]);
      setError('Gagal memuat daftar pasien');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/billing/medicines`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) setMedicines(response.data.data || []);
    } catch (err) {
      console.error('Fetch medicines error:', err.response?.data || err.message);
      setMedicines([]);
    }
  };

  const fetchVisitMedications = async (visitId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${config.apiUrl}/billing/visit/${visitId}/medications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setSelectedPatient(response.data.patient || null);
        const meds = (response.data.medications || []).map(vm => ({ ...vm, selected: false }));
        setVisitMedications(meds);
        setOriginalMedications(meds);
        const quantities = {};
        meds.forEach(vm => { quantities[vm.id] = vm.quantity || 0; });
        setEditQuantities(quantities);
        setNewMedications([]);
        setMedicineSearches({});
        setFilteredMedicines({});
      } else {
        setSelectedPatient(null);
        setVisitMedications([]);
        setOriginalMedications([]);
        setEditQuantities({});
        setError(response.data.message || 'Tidak ada data obat');
      }
    } catch (err) {
      console.error('Fetch visit medications error:', err.response?.data || err.message);
      setSelectedPatient(null);
      setVisitMedications([]);
      setOriginalMedications([]);
      setEditQuantities({});
      setError('Gagal memuat data obat');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    fetchVisitMedications(patient.visit_id);
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredPatients(
      patients.filter(p => p.nama_lengkap.toLowerCase().includes(query))
    );
  };

  const handleMedicineSearch = (id, value) => {
    setMedicineSearches(prev => ({ ...prev, [id]: value }));
  };

  const handleQuantityChange = (medicationId, value) => {
    setEditQuantities(prev => ({ ...prev, [medicationId]: parseInt(value) || 0 }));
  };

  const addNewMedicationRow = () => {
    const newId = Date.now();
    setNewMedications([...newMedications, { id: newId, medicine_id: '', dosage: '', frequency: '', duration: '', quantity: 0, selected: false }]);
    setMedicineSearches(prev => ({ ...prev, [newId]: '' }));
  };

  const handleInputChange = (id, field, value) => {
    setNewMedications(newMedications.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleMedicineSelect = (id, medicineId) => {
    const selectedMedicine = medicines.find(m => m.id === medicineId);
    setNewMedications(newMedications.map(m => m.id === id ? { ...m, medicine_id: medicineId, medicine_name: selectedMedicine?.name || '' } : m));
    setMedicineSearches(prev => ({ ...prev, [id]: '' }));
    setFilteredMedicines(prev => ({ ...prev, [id]: [] }));
  };

  const handleRemoveSelected = () => {
    const selectedIds = [...visitMedications, ...newMedications].filter(m => m.selected).map(m => m.id);
    setVisitMedications(visitMedications.filter(vm => !vm.selected));
    setNewMedications(newMedications.filter(m => !m.selected));
    setMedicineSearches(prev => {
      const updated = { ...prev };
      selectedIds.forEach(id => delete updated[id]);
      return updated;
    });
    setFilteredMedicines(prev => {
      const updated = { ...prev };
      selectedIds.forEach(id => delete updated[id]);
      return updated;
    });
    setEditQuantities(prev => {
      const updated = { ...prev };
      selectedIds.forEach(id => delete updated[id]);
      return updated;
    });
  };

  const handleSelectAll = () => {
    const allSelected = [...visitMedications, ...newMedications].every(m => m.selected);
    setVisitMedications(visitMedications.map(vm => ({ ...vm, selected: !allSelected })));
    setNewMedications(newMedications.map(m => ({ ...m, selected: !allSelected })));
  };

  const handleToggleSelect = (id) => {
    setVisitMedications(visitMedications.map(vm => vm.id === id ? { ...vm, selected: !vm.selected } : vm));
    setNewMedications(newMedications.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
  };

  const saveChanges = async () => {
    setLoading(true);
    try {
      const updatedMeds = [
        ...visitMedications.map(vm => ({
          id: vm.id,
          quantity: editQuantities[vm.id] || vm.quantity,
          status: editQuantities[vm.id] ? 'processed' : vm.status
        })),
        ...newMedications.map(m => ({
          visit_id: selectedPatient.visit_id,
          medicine_id: m.medicine_id,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          quantity: m.quantity,
          status: 'processed'
        }))
      ].filter(m => m.quantity > 0);

      const response = await axios.post(
        `${config.apiUrl}/billing/visit/${selectedPatient.visit_id}/medications`,
        { medications: updatedMeds },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.success) {
        setSuccess('Data berhasil disimpan');
        fetchVisitMedications(selectedPatient.visit_id);
        setNewMedications([]);
        setMedicineSearches({});
        setFilteredMedicines({});
      } else {
        setError(response.data.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return [
      ...visitMedications.map(vm => ({ quantity: editQuantities[vm.id] || vm.quantity, price: vm.price || 0 })),
      ...newMedications.map(m => ({ quantity: m.quantity || 0, price: medicines.find(med => med.id === m.medicine_id)?.price || 0 }))
    ].reduce((sum, vm) => sum + (vm.quantity * vm.price), 0);
  };

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const aStatus = visitMedications.some(vm => vm.visit_id === a.visit_id && vm.status === 'pending') ? 'Waiting' : 'Proceed';
    const bStatus = visitMedications.some(vm => vm.visit_id === b.visit_id && vm.status === 'pending') ? 'Waiting' : 'Proceed';
    return aStatus === 'Waiting' ? -1 : bStatus === 'Waiting' ? 1 : 0;
  });

  return (
    <PageTemplate>
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-6 rounded-xl shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mt-20 -mr-20 backdrop-blur-sm"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -mb-20 -ml-20 backdrop-blur-sm"></div>
        
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3 backdrop-blur-sm">
                <Pill className="text-white" size={28} strokeWidth={2} />
              </div>
              Resep Obat
            </h1>
            <p className="text-blue-100 mt-1 ml-12">Manajemen resep obat pasien</p>
          </div>
          
          <div className="flex space-x-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center min-w-[100px]">
              <div className="text-xs text-blue-100">Total Pasien</div>
              <div className="text-xl font-bold text-white">{patients.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center min-w-[100px]">
              <div className="text-xs text-blue-100">Menunggu</div>
              <div className="text-xl font-bold text-white">
                {patients.filter(p => visitMedications.some(vm => vm.visit_id === p.visit_id && vm.status === 'pending')).length}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex min-h-screen bg-gray-50 p-4 gap-6">
        <div className="w-1/4 bg-white p-5 rounded-xl shadow-md space-y-4 border border-gray-100">
          <div className="mb-6">
            <div className="relative mb-4 group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-blue-500 group-hover:text-blue-600 transition-colors duration-200">
                <Calendar size={18} className="group-hover:scale-110 transition-transform duration-200" />
              </div>
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date || new Date())}
                dateFormat="dd MMMM yyyy"
                className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400"
                placeholderText="Pilih tanggal"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={5}
                showMonthDropdown
                todayButton={<div className="flex items-center"><RefreshCw size={14} className="mr-1" />Hari Ini</div>}
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-blue-500 group-hover:text-blue-600 transition-colors duration-200">
                <Search size={18} className="group-hover:scale-110 transition-transform duration-200" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Cari nama pasien..."
                className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700 flex items-center">
              <User className="mr-2 text-blue-500" size={16} />
              Daftar Pasien
            </h3>
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {filteredPatients.length} pasien
            </div>
          </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 pt-2">
          {loading && 
            <div className="text-center py-10 text-gray-500 flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <User size={20} className="text-blue-500" />
                </div>
              </div>
              <span className="mt-4 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg animate-pulse">Memuat data pasien...</span>
            </div>
          }
          {!loading && filteredPatients.length === 0 && 
            <div className="text-center py-10 text-gray-500 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <XCircle size={32} className="text-gray-400" />
              </div>
              <span className="text-lg font-medium text-gray-600 mb-1">Tidak ada pasien</span>
              <span className="text-sm text-gray-500">Tidak ada pasien untuk tanggal ini</span>
              <button 
                onClick={() => setSelectedDate(new Date())} 
                className="mt-4 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center hover:bg-blue-200 transition-colors duration-200"
              >
                <RefreshCw size={16} className="mr-1.5" />
                Kembali ke hari ini
              </button>
            </div>
          }
          {!loading && filteredPatients.map((patient) => {
            const isWaiting = visitMedications.some(vm => vm.visit_id === patient.visit_id && vm.status === 'pending');
            const statusText = isWaiting ? 'Waiting' : 'Proceed';
            const selected = selectedPatient?.no_rm === patient.no_rm;
            return (
              <div
                key={patient.no_rm}
                className={`relative bg-white rounded-xl p-4 shadow-sm border overflow-hidden ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'} transition-all duration-200 cursor-pointer group`}
                onClick={() => handlePatientSelect(patient)}
              >
                {/* Background decoration */}
                <div className="absolute -right-6 -top-6 w-12 h-12 rounded-full bg-gray-50 group-hover:bg-blue-50 transition-colors duration-200"></div>
                <div className="absolute -left-6 -bottom-6 w-12 h-12 rounded-full bg-gray-50 group-hover:bg-blue-50 transition-colors duration-200"></div>
                
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className={`text-xs px-3 py-1 rounded-full flex items-center ${isWaiting ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {isWaiting ? (
                      <>
                        <div className="relative mr-1.5">
                          <Clock size={14} />
                          <div className="absolute inset-0 animate-ping opacity-30 rounded-full bg-amber-400"></div>
                        </div>
                        {statusText}
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} className="mr-1.5" />
                        {statusText}
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center">
                    <FileText size={12} className="mr-1" />
                    {patient.visit_id}
                  </div>
                </div>
                
                <div className="mt-2 relative z-10">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-medium shadow-sm mr-3">
                      {patient.nama_lengkap.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-lg group-hover:text-blue-700 transition-colors duration-200">
                        {patient.nama_lengkap}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-2 flex items-center">
                          <Clipboard size={12} className="mr-1" />
                          {patient.no_rm}
                        </span>
                        <span className="flex items-center">
                          <Activity size={12} className="mr-1 text-gray-400" />
                          24 Tahun
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600 grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <Stethoscope size={14} className="mr-1.5 text-blue-500" />
                      <span className="text-gray-700">{patient.doctor_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1.5 text-blue-500" />
                      <span className="text-gray-700">10:11</span>
                    </div>
                  </div>
                  
                  {selected && (
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[50px] border-t-blue-500 border-l-[50px] border-l-transparent">
                      <CheckCircle size={14} className="absolute -top-[40px] right-[5px] text-white" />
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-blue-500 transition-all duration-300"></div>
              </div>
            );
          })}
        </div>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
      <div className="flex-1 bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-5">
        {!selectedPatient ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <User size={48} className="text-blue-300" />
            </div>
            <p className="text-xl font-medium text-gray-700 mb-2">Tidak Ada Pasien Dipilih</p>
            <p className="text-gray-500 max-w-md text-center mb-6">Pilih pasien dari daftar di sebelah kiri untuk melihat dan mengelola data resep obat</p>
            <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg flex items-center">
              <ChevronRight size={18} className="mr-2 animate-pulse" />
              Klik pada kartu pasien untuk memulai
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-xl shadow-md mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mt-20 -mr-20 backdrop-blur-sm"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -mb-20 -ml-20 backdrop-blur-sm"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mr-4 text-white self-start shadow-lg">
                    <User size={36} />
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h2 className="text-2xl font-bold text-white">{selectedPatient.nama_lengkap || 'Pilih Pasien'}</h2>
                      <span className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full flex items-center">
                        <Clipboard size={14} className="mr-1.5" />
                        {selectedPatient.no_rm || ''}
                      </span>
                      <span className={`text-sm px-3 py-1 rounded-full flex items-center ${visitMedications.every(vm => vm.status === 'processed') ? 'bg-green-500/20 text-white' : 'bg-amber-500/20 text-white'}`}>
                        {visitMedications.every(vm => vm.status === 'processed') ? (
                          <>
                            <CheckCircle size={14} className="mr-1.5" /> 
                            Proceed
                          </>
                        ) : (
                          <>
                            <div className="relative mr-1.5">
                              <Clock size={14} />
                              <div className="absolute inset-0 animate-ping opacity-50 rounded-full bg-amber-400"></div>
                            </div>
                            Waiting
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="mt-3 text-blue-100 flex items-center flex-wrap gap-3">
                      <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center">
                        <Activity size={16} className="mr-1.5" />
                        Umur: 24 Tahun
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center">
                        <Heart size={16} className="mr-1.5" />
                        Berat: 60 kg
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center">
                        <FileText size={16} className="mr-1.5" />
                        Visit ID: {selectedPatient.visit_id}
                      </div>
                    </div>
                    
                    <div className="mt-4 text-white flex items-center">
                      <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center">
                        <Stethoscope size={16} className="mr-1.5" />
                        Dokter: {selectedPatient.doctor_name || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-2 rounded-lg transition-colors duration-200"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <button 
                  onClick={handleSelectAll} 
                  className="px-4 py-2 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Pilih Semua
                </button>
                <button 
                  onClick={handleRemoveSelected} 
                  className="px-4 py-2 border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center"
                >
                  <Trash2 size={16} className="mr-2" />
                  Hapus Terpilih
                </button>
              </div>
              <button 
                onClick={addNewMedicationRow} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-150 flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Tambah Obat
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-full text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obat</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosis</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frekuensi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kuantitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {visitMedications.map(vm => (
                    <tr key={vm.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={vm.selected || false} 
                          onChange={() => handleToggleSelect(vm.id)} 
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{vm.medicine_name}</td>
                      <td className="px-4 py-3 text-gray-700">{vm.dosage}</td>
                      <td className="px-4 py-3 text-gray-700">{vm.frequency}</td>
                      <td className="px-4 py-3 text-gray-700">{vm.duration}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editQuantities[vm.id] || vm.quantity || 0}
                          onChange={(e) => handleQuantityChange(vm.id, e.target.value)}
                          className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
                          min="0"
                          max={vm.stock || Infinity}
                        />
                      </td>
                    </tr>
                  ))}  
                  {newMedications.map(m => (
                    <tr key={m.id} className="hover:bg-blue-50 transition-colors duration-150 bg-blue-50/30">
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={m.selected || false} 
                          onChange={() => handleToggleSelect(m.id)} 
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 relative">
                        <input
                          type="text"
                          value={m.medicine_name || medicineSearches[m.id] || ''}
                          onChange={(e) => {
                            handleInputChange(m.id, 'medicine_name', e.target.value);
                            handleMedicineSearch(m.id, e.target.value);
                          }}
                          placeholder="Cari obat (min 2 huruf)..."
                          className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
                        />
                        {medicineSearches[m.id] && filteredMedicines[m.id]?.length > 0 && (
                          <div className="absolute left-[calc(100%+0.5rem)] top-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto w-72">
                            {filteredMedicines[m.id].map(med => (
                              <div
                                key={med.id}
                                onDoubleClick={() => handleMedicineSelect(m.id, med.id)}
                                className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between border-b border-gray-100 last:border-0"
                              >
                                <span className="font-medium">{med.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${med.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  {med.stock <= 0 ? 'Stok habis' : `Stok: ${med.stock}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          value={m.dosage} 
                          onChange={(e) => handleInputChange(m.id, 'dosage', e.target.value)} 
                          className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full" 
                          placeholder="Dosis"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          value={m.frequency} 
                          onChange={(e) => handleInputChange(m.id, 'frequency', e.target.value)} 
                          className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full" 
                          placeholder="Frekuensi"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          value={m.duration} 
                          onChange={(e) => handleInputChange(m.id, 'duration', e.target.value)} 
                          className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full" 
                          placeholder="Durasi"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          value={m.quantity} 
                          onChange={(e) => handleInputChange(m.id, 'quantity', e.target.value)} 
                          className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full" 
                          min="0" 
                          placeholder="Jumlah"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button 
              onClick={saveChanges} 
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium text-lg flex items-center justify-center transition-colors duration-150" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-t-white border-white/30 rounded-full animate-spin mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Simpan Resep
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
                <XCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start">
                <CheckCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </PageTemplate>
  );
};

export default ResepObat;