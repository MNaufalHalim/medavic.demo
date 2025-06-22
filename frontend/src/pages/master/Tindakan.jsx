import React, { useEffect, useState } from 'react';
import PageTemplate from '../../components/PageTemplate';
import axios from 'axios';
import config from '../../config';
import { Plus, Edit3, Trash2, Save, XCircle, Loader2, FileText, Search, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 8;

const Tindakan = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({ show: false, type: '', message: '' });
  const [modal, setModal] = useState({ show: false, mode: 'add', item: null });
  const [saving, setSaving] = useState(false);
  const [inlineEdit, setInlineEdit] = useState({ id: null, price: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${config.apiUrl}/master/services`, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data.data);
    } catch {
      setNotif({ show: true, type: 'error', message: 'Gagal mengambil data tindakan' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Filtered and paginated data
  const filtered = data.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  const totalData = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalData / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search]);
  const goToPage = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  const handleSave = async (item) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (modal.mode === 'add') {
        await axios.post(`${config.apiUrl}/master/services`, item, { headers: { Authorization: `Bearer ${token}` } });
        setNotif({ show: true, type: 'success', message: 'Tindakan berhasil ditambahkan' });
      } else {
        await axios.put(`${config.apiUrl}/master/services/${item.id}`, item, { headers: { Authorization: `Bearer ${token}` } });
        setNotif({ show: true, type: 'success', message: 'Tindakan berhasil diupdate' });
      }
      setModal({ show: false, mode: 'add', item: null });
      fetchData();
    } catch {
      setNotif({ show: true, type: 'error', message: 'Gagal menyimpan tindakan' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus tindakan ini?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.apiUrl}/master/services/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotif({ show: true, type: 'success', message: 'Tindakan berhasil dihapus' });
      fetchData();
    } catch {
      setNotif({ show: true, type: 'error', message: 'Gagal menghapus tindakan' });
    }
  };

  const handleInlineEdit = (id, price) => {
    setInlineEdit({ id, price });
  };
  const handleInlineSave = async (id) => {
    try {
      const item = data.find(d => d.id === id);
      const token = localStorage.getItem('token');
      await axios.put(`${config.apiUrl}/master/services/${id}`, { ...item, price: inlineEdit.price }, { headers: { Authorization: `Bearer ${token}` } });
      setNotif({ show: true, type: 'success', message: 'Harga berhasil diupdate' });
      setInlineEdit({ id: null, price: '' });
      fetchData();
    } catch {
      setNotif({ show: true, type: 'error', message: 'Gagal update harga' });
    }
  };

  return (
    <PageTemplate>
      {/* Header ala resep-obat.jsx */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-2xl shadow-xl p-6 mb-8 border border-blue-100/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <FileText className="text-white" size={24} />
            </div>
            Manajemen Tindakan
          </h1>
          <p className="mt-2 text-gray-600 font-medium">Kelola data tindakan/layanan beserta harga. Tambah, edit, atau hapus dengan mudah.</p>
        </div>
        <button
          onClick={() => setModal({ show: true, mode: 'add', item: null })}
          className="bg-white/90 hover:bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-lg border border-blue-200 hover:scale-105 hover:border-blue-300"
          aria-label="Tambah tindakan baru"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </div>
          <span className="transition-all duration-300">Tambah Tindakan</span>
        </button>
      </div>

      {/* Filter/Search Bar */}
      <div className="flex flex-wrap gap-4 items-end mb-4 bg-white/80 p-5 rounded-2xl border border-blue-100 shadow-lg transition-all duration-300 hover:shadow-xl animate-fade-in">
        <div className="flex flex-col min-w-[200px] group">
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1 group-focus-within:text-blue-600 transition-colors duration-200">
            <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Search size={12} className="text-white" />
            </div>
            Nama Tindakan
          </label>
          <div className="relative">
            <input
              type="text"
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm bg-white w-full shadow-sm transition-all duration-300 hover:border-blue-300 focus:shadow-lg"
              placeholder="Cari nama tindakan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none transition-colors duration-200 group-focus-within:text-blue-400">
              <Search size={16} />
            </span>
          </div>
        </div>
        <div className="ml-auto text-xs text-gray-500 font-medium animate-fade-in">
          Total: <span className="text-blue-700 font-bold">{totalData}</span> data
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl shadow border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Nama Tindakan</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider">Harga</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-10 text-gray-400">
                  <Loader2 className="animate-spin mx-auto mb-2" /> Memuat data tindakan...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-10 text-gray-400">Tidak ada data yang cocok.</td>
              </tr>
            ) : (
              paginated.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50 transition-all duration-200">
                  <td className="px-6 py-4 font-medium text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-right text-blue-700 font-semibold">
                    {inlineEdit.id === item.id ? (
                      <input
                        type="number"
                        className="border-b-2 border-blue-400 focus:border-blue-600 px-2 py-1 outline-none w-36 rounded bg-blue-50 text-blue-700 font-semibold transition-all"
                        value={inlineEdit.price}
                        onChange={e => setInlineEdit({ id: item.id, price: e.target.value })}
                        onBlur={() => handleInlineSave(item.id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleInlineSave(item.id); }}
                        autoFocus
                      />
                    ) : (
                      <span className="cursor-pointer hover:underline" onClick={() => handleInlineEdit(item.id, item.price)}>
                        {Number(item.price).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setModal({ show: true, mode: 'edit', item })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 shadow-sm mr-2 transition-all duration-200"
                      title="Edit"
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
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
        <div className="text-xs text-gray-500">Halaman <span className="font-bold text-blue-700">{page}</span> dari <span className="font-bold text-blue-700">{totalPages}</span></div>
        <div className="flex gap-1">
          <button onClick={() => goToPage(1)} disabled={page === 1} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-40"><ChevronsLeft size={16} /></button>
          <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-40"><ChevronLeft size={16} /></button>
          <span className="px-2 py-1 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg">{page}</span>
          <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-40"><ChevronRight size={16} /></button>
          <button onClick={() => goToPage(totalPages)} disabled={page === totalPages} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-40"><ChevronsRight size={16} /></button>
        </div>
      </div>

      {/* Notifikasi */}
      <AnimatePresence>
        {notif.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl flex items-center gap-3 shadow-lg ${notif.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}
          >
            {notif.type === 'success' ? <Check size={20} /> : <X size={20} />}
            <span className="font-medium">{notif.message}</span>
            <button onClick={() => setNotif({ show: false })} className="ml-auto text-xl font-bold hover:opacity-70 transition-opacity">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Form */}
      <AnimatePresence>
        {modal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative"
            >
              <button onClick={() => setModal({ show: false, mode: 'add', item: null })} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold">
                <XCircle size={24} />
              </button>
              <h3 className="text-xl font-bold mb-6 text-blue-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText size={18} className="text-white" />
                </div>
                {modal.mode === 'add' ? 'Tambah Tindakan' : 'Edit Tindakan'}
              </h3>
              <form onSubmit={e => { e.preventDefault(); handleSave(modal.item); }}>
                <div className="mb-6">
                  <label className="block mb-1 font-semibold text-blue-700">Nama Tindakan</label>
                  <input
                    type="text"
                    className="w-full border-b-2 border-blue-200 focus:border-blue-600 px-2 py-2 outline-none bg-blue-50 rounded"
                    value={modal.item?.name || ''}
                    onChange={e => setModal(m => ({ ...m, item: { ...m.item, name: e.target.value } }))}
                    required
                  />
                </div>
                <div className="mb-8">
                  <label className="block mb-1 font-semibold text-blue-700">Harga</label>
                  <input
                    type="number"
                    className="w-full border-b-2 border-blue-200 focus:border-blue-600 px-2 py-2 outline-none bg-blue-50 rounded"
                    value={modal.item?.price || ''}
                    onChange={e => setModal(m => ({ ...m, item: { ...m.item, price: e.target.value } }))}
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setModal({ show: false, mode: 'add', item: null })} className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold">Batal</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-700 disabled:opacity-60">
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTemplate>
  );
};

export default Tindakan;