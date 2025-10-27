// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        // Decodificar el token para obtener los datos
        const decoded = jwtDecode(token);
        
        // Verificar si el token no ha expirado
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            id: decoded.id,
            nombre: decoded.nombre,
            rol: decoded.rol
          });
          setIsAuthenticated(true);
        } else {
          // Token expirado, limpiar
          logout();
        }
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token) => {
    try {
      // Guardar token
      localStorage.setItem('authToken', token);
      
      // Decodificar y establecer usuario
      const decoded = jwtDecode(token);
      setUser({
        id: decoded.id,
        nombreUsuario: decoded.nombre,
        rol: decoded.rol
      });
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};