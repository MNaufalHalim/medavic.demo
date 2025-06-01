import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import Layout from '../../components/Layout';
import { Shield, Save, Plus, Edit2, Trash2 } from 'lucide-react';

const RolePrivilegeManagement = () => {
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [privileges, setPrivileges] = useState({});
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchRolesAndMenus();
  }, []);

  const fetchRolesAndMenus = async () => {
    try {
      const [rolesRes, menusRes] = await Promise.all([
        axios.get(`${config.apiUrl}/roles`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${config.apiUrl}/menus`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setRoles(rolesRes.data.data);
      setMenus(menusRes.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchPrivileges = async (roleId) => {
    try {
      const response = await axios.get(`${config.apiUrl}/roles/${roleId}/privilege`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPrivileges(response.data.data);
    } catch (error) {
      console.error('Error fetching privileges:', error);
    }
  };

  const handleRoleSelect = (role) => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Continue anyway?')) {
        setSelectedRole(role);
        fetchPrivileges(role.id);
        setHasUnsavedChanges(false);
      }
    } else {
      setSelectedRole(role);
      fetchPrivileges(role.id);
    }
  };

  const handlePrivilegeChange = (menuId, privilege) => {
    setPrivileges(prev => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        [privilege]: !prev[menuId][privilege]
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSavePrivileges = async () => {
    try {
      // Transform privileges object into array format expected by the API
      const privilegeArray = Object.entries(privileges).map(([menuId, privs]) => ({
        menu_id: parseInt(menuId),
        can_view: privs.can_view ? 1 : 0,
        can_create: privs.can_create ? 1 : 0,
        can_edit: privs.can_edit ? 1 : 0,
        can_delete: privs.can_delete ? 1 : 0,
        can_access: privs.can_access ? 1 : 0
      }));

      await axios.post(
        `${config.apiUrl}/roles/${selectedRole.id}/privileges`,
        { privileges: privilegeArray },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setHasUnsavedChanges(false);
      alert('Privileges saved successfully');
    } catch (error) {
      console.error('Error saving privileges:', error);
      alert('Error saving privileges');
    }
  };

  return (
    <Layout>
      <div className="flex h-full">
        {/* Role Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 p-4 border-r dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Roles</h2>
            <button
              onClick={() => setShowRoleModal(true)}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
            >
              <Plus size={20} />
            </button>
          </div>
          {roles.map(role => (
            <div
              key={role.id}
              onClick={() => handleRoleSelect(role)}
              className={`p-3 rounded-lg cursor-pointer mb-2 ${
                selectedRole?.id === role.id
                  ? 'bg-blue-50 dark:bg-blue-900'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Shield size={18} className="mr-2" />
                <span className="dark:text-white">{role.name}</span>
                {role.is_system && (
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    System
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Privileges Panel */}
        <div className="flex-1 p-6">
          {selectedRole ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white">
                  {selectedRole.name} Privileges
                </h2>
                <button
                  onClick={handleSavePrivileges}
                  disabled={!hasUnsavedChanges}
                  className={`flex items-center px-4 py-2 rounded ${
                    hasUnsavedChanges
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save size={18} className="mr-2" />
                  Save Changes
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="text-left border-b dark:border-gray-700">
                    <th className="p-3 dark:text-gray-300">Menu</th>
                    <th className="p-3 dark:text-gray-300">View</th>
                    <th className="p-3 dark:text-gray-300">Create</th>
                    <th className="p-3 dark:text-gray-300">Edit</th>
                    <th className="p-3 dark:text-gray-300">Delete</th>
                    <th className="p-3 dark:text-gray-300">Access</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.map(menu => (
                    <tr key={menu.id} className="border-b dark:border-gray-700">
                      <td className="p-3 dark:text-gray-300">{menu.menu_name}</td>
                      {['view', 'create', 'edit', 'delete', 'access'].map(privilege => (
                        <td key={privilege} className="p-3">
                          <input
                            type="checkbox"
                            checked={privileges[menu.id]?.[`can_${privilege}`] || false}
                            onChange={() => handlePrivilegeChange(menu.id, `can_${privilege}`)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
              Select a role to manage privileges
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RolePrivilegeManagement;