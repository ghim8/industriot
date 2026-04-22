import React, { createContext, useState, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  );

  const login = async (email, mot_de_passe) => {
    const res = await api.post('/login', { email, mot_de_passe });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
  try {
    await api.post('/logout');
  } catch(e) {
    // ignore l'erreur
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }
};

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}