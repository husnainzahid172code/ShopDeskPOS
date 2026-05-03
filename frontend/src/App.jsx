// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout       from './components/Layout/Layout';
import LoginPage    from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import Dashboard    from './components/Dashboard/Dashboard';
import InventoryPage from './components/Inventory/InventoryPage';
import POSPage      from './components/POS/POSPage';
import InvoicePage  from './components/Invoice/InvoicePage';
import ExpensePage  from './components/Expenses/ExpensePage';
import ReportsPage  from './components/Reports/ReportsPage';
import UsersPage    from './components/Users/UsersPage';
import './styles/global.css';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="spinner" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login"    element={!user ? <LoginPage />    : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index          element={<Dashboard />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="pos"       element={<POSPage />} />
        <Route path="invoices"  element={<InvoicePage />} />
        <Route path="expenses"  element={<ExpensePage />} />
        <Route path="reports"   element={<ReportsPage />} />
        <Route path="users"     element={<PrivateRoute adminOnly><UsersPage /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
