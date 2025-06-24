// src/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../../config';
import { useNavigate } from 'react-router-dom';
import {
  User,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Search,
  Eye,
  EyeOff,
  Edit,
  Trash,
  MoreVertical,
  UserCheck,
  UserX,
  RefreshCw,
  Calendar,
  Clock,
  Shield,
  Users,
  UserRound,
  Lock,
  Activity,
  ChevronDown,
  Save,
} from 'lucide-react';

// Define animation and custom styles (move to a separate CSS file in production)
const customStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  .animate-scale-in {
    animation: scaleIn 0.3s ease-out forwards;
  }
  
  .animate-slide-in {
    animation: slideIn 0.3s ease-out forwards;
  }

  .modal-animation {
    animation: scaleIn 0.3s ease-out forwards;
  }

  .dropdown-animation {
    animation: fadeIn 0.2s ease-out forwards;
  }
  
  /* Custom scrollbar styles */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c5c5c5;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  /* Button hover effects */
  .btn-gradient {
    background-size: 200% auto;
    transition: 0.3s;
  }
  
  .btn-gradient:hover {
    background-position: right center;
  }
  
  /* Table row hover effect */
  .table-row-hover:hover {
    background-color: rgba(59, 130, 246, 0.05);
    transition: all 0.2s ease;
  }
`;

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  return {
    date: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
};

const StatusBadge = ({ delt_flg }) => {
  const isActive = delt_flg !== 'Y';
  return (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit transition-all duration-200 ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      {isActive ? (
        <>
          <CheckCircle size={14} className="text-emerald-500" />
          <span>Active</span>
        </>
      ) : (
        <>
          <XCircle size={14} className="text-red-500" />
          <span>Inactive</span>
        </>
      )}
    </span>
  );
};

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role_id: '',
    delt_flg: 'N',
  });
  const [formErrors, setFormErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!users.length) return;

    let result = [...users];

    if (activeTab === 'active') {
      result = result.filter((user) => user.delt_flg !== 'Y');
    } else if (activeTab === 'inactive') {
      result = result.filter((user) => user.delt_flg === 'Y');
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.username.toLowerCase().includes(term) ||
          user.full_name.toLowerCase().includes(term) ||
          (user.role_name && user.role_name.toLowerCase().includes(term))
      );
    }

    setFilteredUsers(result);
  }, [users, activeTab, searchTerm]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        navigate('/login');
        return;
      }

      const response = await axios.get(config.apiUrl + '/users', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status === 'success') {
        const formattedUsers = response.data.data.map((user) => ({
          ...user,
          created_at: user.created_at || null,
        }));
        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      } else {
        setError('Failed to fetch users. Please try again.');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        navigate('/login');
      } else {
        setError(`Error fetching users: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const fetchRoles = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(config.apiUrl + '/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(response.data.data || []);
    } catch (error) {
      setError('Failed to fetch roles. Please try again.');
    }
  }, []);

  const handleEdit = useCallback((user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      full_name: user.full_name || '',
      role_id: user.role_id || '',
      delt_flg: user.delt_flg || 'N',
      password: '',
    });
    setIsModalOpen(true);
    setShowPassword(false);
    setFormErrors({});
  }, []);

  const handleDelete = useCallback((user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
    setActiveDropdown(null);
  }, []);

  const confirmDelete = useCallback(
    async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.delete(config.apiUrl + '/users/' + userToDelete.id, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.status === 'success') {
          setSuccessMessage('User has been successfully deleted');
          fetchUsers();
        } else {
          setError('Failed to delete user. Please try again.');
        }
      } catch (error) {
        setError(
          `Error deleting user: ${
            error.response?.data?.message || error.message || 'Unknown error'
          }`
        );
      } finally {
        setIsLoading(false);
        setShowDeleteConfirm(false);
        setUserToDelete(null);
      }
    },
    [fetchUsers, userToDelete]
  );

  const toggleUserStatus = useCallback(
    async (user) => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const newStatus = user.delt_flg === 'Y' ? 'N' : 'Y';

        const response = await axios.put(
          config.apiUrl + '/users/' + user.id,
          { ...user, delt_flg: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data && response.data.status === 'success') {
          setSuccessMessage(
            `User status changed to ${newStatus === 'Y' ? 'inactive' : 'active'}`
          );
          fetchUsers();
        } else {
          setError('Failed to update user status. Please try again.');
        }
      } catch (error) {
        setError(
          `Error updating user status: ${
            error.response?.data?.message || error.message || 'Unknown error'
          }`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [fetchUsers]
  );

  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!selectedUser && !formData.password.trim())
      errors.password = 'Password is required for new users';
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    if (!formData.role_id) errors.role_id = 'Role selection is required';

    return errors;
  }, [formData, selectedUser]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const errors = validateForm();

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setError(
          `Please correct the following: ${Object.values(errors).join(', ')}`
        );
        return;
      }

      setIsLoading(true);
      setError(null);
      setFormErrors({});

      try {
        const token = localStorage.getItem('token');
        let response;
        const payload = { ...formData };
        if (!payload.password) delete payload.password;

        if (selectedUser) {
          response = await axios.put(
            config.apiUrl + '/users/' + selectedUser.id,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setSuccessMessage('User updated successfully');
        } else {
          response = await axios.post(config.apiUrl + '/users', formData, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSuccessMessage('New user created successfully');
        }

        setIsModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
        setFormData({
          username: '',
          password: '',
          full_name: '',
          role_id: '',
          delt_flg: 'N',
        });
      } catch (error) {
        setError(
          `Error saving user: ${
            error.response?.data?.message || error.message || 'Unknown error'
          }`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [fetchUsers, formData, selectedUser]
  );

  const handleActionClick = useCallback((userId) => {
    setActiveDropdown(activeDropdown === userId ? null : userId);
  }, [activeDropdown]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all animate-scale-in">
              <div className="text-center mb-5">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash size={28} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Konfirmasi Hapus</h3>
                <p className="text-gray-600 mt-2">
                  Anda yakin ingin menghapus pengguna <span className="font-semibold">{userToDelete.username}</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                  aria-label="Batalkan hapus"
                >
                  <X size={18} />
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-medium flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  aria-label="Konfirmasi hapus"
                >
                  <Trash size={18} />
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in">
            <CheckCircle size={20} className="mr-2 text-green-500" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in">
            <AlertCircle size={20} className="mr-2 text-red-500" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-3 text-red-500 hover:text-red-700"
              aria-label="Close error message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Users className="text-blue-600" size={32} />
                    Manajemen Pengguna
                </h1>
                <p className="text-gray-500 mt-1 text-sm sm:text-base">Kelola pengguna, role, dan status sistem.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
                <span className="font-bold text-gray-700">{users.length}</span>
                <span className="text-gray-500">Total</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
                <span className="font-bold text-green-600">{users.filter((user) => user.delt_flg !== 'Y').length}</span>
                <span className="text-gray-500">Aktif</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
                <span className="font-bold text-red-600">{users.filter((user) => user.delt_flg === 'Y').length}</span>
                <span className="text-gray-500">Nonaktif</span>
              </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200/80 p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari pengguna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  aria-label="Search users"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none ${
                    activeTab === 'all'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-r border-gray-200'
                  }`}
                  aria-label="Show all users"
                >
                  Semua
                </button>
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none ${
                    activeTab === 'active'
                      ? 'bg-green-600 text-white shadow'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-r border-gray-200'
                  }`}
                  aria-label="Show active users"
                >
                  Aktif
                </button>
                <button
                  onClick={() => setActiveTab('inactive')}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none ${
                    activeTab === 'inactive'
                      ? 'bg-red-600 text-white shadow'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label="Show inactive users"
                >
                  Nonaktif
                </button>
              </div>
               <button
                onClick={() => {
                  setSelectedUser(null);
                  setFormData({
                    username: '',
                    password: '',
                    full_name: '',
                    role_id: '',
                    delt_flg: 'N',
                  });
                  setIsModalOpen(true);
                  setFormErrors({});
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow font-semibold text-sm"
                aria-label="Create new user"
              >
                <UserPlus size={16} />
                Pengguna Baru
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200/80">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw size={24} className="text-blue-500 animate-spin mr-2" />
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <div className="bg-gray-100 p-3 rounded-full mb-2">
                <User size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">
                No users found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add a new user to get started'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                  aria-label="Clear search"
                >
                  <X size={16} className="mr-1" />
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-100/70 sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Pengguna
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Dibuat pada
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-20"
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const formattedDate = formatDate(user.created_at);
                    return (
                      <tr key={user.id} className="table-row-hover">
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">
                                {user.full_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .substring(0, 2)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-800">
                                {user.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role_name || 'No Role'}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <StatusBadge delt_flg={user.delt_flg} />
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          <div>{formattedDate.date}</div>
                          <div className="text-xs text-gray-400">{formattedDate.time}</div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(user)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                title="Edit Pengguna"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => toggleUserStatus(user)}
                                className={`p-2 rounded-full transition-colors ${user.delt_flg === 'Y' ? 'text-green-600 hover:bg-green-100' : 'text-amber-600 hover:bg-amber-100'}`}
                                title={user.delt_flg === 'Y' ? 'Aktifkan Pengguna' : 'Nonaktifkan Pengguna'}
                              >
                                {user.delt_flg === 'Y' ? <UserCheck size={16} /> : <UserX size={16} />}
                              </button>
                              <button
                                onClick={() => handleDelete(user)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                title="Hapus Pengguna"
                              >
                                <Trash size={16} />
                              </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-animation overflow-hidden border border-gray-100">
              {/* Minimalist Header */}
              <div className="bg-slate-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-700 p-2 rounded-lg">
                    {selectedUser ? (
                      <Edit size={18} className="text-white"/>
                    ) : (
                      <UserPlus size={18} className="text-white"/>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {selectedUser ? 'Edit Pengguna' : 'Pengguna Baru'}
                    </h2>
                    <p className="text-slate-300 text-xs">
                      {selectedUser ? 'Perbarui data pengguna' : 'Buat akun baru'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Compact Form */}
              <div className="p-5">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {/* Username */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                        <User size={14} className="text-blue-500" />
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        className={`w-full px-3 py-2.5 border ${
                          formErrors.username
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 focus:border-blue-500'
                        } rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                        placeholder="Masukkan username"
                        required
                      />
                      {formErrors.username && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.username}
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                        <Lock size={14} className="text-amber-500" />
                        Password
                        {selectedUser && (
                          <span className="text-gray-400 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            Opsional
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className={`w-full px-3 py-2.5 border ${
                            formErrors.password
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 focus:border-amber-500'
                          } rounded-lg transition-all duration-200 focus:ring-2 focus:ring-amber-500/20 focus:outline-none pr-10`}
                          placeholder={selectedUser ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                          required={!selectedUser}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {formErrors.password && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.password}
                        </p>
                      )}
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                        <UserRound size={14} className="text-green-500" />
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({ ...formData, full_name: e.target.value })
                        }
                        className={`w-full px-3 py-2.5 border ${
                          formErrors.full_name
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 focus:border-green-500'
                        } rounded-lg transition-all duration-200 focus:ring-2 focus:ring-green-500/20 focus:outline-none`}
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                      {formErrors.full_name && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.full_name}
                        </p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                        <Shield size={14} className="text-purple-500" />
                        Role
                      </label>
                      <div className="relative">
                        <select
                          value={formData.role_id}
                          onChange={(e) =>
                            setFormData({ ...formData, role_id: e.target.value })
                          }
                          className={`w-full px-3 py-2.5 border ${
                            formErrors.role_id
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 focus:border-purple-500'
                          } rounded-lg transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:outline-none appearance-none bg-white`}
                          required
                        >
                          <option value="">Pilih role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.role_name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                      {formErrors.role_id && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.role_id}
                        </p>
                      )}
                    </div>

                    {/* Status - Only for Edit */}
                    {selectedUser && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                          <Activity size={14} className="text-orange-500" />
                          Status
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              value="N"
                              checked={formData.delt_flg === 'N'}
                              onChange={() =>
                                setFormData({ ...formData, delt_flg: 'N' })
                              }
                              className="sr-only peer"
                            />
                            <div className={`flex items-center justify-center py-2 px-3 rounded-lg border-2 transition-all duration-200 ${
                              formData.delt_flg === 'N' 
                                ? 'bg-green-600 text-white border-green-600 shadow' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                            }`}>
                              <CheckCircle size={14} className="mr-1.5" />
                              <span className="text-sm font-medium">Active</span>
                            </div>
                          </label>
                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              value="Y"
                              checked={formData.delt_flg === 'Y'}
                              onChange={() =>
                                setFormData({ ...formData, delt_flg: 'Y' })
                              }
                              className="sr-only peer"
                            />
                            <div className={`flex items-center justify-center py-2 px-3 rounded-lg border-2 transition-all duration-200 ${
                              formData.delt_flg === 'Y' 
                                ? 'bg-red-600 text-white border-red-600 shadow' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-red-400'
                            }`}>
                              <XCircle size={14} className="mr-1.5" />
                              <span className="text-sm font-medium">Inactive</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Solid Action Buttons */}
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setSelectedUser(null);
                        setError(null);
                        setFormErrors({});
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center gap-2 shadow"
                    >
                      <X size={16} />
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Menyimpan...
                        </>
                      ) : selectedUser ? (
                        <>
                          <Save size={16} />
                          Simpan
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          Buat
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManagement;