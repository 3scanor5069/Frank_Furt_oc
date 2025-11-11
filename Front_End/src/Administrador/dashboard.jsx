import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, ShoppingCart, DollarSign, TrendingUp, Menu, X, Home, Package, FileText, Settings, Bell, UtensilsCrossed, History, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import HeaderDashboard from '../components/HeaderDashboard';
import 'react-toastify/dist/ReactToastify.css';
import './dashboard.css';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState({ name: 'Admin', avatar: 'A' });
  const navigate = useNavigate();

  // Estados para los datos del dashboard
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalOrders: 0,
    dailyRevenue: 0,
    weeklyOrders: 0
  });
  
  const [monthlySales, setMonthlySales] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [newUsers, setNewUsers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  const API_BASE_URL = 'http://localhost:3006/api';

  // 🔥 FUNCIÓN PARA OBTENER USUARIO ACTUAL DESDE TOKEN JWT
  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/users/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Failed to verify token');
      }

      const data = await res.json();
      
      // Extraer nombre del usuario desde la respuesta
      const userName = data.user?.nombre || data.nombre || 'Admin';
      const userRole = data.user?.rol || data.rol || 'administrador';
      
      setCurrentUser({
        name: userName.split(' ')[0], // Solo el primer nombre
        fullName: userName,
        role: userRole,
        avatar: userName.charAt(0).toUpperCase()
      });

    } catch (error) {
      console.error('Error fetching current user:', error);
      // Mantener valores por defecto si falla
      setCurrentUser({ name: 'Admin', avatar: 'A' });
    }
  }, [API_BASE_URL]);

  // Función reutilizable para fetch con manejo de errores
  const fetchData = useCallback(async (endpoint) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!res.ok) {
        const text = await res.text();
        console.error(`HTTP ${res.status} ${endpoint}:`, text);
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }, [API_BASE_URL]);

  // Datos de fallback para desarrollo
  const fallbackData = useMemo(() => ({
    metrics: {
      totalUsers: 1248,
      totalOrders: 342,
      dailyRevenue: 56020,
      weeklyOrders: 164
    },
    monthlySales: [
      { day: '1', ventas: 15000 },
      { day: '5', ventas: 18000 },
      { day: '10', ventas: 22000 },
      { day: '15', ventas: 19000 },
      { day: '20', ventas: 25000 },
      { day: '25', ventas: 28000 },
      { day: '30', ventas: 32000 }
    ],
    weeklySales: [
      { day: 'Lun', ventas: 4500 },
      { day: 'Mar', ventas: 5200 },
      { day: 'Mié', ventas: 4800 },
      { day: 'Jue', ventas: 6100 },
      { day: 'Vie', ventas: 7300 },
      { day: 'Sáb', ventas: 8900 },
      { day: 'Dom', ventas: 6800 }
    ],
    newUsers: [
      { semana: 'Sem 1', usuarios: 45 },
      { semana: 'Sem 2', usuarios: 52 },
      { semana: 'Sem 3', usuarios: 38 },
      { semana: 'Sem 4', usuarios: 67 }
    ],
    topProducts: [
      { name: 'Hamburguesa Clásica', value: 35, color: '#FF6B6B' },
      { name: 'Papas Fritas', value: 25, color: '#4ECDC4' },
      { name: 'Hot Dog Especial', value: 20, color: '#45B7D1' },
      { name: 'Bebidas', value: 15, color: '#96CEB4' },
      { name: 'Otros', value: 5, color: '#FFEAA7' }
    ],
    recentUsers: [
      { id: 1, name: 'Juan Pérez', email: 'juan@email.com', date: '2024-06-29', status: 'Activo' },
      { id: 2, name: 'María García', email: 'maria@email.com', date: '2024-06-29', status: 'Activo' },
      { id: 3, name: 'Carlos López', email: 'carlos@email.com', date: '2024-06-28', status: 'Activo' },
      { id: 4, name: 'Ana Martínez', email: 'ana@email.com', date: '2024-06-28', status: 'Pendiente' },
      { id: 5, name: 'Luis Rodríguez', email: 'luis@email.com', date: '2024-06-27', status: 'Activo' },
      { id: 6, name: 'Carmen Silva', email: 'carmen@email.com', date: '2024-06-27', status: 'Activo' },
      { id: 7, name: 'Pedro González', email: 'pedro@email.com', date: '2024-06-26', status: 'Activo' },
      { id: 8, name: 'Laura Díaz', email: 'laura@email.com', date: '2024-06-26', status: 'Inactivo' },
      { id: 9, name: 'Miguel Torres', email: 'miguel@email.com', date: '2024-06-25', status: 'Activo' },
      { id: 10, name: 'Sofia Herrera', email: 'sofia@email.com', date: '2024-06-25', status: 'Activo' }
    ]
  }), []);

  // 🚀 CARGA PARALELA DE DATOS CON Promise.all
  const loadDashboardData = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);

      // Carga paralela de todos los datos
      const [
        metricsData,
        monthlySalesData,
        weeklySalesData,
        newUsersData,
        topProductsData,
        recentUsersData
      ] = await Promise.all([
        fetchData('/dashboard/metrics'),
        fetchData('/dashboard/monthly-sales'),
        fetchData('/dashboard/weekly-sales'),
        fetchData('/dashboard/new-users'),
        fetchData('/dashboard/top-products'),
        fetchData('/dashboard/recent-users')
      ]);

      setMetrics(metricsData);
      setMonthlySales(monthlySalesData);
      setWeeklySales(weeklySalesData);
      setNewUsers(newUsersData);
      setTopProducts(topProductsData);
      setRecentUsers(recentUsersData);

      // Toast solo si es refresh manual
      if (showToast) {
        toast.success('📊 Dashboard actualizado correctamente', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      }

    } catch (error) {
      console.error('Dashboard data loading error:', error);
      setError('Error al cargar los datos del dashboard');
      
      // Usar datos de fallback
      setMetrics(fallbackData.metrics);
      setMonthlySales(fallbackData.monthlySales);
      setWeeklySales(fallbackData.weeklySales);
      setNewUsers(fallbackData.newUsers);
      setTopProducts(fallbackData.topProducts);
      setRecentUsers(fallbackData.recentUsers);

      if (showToast) {
        toast.warning('⚠️ Usando datos de ejemplo (Backend no disponible)', {
          position: "top-right",
          autoClose: 4000
        });
      }
    } finally {
      setLoading(false);
    }
  }, [fetchData, fallbackData]);

  // Carga inicial (SIN toast para evitar parpadeo)
  useEffect(() => {
    const initDashboard = async () => {
      await fetchCurrentUser();
      await loadDashboardData(false); // false = no mostrar toast
    };
    initDashboard();
  }, [fetchCurrentUser, loadDashboardData]);

  // 🔄 Refresh manual (CON toast)
  const handleRefresh = useCallback(() => {
    loadDashboardData(true); // true = mostrar toast
  }, [loadDashboardData]);

  // Navegación
  const handleNavigation = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  // Items del menú
  const menuItems = useMemo(() => [
    { icon: Home, label: 'Dashboard', active: true, path: '/dashboard' },
    { icon: Users, label: 'Usuarios', path: '/UsersCrud' },
    { icon: ShoppingCart, label: 'Pedidos', path: '/OrderManagementPage' },
    { icon: UtensilsCrossed, label: 'Menú', path: '/MenuCrud' },
    { icon: Package, label: 'Inventario', path: '/InventoryCrud' },
    { icon: FileText, label: 'Reportes', path: '/reports' },
    
  ], []);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Toast Container */}
      <ToastContainer limit={3} />

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="logo">
          <h2 className="logo-text">🍔 Frank Furt</h2>
          <p className="logo-subtext">Panel Administrativo</p>
        </div>
        
        <nav className="nav">
          {menuItems.map((item, index) => (
            <a 
              key={index} 
              href="#" 
              className={`nav-item ${item.active ? 'nav-item-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(item.path);
              }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <div className="main-content-dash">
        {/* Header */}
        <HeaderDashboard/>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={handleRefresh}>Reintentar</button>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon users-icon">
              <Users size={24} />
            </div>
            <div className="metric-content">
              <h3 className="metric-value">{metrics.totalUsers.toLocaleString()}</h3>
              <p className="metric-label">Usuarios Registrados</p>
              <span className="metric-change positive">+12% vs mes anterior</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon orders-icon">
              <ShoppingCart size={24} />
            </div>
            <div className="metric-content">
              <h3 className="metric-value">{metrics.totalOrders}</h3>
              <p className="metric-label">Pedidos Hoy</p>
              <span className="metric-change positive">+8% vs ayer</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon revenue-icon">
              <DollarSign size={24} />
            </div>
            <div className="metric-content">
              <h3 className="metric-value">${metrics.dailyRevenue.toLocaleString()}</h3>
              <p className="metric-label">Ingresos del Día</p>
              <span className="metric-change positive">+15% vs ayer</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon weekly-icon">
              <TrendingUp size={24} />
            </div>
            <div className="metric-content">
              <h3 className="metric-value">{metrics.weeklyOrders}</h3>
              <p className="metric-label">Pedidos Semana</p>
              <span className="metric-change positive">+5% vs semana anterior</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          {/* Monthly Sales */}
          <div className="chart-card">
            <h3 className="chart-title">Ventas del Último Mes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                />
                <Line 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#4ECDC4" 
                  strokeWidth={3}
                  dot={{ fill: '#4ECDC4', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Sales */}
          <div className="chart-card">
            <h3 className="chart-title">Ventas de la Semana</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                />
                <Bar dataKey="ventas" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* New Users */}
          <div className="chart-card">
            <h3 className="chart-title">Usuarios Nuevos (Último Mes)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={newUsers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="semana" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [value, 'Usuarios']}
                />
                <Bar dataKey="usuarios" fill="#45B7D1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products */}
          <div className="chart-card">
            <h3 className="chart-title">Productos Más Vendidos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value}%`, 'Porcentaje']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-chart-legend">
              {topProducts.map((item, index) => (
                <div key={index} className="legend-item">
                  <div className="legend-color" style={{backgroundColor: item.color}}></div>
                  <span className="legend-text">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="table-card-dash">
          <h3 className="table-title">Últimos 10 Usuarios Registrados</h3>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr className="table-header">
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Fecha de Registro</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.date}</td>
                    <td>
                      <span className={`status-badge status-${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;