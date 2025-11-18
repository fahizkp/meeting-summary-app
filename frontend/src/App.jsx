import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import MeetingForm from './components/MeetingForm';
import MeetingReport from './components/MeetingReport';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { logout, getUser } from './services/auth';

// Layout component for authenticated pages
const AuthenticatedLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname === '/report' ? 'report' : 'form');
  const user = getUser();

  useEffect(() => {
    // Update active tab when route changes
    if (location.pathname === '/report') {
      setActiveTab('report');
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
    } else {
      navigate('/');
    }
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #ecf0f1',
        paddingBottom: '10px'
      }}>
        <div style={{ display: 'flex' }}>
          <button
            onClick={() => handleTabChange('form')}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              backgroundColor: activeTab === 'form' ? '#3498db' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'Noto Sans Malayalam, sans-serif',
              fontSize: '1rem',
            }}
          >
            മീറ്റിംഗ് ഫോം (Meeting Form)
          </button>
          <button
            onClick={() => handleTabChange('report')}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              backgroundColor: activeTab === 'report' ? '#3498db' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'Noto Sans Malayalam, sans-serif',
              fontSize: '1rem',
            }}
          >
            റിപ്പോർട്ട് (Report)
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user && (
            <span style={{ color: '#7f8c8d', fontSize: '14px' }}>
              {user.username}
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'Noto Sans Malayalam, sans-serif',
              fontSize: '0.9rem',
            }}
          >
            ലോഗൗട്ട് (Logout)
          </button>
        </div>
      </div>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

