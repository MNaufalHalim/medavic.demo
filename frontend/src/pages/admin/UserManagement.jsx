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
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all animate-scale-in">
              <div className="text-center mb-5">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash size={28} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Confirm Deletion</h3>
                <p className="text-gray-600 mt-2">
                  Are you sure you want to delete the user <span className="font-semibold">{userToDelete.username}</span>? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                  aria-label="Cancel deletion"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-medium flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  aria-label="Confirm deletion"
                >
                  <Trash size={18} />
                  Delete
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

        {/* Modern Header with Gradient Background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-md p-6 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Users className="mr-3" size={28} strokeWidth={2} />
                User Management
              </h1>
              <p className="text-blue-100 mt-2 flex items-center">
                <Shield className="mr-2" size={16} />
                Manage system users, roles, and permissions
              </p>
            </div>
            <div className="flex items-center gap-4">
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
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 text-white transition-all duration-200"
                aria-label="Add new user"
              >
                <UserPlus size={18} />
                Add New User
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="bg-white/20 rounded-full p-3 mr-3">
                <User size={20} />
              </div>
              <div>
                <div className="text-sm text-blue-100">Total Users</div>
                <div className="text-2xl font-bold">{users.length}</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="bg-white/20 rounded-full p-3 mr-3">
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="text-sm text-blue-100">Active Users</div>
                <div className="text-2xl font-bold">
                  {users.filter((user) => user.delt_flg !== 'Y').length}
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="bg-white/20 rounded-full p-3 mr-3">
                <XCircle size={20} />
              </div>
              <div>
                <div className="text-sm text-blue-100">Inactive Users</div>
                <div className="text-2xl font-bold">
                  {users.filter((user) => user.delt_flg === 'Y').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users by name, username or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                  aria-label="Search users"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
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
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Create new user"
              >
                <UserPlus size={18} />
                New User
              </button>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    activeTab === 'all'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-label="Show all users"
                >
                  All
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {users.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    activeTab === 'active'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-label="Show active users"
                >
                  Active
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {users.filter((user) => user.delt_flg !== 'Y').length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('inactive')}
                  className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    activeTab === 'inactive'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-label="Show inactive users"
                >
                  Inactive
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === 'inactive' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {users.filter((user) => user.delt_flg === 'Y').length}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Created At
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const formattedDate = formatDate(user.created_at);
                    return (
                      <tr key={user.id} className="table-row-hover">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {user.full_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .substring(0, 2)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-50 text-blue-700">
                            {user.role_name || 'No Role'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full items-center ${
                              user.delt_flg === 'Y'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-green-50 text-green-700'
                            }`}
                          >
                            {user.delt_flg === 'Y' ? (
                              <XCircle size={14} className="mr-1" />
                            ) : (
                              <CheckCircle size={14} className="mr-1" />
                            )}
                            {user.delt_flg === 'Y' ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-1 text-gray-400" />
                              {formattedDate.date}
                            </div>
                            <div className="flex items-center mt-1">
                              <Clock size={14} className="mr-1 text-gray-400" />
                              {formattedDate.time}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                          <button
                            onClick={() => handleActionClick(user.id)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none p-1.5 rounded-full hover:bg-gray-100"
                            aria-label="User actions"
                          >
                            <MoreVertical size={18} color="#606060" />
                          </button>
                          {activeDropdown === user.id && (
                            <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-10 me-2 dropdown-animation overflow-hidden">
                              <div className="py-2 divide-y divide-gray-100">
                                <div className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-50">
                                  User Actions
                                </div>
                                <div>
                                  <button
                                    onClick={() => {
                                      handleEdit(user);
                                      setActiveDropdown(null);
                                    }}
                                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 w-full text-left transition-colors duration-150"
                                    aria-label="Edit user"
                                  >
                                    <Edit size={16} className="mr-2 text-blue-500" />
                                    Edit User
                                  </button>
                                  <button
                                    onClick={() => {
                                      toggleUserStatus(user);
                                      setActiveDropdown(null);
                                    }}
                                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 w-full text-left transition-colors duration-150"
                                    aria-label={user.delt_flg === 'Y' ? 'Activate user' : 'Deactivate user'}
                                  >
                                    {user.delt_flg === 'Y' ? (
                                      <>
                                        <UserCheck size={16} className="mr-2 text-green-500" />
                                        Activate User
                                      </>
                                    ) : (
                                      <>
                                        <UserX size={16} className="mr-2 text-amber-500" />
                                        Deactivate User
                                      </>
                                    )}
                                  </button>
                                </div>
                                <div>
                                  <button
                                    onClick={() => {
                                      handleDelete(user);
                                    }}
                                    className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors duration-150"
                                    aria-label="Delete user"
                                  >
                                    <Trash size={16} className="mr-2 text-red-500" />
                                    Delete Permanently
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
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
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
            <div className="bg-white p-0 rounded-xl shadow-2xl w-full max-w-md modal-animation">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-t-xl flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center">
                  {selectedUser ? (
                    <>
                      <Edit size={20} className="mr-2" />
                      Edit User
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} className="mr-2" />
                      Create New User
                    </>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedUser(null);
                    setError(null);
                    setFormErrors({});
                  }}
                  className="text-white/80 hover:text-white hover:bg-blue-700/50 p-1.5 rounded-full transition-all"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <User size={16} className="text-blue-500 mr-1.5" />
                        Username
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({ ...formData, username: e.target.value })
                          }
                          className={`w-full px-4 py-2.5 border-2 ${
                            formErrors.username
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 focus:border-blue-500'
                          } rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                          placeholder="Enter username"
                          required
                          aria-label="Username"
                        />
                        {formErrors.username && (
                          <p className="mt-1.5 text-sm text-red-600 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {formErrors.username}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <Lock size={16} className="text-blue-500 mr-1.5" />
                        Password{' '}
                        {selectedUser && (
                          <span className="text-gray-500 text-xs ml-1 bg-gray-100 px-2 py-0.5 rounded-full">
                            Optional
                          </span>
                        )}
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className={`w-full px-4 py-2.5 border-2 ${
                            formErrors.password
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 focus:border-blue-500'
                          } rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10`}
                          placeholder={
                            selectedUser ? 'Leave empty to keep current password' : 'Enter secure password'
                          }
                          required={!selectedUser}
                          aria-label="Password"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {formErrors.password && (
                          <p className="mt-1.5 text-sm text-red-600 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {formErrors.password}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <UserRound size={16} className="text-blue-500 mr-1.5" />
                        Full Name
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) =>
                            setFormData({ ...formData, full_name: e.target.value })
                          }
                          className={`w-full px-4 py-2.5 border-2 ${
                            formErrors.full_name
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 focus:border-blue-500'
                          } rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                          placeholder="Enter user's full name"
                          required
                          aria-label="Full name"
                        />
                        {formErrors.full_name && (
                          <p className="mt-1.5 text-sm text-red-600 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {formErrors.full_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <Shield size={16} className="text-blue-500 mr-1.5" />
                        Role
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <select
                          value={formData.role_id}
                          onChange={(e) =>
                            setFormData({ ...formData, role_id: e.target.value })
                          }
                          className={`w-full px-4 py-2.5 border-2 ${
                            formErrors.role_id
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 focus:border-blue-500'
                          } rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-white`}
                          required
                          aria-label="Role"
                        >
                          <option value="">Select a role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.role_name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <ChevronDown size={16} />
                        </div>
                        {formErrors.role_id && (
                          <p className="mt-1.5 text-sm text-red-600 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {formErrors.role_id}
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedUser && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                          <Activity size={16} className="text-blue-500 mr-1.5" />
                          Status
                        </label>
                        <div className="flex gap-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="relative inline-flex items-center p-2 cursor-pointer rounded-md transition-all duration-200 hover:bg-white flex-1 justify-center">
                            <input
                              type="radio"
                              value="N"
                              checked={formData.delt_flg === 'N'}
                              onChange={() =>
                                setFormData({ ...formData, delt_flg: 'N' })
                              }
                              className="sr-only peer"
                              aria-label="Active status"
                            />
                            <div className={`flex items-center justify-center py-1.5 px-3 rounded-md w-full transition-all duration-200 ${formData.delt_flg === 'N' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-600'}`}>
                              <CheckCircle size={16} className={`mr-2 ${formData.delt_flg === 'N' ? 'text-green-500' : 'text-gray-400'}`} />
                              Active
                            </div>
                          </label>
                          <label className="relative inline-flex items-center p-2 cursor-pointer rounded-md transition-all duration-200 hover:bg-white flex-1 justify-center">
                            <input
                              type="radio"
                              value="Y"
                              checked={formData.delt_flg === 'Y'}
                              onChange={() =>
                                setFormData({ ...formData, delt_flg: 'Y' })
                              }
                              className="sr-only peer"
                              aria-label="Inactive status"
                            />
                            <div className={`flex items-center justify-center py-1.5 px-3 rounded-md w-full transition-all duration-200 ${formData.delt_flg === 'Y' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-gray-600'}`}>
                              <XCircle size={16} className={`mr-2 ${formData.delt_flg === 'Y' ? 'text-red-500' : 'text-gray-400'}`} />
                              Inactive
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setSelectedUser(null);
                        setError(null);
                        setFormErrors({});
                      }}
                      className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow focus:ring-2 focus:ring-gray-200 focus:outline-none flex items-center"
                      aria-label="Cancel"
                    >
                      <X size={16} className="mr-1.5" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-300 focus:outline-none flex items-center"
                      disabled={isLoading}
                      aria-label={selectedUser ? 'Update user' : 'Create user'}
                    >
                      {isLoading ? (
                        <RefreshCw size={16} className="animate-spin mr-2" />
                      ) : selectedUser ? (
                        <Save size={16} className="mr-1.5" />
                      ) : (
                        <UserPlus size={16} className="mr-1.5" />
                      )}
                      {selectedUser ? 'Update User' : 'Create User'}
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