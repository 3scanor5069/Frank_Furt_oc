const pool = require('../config/db');

// ============================================================================
// DASHBOARD CONTROLLER - FRANK FURT
// ============================================================================
// Optimizado 100% para la estructura real de la base de datos
// Base de datos: frank_furt
// Puerto: 3006
// Rutas: /api/dashboard/*
// ============================================================================

// ========================= MÉTRICAS PRINCIPALES =========================
// GET /api/dashboard/metrics
// Retorna: { totalUsers, totalOrders, dailyRevenue, weeklyOrders }
exports.getMetrics = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        -- Total de usuarios clientes activos
        (SELECT COUNT(*) 
         FROM usuario 
         WHERE rol = 'cliente' AND activo = 1
        ) AS totalUsers,
        
        -- Pedidos entregados del día actual
        (SELECT COUNT(*) 
         FROM pedido 
         WHERE estado = 'entregado' 
         AND DATE(fecha) = CURDATE()
        ) AS totalOrders,
        
        -- Ingresos totales del día actual
        (SELECT IFNULL(SUM(monto), 0) 
         FROM pago 
         WHERE DATE(fecha) = CURDATE()
        ) AS dailyRevenue,
        
        -- Pedidos entregados de la semana actual (Lun-Dom)
        (SELECT COUNT(*) 
         FROM pedido 
         WHERE estado = 'entregado'
         AND YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
        ) AS weeklyOrders
    `);

    const metrics = rows[0];
    
    res.json({
      totalUsers: parseInt(metrics.totalUsers) || 0,
      totalOrders: parseInt(metrics.totalOrders) || 0,
      dailyRevenue: parseFloat(metrics.dailyRevenue) || 0,
      weeklyOrders: parseInt(metrics.weeklyOrders) || 0
    });

  } catch (error) {
    console.error('❌ Error en getMetrics:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener las métricas del dashboard', 
      error: error.message 
    });
  }
};

// ========================= VENTAS MENSUALES =========================
// GET /api/dashboard/monthly-sales
// Retorna: [{ day: '01', ventas: 15000 }, ...]
exports.getMonthlySales = async (req, res) => {
  try {
    const sql = `
      SELECT
        DATE_FORMAT(fecha, '%d') AS day,
        IFNULL(SUM(monto), 0) AS ventas
      FROM pago
      WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(fecha)
      ORDER BY DATE(fecha) ASC
    `;
    
    const [result] = await pool.query(sql);
    
    // Formatear datos para Recharts
    const formattedData = result.map(row => ({
      day: row.day,
      ventas: parseFloat(row.ventas) || 0
    }));
    
    res.json(formattedData);

  } catch (error) {
    console.error('❌ Error en getMonthlySales:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener ventas mensuales', 
      error: error.message 
    });
  }
};

// ========================= VENTAS SEMANALES =========================
// GET /api/dashboard/weekly-sales
// Retorna: [{ day: 'Lun', ventas: 4500 }, ...]
exports.getWeeklySales = async (req, res) => {
  try {
    const sql = `
      SELECT
        CASE DAYOFWEEK(fecha)
          WHEN 1 THEN 'Dom'
          WHEN 2 THEN 'Lun'
          WHEN 3 THEN 'Mar'
          WHEN 4 THEN 'Mié'
          WHEN 5 THEN 'Jue'
          WHEN 6 THEN 'Vie'
          WHEN 7 THEN 'Sáb'
        END AS day,
        DAYOFWEEK(fecha) AS dayNum,
        IFNULL(SUM(monto), 0) AS ventas
      FROM pago
      WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DAYOFWEEK(fecha)
      ORDER BY 
        -- Ordenar Lun-Dom (2,3,4,5,6,7,1)
        CASE DAYOFWEEK(fecha)
          WHEN 1 THEN 7  -- Dom al final
          ELSE DAYOFWEEK(fecha) - 1
        END
    `;
    
    const [result] = await pool.query(sql);
    
    // Formatear eliminando dayNum
    const formattedData = result.map(row => ({
      day: row.day,
      ventas: parseFloat(row.ventas) || 0
    }));
    
    res.json(formattedData);

  } catch (error) {
    console.error('❌ Error en getWeeklySales:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener ventas semanales', 
      error: error.message 
    });
  }
};

// ========================= NUEVOS USUARIOS =========================
// GET /api/dashboard/new-users
// Retorna: [{ semana: 'Sem 1', usuarios: 45 }, ...]
exports.getNewUsers = async (req, res) => {
  try {
    const sql = `
      SELECT
        WEEK(fecha_registro, 1) AS week,
        COUNT(*) AS usuarios
      FROM usuario
      WHERE fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
        AND rol = 'cliente'
        AND activo = 1
      GROUP BY WEEK(fecha_registro, 1)
      ORDER BY week ASC
    `;
    
    const [result] = await pool.query(sql);
    
    // Formatear con etiquetas "Sem 1", "Sem 2", etc.
    const newUsersData = result.map((row, index) => ({
      semana: `Sem ${index + 1}`,
      usuarios: parseInt(row.usuarios) || 0
    }));
    
    res.json(newUsersData);

  } catch (error) {
    console.error('❌ Error en getNewUsers:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener nuevos usuarios', 
      error: error.message 
    });
  }
};

// ========================= TOP PRODUCTOS =========================
// GET /api/dashboard/top-products
// Retorna: [{ name: 'Hamburguesa', value: 35, color: '#FF6B6B' }, ...]
exports.getTopProducts = async (req, res) => {
  try {
    const sql = `
      SELECT
        p.nombre AS name,
        SUM(pp.cantidad) AS totalVendido
      FROM pedido_producto pp
      INNER JOIN producto p ON pp.idProducto = p.idProducto
      INNER JOIN pedido ped ON pp.idPedido = ped.idPedido
      WHERE ped.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND ped.estado = 'entregado'
      GROUP BY p.idProducto, p.nombre
      ORDER BY totalVendido DESC
      LIMIT 5
    `;
    
    const [result] = await pool.query(sql);
    
    // Si no hay datos, retornar array vacío
    if (result.length === 0) {
      return res.json([]);
    }
    
    // Calcular total para porcentajes
    const totalSales = result.reduce((acc, item) => acc + parseFloat(item.totalVendido), 0);
    
    // Colores predefinidos para el gráfico de pastel
    const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    // Formatear con porcentajes
    const topProducts = result.map((item, index) => ({
      name: item.name,
      value: totalSales > 0 
        ? Math.round((parseFloat(item.totalVendido) / totalSales) * 100) 
        : 0,
      color: COLORS[index % COLORS.length]
    }));
    
    res.json(topProducts);

  } catch (error) {
    console.error('❌ Error en getTopProducts:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener productos más vendidos', 
      error: error.message 
    });
  }
};

// ========================= USUARIOS RECIENTES =========================
// GET /api/dashboard/recent-users
// Retorna: [{ id, name, email, date, status }, ...]
exports.getRecentUsers = async (req, res) => {
  try {
    const sql = `
      SELECT 
        idUsuario AS id,
        nombre AS name,
        correo AS email,
        DATE_FORMAT(fecha_registro, '%Y-%m-%d') AS date,
        CASE WHEN activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS status
      FROM usuario
      WHERE rol = 'cliente'
      ORDER BY fecha_registro DESC
      LIMIT 10
    `;
    
    const [result] = await pool.query(sql);
    res.json(result);

  } catch (error) {
    console.error('❌ Error en getRecentUsers:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener usuarios recientes', 
      error: error.message 
    });
  }
};

// ========================= COMPARACIONES (OPCIONAL) =========================
// GET /api/dashboard/comparisons
// Retorna comparaciones mes actual vs anterior, día actual vs anterior, etc.
exports.getComparisons = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        -- Usuarios: mes actual vs mes anterior
        (SELECT COUNT(*) 
         FROM usuario 
         WHERE rol = 'cliente' 
           AND MONTH(fecha_registro) = MONTH(CURDATE())
           AND YEAR(fecha_registro) = YEAR(CURDATE())
           AND activo = 1
        ) AS usersThisMonth,
        
        (SELECT COUNT(*) 
         FROM usuario 
         WHERE rol = 'cliente' 
           AND MONTH(fecha_registro) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
           AND YEAR(fecha_registro) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
           AND activo = 1
        ) AS usersLastMonth,
        
        -- Ingresos: hoy vs ayer
        (SELECT IFNULL(SUM(monto), 0)
         FROM pago
         WHERE DATE(fecha) = CURDATE()
        ) AS revenueToday,
        
        (SELECT IFNULL(SUM(monto), 0)
         FROM pago
         WHERE DATE(fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ) AS revenueYesterday,
        
        -- Pedidos: semana actual vs semana anterior
        (SELECT COUNT(*)
         FROM pedido
         WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
           AND estado = 'entregado'
        ) AS ordersThisWeek,
        
        (SELECT COUNT(*)
         FROM pedido
         WHERE YEARWEEK(fecha, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK), 1)
           AND estado = 'entregado'
        ) AS ordersLastWeek
    `);
    
    const data = rows[0];
    
    // Calcular porcentajes de cambio
    const userChange = data.usersLastMonth > 0 
      ? Math.round(((data.usersThisMonth - data.usersLastMonth) / data.usersLastMonth) * 100)
      : 0;
      
    const revenueChange = data.revenueYesterday > 0
      ? Math.round(((data.revenueToday - data.revenueYesterday) / data.revenueYesterday) * 100)
      : 0;
      
    const orderChange = data.ordersLastWeek > 0
      ? Math.round(((data.ordersThisWeek - data.ordersLastWeek) / data.ordersLastWeek) * 100)
      : 0;
    
    res.json({
      users: {
        current: parseInt(data.usersThisMonth),
        previous: parseInt(data.usersLastMonth),
        change: userChange
      },
      revenue: {
        current: parseFloat(data.revenueToday),
        previous: parseFloat(data.revenueYesterday),
        change: revenueChange
      },
      orders: {
        current: parseInt(data.ordersThisWeek),
        previous: parseInt(data.ordersLastWeek),
        change: orderChange
      }
    });

  } catch (error) {
    console.error('❌ Error en getComparisons:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener comparaciones', 
      error: error.message 
    });
  }
};

// ============================================================================
// EXPORTAR CONTROLADOR
// ============================================================================

console.log('✅ DashboardController cargado correctamente');
console.log('📊 Endpoints disponibles:');
console.log('   - GET /api/dashboard/metrics');
console.log('   - GET /api/dashboard/monthly-sales');
console.log('   - GET /api/dashboard/weekly-sales');
console.log('   - GET /api/dashboard/new-users');
console.log('   - GET /api/dashboard/top-products');
console.log('   - GET /api/dashboard/recent-users');
console.log('   - GET /api/dashboard/comparisons (opcional)');

module.exports = exports;