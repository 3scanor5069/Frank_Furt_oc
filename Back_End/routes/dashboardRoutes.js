const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// ============================================================================
// DASHBOARD ROUTES - FRANK FURT
// ============================================================================
// Base URL: /api/dashboard
// Puerto: 3006
// Ejemplo completo: http://localhost:3006/api/dashboard/metrics
// ============================================================================

// ========================= RUTAS PRINCIPALES =========================

// GET /api/dashboard/metrics
// Retorna métricas principales del dashboard
// Response: { totalUsers, totalOrders, dailyRevenue, weeklyOrders }
router.get('/metrics', dashboardController.getMetrics);

// GET /api/dashboard/monthly-sales
// Retorna ventas de los últimos 30 días agrupadas por día
// Response: [{ day: '01', ventas: 15000 }, ...]
router.get('/monthly-sales', dashboardController.getMonthlySales);

// GET /api/dashboard/weekly-sales
// Retorna ventas de los últimos 7 días agrupadas por día de la semana
// Response: [{ day: 'Lun', ventas: 4500 }, ...]
router.get('/weekly-sales', dashboardController.getWeeklySales);

// GET /api/dashboard/new-users
// Retorna usuarios nuevos de las últimas 4 semanas
// Response: [{ semana: 'Sem 1', usuarios: 45 }, ...]
router.get('/new-users', dashboardController.getNewUsers);

// GET /api/dashboard/top-products
// Retorna los 5 productos más vendidos del último mes
// Response: [{ name: 'Hamburguesa', value: 35, color: '#FF6B6B' }, ...]
router.get('/top-products', dashboardController.getTopProducts);

// GET /api/dashboard/recent-users
// Retorna los últimos 10 usuarios registrados
// Response: [{ id, name, email, date, status }, ...]
router.get('/recent-users', dashboardController.getRecentUsers);

// GET /api/dashboard/comparisons (OPCIONAL)
// Retorna comparaciones entre períodos (mes actual vs anterior, etc.)
// Response: { users: {...}, revenue: {...}, orders: {...} }
router.get('/comparisons', dashboardController.getComparisons);

// ========================= RUTA DE PRUEBA =========================

// GET /api/dashboard
// Ruta de prueba para verificar que el módulo de dashboard funciona
router.get('/', (req, res) => {
  res.json({
    message: '✅ Dashboard API funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      metrics: 'GET /api/dashboard/metrics',
      monthlySales: 'GET /api/dashboard/monthly-sales',
      weeklySales: 'GET /api/dashboard/weekly-sales',
      newUsers: 'GET /api/dashboard/new-users',
      topProducts: 'GET /api/dashboard/top-products',
      recentUsers: 'GET /api/dashboard/recent-users',
      comparisons: 'GET /api/dashboard/comparisons (opcional)'
    },
    status: 'active',
    database: 'frank_furt',
    port: 3006
  });
});

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

console.log('✅ Dashboard routes cargadas');
console.log('📍 Base URL: /api/dashboard');
console.log('🔗 URLs completas:');
console.log('   http://localhost:3006/api/dashboard/metrics');
console.log('   http://localhost:3006/api/dashboard/monthly-sales');
console.log('   http://localhost:3006/api/dashboard/weekly-sales');
console.log('   http://localhost:3006/api/dashboard/new-users');
console.log('   http://localhost:3006/api/dashboard/top-products');
console.log('   http://localhost:3006/api/dashboard/recent-users');

module.exports = router;