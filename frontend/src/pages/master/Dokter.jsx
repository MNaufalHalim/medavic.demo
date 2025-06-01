import React, { useState, useEffect } from 'react';
import PageTemplate from '../../components/PageTemplate';
import axios from 'axios';
import { 
  User, Calendar, Phone, Mail, Award, Clock, 
  CheckCircle, XCircle, Plus, Trash2, Save, 
  Edit, RefreshCw, Search, Filter, ChevronDown, 
  Stethoscope, AlertTriangle, Info, Shield
} from 'lucide-react';

// Tambahkan style untuk animasi
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
`;

const Dokter = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editDoctor, setEditDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [removedScheduleIds, setRemovedScheduleIds] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/api/master/doctors', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.status === 'success') {
        setDoctors(response.data.data);
      } else setError(response.data.message || 'Gagal memuat data dokter');
    } catch {
      setError('Gagal memuat data dokter');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setEditDoctor({ ...doc });
    setRemovedScheduleIds([]);
    fetchSchedules(doc.id);
    setError(''); setSuccess('');
  };

  const fetchSchedules = async (doctorId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/master/doctor-schedules?doctor_id=${doctorId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = res.data.data || {};
      // Convert grouped object into flat array
      const flat = Object.keys(data).flatMap(day =>
        data[day].map(s => ({ ...s, day_of_week: day }))
      );
      setScheduleEntries(flat);
    } catch {
      setScheduleEntries([]);
    }
  };

  // Helper to deduplicate schedule entries by day + start + end
  const dedupeSchedules = (list) => {
    const seen = new Set();
    const result = [];
    for (const item of list) {
      const key = `${item.day_of_week}|${item.start_time}|${item.end_time}`;
      if (!item.day_of_week || !item.start_time || !item.end_time) {
        result.push(item); // keep incomplete rows for user to finish
        continue;
      }
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  };

  const handleScheduleChange = (index, field, value) => {
    setScheduleEntries(prev => {
      const updated = prev.map((e,i) => i===index ? { ...e, [field]: value } : e);
      return dedupeSchedules(updated);
    });
  };

  const addSchedule = () => {
    setScheduleEntries(prev => dedupeSchedules([...prev, { day_of_week: '', start_time: '', end_time: '', is_active: true }]));
  };

  const removeSchedule = (index) => {
    setScheduleEntries(prev => {
      const rem = prev[index];
      if (rem.id) setRemovedScheduleIds(ids => [...ids, rem.id]);
      return prev.filter((_,i) => i!==index);
    });
  };

  const handleInputChange = (field, value) => {
    setEditDoctor(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editDoctor) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const response = await axios.put(
        `http://localhost:5000/api/master/doctors/${editDoctor.id}`,
        editDoctor,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.status === 'success') {
        setSuccess('Data dokter berhasil diperbarui');
        fetchDoctors();
        // save schedule changes
        await Promise.all([
          ...removedScheduleIds.map(id => axios.delete(
            `http://localhost:5000/api/master/doctor-schedules/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          )),
          ...scheduleEntries.filter(e => e.id).map(e => axios.put(
            `http://localhost:5000/api/master/doctor-schedules/${e.id}`, e, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          )),
          ...scheduleEntries.filter(e => !e.id).map(e => axios.post(
            `http://localhost:5000/api/master/doctor-schedules`, { ...e, doctor_id: editDoctor.id }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          ))
        ]);
        fetchSchedules(editDoctor.id);
      } else setError(response.data.message || 'Gagal memperbarui data dokter');
    } catch {
      setError('Gagal memperbarui data dokter');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedDoctor) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/master/doctors/${selectedDoctor.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.status === 'success') {
        setSuccess('Data dokter berhasil dihapus');
        setSelectedDoctor(null); setEditDoctor(null);
        fetchDoctors();
      } else setError(response.data.message || 'Gagal menghapus data dokter');
    } catch {
      setError('Gagal menghapus data dokter');
    } finally { setLoading(false); }
  };

  const filteredDoctors = () => {
    if (filter === 'available') {
      return doctors.filter(doc => doc.status === 'active');
    } else if (filter === 'inactive') {
      return doctors.filter(doc => doc.status === 'inactive');
    }
    return doctors;
  };

  const getNextSchedule = (doctorId) => {
    // Fetch schedules for this doctor if available in the current state
    // This assumes schedules are loaded when a doctor is selected, for preview we show a placeholder
    if (scheduleEntries.length > 0 && selectedDoctor && selectedDoctor.id === doctorId) {
      const upcoming = scheduleEntries.find(s => s.doctor_id === doctorId || true);
      if (upcoming && upcoming.day_of_week && upcoming.start_time) {
        return `${upcoming.day_of_week.substring(0, 3)}, ${upcoming.start_time}`;
      }
    }
    return 'Belum ada jadwal';
  };

  return (
    <PageTemplate title="Data Dokter">
      <style>{styles}</style>
      {/* Header dengan statistik */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-xl shadow-md mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mt-20 -mr-20 backdrop-blur-sm"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -mb-20 -ml-20 backdrop-blur-sm"></div>
        
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mr-4 text-white self-start shadow-lg">
              <Stethoscope size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Manajemen Dokter</h2>
              <p className="text-blue-100 mt-1">Kelola data dan jadwal dokter</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setSelectedDoctor(null);
              setEditDoctor({
                name: '',
                specialization: '',
                phone_number: '',
                email: '',
                status: 'active'
              });
              setScheduleEntries([]);
              setRemovedScheduleIds([]);
              setError('');
              setSuccess('');
            }}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Tambah Dokter
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Dokter</p>
                <p className="text-2xl font-bold">{doctors.length}</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <User size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Dokter Aktif</p>
                <p className="text-2xl font-bold">{doctors.filter(d => d.status === 'active').length}</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Tidak Aktif</p>
                <p className="text-2xl font-bold">{doctors.filter(d => d.status === 'inactive').length}</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <XCircle size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex h-full gap-6">
        {/* Doctor List */}
        <div className="w-1/2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <User className="mr-2 text-blue-500" size={20} />
                Daftar Dokter
              </h2>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Cari dokter..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    // Implementasi pencarian sederhana
                    const searchTerm = e.target.value.toLowerCase();
                    if (searchTerm) {
                      setDoctors(doctors.filter(doc => 
                        doc.name.toLowerCase().includes(searchTerm) || 
                        (doc.specialization && doc.specialization.toLowerCase().includes(searchTerm))
                      ));
                    } else {
                      fetchDoctors(); // Reset ke data asli jika pencarian kosong
                    }
                  }}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              <button 
                className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center ${filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`} 
                onClick={() => setFilter('all')}
              >
                <Filter size={14} className="mr-1.5" />
                Semua
                <span className="ml-1.5 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">{doctors.length}</span>
              </button>
              <button 
                className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center ${filter === 'available' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`} 
                onClick={() => setFilter('available')}
              >
                <CheckCircle size={14} className="mr-1.5" />
                Aktif
                <span className="ml-1.5 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">{doctors.filter(d => d.status === 'active').length}</span>
              </button>
              <button 
                className={`flex-1 py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center ${filter === 'inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`} 
                onClick={() => setFilter('inactive')}
              >
                <XCircle size={14} className="mr-1.5" />
                Non-Aktif
                <span className="ml-1.5 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">{doctors.filter(d => d.status === 'inactive').length}</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-10 text-center text-gray-500 flex flex-col items-center">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <User size={16} className="text-blue-500" />
                </div>
              </div>
              <span className="mt-4 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg animate-pulse">Memuat data dokter...</span>
            </div>
          )}

          {/* Doctor List */}
          <div className="overflow-y-auto max-h-[calc(100vh-24rem)]">
            {!loading && filteredDoctors().length === 0 && (
              <div className="py-10 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <AlertTriangle size={32} className="text-gray-400" />
                  </div>
                  <span className="text-lg font-medium text-gray-600 mb-1">Tidak ada dokter</span>
                  <span className="text-sm text-gray-500">Tidak ada data dokter yang ditemukan</span>
                </div>
              </div>
            )}
            
            {!loading && filteredDoctors().map((doc, index) => (
              <div 
                key={doc.id} 
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors duration-200 ${selectedDoctor?.id === doc.id ? 'bg-blue-50' : ''}`} 
                onClick={() => handleSelectDoctor(doc)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-sm ${doc.status === 'active' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                      {doc.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{doc.name}</div>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <Award size={12} className="mr-1 text-blue-500" />
                        {doc.specialization || 'Spesialisasi tidak tersedia'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className={`text-xs px-2 py-0.5 rounded-full ${doc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {doc.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1.5">
                      <Clock size={12} className="mr-1" />
                      {getNextSchedule(doc.id)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Detail */}
        <div className="w-1/2 bg-white rounded-xl shadow-sm overflow-hidden">
          {editDoctor ? (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-white p-6 border-b border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Stethoscope className="mr-2 text-blue-500" size={20} />
                    {selectedDoctor ? 'Edit Dokter' : 'Tambah Dokter Baru'}
                  </h3>
                  <div className="flex gap-2">
                    {selectedDoctor && (
                      <button 
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center"
                        onClick={handleDelete}
                        disabled={loading}
                      >
                        <Trash2 size={16} className="mr-1.5" />
                        Hapus
                      </button>
                    )}
                    <button 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg transition-colors duration-200 flex items-center shadow-sm"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin mr-2"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-1.5" />
                          Simpan
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Alerts */}
                {(error || success) && (
                  <div className="mb-4">
                    {error && (
                      <div className="flex items-start bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 animate-fade-in">
                        <AlertTriangle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                        <div>{error}</div>
                      </div>
                    )}
                    {success && (
                      <div className="flex items-start bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 animate-fade-in">
                        <CheckCircle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                        <div>{success}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Summary */}
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md ${editDoctor.status === 'inactive' ? 'bg-gradient-to-br from-gray-500 to-gray-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                    {editDoctor.name ? editDoctor.name.charAt(0) : '?'}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-bold text-gray-800">{editDoctor.name || 'Nama Dokter'}</div>
                    <div className="flex items-center text-gray-500 mt-1">
                      <Award size={14} className="mr-1.5 text-blue-500" />
                      {editDoctor.specialization || 'Belum ada spesialisasi'}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editDoctor.phone_number && (
                        <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          <Phone size={12} className="mr-1.5 text-blue-500" />
                          {editDoctor.phone_number}
                        </div>
                      )}
                      {editDoctor.email && (
                        <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          <Mail size={12} className="mr-1.5 text-blue-500" />
                          {editDoctor.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <User className="mr-2 text-blue-500" size={18} />
                    Informasi Dokter
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <User size={16} />
                        </div>
                        <input
                          type="text"
                          value={editDoctor.name ?? ''}
                          onChange={e => handleInputChange('name', e.target.value)}
                          className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Nama lengkap dokter"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spesialisasi</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <Award size={16} />
                        </div>
                        <input
                          type="text"
                          value={editDoctor.specialization ?? ''}
                          onChange={e => handleInputChange('specialization', e.target.value)}
                          className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Spesialisasi dokter"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <Phone size={16} />
                        </div>
                        <input
                          type="text"
                          value={editDoctor.phone_number ?? ''}
                          onChange={e => handleInputChange('phone_number', e.target.value)}
                          className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Nomor telepon"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          <Mail size={16} />
                        </div>
                        <input
                          type="email"
                          value={editDoctor.email ?? ''}
                          onChange={e => handleInputChange('email', e.target.value)}
                          className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Email dokter"
                        />
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="flex space-x-4">
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 flex-1 ${editDoctor.status === 'active' ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-gray-300'}`}>
                          <input
                            type="radio"
                            name="status"
                            value="active"
                            checked={editDoctor.status === 'active'}
                            onChange={() => handleInputChange('status', 'active')}
                            className="mr-2 text-green-600 focus:ring-green-500"
                          />
                          <div className="flex items-center">
                            <CheckCircle size={18} className="mr-2 text-green-600" />
                            <div>
                              <div className="font-medium">Aktif</div>
                              <div className="text-xs text-gray-500">Dokter dapat menerima pasien</div>
                            </div>
                          </div>
                        </label>
                        
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 flex-1 ${editDoctor.status === 'inactive' ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-300'}`}>
                          <input
                            type="radio"
                            name="status"
                            value="inactive"
                            checked={editDoctor.status === 'inactive'}
                            onChange={() => handleInputChange('status', 'inactive')}
                            className="mr-2 text-red-600 focus:ring-red-500"
                          />
                          <div className="flex items-center">
                            <XCircle size={18} className="mr-2 text-red-600" />
                            <div>
                              <div className="font-medium">Non-Aktif</div>
                              <div className="text-xs text-gray-500">Dokter tidak dapat menerima pasien</div>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Calendar className="mr-2 text-blue-500" size={18} />
                      Jadwal Praktik
                    </h4>
                    
                    <button 
                      onClick={addSchedule}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center"
                    >
                      <Plus size={16} className="mr-1.5" />
                      Tambah Jadwal
                    </button>
                  </div>
                  
                  {scheduleEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
                      <Calendar size={36} className="text-gray-400 mb-2" />
                      <p className="text-gray-600 font-medium">Belum ada jadwal</p>
                      <p className="text-gray-500 text-sm mt-1 mb-3">Klik tombol "Tambah Jadwal" untuk menambahkan jadwal praktik dokter</p>
                      <button 
                        onClick={addSchedule}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center shadow-sm mt-2"
                      >
                        <Plus size={16} className="mr-1.5" />
                        Tambah Jadwal Baru
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hari</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mulai</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selesai</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {scheduleEntries.map((schedule, index) => (
                            <tr key={index} className="hover:bg-blue-50 transition-colors duration-150">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <Calendar size={14} />
                                  </div>
                                  <select 
                                    value={schedule.day_of_week ?? ''} 
                                    onChange={e => handleScheduleChange(index, 'day_of_week', e.target.value)}
                                    className="pl-9 w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                                  >
                                    <option value="">-- pilih hari --</option>
                                    <option value="Monday">Senin</option>
                                    <option value="Tuesday">Selasa</option>
                                    <option value="Wednesday">Rabu</option>
                                    <option value="Thursday">Kamis</option>
                                    <option value="Friday">Jumat</option>
                                    <option value="Saturday">Sabtu</option>
                                    <option value="Sunday">Minggu</option>
                                  </select>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <Clock size={14} />
                                  </div>
                                  <input 
                                    type="time" 
                                    value={schedule.start_time ?? ''} 
                                    onChange={e => handleScheduleChange(index, 'start_time', e.target.value)}
                                    className="pl-9 w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <Clock size={14} />
                                  </div>
                                  <input 
                                    type="time" 
                                    value={schedule.end_time ?? ''} 
                                    onChange={e => handleScheduleChange(index, 'end_time', e.target.value)}
                                    className="pl-9 w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <label className="flex items-center space-x-1 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={schedule.is_active}
                                      onChange={e => handleScheduleChange(index, 'is_active', e.target.checked)}
                                      className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Aktif</span>
                                  </label>
                                  <button 
                                    onClick={() => removeSchedule(index)}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-all duration-200 flex items-center"
                                    title="Hapus jadwal"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {scheduleEntries.length > 0 && (
                    <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start">
                      <Info size={16} className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        Jadwal yang ditampilkan akan digunakan untuk menentukan ketersediaan dokter. Pastikan jadwal tidak tumpang tindih dengan dokter lain.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 italic">Pilih dokter untuk melihat atau mengedit data</div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
};

export default Dokter;