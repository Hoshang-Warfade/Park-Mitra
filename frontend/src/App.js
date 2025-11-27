// Main App Component with Routing
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';

// Layout Components
import ErrorBoundary from './components/Common/ErrorBoundary';
import Navbar from './components/Common/Navbar';
import Footer from './components/Common/Footer';
import ProtectedRoute from './components/Common/ProtectedRoute';
import ScrollToTop from './components/Common/ScrollToTop';

// Auth Components
import Login from './components/Auth/Login';
import MemberLogin from './components/Auth/MemberLogin';
import AdminLogin from './components/Auth/AdminLogin';
import Register from './components/Auth/Register';
import OrganizationRegister from './components/Auth/OrganizationRegister';

// Dashboard Components
import UserDashboard from './components/Dashboard/UserDashboard';
import OrgAdminDashboard from './components/Admin/OrgAdminDashboard';
import WatchmanDashboard from './components/Watchman/WatchmanDashboard';
import DashboardRedirect from './components/Common/DashboardRedirect';
import Settings from './components/Dashboard/Settings';
import HelpSupport from './components/Dashboard/HelpSupport';

// Booking Components
import BookingForm from './components/Booking/BookingForm';
import PayPenaltyAndRebook from './components/Booking/PayPenaltyAndRebook';
import BookingList from './components/Booking/BookingList';

// Payment Components
import PaymentSimulation from './components/Payment/PaymentSimulation';
import PaymentHistory from './components/Payment/PaymentHistory';

// QR Code Components
import QRCodeDisplay from './components/QRCode/QRCodeDisplay';

// Informal Parking
import StreetParkingFinder from './components/InformalParking/StreetParkingFinder';

// Other Components
import LandingPage from './components/Landing/LandingPage';
import UserProfile from './components/Profile/UserProfile';
import NotFound from './components/Common/NotFound';

import './App.css';

// Layout wrapper to conditionally show Navbar
const AppLayout = () => {
  const location = useLocation();
  
  // Hide navbar on auth pages
  const hideNavbar = ['/login', '/member-login', '/admin-login', '/register', '/register-organization'].includes(location.pathname);
  
  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/member-login" element={<MemberLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-organization" element={<OrganizationRegister />} />
          
          {/* Protected Routes - Dashboard (Redirects based on user type) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />
          
          {/* User Dashboard - For regular users */}
          <Route path="/user/dashboard" element={
            <ProtectedRoute allowedUserTypes={['organization_member', 'visitor', 'walk_in']}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          
          {/* Admin Dashboard - Requires Admin */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute requiresAdmin={true}>
              <OrgAdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Admin Dashboard - Alternative Route */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiresAdmin={true}>
              <OrgAdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Watchman Dashboard - Watchman Only */}
          <Route path="/watchman-dashboard" element={
            <ProtectedRoute allowedUserTypes={['watchman']}>
              <WatchmanDashboard />
            </ProtectedRoute>
          } />
          
          {/* Watchman Dashboard - Alternative Route */}
          <Route path="/watchman/dashboard" element={
            <ProtectedRoute allowedUserTypes={['watchman']}>
              <WatchmanDashboard />
            </ProtectedRoute>
          } />
          
          {/* Booking Routes - Authenticated Users */}
          <Route path="/book-parking" element={
            <ProtectedRoute>
              <BookingForm />
            </ProtectedRoute>
          } />
          
          <Route path="/my-bookings" element={
            <ProtectedRoute>
              <BookingList />
            </ProtectedRoute>
          } />
          
          <Route path="/booking/:id/qr" element={
            <ProtectedRoute>
              <QRCodeDisplay />
            </ProtectedRoute>
          } />
          
          <Route path="/pay-penalty/:bookingId" element={
            <ProtectedRoute>
              <PayPenaltyAndRebook />
            </ProtectedRoute>
          } />
          
          {/* Payment Routes - Visitor Only */}
          <Route path="/payment/:bookingId" element={
            <ProtectedRoute allowedUserTypes={['visitor']}>
              <PaymentSimulation />
            </ProtectedRoute>
          } />
          
          {/* Informal Parking - Authenticated */}
          <Route path="/informal-parking" element={
            <ProtectedRoute>
              <StreetParkingFinder />
            </ProtectedRoute>
          } />
          
          {/* Profile - Authenticated */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          
          {/* Settings - Authenticated */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* Help & Support - Authenticated */}
          <Route path="/help-support" element={
            <ProtectedRoute>
              <HelpSupport />
            </ProtectedRoute>
          } />
          
          {/* Payment History - Authenticated */}
          <Route path="/payment-history" element={
            <ProtectedRoute>
              <PaymentHistory />
            </ProtectedRoute>
          } />
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BookingProvider>
          <BrowserRouter>
            <ScrollToTop />
            <div className="App min-h-screen flex flex-col">
              <AppLayout />
            </div>
            
            {/* Toast Notifications */}
            <ToastContainer 
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </BrowserRouter>
        </BookingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
