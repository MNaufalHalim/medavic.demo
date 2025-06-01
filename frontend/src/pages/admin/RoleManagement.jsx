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
        axios.get(apiUrl('api/roles'), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(apiUrl('api/menus'), {  // Changed from /api/menu to /api/menus
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
      const response = await axios.get(apiUrl(`api/roles/${roleId}/privilege`), {
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
        apiUrl(`api/roles/${selectedRole.id}/privilege`),
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
        await axios.post(apiUrl('api/roles'), roleForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.put(apiUrl(`api/roles/${selectedRole.id}`), roleForm, {
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
      await axios.delete(apiUrl(`api/roles/${role.id}`), {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      {/* Header Section */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Shield className="mr-3" size={28} />
              Role & Privilege Management
            </h1>
            <p className="text-blue-100 mt-1">Kelola peran dan hak akses pengguna</p>
          </div>
          <div className="flex space-x-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-xs text-blue-100">Total Roles</div>
              <div className="text-xl font-bold">{roles.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-xs text-blue-100">System Roles</div>
              <div className="text-xl font-bold">{roles.filter(r => r.is_system === 1).length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Role List */}
        <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Shield className="mr-2 text-blue-600" size={20} />
              Daftar Role
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setModalMode('create');
                setRoleForm({ role_name: '', description: '' });
                setShowModal(true);
              }}
              className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus size={18} />
            </motion.button>
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
        <div className="flex-1">
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
                    {hasChanges ? 'Save Changes' : 'All Changes Saved'}
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Cari menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Semua Menu
                  </button>
                  <button
                    onClick={() => setActiveTab('parent')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'parent' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Menu Utama
                  </button>
                  <button
                    onClick={() => setActiveTab('child')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'child' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Sub Menu
                  </button>
                </div>
              </div>
              
              {/* Hierarchical Menu Privileges */}
              <div className="space-y-4">
                <AnimatePresence>
                  {isLoading ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-center items-center p-12"
                    >
                      <div className="flex flex-col items-center">
                        <RefreshCw size={36} className="text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-600">Memuat data...</p>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {/* Parent Menus */}
                      {parentMenus
                        .filter(menu => {
                          if (searchQuery) return menu.menu_name.toLowerCase().includes(searchQuery.toLowerCase());
                          if (activeTab === 'child') return false;
                          return true;
                        })
                        .map(parentMenu => (
                          <motion.div 
                            key={parentMenu.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
                          >
                            <div 
                              className="px-6 py-4 border-b flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => toggleMenuExpanded(parentMenu.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                  {getMenuIcon(parentMenu.menu_name)}
                                </div>
                                <h3 className="font-semibold text-gray-800">{parentMenu.menu_name}</h3>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                  {['view', 'access'].map(privilege => {
                                    const isChecked = privileges[parentMenu.id]?.[`can_${privilege}`] || false;
                                    return (
                                      <motion.div 
                                        key={privilege}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${isChecked ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePrivilegeChange(parentMenu.id, `can_${privilege}`);
                                        }}
                                      >
                                        {privilege === 'view' ? <Eye size={12} /> : <Lock size={12} />}
                                        {getPrivilegeLabel(privilege)}
                                      </motion.div>
                                    );
                                  })}
                                </div>
                                <button className="text-gray-400">
                                  {expandedMenus[parentMenu.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </button>
                              </div>
                            </div>
                            
                            {/* Child Menus */}
                            <AnimatePresence>
                              {expandedMenus[parentMenu.id] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="divide-y divide-gray-100">
                                    {getChildMenus(parentMenu.id)
                                      .filter(menu => {
                                        if (searchQuery) return menu.menu_name.toLowerCase().includes(searchQuery.toLowerCase());
                                        return true;
                                      })
                                      .map(childMenu => (
                                        <div key={childMenu.id} className="p-4 pl-14 hover:bg-gray-50 transition-colors">
                                          <div className="flex flex-col space-y-3">
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-gray-100 text-gray-600">
                                                  {getMenuIcon(childMenu.menu_name, true)}
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{childMenu.menu_name}</span>
                                              </div>
                                              <div className="flex gap-1">
                                                {['view', 'access'].map(privilege => {
                                                  const isChecked = privileges[childMenu.id]?.[`can_${privilege}`] || false;
                                                  return (
                                                    <motion.button
                                                      key={privilege}
                                                      whileHover={{ scale: 1.05 }}
                                                      whileTap={{ scale: 0.95 }}
                                                      onClick={() => handlePrivilegeChange(childMenu.id, `can_${privilege}`)}
                                                      className={`p-1 rounded-md ${isChecked ? 'text-blue-600' : 'text-gray-400'}`}
                                                    >
                                                      {privilege === 'view' ? <Eye size={14} /> : <Lock size={14} />}
                                                    </motion.button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-2 ml-7">
                                              {['create', 'edit', 'delete'].map(privilege => {
                                                const isChecked = privileges[childMenu.id]?.[`can_${privilege}`] || false;
                                                const icons = {
                                                  'create': <PlusCircle size={14} />,
                                                  'edit': <Pencil size={14} />,
                                                  'delete': <Trash size={14} />
                                                };
                                                return (
                                                  <motion.div
                                                    key={privilege}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handlePrivilegeChange(childMenu.id, `can_${privilege}`)}
                                                    className={`px-2 py-1.5 rounded-md text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${isChecked ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                  >
                                                    {icons[privilege]}
                                                    {getPrivilegeLabel(privilege)}
                                                  </motion.div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      
                      {/* Standalone Child Menus (for search results or child tab) */}
                      {activeTab === 'child' || searchQuery ? (
                        <div className="mt-4">
                          {menus
                            .filter(menu => {
                              if (!searchQuery && activeTab !== 'child') return false;
                              if (activeTab === 'child' && !menu.parent_id) return false;
                              if (searchQuery && !menu.menu_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                              // Don't show children that are already shown under their parents when expanded
                              if (menu.parent_id && expandedMenus[menu.parent_id] && !searchQuery) return false;
                              return true;
                            })
                            .map(menu => (
                              <motion.div
                                key={`standalone-${menu.id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-lg shadow-sm p-4 mb-2 border border-gray-100"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-gray-100 text-gray-600">
                                      {getMenuIcon(menu.menu_name, true)}
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-gray-700">{menu.menu_name}</span>
                                      {menu.parent_id && (
                                        <div className="text-xs text-gray-500">
                                          {menus.find(m => m.id === menu.parent_id)?.menu_name || 'Menu Utama'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {['view', 'create', 'edit', 'delete', 'access'].map(privilege => {
                                      const isChecked = privileges[menu.id]?.[`can_${privilege}`] || false;
                                      return (
                                        <motion.button
                                          key={privilege}
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => handlePrivilegeChange(menu.id, `can_${privilege}`)}
                                          className={`p-1.5 rounded-full ${isChecked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                          title={getPrivilegeLabel(privilege)}
                                        >
                                          {privilege === 'view' && <Eye size={14} />}
                                          {privilege === 'create' && <PlusCircle size={14} />}
                                          {privilege === 'edit' && <Pencil size={14} />}
                                          {privilege === 'delete' && <Trash size={14} />}
                                          {privilege === 'access' && <Lock size={14} />}
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                        </div>
                      ) : null}
                      
                      {/* No results message */}
                      {searchQuery && filteredMenus.length === 0 && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-white rounded-xl p-8 text-center border border-gray-100"
                        >
                          <Search size={40} className="text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-700 mb-1">Tidak ada hasil</h3>
                          <p className="text-gray-500">Tidak ada menu yang cocok dengan pencarian "{searchQuery}"</p>
                        </motion.div>
                      )}
                    </>
                  )}
                </AnimatePresence>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                {modalMode === 'create' ? 'Add New Role' : 'Edit Role'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="hover:bg-gray-100 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={roleForm.role_name}
                  onChange={e => setRoleForm({ ...roleForm, role_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter role name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={roleForm.description}
                  onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 transition-all duration-200"
                  placeholder="Enter role description"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {modalMode === 'create' ? 'Create Role' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
