import React, { useEffect, useState } from 'react';
import PageTemplate from '../../components/PageTemplate';
import axios from 'axios';
import config from '../../config';
import { Plus, Edit3, Trash2, Save, XCircle, Loader2, ChevronDown, Filter, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';

const UNIT_OPTIONS = [
  'Strip', 'Botol', 'Ampul', 'Tablet', 'Kapsul', 'Tube', 'Sachet', 'Vial', 'Box', 'Lainnya'
];

const PAGE_SIZE = 8;

const Obat = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', unit: '', price: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter state
  const [filterName, setFilterName] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);

  // Fetch medicines
  const fetchMedicines = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${config.apiUrl}/master/medicines`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data.status === 'success') {
        setMedicines(res.data.data.filter(m => m.delt_flg === 'N'));
      } else {
        setError(res.data.message || 'Gagal memuat data obat');
      }
    } catch {
      setError('Gagal memuat data obat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Modal open for add/edit
  const openModal = (medicine = null) => {
    setError('');
    setSuccess('');
    if (medicine) {
      setForm({ id: medicine.id, name: medicine.name, unit: medicine.unit, price: medicine.price });
      setEditMode(true);
    } else {
      setForm({ id: null, name: '', unit: '', price: '' });
      setEditMode(false);
    }
    setModalOpen(true);
  };

  // Modal close
  const closeModal = () => {
    setModalOpen(false);
    setForm({ id: null, name: '', unit: '', price: '' });
    setError('');
    setSuccess('');
    setEditMode(false);
  };

  // Handle form change
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Save (add/edit)
  const handleSave = async () => {
    if (!form.name.trim() || !form.unit.trim() || !form.price) {
      setError('Nama, satuan, dan harga wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editMode) {
        // Edit
        await axios.put(`${config.apiUrl}/master/medicines/${form.id}`, {
          name: form.name,
          unit: form.unit,
          price: form.price,
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSuccess('Data obat berhasil diperbarui!');
      } else {
        // Add
        await axios.post(`${config.apiUrl}/master/medicines`, {
          name: form.name,
          unit: form.unit,
          price: form.price,
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSuccess('Obat baru berhasil ditambahkan!');
      }
      closeModal();
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data obat');
    } finally {
      setSaving(false);
    }
  };

  // Soft delete
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus obat ini?')) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`${config.apiUrl}/master/medicines/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchMedicines();
    } catch {
      setError('Gagal menghapus data obat');
    } finally {
      setLoading(false);
    }
  };

  // Filtered and paginated data
  const filtered = medicines.filter(med => {
    const matchName = med.name.toLowerCase().includes(filterName.toLowerCase());
    const matchUnit = filterUnit ? med.unit === filterUnit : true;
    const matchMin = filterPriceMin ? Number(med.price) >= Number(filterPriceMin) : true;
    const matchMax = filterPriceMax ? Number(med.price) <= Number(filterPriceMax) : true;
    return matchName && matchUnit && matchMin && matchMax;
  });
  const totalData = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalData / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page if filter changes
  useEffect(() => { setPage(1); }, [filterName, filterUnit, filterPriceMin, filterPriceMax]);

  // Pagination controls
  const goToPage = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  return (
    <PageTemplate>
      {/* Header ala resep-obat.jsx */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-2xl shadow-xl p-6 mb-8 border border-blue-100/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <Filter className="text-white" size={24} />
            </div>
            Manajemen Obat
          </h1>
          <p className="mt-2 text-gray-600 font-medium">Kelola data obat, satuan, harga, dan informasi penting lainnya.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-white/90 hover:bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-lg border border-blue-200 hover:scale-105 hover:border-blue-300"
          aria-label="Tambah obat baru"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </div>
          <span className="transition-all duration-300">Tambah Obat Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 items-end mb-4 bg-white/80 p-5 rounded-2xl border border-sky-100 shadow-lg transition-all duration-300 hover:shadow-xl animate-fade-in">
        <div className="flex flex-col min-w-[180px] group">
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1 group-focus-within:text-blue-600 transition-colors duration-200">
            <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Filter size={12} className="text-white" />
            </div>
            Nama Obat
          </label>
          <div className="relative">
            <input
              type="text"
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm bg-white w-full shadow-sm transition-all duration-300 hover:border-sky-300 focus:shadow-lg"
              placeholder="Cari nama obat..."
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none transition-colors duration-200 group-focus-within:text-sky-400">
              <Filter size={16} />
            </span>
          </div>
        </div>
        <div className="flex flex-col min-w-[150px] group">
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1 group-focus-within:text-blue-600 transition-colors duration-200">
            <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <ChevronDown size={12} className="text-white" />
            </div>
            Satuan
          </label>
          <div className="relative">
            <select
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm bg-white w-full shadow-sm transition-all duration-300 hover:border-sky-300 focus:shadow-lg appearance-none cursor-pointer"
              value={filterUnit}
              onChange={e => setFilterUnit(e.target.value)}
            >
              <option value="">Semua</option>
              {UNIT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none transition-colors duration-200 group-focus-within:text-sky-400">
              <ChevronDown size={16} />
            </span>
          </div>
        </div>
        <div className="flex flex-col min-w-[120px] group">
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1 group-focus-within:text-blue-600 transition-colors duration-200">
            <div className="w-4 h-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
              <Wallet size={12} className="text-white" />
            </div>
            Harga Min
          </label>
          <div className="relative">
            <input
              type="number"
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm bg-white w-full shadow-sm transition-all duration-300 hover:border-sky-300 focus:shadow-lg pr-10"
              placeholder="Rp Min"
              value={filterPriceMin}
              onChange={e => setFilterPriceMin(e.target.value)}
              min={0}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none transition-colors duration-200 group-focus-within:text-sky-400">
              <Wallet size={16} />
            </span>
          </div>
        </div>
        <div className="flex flex-col min-w-[120px] group">
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1 group-focus-within:text-blue-600 transition-colors duration-200">
            <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Wallet size={12} className="text-white" />
            </div>
            Harga Max
          </label>
          <div className="relative">
            <input
              type="number"
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-sm bg-white w-full shadow-sm transition-all duration-300 hover:border-sky-300 focus:shadow-lg pr-10"
              placeholder="Rp Max"
              value={filterPriceMax}
              onChange={e => setFilterPriceMax(e.target.value)}
              min={0}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none transition-colors duration-200 group-focus-within:text-sky-400">
              <Wallet size={16} />
            </span>
          </div>
        </div>
        <div className="ml-auto text-xs text-gray-500 font-medium animate-fade-in">
          Total: <span className="text-sky-700 font-bold">{totalData}</span> data
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl shadow border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-sky-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-sky-700 uppercase tracking-wider">Nama Obat</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-sky-700 uppercase tracking-wider">Satuan</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-sky-700 uppercase tracking-wider">Harga</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-sky-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-400">
                  <Loader2 className="animate-spin mx-auto mb-2" /> Memuat data obat...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-400">Tidak ada data yang cocok.</td>
              </tr>
            ) : (
              paginated.map((med) => (
                <tr key={med.id} className="hover:bg-sky-50 transition-all duration-200">
                  <td className="px-6 py-4 font-medium text-gray-800">{med.name}</td>
                  <td className="px-6 py-4 text-gray-600">{med.unit}</td>
                  <td className="px-6 py-4 text-right text-gray-700">Rp {Number(med.price).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => openModal(med)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 shadow-sm mr-2 transition-all duration-200"
                      title="Edit"
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(med.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 shadow-sm transition-all duration-200"
                      title="Hapus"
                    >
                      <Trash2 size={16} /> Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-gray-500">Halaman <span className="font-bold text-sky-700">{page}</span> dari <span className="font-bold text-sky-700">{totalPages}</span></div>
        <div className="flex gap-1">
          <button onClick={() => goToPage(1)} disabled={page === 1} className="p-2 rounded-lg text-sky-600 hover:bg-sky-50 disabled:opacity-40"><ChevronsLeft size={16} /></button>
          <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="p-2 rounded-lg text-sky-600 hover:bg-sky-50 disabled:opacity-40"><ChevronLeft size={16} /></button>
          <span className="px-2 py-1 text-sm font-semibold text-sky-700 bg-sky-50 rounded-lg">{page}</span>
          <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="p-2 rounded-lg text-sky-600 hover:bg-sky-50 disabled:opacity-40"><ChevronRight size={16} /></button>
          <button onClick={() => goToPage(totalPages)} disabled={page === totalPages} className="p-2 rounded-lg text-sky-600 hover:bg-sky-50 disabled:opacity-40"><ChevronsRight size={16} /></button>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-bold text-blue-700 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                {editMode ? <Edit3 size={18} className="text-white" /> : <Plus size={18} className="text-white" />}
              </div>
              {editMode ? 'Edit Obat' : 'Tambah Obat'}
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Obat <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300"
                  placeholder="Masukkan nama obat"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Satuan <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300 appearance-none cursor-pointer"
                    value={form.unit}
                    onChange={e => handleChange('unit', e.target.value)}
                    required
                  >
                    <option value="">Pilih satuan</option>
                    {UNIT_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown size={18} className="text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300 pr-12"
                    placeholder="Masukkan harga"
                    value={form.price}
                    onChange={e => handleChange('price', e.target.value)}
                    min={0}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">Rp</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={closeModal}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-300 flex items-center gap-2 text-sm border border-gray-300 hover:scale-105"
                disabled={saving}
              >
                <div className="w-4 h-4 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                  <XCircle size={12} className="text-white" />
                </div>
                Batal
              </button>
              <button
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed hover:scale-105"
                disabled={saving}
              >
                {saving ? (
                  <div className="w-4 h-4 bg-white/20 rounded-lg flex items-center justify-center">
                    <Loader2 size={12} className="animate-spin text-white" />
                  </div>
                ) : (
                  <div className="w-4 h-4 bg-white/20 rounded-lg flex items-center justify-center">
                    <Save size={12} className="text-white" />
                  </div>
                )}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
};

export default Obat;