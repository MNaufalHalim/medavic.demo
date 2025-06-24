import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';
import { 
  Shield, Save, Plus, X, Trash2, ChevronDown, ChevronRight, 
  Settings, Users, ClipboardList, FileText, Home, User, 
  Stethoscope, Pill, Activity, Bell, BarChart2, CreditCard, 
  Calendar, FilePlus, FileCheck, FileSearch, FileClock, Check, 
  AlertCircle, Edit2, Eye, PlusCircle, Pencil, Trash, Lock, 
  LockOpen, Info, HelpCircle, Search, Filter, RefreshCw, Menu
} from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';

const RoleManagement = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [privileges, setPrivileges] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [roleForm, setRoleForm] = useState({ role_name: '', description: '' });
  const [expandedMenus, setExpandedMenus] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.role_id) {
      navigate('/login');
      return;
    }
    setIsLoading(true);
    fetchRolesAndMenus();
  }, []);

  const fetchRolesAndMenus = async () => {
    try {
      const token = localStorage.getItem('token');
      const [rolesRes, menusRes] = await Promise.all([
        axios.get(apiUrl('roles'), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(apiUrl('menus'), {  // Changed from /menu to /menus
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setRoles(rolesRes.data.data);
      setMenus(menusRes.data.data);
      
      // Initialize expanded state for parent menus
      const expanded = {};
      menusRes.data.data.forEach(menu => {
        if (!menu.parent_id) {
          expanded[menu.id] = true; // Start with parent menus expanded
        }
      });
      setExpandedMenus(expanded);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  const fetchPrivileges = async (roleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(apiUrl(`roles/${roleId}/privilege`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Convert array to object for easier handling
      const privilegeObj = {};
      response.data.data.forEach(priv => {
        privilegeObj[priv.menu_id] = {
          can_view: priv.can_view === 1,
          can_create: priv.can_create === 1,
          can_edit: priv.can_edit === 1,
          can_delete: priv.can_delete === 1,
          can_access: priv.can_access === 1
        };
      });
      setPrivileges(privilegeObj);
    } catch (error) {
      console.error('Error fetching privileges:', error);
    }
  };

  const handleRoleSelect = (role) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Continue anyway?')) return;
    }
    setSelectedRole(role);
    fetchPrivileges(role.id);
    setHasChanges(false);
  };

  const handlePrivilegeChange = (menuId, privilege) => {
    setPrivileges(prev => ({
      ...prev,
      [menuId]: {
        ...(prev[menuId] || {}),
        [privilege]: !(prev[menuId]?.[privilege] || false)
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const privilegeArray = Object.entries(privileges).map(([menuId, privs]) => ({
        menu_id: parseInt(menuId),
        can_view: privs.can_view ? 1 : 0,
        can_create: privs.can_create ? 1 : 0,
        can_edit: privs.can_edit ? 1 : 0,
        can_delete: privs.can_delete ? 1 : 0,
        can_access: privs.can_access ? 1 : 0
      }));

      await axios.post(
        apiUrl(`roles/${selectedRole.id}/privilege`),
        { privileges: privilegeArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasChanges(false);
      alert('Privileges saved successfully');
    } catch (error) {
      console.error('Error saving privileges:', error);
      alert('Error saving privileges');
    }
  };

  const handleSaveRole = async () => {
    try {
      const token = localStorage.getItem('token');
      if (modalMode === 'create') {
        await axios.post(apiUrl('roles'), roleForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.put(apiUrl(`roles/${selectedRole.id}`), roleForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchRolesAndMenus();
      setShowModal(false);
      setRoleForm({ role_name: '', description: '' });
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error saving role');
    }
  };

  const handleDeleteRole = async (e, role) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(apiUrl(`roles/${role.id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRolesAndMenus();
      if (selectedRole?.id === role.id) {
        setSelectedRole(null);
        setPrivileges({});
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Error deleting role');
    }
  };

  // Group menus by parent for hierarchical display
  const menuGroups = {};
  menus.forEach(menu => {
    const parentId = menu.parent_id || 'root';
    if (!menuGroups[parentId]) {
      menuGroups[parentId] = [];
    }
    menuGroups[parentId].push(menu);
  });

  // Check if a menu has children
  const hasChildren = (menuId) => {
    return menus.some(menu => menu.parent_id === menuId);
  };
  
  // Toggle expanded state for a menu
  const toggleMenuExpanded = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };
  
  // Filter menus based on search query
  const filteredMenus = searchQuery
    ? menus.filter(menu => 
        menu.menu_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : menus;
    
  // Get parent menus (those without parent_id)
  const parentMenus = menus.filter(menu => !menu.parent_id);
  
  // Get child menus for a specific parent
  const getChildMenus = (parentId) => {
    return menus.filter(menu => menu.parent_id === parentId);
  };

  // Get appropriate icon for menu
  const getMenuIcon = (menuName, isSmall = false) => {
    const size = isSmall ? 14 : 18;
    const menuIcons = {
      'Dashboard': <Home size={size} />,
      'Pasien': <User size={size} />,
      'Dokter': <Stethoscope size={size} />,
      'Apotek': <Pill size={size} />,
      'Pembayaran': <CreditCard size={size} />,
      'Rekam Medis': <FileText size={size} />,
      'Jadwal': <Calendar size={size} />,
      'Laporan': <BarChart2 size={size} />,
      'Pengguna': <Users size={size} />,
      'Role': <Shield size={size} />,
      'Pengaturan': <Settings size={size} />,
      'Notifikasi': <Bell size={size} />,
      'Aktivitas': <Activity size={size} />,
      'Pendaftaran Pasien': <FilePlus size={size} />,
      'Kunjungan': <FileCheck size={size} />,
      'Input Rekam Medis': <FileSearch size={size} />,
      'Riwayat': <FileClock size={size} />,
    };
    return menuIcons[menuName] || <ClipboardList size={size} />;
  };

  // Get translated privilege label
  const getPrivilegeLabel = (privilege) => {
    const labels = {
      'view': 'Lihat',
      'create': 'Buat',
      'edit': 'Edit',
      'delete': 'Hapus',
      'access': 'Akses',
    };
    return labels[privilege] || privilege;
  };

  // Komponen TreeMenu untuk menampilkan menu dan sub-menu secara tree minimalis
  const TreeMenu = ({ menus, privileges, onPrivilegeChange, expandedMenus, toggleMenuExpanded, getMenuIcon, getPrivilegeLabel, searchQuery }) => {
    // Group parent & children
    const parentMenus = menus.filter(menu => !menu.parent_id);
    const getChildMenus = (parentId) => menus.filter(menu => menu.parent_id === parentId);

    // Jika ada search, filter parent & child agar parent tetap tampil jika ada child yang cocok
    const filterMenuTree = (parent) => {
      if (!searchQuery) return true;
      const childMenus = getChildMenus(parent.id);
      // Cek parent cocok
      if (parent.menu_name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
      // Cek ada child yang cocok
      return childMenus.some(child => child.menu_name.toLowerCase().includes(searchQuery.toLowerCase()));
    };
    const filterChild = (child) => {
      if (!searchQuery) return true;
      return child.menu_name.toLowerCase().includes(searchQuery.toLowerCase());
    };

    return (
      <div className="space-y-1">
        {parentMenus.filter(filterMenuTree).map(parent => (
          <div key={parent.id}>
            <div className="flex items-center group px-2 py-2 rounded hover:bg-blue-50 transition cursor-pointer" onClick={() => toggleMenuExpanded(parent.id)}>
              <span className="mr-2 text-gray-400 group-hover:text-blue-500 transition">
                {expandedMenus[parent.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
              <span className="mr-2 text-blue-600">
                {getMenuIcon(parent.menu_name, true)}
              </span>
              <span className="font-medium text-gray-800 flex-1">{parent.menu_name}</span>
              {/* Privilege: view & access */}
              <div className="flex gap-1 ml-2">
                {['view', 'access'].map(priv => (
                  <button
                    key={priv}
                    onClick={e => { e.stopPropagation(); onPrivilegeChange(parent.id, `can_${priv}`); }}
                    className={`w-7 h-7 flex items-center justify-center rounded transition text-xs border ${privileges[parent.id]?.[`can_${priv}`] ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                    title={getPrivilegeLabel(priv)}
                  >
                    {priv === 'view' ? <Eye size={14} /> : <Lock size={14} />}
                  </button>
                ))}
              </div>
            </div>
            {/* Children */}
            {(expandedMenus[parent.id] || searchQuery) && getChildMenus(parent.id).filter(filterChild).length > 0 && (
              <div className="ml-7 border-l border-gray-100 pl-2">
                {getChildMenus(parent.id).filter(filterChild).map(child => (
                  <div key={child.id} className="flex items-center group px-2 py-1.5 rounded hover:bg-blue-50 transition cursor-pointer">
                    <span className="mr-2 text-blue-400">
                      {getMenuIcon(child.menu_name, true)}
                    </span>
                    <span className="text-gray-700 flex-1">{child.menu_name}</span>
                    <div className="flex gap-1 ml-2">
                      {['view', 'access', 'create', 'edit', 'delete'].map(priv => (
                        <button
                          key={priv}
                          onClick={e => { e.stopPropagation(); onPrivilegeChange(child.id, `can_${priv}`); }}
                          className={`w-7 h-7 flex items-center justify-center rounded transition text-xs border ${privileges[child.id]?.[`can_${priv}`] ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                          title={getPrivilegeLabel(priv)}
                        >
                          {priv === 'view' && <Eye size={13} />}
                          {priv === 'access' && <Lock size={13} />}
                          {priv === 'create' && <PlusCircle size={13} />}
                          {priv === 'edit' && <Pencil size={13} />}
                          {priv === 'delete' && <Trash size={13} />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Shield className="text-blue-600" size={32} />
            Manajemen Role & Hak Akses
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Kelola peran dan hak akses untuk setiap pengguna.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="font-bold text-gray-700">{roles.length}</span>
              <span className="text-gray-500">Total Role</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="font-bold text-blue-600">{roles.filter(r => r.is_system === 1).length}</span>
              <span className="text-gray-500">Role Sistem</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Role List */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
              <Shield size={20} className="text-blue-600"/>
              Daftar Role
            </h2>
            <button
              onClick={() => {
                setModalMode('create');
                setRoleForm({ role_name: '', description: '' });
                setShowModal(true);
              }}
              className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-[calc(100vh-280px)] overflow-y-auto">
            <AnimatePresence>
              {roles.map((role) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedRole?.id === role.id
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-r-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedRole?.id === role.id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Shield size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{role.role_name}</div>
                        {role.description && (
                          <div className="text-xs text-gray-500 truncate max-w-[180px]">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {role.is_system === 1 ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        System
                      </span>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalMode('edit');
                            setRoleForm({
                              role_name: role.role_name,
                              description: role.description || ''
                            });
                            setSelectedRole(role);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteRole(e, role)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Privileges Section */}
        <div className="col-span-12 lg:col-span-8">
          {selectedRole ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedRole.role_name}</h2>
                    {selectedRole.description && (
                      <p className="text-gray-500 mt-1">{selectedRole.description}</p>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                      hasChanges
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Save size={18} className={hasChanges ? 'text-white' : 'text-gray-400'} />
                    {hasChanges ? 'Simpan Perubahan' : 'Semua Tersimpan'}
                  </button>
                </div>
              </div>
              {/* Search & Tree Menu */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Cari menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                {/* Tree Menu Minimalis */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <TreeMenu
                    menus={menus}
                    privileges={privileges}
                    onPrivilegeChange={handlePrivilegeChange}
                    expandedMenus={expandedMenus}
                    toggleMenuExpanded={toggleMenuExpanded}
                    getMenuIcon={getMenuIcon}
                    getPrivilegeLabel={getPrivilegeLabel}
                    searchQuery={searchQuery}
                  />
                </div>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-gray-200 hover:border-blue-200 transition-colors min-h-[400px]"
            >
              <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full mb-6">
                <Shield size={56} className="text-blue-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">Tidak Ada Role Dipilih</h3>
              <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                Pilih role dari daftar untuk melihat dan mengelola hak akses, atau buat role baru untuk memulai.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setModalMode('create');
                    setRoleForm({ role_name: '', description: '' });
                    setShowModal(true);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-md flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Buat Role Baru
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fetchRolesAndMenus()}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Refresh Data
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden animate-fade-in-up">
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-full p-2 shadow transition-all z-10"
              aria-label="Tutup"
            >
              <X size={22} />
            </button>
            {/* Header */}
            <div className="px-8 pt-8 pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100 flex items-center gap-3">
              <Shield className="text-blue-500" size={22} />
              <h3 className="text-xl font-bold text-gray-800">
                {modalMode === 'create' ? 'Tambah Role Baru' : 'Edit Role'}
              </h3>
            </div>
            {/* Form */}
            <form
              onSubmit={e => { e.preventDefault(); handleSaveRole(); }}
              className="px-8 py-7 space-y-6"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide uppercase">
                  Nama Role
                </label>
                <input
                  type="text"
                  value={roleForm.role_name}
                  onChange={e => setRoleForm({ ...roleForm, role_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50 text-gray-800 font-medium placeholder-gray-400 transition-all"
                  placeholder="Masukkan nama role"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide uppercase">
                  Deskripsi
                </label>
                <textarea
                  value={roleForm.description}
                  onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50 text-gray-800 font-medium placeholder-gray-400 transition-all min-h-[90px] resize-none"
                  placeholder="Deskripsi singkat role (opsional)"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all shadow-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg hover:from-blue-700 hover:to-blue-600 hover:scale-105 transition-all"
                >
                  {modalMode === 'create' ? 'Buat Role' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
