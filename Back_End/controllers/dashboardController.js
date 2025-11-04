const pool = require('../config/db');

// ========================= MÉTRICAS PRINCIPALES =========================
exports.getMetrics = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        -- Total de usuarios con rol cliente
        (SELECT COUNT(*) FROM usuario WHERE rol = 'cliente' AND activo = 1) AS totalUsers,
        
        -- Pedidos del día (solo estado 'entregado', NO existe 'pagado_cerrado')
        (SELECT COUNT(*) FROM pedido 
         WHERE estado = 'entregado' 
         AND DATE(fecha) = CURDATE()
        ) AS totalOrders,
        
        -- Ingresos del día (desde tabla pago)
        (SELECT IFNULL(SUM(monto), 0) FROM pago 
         WHERE DATE(fecha) = CURDATE()
        ) AS dailyRevenue,
        
        -- Pedidos de la semana actual (solo 'entregado')
        (SELECT COUNT(*) FROM pedido 
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
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ 
      message: 'Error al obtener las métricas del dashboard', 
      error: error.message 
    });
  }
};

// ========================= VENTAS MENSUALES =========================
exports.getMonthlySales = async (req, res) => {
  try {
    const sql = `
      SELECT
          DATE_FORMAT(fecha, '%d') AS day,
          IFNULL(SUM(monto), 0) AS ventas
      FROM pago
      WHERE fecha >= CURDATE() - INTERVAL 30 DAY
      GROUP BY DATE(fecha)
      ORDER BY DATE(fecha)
    `;
    const [result] = await pool.query(sql);
    
    // Formatear datos
    const formattedData = result.map(row => ({
      day: row.day,
      ventas: parseFloat(row.ventas) || 0
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching monthly sales:', error);
    res.status(500).json({ 
      message: 'Error al obtener ventas mensuales', 
      error: error.message 
    });
  }
};

// ========================= VENTAS SEMANALES =========================
exports.getWeeklySales = async (req, res) => {
  try {
    const sql = `
      SELECT
          CASE
              WHEN DAYOFWEEK(fecha) = 2 THEN 'Lun'
              WHEN DAYOFWEEK(fecha) = 3 THEN 'Mar'
              WHEN DAYOFWEEK(fecha) = 4 THEN 'Mié'
              WHEN DAYOFWEEK(fecha) = 5 THEN 'Jue'
              WHEN DAYOFWEEK(fecha) = 6 THEN 'Vie'
              WHEN DAYOFWEEK(fecha) = 7 THEN 'Sáb'
              WHEN DAYOFWEEK(fecha) = 1 THEN 'Dom'
          END AS day,
          DAYOFWEEK(fecha) AS dayNum,
          IFNULL(SUM(monto), 0) AS ventas
      FROM pago
      WHERE fecha >= CURDATE() - INTERVAL 7 DAY
      GROUP BY DAYOFWEEK(fecha), day
      ORDER BY dayNum
    `;
    const [result] = await pool.query(sql);
    
    // Formatear y eliminar dayNum
    const formattedData = result.map(row => ({
      day: row.day,
      ventas: parseFloat(row.ventas) || 0
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching weekly sales:', error);
    res.status(500).json({ 
      message: 'Error al obtener ventas semanales', 
      error: error.message 
    });
  }
};

// ========================= NUEVOS USUARIOS =========================
exports.getNewUsers = async (req, res) => {
  try {
    const sql = `
      SELECT
          WEEK(fecha_registro, 1) AS week,
          COUNT(*) AS usuarios
      FROM usuario
      WHERE fecha_registro >= CURDATE() - INTERVAL 4 WEEK 
        AND rol = 'cliente'
        AND activo = 1
      GROUP BY week
      ORDER BY week
    `;
    const [result] = await pool.query(sql);
    
    const newUsersData = result.map((row, index) => ({
      semana: `Sem ${index + 1}`,
      usuarios: parseInt(row.usuarios) || 0
    }));
    
    res.json(newUsersData);
  } catch (error) {
    console.error('Error fetching new users:', error);
    res.status(500).json({ 
      message: 'Error al obtener nuevos usuarios', 
      error: error.message 
    });
  }
};

// ========================= TOP PRODUCTOS =========================
exports.getTopProducts = async (req, res) => {
  try {
    // JOIN con pedido para filtrar por fecha (pedido_producto NO tiene campo fecha)
    const sql = `
      SELECT
          p.nombre AS name,
          SUM(pp.cantidad) AS value
      FROM pedido_producto pp
      JOIN producto p ON pp.idProducto = p.idProducto
      JOIN pedido ped ON pp.idPedido = ped.idPedido
      WHERE ped.fecha >= CURDATE() - INTERVAL 30 DAY
        AND ped.estado = 'entregado'
      GROUP BY p.idProducto, p.nombre
      ORDER BY value DESC
      LIMIT 5
    `;
    const [result] = await pool.query(sql);
    
    // Si no hay datos, retornar array vacío
    if (result.length === 0) {
      return res.json([]);
    }
    
    const totalSales = result.reduce((acc, item) => acc + parseFloat(item.value), 0);
    const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    const topProducts = result.map((item, index) => ({
      name: item.name,
      value: totalSales > 0 ? Math.round((parseFloat(item.value) / totalSales) * 100) : 0,
      color: COLORS[index % COLORS.length]
    }));
    
    res.json(topProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ 
      message: 'Error al obtener productos más vendidos', 
      error: error.message 
    });
  }
};

// ========================= USUARIOS RECIENTES =========================
exports.getRecentUsers = async (req, res) => {
  try {
    // Usar tabla usuario (NO existe tabla "cliente")
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
    console.error('Error fetching recent users:', error);
    res.status(500).json({ 
      message: 'Error al obtener usuarios recientes', 
      error: error.message 
    });
  }
};

// ========================= ESTADÍSTICAS ADICIONALES =========================
exports.getComparisons = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        -- Comparación de usuarios mes actual vs mes anterior
        (
          SELECT COUNT(*) 
          FROM usuario 
          WHERE rol = 'cliente' 
            AND MONTH(fecha_registro) = MONTH(CURDATE())
            AND YEAR(fecha_registro) = YEAR(CURDATE())
            AND activo = 1
        ) AS usersThisMonth,
        (
          SELECT COUNT(*) 
          FROM usuario 
          WHERE rol = 'cliente' 
            AND MONTH(fecha_registro) = MONTH(CURDATE() - INTERVAL 1 MONTH)
            AND YEAR(fecha_registro) = YEAR(CURDATE() - INTERVAL 1 MONTH)
            AND activo = 1
        ) AS usersLastMonth,
        
        -- Comparación de ingresos día actual vs día anterior
        (
          SELECT IFNULL(SUM(monto), 0)
          FROM pago
          WHERE DATE(fecha) = CURDATE()
        ) AS revenueToday,
        (
          SELECT IFNULL(SUM(monto), 0)
          FROM pago
          WHERE DATE(fecha) = CURDATE() - INTERVAL 1 DAY
        ) AS revenueYesterday,
        
        -- Comparación de pedidos semana actual vs semana anterior
        (
          SELECT COUNT(*)
          FROM pedido
          WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
            AND estado = 'entregado'
        ) AS ordersThisWeek,
        (
          SELECT COUNT(*)
          FROM pedido
          WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURDATE() - INTERVAL 1 WEEK, 1)
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
        current: data.usersThisMonth,
        previous: data.usersLastMonth,
        change: userChange
      },
      revenue: {
        current: parseFloat(data.revenueToday),
        previous: parseFloat(data.revenueYesterday),
        change: revenueChange
      },
      orders: {
        current: data.ordersThisWeek,
        previous: data.ordersLastWeek,
        change: orderChange
      }
    });
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    res.status(500).json({ 
      message: 'Error al obtener comparaciones', 
      error: error.message 
    });
  }
};

console.log('✅ DashboardController FINAL - Corregido según estructura real de BD');
module.exports = exports;