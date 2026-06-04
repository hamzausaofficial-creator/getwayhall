import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import BookingCalendar from './pages/BookingCalendar';
import HallManagement from './pages/HallManagement';
import CustomerManagement from './pages/CustomerManagement';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import ExpenseDetail from './pages/ExpenseDetail';
import Staff from './pages/Staff';
import Inventory from './pages/Inventory';
import InventoryDetail from './pages/InventoryDetail';
import DecorationPackages from './pages/DecorationPackages';
import DecorationPackageDetail from './pages/DecorationPackageDetail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import PrintDocument from './pages/PrintDocument';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';

import { useAuth } from './context/AuthContext';
import { AdminRoute, ManagerRoute, StaffBlockedRoute } from './components/RoleRoute';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <div className="flex h-screen items-center justify-center">Loading profile...</div>;

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        
        <Route path="/print/:bookingId" element={<ProtectedRoute><PrintDocument /></ProtectedRoute>} />
        
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<StaffBlockedRoute><Overview /></StaffBlockedRoute>} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/:bookingId" element={<BookingDetail />} />
          <Route path="/calendar" element={<BookingCalendar />} />
          <Route path="/halls" element={<HallManagement />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/expenses" element={<ManagerRoute><Expenses /></ManagerRoute>} />
          <Route path="/expenses/:expenseId" element={<ManagerRoute><ExpenseDetail /></ManagerRoute>} />
          <Route path="/staff" element={<AdminRoute><Staff /></AdminRoute>} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/:itemId" element={<InventoryDetail />} />
          <Route path="/decoration-packages" element={<DecorationPackages />} />
          <Route path="/decoration-packages/:packageId" element={<DecorationPackageDetail />} />
          <Route path="/reports" element={<ManagerRoute><Reports /></ManagerRoute>} />
          <Route path="/notifications" element={<ManagerRoute><Notifications /></ManagerRoute>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
