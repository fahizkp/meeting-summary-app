import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, getUserAccessConfig } from '../services/auth';

/**
 * HomeRedirect component handles initial navigation logic based on user roles.
 * It determines the best default route for the current user and redirects them.
 */
const HomeRedirect = () => {
    const navigate = useNavigate();
    const user = getUser();
    const { defaultRoute } = getUserAccessConfig(user);

    useEffect(() => {
        if (user) {
            console.log(`Redirecting user ${user.username} to ${defaultRoute} based on roles:`, user.roles);
            navigate(defaultRoute, { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    }, [user, defaultRoute, navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontFamily: 'Anek Malayalam, sans-serif',
            background: 'var(--gray-50)'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--primary-light)',
                borderTop: '3px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
            }}></div>
            <p style={{ color: 'var(--gray-600)', fontWeight: '500' }}>പ്രവേശിക്കുന്നു...</p>
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default HomeRedirect;
