// src/App.js
import './index.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

// Pages
import PaginaPrincipal from './pages/PaginaPrincipal';
import Login from './pages/Login';
import Register from './pages/Register';
import AboutPage from './pages/AboutPage';
import MenuPage from './pages/MenuPage';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';

import MenuDetail from './pages/MenuDetail';
import CartPage from './pages/CartPage'; 
import TeamPage from './pages/TeamPage';
import ServicesPage from './pages/ServicesPage';
import MiPerfil from './pages/MiPerfil';
import SeleccionMesas from './pages/SeleccionMesas';
import RegistroOrden from './pages/RegistroOrden';

// Components
import Ubications from './components/Ubications';
import EditarPerfil from './components/Editarperfil';
import DashboardBar from './components/DashboardBar';

// Admin
import FoodChainDashboard from './Administrador/dashboard';
import MenuCrud from './Administrador/MenuCrud';
import UsersCrud from './Administrador/UsersCrud';
import InventoryCrud from './Administrador/InventoryCrud';
import ManualSale from './Administrador/ManualSale';
import InventoryHistory from './Administrador/InventoryHistory';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Rutas del Dashboard Admin */}
            <Route path="/" element={<FoodChainDashboard />} />
            <Route path="/UsersCrud" element={<UsersCrud />} />
            <Route path="/MenuCrud" element={<MenuCrud />} />
            <Route path="/InventoryCrud" element={<InventoryCrud />} />
            <Route path="/ManualSale" element={<ManualSale />} />
            <Route path="/InventoryHistory" element={<InventoryHistory />} />
            <Route path="/DashboardBar" element={<DashboardBar />} />
            
            {/* Rutas Públicas */}
            <Route path="/p" element={<PaginaPrincipal />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
            <Route path="/ResetPassword" element={<ResetPassword />} />
            <Route path="/ForgotPassword" element={<ForgotPassword />} />
            <Route path="/Ubications" element={<Ubications />} />
            <Route path="/equipo" element={<TeamPage />} />
            <Route path="/servicios" element={<ServicesPage />} />
            
            {/* Rutas de Menú y Carrito */}
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/menu/:id" element={<MenuDetail />} />
            <Route path="/cart" element={<CartPage />} />
            
            {/* Rutas de Usuario Autenticado */}
            <Route path="/MiPerfil" element={<MiPerfil />} />
            <Route path="/EditarPerfil" element={<EditarPerfil />} />
            
            {/* Rutas de Mesas */}
            <Route path="/SeleccionMesas" element={<SeleccionMesas />} />
            <Route path="/RegistroOrden" element={<RegistroOrden />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;