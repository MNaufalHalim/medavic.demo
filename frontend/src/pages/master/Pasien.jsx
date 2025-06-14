import React, { useState, useEffect } from 'react';
import PageTemplate from '../../components/PageTemplate';
import axios from 'axios';
import config from '../../config';
import { User, Clipboard, CheckCircle, XCircle, Mail, Phone, Calendar, MapPin, ChevronRight, Edit, X, AlertCircle, Search, Printer, History, Loader2 } from 'lucide-react';

const Pasien = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [visitHistory, setVisitHistory] = useState([]);
  const [editMessage, setEditMessage] = useState(null);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${config.apiUrl}/master/patients`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data.status === 'success') {
        setPatients(res.data.data || []);
      } else {
        setError(res.data.message || 'Gagal memuat data pasien');
      }
    } catch {
      setError('Gagal memuat data pasien');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitHistory = async (no_rm) => {
    try {
      const res = await axios.get(`${config.apiUrl}/medical/patients/${no_rm}/visits`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) setVisitHistory(res.data.data || []);
    } catch {}
  };

  const openModal = (patient) => {
    setSelected(patient);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
    setActiveTab(null);
  };

  const closeExtendPanel = () => setActiveTab(null);

  // Filtered patients
  const filteredPatients = patients.filter(p =>
    p.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    p.no_rm.toLowerCase().includes(search.toLowerCase())
  );

  // Fungsi handle edit pasien
  const handleEditPatient = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMessage(null);
    setEditError(null);
    try {
      const form = e.target;
      const payload = {
        nama_lengkap: form.nama_lengkap.value,
        email: form.email.value,
        phone_number: form.phone_number.value,
        tanggal_lahir: form.birth_date.value,
        jenis_kelamin: form.gender.value,
        alamat: form.address.value,
        nik: form.nik.value
      };
      const res = await axios.put(`${config.apiUrl}/master/patients/${selected.no_rm}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchPatients();
      setEditMessage(res.data.message || 'Data pasien berhasil diupdate');
      setEditMode(false);
      setTimeout(() => {
        setEditMessage(null);
        setModalOpen(false);
      }, 1500);
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Gagal update pasien');
      setTimeout(() => setEditError(null), 2500);
    }
    setEditLoading(false);
  };

  // useEffect untuk fetch history saat tab history dibuka
  useEffect(() => {
    if (activeTab === 'history' && selected) {
      fetchVisitHistory(selected.no_rm);
    }
  }, [activeTab, selected]);

  return (
    <PageTemplate>
      {/* Header modern ala RawatJalan/InputRM */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-500 to-blue-600 rounded-2xl shadow-lg p-8 mb-8 flex flex-col md:flex-row md:items-center md:justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-4">
            <User size={36} className="text-white drop-shadow" />
            Data Pasien
          </h1>
          <p className="text-blue-100/90 mt-2 text-lg">Kelola data pasien dengan mudah dan cepat</p>
        </div>
        <div className="mt-6 md:mt-0 flex items-center gap-3">
          <div className="relative group">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400 group-focus-within:text-sky-600 transition-colors duration-200" />
            <input
              type="text"
              className="pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm bg-white w-64 shadow-sm transition-all duration-300 hover:border-sky-300"
              placeholder="Cari nama atau No RM..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Daftar pasien dalam bentuk tabel modern */}
      <div className="overflow-x-auto rounded-xl shadow border border-gray-200 bg-white animate-fade-in">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-sky-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-sky-700 uppercase tracking-wider">Nama & No RM</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-sky-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-sky-700 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-sky-700 uppercase tracking-wider">Telepon</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-sky-700 uppercase tracking-wider">Gender</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">Memuat data pasien...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-red-500">{error}</td>
              </tr>
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">Tidak ada pasien ditemukan.</td>
              </tr>
            ) : (
              filteredPatients.map((p, idx) => (
                <tr key={p.no_rm} className="hover:bg-sky-50 transition-all duration-200">
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="font-bold text-gray-800 text-base flex items-center gap-2">
                      <User size={16} className="text-sky-500" /> {p.nama_lengkap}
                    </div>
                    <button
                      onClick={() => openModal(p)}
                      className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg text-xs font-semibold border border-sky-200 shadow-sm transition-all duration-200"
                      title="Lihat detail pasien"
                    >
                      <Clipboard size={13} className="text-sky-400" /> {p.no_rm}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{p.email || <span className='italic text-gray-400'>-</span>}</td>
                  <td className="px-6 py-4 text-gray-700">{p.phone_number || <span className='italic text-gray-400'>-</span>}</td>
                  <td className="px-6 py-4 text-gray-700">{p.gender || <span className='italic text-gray-400'>-</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Pasien */}
      {modalOpen && selected && (
        <>
          {/* Overlay gelap dengan animasi fade-in */}
          <div className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 animate-fade-in" onClick={closeModal}></div>
          {/* Right sheet modal dengan animasi slide-in */}
          <div className="fixed inset-y-0 right-0 z-50 flex items-stretch justify-end pointer-events-none p-5">
            <div className="bg-white border-l border-gray-100 rounded-xl shadow-2xl w-full max-w-full h-full flex flex-row pointer-events-auto animate-slide-in-right transition-all duration-500 relative overflow-y-auto">
              {/* Sidebar Sticky */}
              <div className="sticky top-0 self-start h-full flex flex-col items-center bg-gradient-to-b from-sky-50 to-white rounded-l-xl border-r border-gray-100 shadow-sm min-w-[70px] z-20 py-10 px-2">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`mb-2 flex flex-col items-center gap-1 ${activeTab==='history' ? 'text-indigo-800 bg-indigo-100' : 'text-indigo-600'} hover:text-indigo-800 transition-colors text-xs font-semibold py-2 px-2 rounded-lg hover:bg-indigo-100 focus:bg-indigo-200 focus:outline-none w-14`}
                  title="History Kunjungan"
                >
                  <History size={22} />
                  History
                </button>
                <button
                  onClick={() => setActiveTab('cetak')}
                  className={`flex flex-col items-center gap-1 ${activeTab==='cetak' ? 'text-gray-700 bg-gray-100' : 'text-gray-500'} hover:text-gray-700 transition-colors text-xs font-semibold py-2 px-2 rounded-lg hover:bg-gray-100 focus:bg-gray-200 focus:outline-none w-14`}
                  title="Cetak Data Pasien"
                >
                  <Printer size={22} />
                  Cetak
                </button>
              </div>
              {/* Panel Konten History/Cetak */}
              {activeTab && (
                <div className="h-full flex flex-col bg-white/70 backdrop-blur-xl rounded-r-xl shadow-xl w-[370px] max-w-full animate-slide-in-left transition-all duration-500 relative overflow-y-auto scrollbar-thin scrollbar-thumb-sky-100 scrollbar-track-transparent z-10">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-sky-50/80 to-white/80">
                    <div className="font-bold text-lg text-sky-700 flex items-center gap-2">
                      {activeTab==='edit' && (<><Edit size={22} className="text-sky-500 drop-shadow"/> Edit Pasien</>)}
                      {activeTab==='history' && (<><History size={22} className="text-indigo-500 drop-shadow"/> History Kunjungan</>)}
                      {activeTab==='cetak' && (<><Printer size={22} className="text-blue-500 drop-shadow"/> Cetak Data</>)}
                    </div>
                    <button onClick={closeExtendPanel} className="text-gray-400 hover:text-red-500 transition-colors bg-gray-100 hover:bg-red-100 rounded-full p-1 ml-2">
                      <X size={20}/>
                    </button>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-sky-100 scrollbar-track-transparent relative">
                    {/* Loader overlay untuk panel extend */}
                    {activeTab==='edit' && editLoading && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl animate-fade-in">
                        <Loader2 className="animate-spin text-sky-500" size={38} />
                      </div>
                    )}
                    {/* Form edit modern tetap seperti sebelumnya */}
                    {activeTab==='edit' && (
                      <form className="rounded-2xl bg-white/90 shadow-lg border border-sky-100 p-6 relative" onSubmit={handleEditPatient}>
                        {editMessage && (
                          <div className="mb-4 px-4 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-semibold text-center animate-fade-in">{editMessage}</div>
                        )}
                        {editError && (
                          <div className="mb-4 px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold text-center animate-fade-in">{editError}</div>
                        )}
                        <div className="flex flex-col items-center mb-8 mt-2">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg mb-2">
                            <Edit size={28} className="text-white drop-shadow" />
                          </div>
                          <div className="text-xl font-extrabold text-sky-700 tracking-tight mb-1">Edit Data Pasien</div>
                          <div className="text-xs text-gray-400">Perbarui data diri pasien dengan mudah dan cepat</div>
                        </div>
                        <div className="grid grid-cols-1 gap-5">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1" htmlFor="nama_lengkap"><User size={15} className="text-sky-400"/> Nama Lengkap</label>
                            <input id="nama_lengkap" name="nama_lengkap" type="text" defaultValue={selected.nama_lengkap} required className="mt-1 w-full rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 px-4 py-2 text-sm shadow-sm bg-white transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.15)]" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1" htmlFor="email"><Mail size={15} className="text-indigo-400"/> Email</label>
                            <input id="email" name="email" type="email" defaultValue={selected.email} required className="mt-1 w-full rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 px-4 py-2 text-sm shadow-sm bg-white transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1" htmlFor="phone_number"><Phone size={15} className="text-indigo-400"/> Telepon</label>
                            <input id="phone_number" name="phone_number" type="text" defaultValue={selected.phone_number} required className="mt-1 w-full rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 px-4 py-2 text-sm shadow-sm bg-white transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1" htmlFor="birth_date"><Calendar size={15} className="text-indigo-400"/> Tanggal Lahir</label>
                            <input id="birth_date" name="birth_date" type="date" defaultValue={selected.birth_date ? selected.birth_date.split('T')[0] : ''} required className="mt-1 w-full rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 px-4 py-2 text-sm shadow-sm bg-white transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1" htmlFor="gender"><User size={15} className="text-indigo-400"/> Gender</label>
                            <select id="gender" name="gender" defaultValue={selected.gender === 'Laki-laki' ? 'L' : selected.gender === 'Perempuan' ? 'P' : ''} required className="mt-1 w-full rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 px-4 py-2 text-sm shadow-sm bg-white transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]">
                              <option value="">Pilih Gender</option>
                              <option value="L">Laki-laki</option>
                              <option value="P">Perempuan</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1" htmlFor="address"><MapPin size={15} className="text-indigo-400"/> Alamat</label>
                            <input id="address" name="address" type="text" defaultValue={selected.address} className="mt-1 w-full rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 px-4 py-2 text-sm shadow-sm bg-white transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1" htmlFor="nik"><Clipboard size={15} className="text-sky-400"/> NIK</label>
                            <input id="nik" name="nik" type="text" defaultValue={selected.nik} className="mt-1 w-full rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 px-4 py-2 text-sm shadow-sm bg-white transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.15)]" />
                          </div>
                        </div>
                        <div className="flex gap-3 mt-10 justify-end">
                          <button type="button" onClick={closeExtendPanel} className="px-5 py-2 rounded-xl border border-sky-200 text-sky-600 font-semibold shadow-sm transition-all duration-200 flex items-center gap-2 hover:bg-sky-50 hover:border-sky-400">
                            <X size={16}/> Batal
                          </button>
                          <button type="submit" disabled={editLoading} className="px-7 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105">
                            {editLoading ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>} Simpan
                          </button>
                        </div>
                      </form>
                    )}
                    {activeTab==='history' && (
                      <div className="relative bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm animate-fade-in">
                        <div className="absolute left-7 top-14 bottom-5 w-1 bg-gradient-to-b from-blue-400 to-blue-100 rounded-full"></div>
                        {visitHistory && visitHistory.length > 0 ? visitHistory.map((visit, index) => (
                          <div key={visit.visit_id} className="relative pl-8 mb-6 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className={`absolute left-0 w-5 h-5 rounded-full flex items-center justify-center ${index === 0 ? 'bg-blue-500 animate-pulse shadow-md' : 'bg-gray-200'}`}>{index === 0 && <div className="w-2 h-2 bg-white rounded-full"></div>}</div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                              <div className="flex items-baseline mb-2 gap-2 flex-wrap">
                                <div className="text-sm font-medium text-blue-500">{visit.visit_date ? new Date(visit.visit_date).toLocaleString('id-ID', { month: 'short' }) : ''}</div>
                                <div className="text-xl font-bold text-gray-800">{visit.visit_date ? new Date(visit.visit_date).getDate() : ''}</div>
                                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{visit.visit_date ? (visit.visit_date.split('T')[1]?.slice(0,5) || '-') : '-'}</div>
                              </div>
                              <div className="font-medium text-gray-800 flex items-center">
                                <span className="mr-1 text-blue-500"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18V6a6 6 0 1 1 12 0v12"/><path d="M6 18a6 6 0 0 0 12 0"/></svg></span>
                                {visit.doctor_name || <span className='italic text-gray-400'>-</span>}
                              </div>
                              {visit.doctor_specialty && (<div className="text-xs text-gray-500 mt-1">{visit.doctor_specialty}</div>)}
                              <div className="mt-3 bg-gradient-to-r from-blue-50 to-white p-3 rounded-lg border border-blue-100 text-sm text-gray-600">
                                <div className="font-medium text-gray-700 flex items-center mb-1">
                                  <span className="mr-1 text-blue-500"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12h6"/><path d="M12 9v6"/><circle cx="12" cy="12" r="10"/></svg></span>
                                  Keluhan:
                                </div>
                                {visit.complaint || visit.notes || <span className='italic text-gray-400'>Tidak ada catatan</span>}
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8 text-gray-500 animate-fade-in">
                            <svg className="mx-auto mb-3 text-gray-300" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            <div>Tidak ada riwayat kunjungan</div>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab==='cetak' && (
                      <div className="text-gray-500 text-sm italic">Preview/cetak data pasien di sini...</div>
                    )}
                  </div>
                </div>
              )}
              {/* Konten Utama Modal */}
              <div className="flex-1 min-w-0 w-[500px] max-w-[600px]">
                {/* Section: No RM */}
                <div className="flex items-center justify-between px-8 pt-10 pb-3 border-b border-blue-50 bg-gradient-to-r from-white via-blue-50 to-white rounded-tl-3xl relative transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-blue-400 font-semibold uppercase tracking-widest">No. Rekam Medis</span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono text-base font-semibold shadow-sm">
                      <Clipboard size={14} className="text-blue-400" /> {selected.no_rm}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!editMode && (
                      <button onClick={()=>setActiveTab('edit')} className="p-2 rounded-full bg-white hover:bg-blue-100 text-blue-500 hover:text-blue-700 shadow-sm transition-all duration-150">
                        <Edit size={16}/>
                      </button>
                    )}
                    <button onClick={closeModal} className="p-2 rounded-full bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 shadow-sm transition-all duration-150 ml-1">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                {/* Penanda Edit Mode di bawah No RM, di atas nama */}
                {editMode && (
                  <div className="flex justify-center mt-2 mb-2 animate-fade-in">
                    <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold shadow border-2 border-blue-300">
                      <Edit size={14} className="text-blue-400" /> Edit Mode
                    </span>
                  </div>
                )}
                {/* Section: Nama, Avatar, dan Umur */}
                <div className={`flex items-center gap-5 px-8 pt-6 pb-2 transition-colors duration-300` + (editMode ? ' bg-blue-50' : '')}>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-indigo-300 text-blue-700 flex items-center justify-center text-3xl font-bold shadow-md">
                    {selected.nama_lengkap?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    {!editMode ? (
                      <div className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                        {selected.nama_lengkap}
                      </div>
                    ) : (
                      <input id="nama_lengkap" name="nama_lengkap" type="text" defaultValue={selected.nama_lengkap} required className="text-2xl font-bold text-blue-900 tracking-tight px-2 py-1 rounded bg-blue-50 border-0 border-b-2 border-b-blue-400 focus:border-b-blue-600 focus:ring-0 w-full max-w-xs outline-none transition-colors duration-200" />
                    )}
                    {/* Umur otomatis */}
                    <div className="text-xs text-blue-400 mt-1">{selected.birth_date ? `${Math.max(0, Math.floor((new Date() - new Date(selected.birth_date)) / (365.25*24*60*60*1000)))} tahun` : '-'}</div>
                  </div>
                </div>
                {/* Section: Info Grid */}
                <form id="edit-pasien-form" onSubmit={handleEditPatient}>
                  <div className={`px-8 pt-4 pb-10 transition-all duration-300` + (editMode ? ' bg-blue-50' : '')}>
                    <div className={`rounded-2xl shadow p-7 grid grid-cols-1 gap-y-4 transition-all duration-300` + (editMode ? ' border-2 border-blue-400 bg-white' : ' bg-blue-50') }>
                      {/* NIK */}
                      <div className={`flex items-center justify-between gap-4 py-2 px-3 rounded-lg transition-colors duration-200` + (editMode ? ' bg-blue-50 border border-blue-100' : ' bg-white/90') }>
                        <span className="flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase tracking-widest"><Clipboard size={13} className="text-blue-300" /> NIK</span>
                        {!editMode ? (
                          <span className="text-blue-700 font-mono text-sm">{selected.nik || <span className='italic text-blue-300'>-</span>}</span>
                        ) : (
                          <div className="relative w-full max-w-xs flex items-center">
                            <Clipboard size={15} className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-300" />
                            <input id="nik" name="nik" type="text" defaultValue={selected.nik} placeholder="NIK" className="pl-8 pr-2 py-1 rounded bg-blue-50 border-0 border-b-2 border-b-blue-400 focus:border-b-blue-600 focus:ring-0 text-sm w-full outline-none text-right text-blue-900 placeholder:text-blue-200 transition-all duration-200" />
                          </div>
                        )}
                      </div>
                      {/* Tanggal Lahir */}
                      <div className={`flex items-center justify-between gap-4 py-2 px-3 rounded-lg transition-colors duration-200` + (editMode ? ' bg-blue-50 border border-blue-100' : ' bg-white/90') }>
                        <span className="flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase tracking-widest"><Calendar size={13} className="text-indigo-300" /> Tanggal Lahir</span>
                        {!editMode ? (
                          <span className="text-blue-700 text-sm">{selected.birth_date ? selected.birth_date.split('T')[0] : <span className='italic text-blue-300'>-</span>}</span>
                        ) : (
                          <div className="relative w-full max-w-xs flex items-center">
                            <Calendar size={15} className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-300" />
                            <input id="birth_date" name="birth_date" type="date" defaultValue={selected.birth_date ? selected.birth_date.split('T')[0] : ''} required className="pl-8 pr-2 py-1 rounded bg-blue-50 border-0 border-b-2 border-b-blue-400 focus:border-b-blue-600 focus:ring-0 text-sm w-full outline-none text-right text-blue-900 placeholder:text-blue-200 transition-all duration-200" />
                          </div>
                        )}
                      </div>
                      {/* Email */}
                      <div className={`flex items-center justify-between gap-4 py-2 px-3 rounded-lg transition-colors duration-200` + (editMode ? ' bg-blue-50 border border-blue-100' : ' bg-white/90') }>
                        <span className="flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase tracking-widest"><Mail size={13} className="text-indigo-300" /> Email</span>
                        {!editMode ? (
                          <span className="text-gray-700 text-sm">{selected.email || <span className='italic text-blue-300'>-</span>}</span>
                        ) : (
                          <div className="relative w-full max-w-xs flex items-center">
                            <Mail size={15} className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-300" />
                            <input id="email" name="email" type="email" defaultValue={selected.email} placeholder="Email" required className="pl-8 pr-2 py-1 rounded bg-white border-0 border-b-2 border-b-blue-100 focus:border-b-blue-500 focus:ring-0 text-sm w-full outline-none text-right text-blue-900 placeholder:text-blue-200 transition-all duration-200" />
                          </div>
                        )}
                      </div>
                      {/* Telepon */}
                      <div className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-white/90">
                        <span className="flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase tracking-widest"><Phone size={13} className="text-indigo-300" /> Telepon</span>
                        {!editMode ? (
                          <span className="text-gray-700 text-sm">{selected.phone_number || <span className='italic text-blue-300'>-</span>}</span>
                        ) : (
                          <div className="relative w-full max-w-xs flex items-center">
                            <Phone size={15} className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-300" />
                            <input id="phone_number" name="phone_number" type="text" defaultValue={selected.phone_number} placeholder="Telepon" required className="pl-8 pr-2 py-1 rounded bg-white border-0 border-b-2 border-b-blue-100 focus:border-b-blue-500 focus:ring-0 text-sm w-full outline-none text-right text-blue-900 placeholder:text-blue-200 transition-all duration-200" />
                          </div>
                        )}
                      </div>
                      {/* Gender */}
                      <div className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-white/90">
                        <span className="flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase tracking-widest"><User size={13} className="text-indigo-300" /> Gender</span>
                        {!editMode ? (
                          <span className="text-gray-700 text-sm">{selected.gender || <span className='italic text-blue-300'>-</span>}</span>
                        ) : (
                          <div className="relative w-full max-w-xs flex items-center">
                            <User size={15} className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-300" />
                            <select id="gender" name="gender" defaultValue={selected.gender === 'Laki-laki' ? 'L' : selected.gender === 'Perempuan' ? 'P' : ''} required className="pl-8 pr-2 py-1 rounded bg-white border-0 border-b-2 border-b-blue-100 focus:border-b-blue-500 focus:ring-0 text-sm w-full outline-none text-right text-blue-900 transition-all duration-200">
                              <option value="">Pilih Gender</option>
                              <option value="L">Laki-laki</option>
                              <option value="P">Perempuan</option>
                            </select>
                          </div>
                        )}
                      </div>
                      {/* Alamat */}
                      <div className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-white/90">
                        <span className="flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase tracking-widest"><MapPin size={13} className="text-indigo-300" /> Alamat</span>
                        {!editMode ? (
                          <span className="text-gray-700 text-sm">{selected.address || <span className='italic text-blue-300'>-</span>}</span>
                        ) : (
                          <div className="relative w-full max-w-xs flex items-center">
                            <MapPin size={15} className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-300" />
                            <input id="address" name="address" type="text" defaultValue={selected.address} placeholder="Alamat" className="pl-8 pr-2 py-1 rounded bg-white border-0 border-b-2 border-b-blue-100 focus:border-b-blue-500 focus:ring-0 text-sm w-full outline-none text-right text-blue-900 placeholder:text-blue-200 transition-all duration-200" />
                          </div>
                        )}
                      </div>
                      {/* Medical Note */}
                      {selected.medical_note && (
                        <div className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-white/90 md:col-span-2">
                          <span className="flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase tracking-widest"><AlertCircle size={13} className="text-blue-300" /> Catatan Medis</span>
                          {!editMode ? (
                            <span className="text-blue-900 text-sm">{selected.medical_note}</span>
                          ) : (
                            <div className="relative w-full max-w-xs flex items-center">
                              <AlertCircle size={15} className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-300" />
                              <input id="medical_note" name="medical_note" type="text" defaultValue={selected.medical_note} placeholder="Catatan Medis" className="pl-8 pr-2 py-1 rounded bg-white border-0 border-b-2 border-b-blue-100 focus:border-b-blue-500 focus:ring-0 text-sm w-full outline-none text-right text-blue-900 placeholder:text-blue-200 transition-all duration-200" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Tombol konfirmasi edit & cancel di bawah, kanan */}
                    {editMode && (
                      <div className="flex gap-3 justify-end mt-10">
                        <button type="button" onClick={()=>setEditMode(false)} className="px-7 py-2 rounded-xl border border-blue-100 bg-white hover:bg-blue-50 text-blue-700 font-semibold shadow-sm transition-all flex items-center gap-2 text-base">
                          <X size={18}/> Batal
                        </button>
                        <button type="submit" disabled={editLoading} className="px-8 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold shadow-lg transition-all flex items-center gap-2 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                          {editLoading ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>} Simpan
                        </button>
                      </div>
                    )}
                  </div>
                  {editLoading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl animate-fade-in">
                      <Loader2 className="animate-spin text-blue-400" size={22} />
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </PageTemplate>
  );
};

export default Pasien;