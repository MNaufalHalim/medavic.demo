import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  return {
    date: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // This enables 24-hour format
    })
  };
};

const StatusBadge = ({ delt_flg }) => {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      delt_flg === 'Y' 
        ? 'bg-red-100 text-red-800' 
        : 'bg-green-100 text-green-600'
    }`}>
      {delt_flg === 'Y' ? 'Inactive' : 'Active'}
    </span>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role_id: '',
    delt_flg: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        navigate('/login');
        return;
      }
  
      const response = await axios.get(`${config.apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (response.data.status === 'success') {
        console.log('API Response:', response.data.data); // Debug log
        const formattedUsers = response.data.data.map(user => ({
          ...user,
          created_at: user.created_at || null
        }));
        console.log('Formatted Users:', formattedUsers); // Debug log
        setUsers(formattedUsers);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Authentication error');
        navigate('/login');
      } else {
        console.error('Error fetching users:', error);
      }
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(response.data.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      full_name: user.full_name,
      role_id: user.role_id,
      delt_flg: user.delt_flg,
      password: '' // Clear password on edit
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${config.apiUrl}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (selectedUser) {
        // Update existing user
        await axios.put(`${config.apiUrl}/users/${selectedUser.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new user
        await axios.post(`${config.apiUrl}/users`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
      setFormData({ username: '', password: '', full_name: '', role_id: '', delt_flg: '' });
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleActionClick = (userId) => {
    setActiveDropdown(activeDropdown === userId ? null : userId);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">User List</h1>
          <button className="text-gray-500 px-3 py-1 text-sm border rounded-md flex items-center gap-2">
            [icon filter] Filters
          </button>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null);
            setFormData({ username: '', password: '', full_name: '', role_id: '', delt_flg: '' });
            setIsModalOpen(true);
          }}
          className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 flex items-center gap-2"
        >
          + New User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.username}</div>
                  <div className="text-sm text-gray-500">{user.full_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge delt_flg={user.delt_flg} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(user.created_at).date}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(user.created_at).time}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                  <button 
                    onClick={() => handleActionClick(user.id)}
                    className="text-gray-400 hover:text-gray-600 outline-none active:outline-none focus:outline-none"
                  >
                    <svg width="13" height="16" viewBox="0 0 13 63" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="6.5" cy="6.5" r="6.5" fill="#606060"/>
                      <circle cx="6.5" cy="56.5" r="6.5" fill="#606060"/>
                      <circle cx="6.5" cy="31.5" r="6.5" fill="#606060"/>
                      </svg>

                  </button>
                  
                  {activeDropdown === user.id && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleEdit(user);
                            setActiveDropdown(null);
                          }}
                          className="flex items-center px-4 py-2 text-lg text-gray-700 hover:bg-gray-100 w-full"
                        >
                          <svg width="14" height="18" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" className='mr-2'>
                            <path d="M11.735 3.52979H3.38556C2.75287 3.52979 2.14609 3.78112 1.69871 4.2285C1.25133 4.67588 1 5.28265 1 5.91534V22.6142C1 23.2469 1.25133 23.8537 1.69871 24.3011C2.14609 24.7485 2.75287 24.9998 3.38556 24.9998H20.0844C20.7171 24.9998 21.3239 24.7485 21.7713 24.3011C22.2187 23.8537 22.47 23.2469 22.47 22.6142V14.2648" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M20.6809 1.7411C21.1554 1.26658 21.799 1 22.4701 1C23.1411 1 23.7847 1.26658 24.2592 1.7411C24.7338 2.21561 25.0003 2.8592 25.0003 3.53026C25.0003 4.20133 24.7338 4.84491 24.2592 5.31943L12.9279 16.6508L8.15674 17.8436L9.34952 13.0725L20.6809 1.7411Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(user.id);
                            setActiveDropdown(null);
                          }}
                          className="flex items-center px-4 py-2 text-lg text-red-600 hover:bg-gray-100 w-full"
                        >
                          <svg width="14" height="31" viewBox="0 0 28 31" fill="none" xmlns="http://www.w3.org/2000/svg" className='mr-2'>
                          <path d="M1 6.77783H3.88889H27" stroke="#CD0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M24.1111 6.77778V27C24.1111 27.7662 23.8068 28.501 23.265 29.0428C22.7232 29.5845 21.9884 29.8889 21.2222 29.8889H6.7778C6.01162 29.8889 5.27682 29.5845 4.73505 29.0428C4.19328 28.501 3.88892 27.7662 3.88892 27V6.77778M8.22225 6.77778V3.88889C8.22225 3.12271 8.52661 2.38791 9.06839 1.84614C9.61016 1.30436 10.345 1 11.1111 1H16.8889C17.6551 1 18.3899 1.30436 18.9317 1.84614C19.4734 2.38791 19.7778 3.12271 19.7778 3.88889V6.77778" stroke="#CD0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M11.1111 14V22.6667" stroke="#CD0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.8889 14V22.6667" stroke="#CD0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal title changes based on edit/create */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              {selectedUser ? 'Edit User' : 'Add User'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Role</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {selectedUser ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;