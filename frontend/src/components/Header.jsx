import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Settings, LogOut } from 'lucide-react';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-600 lg:hidden dark:text-gray-400"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-600 dark:text-gray-400">
            <Bell size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
            >
              <User size={20} />
              <span>{user.full_name}</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 dark:bg-gray-700">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <Settings size={16} className="mr-2" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-red-600 hover:bg-gray-100 w-full dark:hover:bg-gray-600"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;