import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // Au démarrage, vérifier que le token est toujours valide
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser && !user) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (emailOrUser, passwordOrToken) => {
    if (typeof emailOrUser === 'object') {
      setUser(emailOrUser);
      localStorage.setItem('user', JSON.stringify(emailOrUser));
      return;
    }
    const res = await api.post('/login', { email: emailOrUser, mot_de_passe: passwordOrToken });
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  };
  const [entreprise, setEntreprise] = useState(() => {
  try {
    const stored = localStorage.getItem('user');
    const u = stored ? JSON.parse(stored) : null;
    return u?.entreprise || null;
  } catch { return null; }
});

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try { await api.post('/logout'); } catch(e) {}
    finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('activePage');
      setUser(null);
      api.post('/logout').catch(() => {});
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}