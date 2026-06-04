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
import GuestHouseOverview from './pages/guesthouse/Overview';
import GuestHouseRooms from './pages/guesthouse/Rooms';
import RoomFormPage from './pages/guesthouse/RoomFormPage';
import GuestHouseStays from './pages/guesthouse/Stays';
import StayFormPage from './pages/guesthouse/StayFormPage';
import StayDetail from './pages/guesthouse/StayDetail';
import GuestHousePayments from './pages/guesthouse/Payments';
import PaymentFormPage from './pages/guesthouse/PaymentFormPage';
import GuestHouseExpenses from './pages/guesthouse/Expenses';
import ExpenseFormPage from './pages/guesthouse/ExpenseFormPage';
import GhPrintExpense from './pages/guesthouse/GhPrintExpense';
import StayCalendar from './pages/guesthouse/StayCalendar';
import GuestHouseReports from './pages/guesthouse/Reports';
import GhPrintStay from './pages/guesthouse/GhPrintStay';
import GhPrintPayment from './pages/guesthouse/GhPrintPayment';

import { useAuth } from './context/AuthContext';
import { AdminRoute, ManagerRoute, StaffBlockedRoute } from './components/RoleRoute';
import { MarriageHallRoute, GuestHouseRoute } from './components/AppTypeRoute';

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

        <Route
          path="/print/:bookingId"
          element={
            <ProtectedRoute>
              <MarriageHallRoute>
                <PrintDocument />
              </MarriageHallRoute>
            </ProtectedRoute>
          }
        />

        {/* Marriage Hall app */}
        <Route
          element={
            <ProtectedRoute>
              <MarriageHallRoute>
                <DashboardLayout />
              </MarriageHallRoute>
            </ProtectedRoute>
          }
        >
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

        {/* Guest House app — same shell UI as Marriage Hall */}
        <Route
          element={
            <ProtectedRoute>
              <GuestHouseRoute>
                <DashboardLayout />
              </GuestHouseRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/gh/dashboard" element={<StaffBlockedRoute><GuestHouseOverview /></StaffBlockedRoute>} />
          <Route path="/gh/stays/new" element={<StayFormPage />} />
          <Route path="/gh/stays/:stayId/edit" element={<StayFormPage />} />
          <Route path="/gh/stays" element={<GuestHouseStays />} />
          <Route path="/gh/stays/:stayId" element={<StayDetail />} />
          <Route path="/gh/calendar" element={<StayCalendar />} />
          <Route path="/gh/rooms/new" element={<RoomFormPage />} />
          <Route path="/gh/rooms/:roomId/edit" element={<RoomFormPage />} />
          <Route path="/gh/rooms" element={<GuestHouseRooms />} />
          <Route path="/gh/customers" element={<CustomerManagement />} />
          <Route path="/gh/payments/new" element={<PaymentFormPage />} />
          <Route path="/gh/payments/:paymentId/edit" element={<PaymentFormPage />} />
          <Route path="/gh/payments" element={<GuestHousePayments />} />
          <Route path="/gh/expenses/new" element={<ManagerRoute><ExpenseFormPage /></ManagerRoute>} />
          <Route path="/gh/expenses/:expenseId/edit" element={<ManagerRoute><ExpenseFormPage /></ManagerRoute>} />
          <Route path="/gh/expenses" element={<ManagerRoute><GuestHouseExpenses /></ManagerRoute>} />
          <Route path="/gh/reports" element={<ManagerRoute><GuestHouseReports /></ManagerRoute>} />
          <Route path="/gh/notifications" element={<ManagerRoute><Notifications /></ManagerRoute>} />
          <Route path="/gh/staff" element={<AdminRoute><Staff /></AdminRoute>} />
          <Route path="/gh/profile" element={<Profile />} />
          <Route path="/gh/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        </Route>

        <Route
          path="/gh/print/stay/:stayId"
          element={
            <ProtectedRoute>
              <GuestHouseRoute>
                <GhPrintStay />
              </GuestHouseRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gh/print/payment/:paymentId"
          element={
            <ProtectedRoute>
              <GuestHouseRoute>
                <GhPrintPayment />
              </GuestHouseRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gh/print/expense/:expenseId"
          element={
            <ProtectedRoute>
              <GuestHouseRoute>
                <GhPrintExpense />
              </GuestHouseRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gh/print/:stayId"
          element={
            <ProtectedRoute>
              <GuestHouseRoute>
                <GhPrintStay />
              </GuestHouseRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
