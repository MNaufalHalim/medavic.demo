import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="flex w-screen size-dvh bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-white border-b border-gray-200">
          <Navbar />
        </div>
        
        <main className="px-0 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;