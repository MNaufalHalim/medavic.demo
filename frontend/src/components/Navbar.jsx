import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown, Bell } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userString = localStorage.getItem('user');
  const user = userString && userString !== 'undefined' ? JSON.parse(userString) : null;

  useEffect(() => {
    // Cek token saat komponen dimount
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Tambahkan interceptor untuk axios
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('permissions');
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    navigate('/login');
  };

  return (
    <div className="flex justify-between items-center h-full px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="search"
            placeholder="Search..."
            className="w-96 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-50 rounded-full">
          <Bell size={20} className="text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-50 rounded-full">
          <Settings size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-gray-700">{user?.full_name}</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;