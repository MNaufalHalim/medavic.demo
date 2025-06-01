import { useState, useEffect } from 'react';
import PageTemplate from '../../components/PageTemplate';
import axios from 'axios';
import config from '../../config';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Search, Pill, Clock, User, CheckCircle, XCircle, Plus, Trash2, Save } from 'lucide-react';

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
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Pill className="mr-2" size={28} strokeWidth={2} />
          Resep Obat
        </h1>
        <p className="text-blue-100 mt-1">Manajemen resep obat pasien</p>
      </div>
      
      <div className="flex min-h-screen bg-gray-100 p-4 gap-6">
        <div className="w-1/4 bg-white p-5 rounded-xl shadow-md space-y-4 border border-gray-100">
          <div className="mb-6">
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-blue-500">
                <Calendar size={18} />
              </div>
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date || new Date())}
                dateFormat="dd MMMM yyyy"
                className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholderText="Pilih tanggal"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={5}
                showMonthDropdown
                todayButton="Hari Ini"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-blue-500">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Cari nama pasien..."
                className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>
          <h3 className="font-medium text-gray-700 flex items-center mb-2">
            <User className="mr-2" size={16} />
            Daftar Pasien
          </h3>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {loading && 
            <div className="text-center py-6 text-gray-500 animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full mb-2 animate-spin"></div>
              <span>Memuat data pasien...</span>
            </div>
          }
          {!loading && filteredPatients.length === 0 && 
            <div className="text-center py-6 text-gray-500 flex flex-col items-center">
              <XCircle size={40} className="text-gray-400 mb-2" />
              <span>Tidak ada pasien untuk tanggal ini</span>
            </div>
          }
          {!loading && filteredPatients.map((patient) => {
            const isWaiting = visitMedications.some(vm => vm.visit_id === patient.visit_id && vm.status === 'pending');
            const statusColor = isWaiting ? 'bg-amber-500' : 'bg-emerald-500';
            const statusText = isWaiting ? 'Waiting' : 'Proceed';
            const selected = selectedPatient?.no_rm === patient.no_rm;
            return (
              <div
                key={patient.no_rm}
                className={`relative bg-white rounded-xl p-4 shadow-sm border ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'} transition-all duration-200 cursor-pointer`}
                onClick={() => handlePatientSelect(patient)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className={`text-xs px-2 py-1 rounded-full ${isWaiting ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'} flex items-center`}>
                    {isWaiting ? 
                      <Clock size={14} className="mr-1" /> : 
                      <CheckCircle size={14} className="mr-1" />
                    }
                    {statusText}
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{patient.visit_id}</div>
                </div>
                
                <div className="mt-2">
                  <div className="font-semibold text-gray-800 text-lg">
                    {patient.nama_lengkap}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-2">{patient.no_rm}</span>
                    <span>24 Tahun</span>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="font-medium">Dokter:</span>
                      <span className="ml-2">{patient.doctor_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="font-medium">Waktu Kunjungan:</span>
                      <span className="ml-2">10:11</span>
                    </div>
                  </div>
                  
                  {selected && 
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      DIPILIH
                    </div>
                  }
                </div>
              </div>
            );
          })}
        </div>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
      <div className="flex-1 bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-5">
        {!selectedPatient ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <User size={48} className="text-gray-300 mb-3" />
            <p className="text-lg">Pilih pasien dari daftar untuk melihat data resep</p>
            <p className="text-sm mt-2">Tidak ada pasien yang dipilih</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border border-blue-100 mb-6">
              <div className="flex justify-between items-start">
                <div className="flex">
                  <div className="bg-blue-100 rounded-full p-3 mr-4 text-blue-600 self-start">
                    <User size={32} />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h2 className="text-2xl font-bold text-gray-800">{selectedPatient.nama_lengkap || 'Pilih Pasien'}</h2>
                      <span className="ml-3 bg-blue-600 text-white text-sm px-3 py-1 rounded-full">{selectedPatient.no_rm || ''}</span>
                      <span className={`ml-3 text-sm px-3 py-1 rounded-full ${visitMedications.every(vm => vm.status === 'processed') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} flex items-center`}>
                        {visitMedications.every(vm => vm.status === 'processed') ? 
                          <><CheckCircle size={14} className="mr-1" /> Proceed</> : 
                          <><Clock size={14} className="mr-1" /> Waiting</>
                        }
                      </span>
                    </div>
                    <div className="mt-2 text-gray-600 flex items-center space-x-4">
                      <div className="bg-gray-100 px-3 py-1 rounded-lg">Umur: 24 Tahun</div>
                      <div className="bg-gray-100 px-3 py-1 rounded-lg">Berat: 60 kg</div>
                      <div className="bg-gray-100 px-3 py-1 rounded-lg">Visit ID: {selectedPatient.visit_id}</div>
                    </div>
                    <div className="mt-3 text-gray-600">
                      <span className="font-medium">Dokter:</span> {selectedPatient.doctor_name || 'N/A'}
                    </div>
                  </div>
                </div>
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
            <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-200 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">Total Harga</span>
              <span className="text-2xl font-bold text-green-700">Rp {calculateTotal().toLocaleString('id-ID')}</span>
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