import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const DashboardLayout = ({ children }) => {
  const [menus, setMenus] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndMenus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const userResponse = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUser(userResponse.data.data);

        const menuResponse = await axios.get(`http://localhost:5000/api/role-permissions/${userResponse.data.data.role_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMenus(menuResponse.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        navigate('/login');
      }
    };

    fetchUserAndMenus();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-4">
          <h1 className="text-2xl font-bold">MEDAVIC</h1>
          <p className="text-sm text-gray-400">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.role?.name}</p>
        </div>
        <nav className="mt-8">
          {menus.map((menu) => (
            <Link
              key={menu.id}
              to={menu.route}
              className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700"
            >
              <i className={`fas fa-${menu.icon} mr-3`}></i>
              {menu.name}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-4">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;