import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ChangerMdp from './pages/ChangerMdp';
import Dashboard from './pages/Dashboard'; // ta page principale

function PrivateRoute({ children }) {
  const { user } = useAuth();

  // Vérifier aussi le localStorage directement
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const token      = localStorage.getItem('token');

  // Pas connecté du tout
  if (!user && (!storedUser || !token)) {
    return <Navigate to="/login" />;
  }

  const currentUser = user || storedUser;

  if (currentUser?.role !== 'super_admin' && currentUser?.mdp_change === 0) {
    return <Navigate to="/changer-mdp" />;
  }
  
  // Changement mdp forcé
  if (currentUser?.mdp_change === 0) {
    return <Navigate to="/changer-mdp" />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"       element={<Login />} />
      <Route path="/changer-mdp" element={<ChangerMdp />} />
      <Route path="/*" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}