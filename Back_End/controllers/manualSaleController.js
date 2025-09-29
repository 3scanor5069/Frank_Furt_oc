// controllers/manualSaleController.js
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'frank_furt',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const manualSaleController = {

  // Crear un pedido manual
  crearPedidoManual: async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { idMesa, productos } = req.body;
      
      // Validaciones básicas
      if (!idMesa || !productos || productos.length === 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Datos incompletos. Se requiere mesa y productos.' 
        });
      }

      // Verificar que la mesa existe
      const [mesaResult] = await connection.execute(
        'SELECT id, numero, estado FROM mesas WHERE id = ?',
        [idMesa]
      );

      if (mesaResult.length === 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Mesa no encontrada' 
        });
      }

      // Verificar que todos los productos existen y calcular el total
      let totalPedido = 0;
      const productosValidos = [];

      for (const producto of productos) {
        const [productoResult] = await connection.execute(
          'SELECT idProducto, nombre, precio FROM productos WHERE idProducto = ? AND estado = "activo"',
          [producto.idProducto]
        );

        if (productoResult.length === 0) {
          await connection.rollback();
          return res.status(400).json({ 
            error: `Producto con ID ${producto.idProducto} no encontrado o inactivo` 
          });
        }

        if (producto.cantidad <= 0) {
          await connection.rollback();
          return res.status(400).json({ 
            error: `Cantidad inválida para el producto ${producto.idProducto}` 
          });
        }

        const productoDB = productoResult[0];
        const subtotal = productoDB.precio * producto.cantidad;
        totalPedido += subtotal;

        productosValidos.push({
          idProducto: producto.idProducto,
          nombre: productoDB.nombre,
          precio: productoDB.precio,
          cantidad: producto.cantidad,
          subtotal: subtotal
        });
      }

      // Crear el pedido principal
      const [pedidoResult] = await connection.execute(
        `INSERT INTO pedidos (idMesa, total, estado, fechaCreacion, tipo) 
         VALUES (?, ?, 'pendiente', NOW(), 'manual')`,
        [idMesa, totalPedido]
      );

      const idPedido = pedidoResult.insertId;

      // Insertar los detalles del pedido
      for (const producto of productosValidos) {
        await connection.execute(
          `INSERT INTO detalle_pedidos (idPedido, idProducto, cantidad, precioUnitario, subtotal) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            idPedido, 
            producto.idProducto, 
            producto.cantidad, 
            producto.precio, 
            producto.subtotal
          ]
        );
      }

      // Actualizar el estado de la mesa
      await connection.execute(
        'UPDATE mesas SET estado = "ocupada" WHERE id = ?',
        [idMesa]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        data: {
          idPedido: idPedido,
          idMesa: idMesa,
          numeroMesa: mesaResult[0].numero,
          total: totalPedido,
          productos: productosValidos,
          estado: 'pendiente',
          fechaCreacion: new Date().toISOString()
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error al crear pedido manual:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al crear el pedido' 
      });
    } finally {
      connection.release();
    }
  },

  // Obtener todos los pedidos pendientes
  obtenerPedidosPendientes: async (req, res) => {
    try {
      const [pedidos] = await pool.execute(`
        SELECT 
          p.idPedido,
          p.idMesa,
          m.numero as numeroMesa,
          p.total,
          p.estado,
          p.fechaCreacion,
          GROUP_CONCAT(
            CONCAT(dp.cantidad, 'x ', pr.nombre) 
            ORDER BY dp.id SEPARATOR ', '
          ) as productos
        FROM pedidos p
        JOIN mesas m ON p.idMesa = m.id
        JOIN detalle_pedidos dp ON p.idPedido = dp.idPedido
        JOIN productos pr ON dp.idProducto = pr.idProducto
        WHERE p.estado = 'pendiente' AND p.tipo = 'manual'
        GROUP BY p.idPedido, p.idMesa, m.numero, p.total, p.estado, p.fechaCreacion
        ORDER BY p.fechaCreacion DESC
      `);

      res.json({
        success: true,
        data: pedidos,
        total: pedidos.length
      });

    } catch (error) {
      console.error('Error al obtener pedidos pendientes:', error);
      res.status(500).json({ 
        error: 'Error al obtener pedidos pendientes' 
      });
    }
  },

  // Obtener el detalle de un pedido específico
  obtenerDetallePedido: async (req, res) => {
    try {
      const { idPedido } = req.params;

      // Validar que el ID sea un número
      if (isNaN(idPedido)) {
        return res.status(400).json({ 
          error: 'ID de pedido inválido' 
        });
      }

      const [pedidoResult] = await pool.execute(`
        SELECT 
          p.idPedido,
          p.idMesa,
          m.numero as numeroMesa,
          p.total,
          p.estado,
          p.fechaCreacion,
          p.fechaPago,
          p.tipo
        FROM pedidos p
        JOIN mesas m ON p.idMesa = m.id
        WHERE p.idPedido = ? AND p.tipo = 'manual'
      `, [idPedido]);

      if (pedidoResult.length === 0) {
        return res.status(404).json({ 
          error: 'Pedido no encontrado' 
        });
      }

      const [detalleResult] = await pool.execute(`
        SELECT 
          dp.cantidad,
          dp.precioUnitario,
          dp.subtotal,
          pr.idProducto,
          pr.nombre as nombreProducto,
          pr.categoria
        FROM detalle_pedidos dp
        JOIN productos pr ON dp.idProducto = pr.idProducto
        WHERE dp.idPedido = ?
        ORDER BY dp.id
      `, [idPedido]);

      res.json({
        success: true,
        data: {
          ...pedidoResult[0],
          productos: detalleResult
        }
      });

    } catch (error) {
      console.error('Error al obtener detalle del pedido:', error);
      res.status(500).json({ 
        error: 'Error al obtener detalle del pedido' 
      });
    }
  },

  // Marcar un pedido como pagado
  marcarComoPagado: async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { idPedido } = req.params;

      // Validar que el ID sea un número
      if (isNaN(idPedido)) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'ID de pedido inválido' 
        });
      }

      // Verificar que el pedido existe y está pendiente
      const [pedidoResult] = await connection.execute(
        'SELECT idPedido, idMesa, estado, total FROM pedidos WHERE idPedido = ? AND tipo = "manual"',
        [idPedido]
      );

      if (pedidoResult.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          error: 'Pedido no encontrado' 
        });
      }

      const pedido = pedidoResult[0];

      if (pedido.estado !== 'pendiente') {
        await connection.rollback();
        return res.status(400).json({ 
          error: `No se puede marcar como pagado un pedido con estado: ${pedido.estado}` 
        });
      }

      // Actualizar el estado del pedido
      await connection.execute(
        'UPDATE pedidos SET estado = "pagado", fechaPago = NOW() WHERE idPedido = ?',
        [idPedido]
      );

      // Liberar la mesa
      await connection.execute(
        'UPDATE mesas SET estado = "disponible" WHERE id = ?',
        [pedido.idMesa]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Pedido marcado como pagado exitosamente',
        data: {
          idPedido: parseInt(idPedido),
          total: pedido.total,
          estadoAnterior: 'pendiente',
          estadoNuevo: 'pagado'
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error al marcar pedido como pagado:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al procesar el pago' 
      });
    } finally {
      connection.release();
    }
  },

  // Cancelar un pedido
  cancelarPedido: async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { idPedido } = req.params;

      // Validar que el ID sea un número
      if (isNaN(idPedido)) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'ID de pedido inválido' 
        });
      }

      // Verificar que el pedido existe y está pendiente
      const [pedidoResult] = await connection.execute(
        'SELECT idPedido, idMesa, estado FROM pedidos WHERE idPedido = ? AND tipo = "manual"',
        [idPedido]
      );

      if (pedidoResult.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          error: 'Pedido no encontrado' 
        });
      }

      const pedido = pedidoResult[0];

      if (pedido.estado !== 'pendiente') {
        await connection.rollback();
        return res.status(400).json({ 
          error: `No se puede cancelar un pedido con estado: ${pedido.estado}` 
        });
      }

      // Actualizar el estado del pedido
      await connection.execute(
        'UPDATE pedidos SET estado = "cancelado" WHERE idPedido = ?',
        [idPedido]
      );

      // Liberar la mesa
      await connection.execute(
        'UPDATE mesas SET estado = "disponible" WHERE id = ?',
        [pedido.idMesa]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Pedido cancelado exitosamente',
        data: {
          idPedido: parseInt(idPedido),
          estadoAnterior: 'pendiente',
          estadoNuevo: 'cancelado'
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error al cancelar pedido:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al cancelar el pedido' 
      });
    } finally {
      connection.release();
    }
  },

  // Obtener historial de pedidos de una mesa específica
  obtenerHistorialMesa: async (req, res) => {
    try {
      const { idMesa } = req.params;
      const { limite = 10, pagina = 1 } = req.query;

      // Validar parámetros
      if (isNaN(idMesa)) {
        return res.status(400).json({ 
          error: 'ID de mesa inválido' 
        });
      }

      const offset = (pagina - 1) * limite;

      const [pedidos] = await pool.execute(`
        SELECT 
          p.idPedido,
          p.total,
          p.estado,
          p.fechaCreacion,
          p.fechaPago,
          COUNT(dp.id) as totalProductos
        FROM pedidos p
        LEFT JOIN detalle_pedidos dp ON p.idPedido = dp.idPedido
        WHERE p.idMesa = ? AND p.tipo = 'manual'
        GROUP BY p.idPedido, p.total, p.estado, p.fechaCreacion, p.fechaPago
        ORDER BY p.fechaCreacion DESC
        LIMIT ? OFFSET ?
      `, [idMesa, parseInt(limite), parseInt(offset)]);

      const [totalResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM pedidos WHERE idMesa = ? AND tipo = "manual"',
        [idMesa]
      );

      res.json({
        success: true,
        data: pedidos,
        pagination: {
          paginaActual: parseInt(pagina),
          limite: parseInt(limite),
          total: totalResult[0].total,
          totalPaginas: Math.ceil(totalResult[0].total / limite)
        }
      });

    } catch (error) {
      console.error('Error al obtener historial de mesa:', error);
      res.status(500).json({ 
        error: 'Error al obtener historial de pedidos de la mesa' 
      });
    }
  },

  // Obtener estadísticas de ventas manuales
  obtenerEstadisticas: async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      
      let filtroFecha = '';
      let parametros = [];

      if (fechaInicio && fechaFin) {
        filtroFecha = 'AND DATE(p.fechaCreacion) BETWEEN ? AND ?';
        parametros = [fechaInicio, fechaFin];
      } else if (fechaInicio) {
        filtroFecha = 'AND DATE(p.fechaCreacion) >= ?';
        parametros = [fechaInicio];
      } else if (fechaFin) {
        filtroFecha = 'AND DATE(p.fechaCreacion) <= ?';
        parametros = [fechaFin];
      }

      // Estadísticas generales
      const [estadisticas] = await pool.execute(`
        SELECT 
          COUNT(*) as totalPedidos,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pedidosPendientes,
          COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as pedidosPagados,
          COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as pedidosCancelados,
          COALESCE(SUM(CASE WHEN estado = 'pagado' THEN total END), 0) as ventaTotal,
          COALESCE(AVG(CASE WHEN estado = 'pagado' THEN total END), 0) as promedioVenta
        FROM pedidos p
        WHERE tipo = 'manual' ${filtroFecha}
      `, parametros);

      // Productos más vendidos
      const [productosMasVendidos] = await pool.execute(`
        SELECT 
          pr.nombre,
          SUM(dp.cantidad) as cantidadVendida,
          SUM(dp.subtotal) as ventaTotal
        FROM detalle_pedidos dp
        JOIN productos pr ON dp.idProducto = pr.idProducto
        JOIN pedidos p ON dp.idPedido = p.idPedido
        WHERE p.tipo = 'manual' AND p.estado = 'pagado' ${filtroFecha}
        GROUP BY pr.idProducto, pr.nombre
        ORDER BY cantidadVendida DESC
        LIMIT 5
      `, parametros);

      // Ventas por día
      const [ventasPorDia] = await pool.execute(`
        SELECT 
          DATE(p.fechaCreacion) as fecha,
          COUNT(*) as totalPedidos,
          COALESCE(SUM(CASE WHEN estado = 'pagado' THEN total END), 0) as ventaTotal
        FROM pedidos p
        WHERE tipo = 'manual' ${filtroFecha}
        GROUP BY DATE(p.fechaCreacion)
        ORDER BY fecha DESC
        LIMIT 30
      `, parametros);

      res.json({
        success: true,
        data: {
          resumen: estadisticas[0],
          productosMasVendidos,
          ventasPorDia
        }
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ 
        error: 'Error al obtener estadísticas de ventas' 
      });
    }
  }

};

module.exports = manualSaleController;