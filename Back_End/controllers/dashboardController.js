const pool = require('../config/db');

// ========================= MÉTRICAS PRINCIPALES =========================
exports.getMetrics = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        -- Total de clientes registrados
        (SELECT COUNT(*) FROM usuario WHERE rol = 'cliente') AS totalUsers,
        
        -- Pedidos del día
        (SELECT COUNT(*) FROM pedido 
         WHERE estado IN ('entregado', 'pagado_cerrado') 
         AND DATE(fecha) = CURDATE()
        ) AS totalOrders,
        
        -- Ingresos del día (desde tabla pago)
        (SELECT IFNULL(SUM(monto),0) FROM pago 
         WHERE DATE(fecha) = CURDATE()
        ) AS dailyRevenue,
        
        -- Pedidos de la semana actual
        (SELECT COUNT(*) FROM pedido 
         WHERE estado IN ('entregado', 'pagado_cerrado') 
         AND YEARWEEK(fecha,1) = YEARWEEK(CURDATE(),1)
        ) AS weeklyOrders
    `);

    const metrics = rows[0];
    res.json({
      totalUsers: metrics.totalUsers || 0,
      totalOrders: metrics.totalOrders || 0,
      dailyRevenue: metrics.dailyRevenue || 0,
      weeklyOrders: metrics.weeklyOrders || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Error fetching metrics', error });
  }
};

// ========================= VENTAS MENSUALES =========================
exports.getMonthlySales = async (req, res) => {
  try {
    const sql = `
      SELECT
          DATE_FORMAT(fecha, '%d') AS day,
          SUM(monto) AS ventas
      FROM pago
      WHERE fecha >= CURDATE() - INTERVAL 30 DAY
      GROUP BY DATE(fecha)
      ORDER BY DATE(fecha)
    `;
    const [result] = await pool.query(sql);
    res.json(result);
  } catch (error) {
    console.error('Error fetching monthly sales:', error);
    res.status(500).json({ message: 'Error fetching monthly sales', error });
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
          SUM(monto) AS ventas
      FROM pago
      WHERE fecha >= CURDATE() - INTERVAL 7 DAY
      GROUP BY DAYOFWEEK(fecha)
      ORDER BY DAYOFWEEK(fecha)
    `;
    const [result] = await pool.query(sql);
    res.json(result);
  } catch (error) {
    console.error('Error fetching weekly sales:', error);
    res.status(500).json({ message: 'Error fetching weekly sales', error });
  }
};

// ========================= NUEVOS USUARIOS =========================
exports.getNewUsers = async (req, res) => {
  try {
    const sql = `
      SELECT
          WEEK(fecha_creacion, 1) AS week,
          COUNT(*) AS usuarios
      FROM usuario
      WHERE fecha_creacion >= CURDATE() - INTERVAL 4 WEEK 
        AND rol = 'cliente'
      GROUP BY week
      ORDER BY week
    `;
    const [result] = await pool.query(sql);
    const newUsersData = result.map(row => ({
      semana: `Sem ${row.week}`,
      usuarios: row.usuarios
    }));
    res.json(newUsersData);
  } catch (error) {
    console.error('Error fetching new users:', error);
    res.status(500).json({ message: 'Error fetching new users', error });
  }
};

// ========================= TOP PRODUCTOS =========================
exports.getTopProducts = async (req, res) => {
  try {
    const sql = `
      SELECT
          p.nombre AS name,
          SUM(pp.cantidad) AS value
      FROM pedido_producto pp
      JOIN producto p ON pp.idProducto = p.idProducto
      GROUP BY p.nombre
      ORDER BY value DESC
      LIMIT 5
    `;
    const [result] = await pool.query(sql);
    const totalSales = result.reduce((acc, item) => acc + item.value, 0);
    const topProducts = result.map(item => ({
      name: item.name,
      value: totalSales > 0 ? (item.value / totalSales) * 100 : 0
    }));

    const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const productsWithColors = topProducts.map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length]
    }));
    
    res.json(productsWithColors);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ message: 'Error fetching top products', error });
  }
};

// ========================= USUARIOS RECIENTES =========================
exports.getRecentUsers = async (req, res) => {
  try {
    const sql = `
      SELECT 
          idCliente AS id,
          nombre AS name,
          correo AS email,
          DATE_FORMAT(fecha_registro, '%Y-%m-%d') AS date,
          CASE WHEN activo = 1 THEN 'Activo' ELSE 'Inactivo' END AS status
      FROM cliente
      ORDER BY fecha_registro DESC
      LIMIT 10
    `;
    const [result] = await pool.query(sql);
    res.json(result);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ message: 'Error fetching recent users', error });
  }
};

console.log('DashboardController cargado con:', module.exports);
