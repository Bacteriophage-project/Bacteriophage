import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';

const ProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const [showMessage, setShowMessage] = useState(false);

  const useAuth = process.env.REACT_APP_USE_AUTH === 'true';

  useEffect(() => {
    if (!loading && useAuth && !user) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, useAuth]);

  if (loading) return <div>Loading...</div>;

  if (useAuth && !user) {
    return showMessage ? (
      <div className="login-warning" style={{ textAlign: 'center', marginTop: '100px', fontSize: '1.2rem' }}>
        🔒 Please log in to access this page.
      </div>
    ) : (
      <Navigate to="/" replace />
    );
  }

  return children;
};

export default ProtectedRoute;
