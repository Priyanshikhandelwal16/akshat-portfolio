import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider, useAdmin } from './context/AdminContext';

// Public components
import PortfolioHome from './components/PortfolioHome';

// Admin CMS components
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';

// Route helper to enforce session protection
const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAdmin();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-bg-darker flex items-center justify-center font-mono text-accent text-xs">
        AUTHENTICATING...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <AdminProvider>
      <Router>
        <Routes>
          {/* Public Website */}
          <Route path="/" element={<PortfolioHome />} />

          {/* Secure Admin Dashboard */}
          <Route path="/admin/login" element={<AdminLoginRouteGuard />} />
          
          <Route 
            path="/admin/*" 
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } 
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AdminProvider>
  );
}

// Redirects authenticated admin users directly to dashboard
const AdminLoginRouteGuard = () => {
  const { isAuthenticated, loading } = useAdmin();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-bg-darker flex items-center justify-center font-mono text-accent text-xs">
        AUTHENTICATING...
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/admin" replace /> : <AdminLogin />;
};

export default App;
