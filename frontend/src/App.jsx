import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AddProperty from './pages/AddProperty';
import PropertyDetail from './pages/PropertyDetail';
import MyProperties from './pages/MyProperties';
import MyInquiries from './pages/MyInquiries';
import MyMaintenance from './pages/MyMaintenance';
import Profile from './pages/Profile';
import GuestMaintenance from './pages/GuestMaintenance';
import MyTransactions from './pages/MyTransactions';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <ProtectedRoute requiredRole={null} requireUnauthenticated={true} fallbackPath="/dashboard">
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/guest-maintenance" element={<GuestMaintenance />} />

            {/* User Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/add-property" element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <AddProperty />
              </ProtectedRoute>
            } />
            <Route path="/my-properties" element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <MyProperties />
              </ProtectedRoute>
            } />
            <Route path="/my-inquiries" element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <MyInquiries />
              </ProtectedRoute>
            } />
            <Route path="/my-maintenance" element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <MyMaintenance />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/my-transactions" element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <MyTransactions />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Maintenance Routes */}
            <Route path="/maintenance-dashboard" element={
              // Maintenance dashboard allowed for MAINTENANCE roles
              <ProtectedRoute requiredRole="ROLE_MAINTENANCE">
                <MaintenanceDashboard />
              </ProtectedRoute>
            } />

            {/* Fallback Catch-All / Not Found Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
