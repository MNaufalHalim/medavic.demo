import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Layout from './Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/dashboard/Dashboard';
// Master Data
import Pasien from '../pages/master/Pasien';
import Dokter from '../pages/master/Dokter';
import Obat from '../pages/master/Obat';
import Tindakan from '../pages/master/Tindakan';
import Poli from '../pages/master/Poli';
// Rekam Medis
import InputRM from '../pages/rm/InputRM';
import RiwayatRM from '../pages/rm/RiwayatRM';
import Diagnosa from '../pages/rm/Diagnosa';
// Admin
import UserManagement from '../pages/admin/UserManagement';
import RoleManagement from '../pages/admin/RoleManagement';
import MenuManagement from '../pages/admin/MenuManagement';
import RawatJalan from '../pages/pendaftaran/rawat-jalan';
import ResepObat from '../pages/billing/resep-obat';
import Pembayaran from '../pages/billing/pembayaran';
import ErrorBoundary from './ErrorBoundary';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes - All routes except login */}
      <Route path="/*" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Master Data Routes */}
        <Route path="master">
          <Route path="pasien" element={<Pasien />} />
          <Route path="dokter" element={<Dokter />} />
          <Route path="obat" element={<Obat />} />
          <Route path="tindakan" element={<Tindakan />} />
          <Route path="poli" element={<Poli />} />
        </Route>

        {/* Rekam Medis Routes */}
        <Route path="rm">
          <Route path="input" element={<ErrorBoundary><InputRM /></ErrorBoundary>} />
          <Route path="history" element={<RiwayatRM />} />
          <Route path="diagnosa" element={<Diagnosa />} />
        </Route>

        {/* Pendaftaran Routes */}
        <Route path="pendaftaran">
          <Route path="rawat-jalan" element={<RawatJalan />} />
        </Route>

        {/* Billing Routes */}
        <Route path="billing">
          <Route path="resep-obat" element={<ResepObat />} />
          <Route path="pembayaran" element={<Pembayaran />} />
          {/* <Route index element={<Navigate to="resep-obat" replace />} /> */}
        </Route>

        {/* Settings/Admin Routes */}
        <Route path="settings">
          <Route path="user" element={<UserManagement />} />
          <Route path="role" element={<RoleManagement />} />
          <Route path="menu" element={<MenuManagement />} />
        </Route>

        {/* Redirect /admin/users to /settings/user */}
        <Route path="admin/users" element={<Navigate to="/settings/user" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;