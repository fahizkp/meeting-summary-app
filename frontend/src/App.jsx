import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import MeetingForm from './components/MeetingForm';
import MeetingReport from './components/MeetingReport';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { logout, getUser } from './services/auth';

import Dashboard from './components/Dashboard';

// Layout component for authenticated pages
const AuthenticatedLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('form');
  const user = getUser();

  useEffect(() => {
    // Update active tab when route changes
    if (location.pathname === '/report') {
      setActiveTab('report');
    } else if (location.pathname === '/dashboard') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('form');
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'report') {
      navigate('/report');
    } else if (tab === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const navStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '24px',
      padding: '16px',
      background: 'var(--white)',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-md)',
    },
    tabsRow: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    tab: (isActive) => ({
      flex: '1',
      minWidth: '100px',
      padding: '12px 16px',
      background: isActive
        ? 'var(--primary)'
        : 'var(--gray-200)',
      color: isActive ? 'white' : 'var(--gray-600)',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontFamily: 'Anek Malayalam, sans-serif',
      fontSize: '0.9rem',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      boxShadow: isActive ? 'var(--shadow-cute)' : 'none',
    }),
    userRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: '12px',
      borderTop: '1px solid #e0e0e0',
    },
    username: {
      color: 'var(--primary)',
      fontSize: '14px',
      fontWeight: '500',
      background: 'var(--primary-light)',
      padding: '6px 12px',
      borderRadius: '20px',
    },
    logoutBtn: {
      padding: '10px 20px',
      background: 'var(--danger)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontFamily: 'Anek Malayalam, sans-serif',
      fontSize: '0.85rem',
      fontWeight: '600',
      transition: 'all 0.2s ease',
    },
  };

  return (
    <div>
      <nav style={navStyles.container}>
        <div style={navStyles.tabsRow}>
          <button
            onClick={() => handleTabChange('form')}
            style={navStyles.tab(activeTab === 'form')}
          >
            മീറ്റിംഗ് ഫോം
          </button>
          <button
            onClick={() => handleTabChange('report')}
            style={navStyles.tab(activeTab === 'report')}
          >
            റിപ്പോർട്ട്
          </button>
          <button
            onClick={() => handleTabChange('dashboard')}
            style={navStyles.tab(activeTab === 'dashboard')}
          >
            ഡാഷ്ബോർഡ്
          </button>
        </div>
        <div style={navStyles.userRow}>
          {user && (
            <span style={navStyles.username}>
              {user.username}
            </span>
          )}
          <button
            onClick={handleLogout}
            style={navStyles.logoutBtn}
          >
            ലോഗൗട്ട്
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <MeetingForm />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <MeetingReport />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Dashboard onNavigate={(id) => {
                // Navigation not fully implemented for view details from dashboard yet
                // But typically would go to report view with query param or specific route
                // For now, we'll re-use MeetingReport logic if possible or just navigate to report list
                // Since Routing doesn't support /report/:id directly in the definition above, we might need to adjust.
                // Actually MeetingReport listens to state or just shows list.
                // We can make Dashboard pass state to navigate.
              }} />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

