// controllers/manualSaleController.js
const db = require('../config/db');

/**
 * Obtiene todas las mesas con su estado actual
 * @route GET /api/manualSale/mesas
 */
const getMesas = async (req, res) => {
  try {
    const query = `
      SELECT 
        idMesa, 
        numero, 
        estado,
        idSede
      FROM mesa 
      WHERE idSede = 1
      ORDER BY 
        CASE estado
          WHEN 'disponible' THEN 1
          WHEN 'ocupada' THEN 2
          WHEN 'limpieza' THEN 3
        END,
        numero
    `;
    const [mesas] = await db.query(query);
    res.json(mesas);
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    res.status(500).json({ 
      error: 'Error al cargar las mesas',
      details: error.message 
    });
  }
};

/**
 * Obtiene todos los productos disponibles con información de stock
 * @route GET /api/manualSale/productos
 */
const getProductos = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.idProducto,
        p.nombre,
        p.precio,
        p.descripcion,
        p.disponible,
        c.nombre as categoria,
        c.id as idCategoria,
        COALESCE(i.stockDisponible, 0) as stock,
        p.imagen_url
      FROM producto p
      INNER JOIN categoria c ON p.idCategoria = c.id
      LEFT JOIN inventario i ON p.idProducto = i.idProducto AND i.idSede = 1
      WHERE p.disponible = 1 AND c.activo = 1
      ORDER BY c.nombre, p.nombre
    `;
    const [productos] = await db.query(query);
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ 
      error: 'Error al cargar los productos',
      details: error.message 
    });
  }
};

/**
 * Obtiene todas las categorías activas
 * @route GET /api/manualSale/categorias
 */
const getCategorias = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id, 
        c.nombre, 
        c.descripcion,
        COUNT(p.idProducto) as cantidadProductos
      FROM categoria c
      LEFT JOIN producto p ON c.id = p.idCategoria AND p.disponible = 1
      WHERE c.activo = 1 
      GROUP BY c.id, c.nombre, c.descripcion
      HAVING cantidadProductos > 0
      ORDER BY c.nombre
    `;
    const [categorias] = await db.query(query);
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ 
      error: 'Error al cargar las categorías',
      details: error.message 
    });
  }
};

/**
 * Registra una nueva venta en mesa usando procedimiento almacenado
 * @route POST /api/manualSale/registrar
 * @body { idMesa, idSede, productos: [{ idProducto, cantidad }] }
 */
const registrarVenta = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { idMesa, idSede = 1, productos } = req.body;

    // Validaciones de entrada
    if (!idMesa) {
      return res.status(400).json({ 
        error: 'Debe seleccionar una mesa',
        code: 'MESA_REQUIRED'
      });
    }

    if (!productos || productos.length === 0) {
      return res.status(400).json({ 
        error: 'El carrito está vacío',
        code: 'CART_EMPTY'
      });
    }

    // Validar formato de productos
    const productosValidos = productos.every(p => 
      p.idProducto && 
      p.cantidad && 
      Number.isInteger(p.cantidad) && 
      p.cantidad > 0
    );

    if (!productosValidos) {
      return res.status(400).json({ 
        error: 'Formato de productos inválido. Verifique cantidad y ID',
        code: 'INVALID_PRODUCTS'
      });
    }

    // Verificar stock antes de procesar
    const stockQuery = `
      SELECT 
        i.idProducto,
        p.nombre,
        i.stockDisponible
      FROM inventario i
      INNER JOIN producto p ON i.idProducto = p.idProducto
      WHERE i.idSede = ? AND i.idProducto IN (?)
    `;
    
    const productosIds = productos.map(p => p.idProducto);
    const [stockData] = await connection.query(stockQuery, [idSede, productosIds]);

    // Validar stock disponible
    for (const producto of productos) {
      const stock = stockData.find(s => s.idProducto === producto.idProducto);
      
      if (!stock) {
        return res.status(400).json({
          error: `Producto con ID ${producto.idProducto} no encontrado en inventario`,
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      if (stock.stockDisponible < producto.cantidad) {
        return res.status(400).json({
          error: `Stock insuficiente para ${stock.nombre}. Disponible: ${stock.stockDisponible}, Solicitado: ${producto.cantidad}`,
          code: 'INSUFFICIENT_STOCK',
          producto: stock.nombre,
          disponible: stock.stockDisponible,
          solicitado: producto.cantidad
        });
      }
    }

    // Convertir productos a JSON string
    const productosJson = JSON.stringify(productos);

    // Llamar al procedimiento almacenado
    const query = 'CALL sp_registrar_venta_mesa(?, ?, ?)';
    const [result] = await connection.query(query, [idMesa, idSede, productosJson]);

    // Extraer resultado del procedimiento
    const pedidoCreado = result[0]?.[0];

    if (!pedidoCreado || !pedidoCreado.idPedido) {
      throw new Error('No se pudo crear el pedido');
    }

    res.status(201).json({
      success: true,
      message: 'Pedido registrado exitosamente',
      data: {
        idPedido: pedidoCreado.idPedido,
        total: pedidoCreado.total,
        idMesa: idMesa,
        cantidadProductos: productos.length,
        cantidadItems: productos.reduce((sum, p) => sum + p.cantidad, 0)
      }
    });

  } catch (error) {
    console.error('Error al registrar venta:', error);
    
    // Manejar errores específicos del procedimiento
    if (error.message.includes('Mesa no disponible')) {
      return res.status(409).json({ 
        error: 'La mesa seleccionada no está disponible',
        code: 'MESA_NO_DISPONIBLE'
      });
    }
    
    if (error.message.includes('Stock insuficiente')) {
      return res.status(400).json({ 
        error: 'Stock insuficiente para algunos productos',
        code: 'INSUFFICIENT_STOCK'
      });
    }

    if (error.message.includes('Mesa no encontrada')) {
      return res.status(404).json({ 
        error: 'Mesa no encontrada',
        code: 'MESA_NOT_FOUND'
      });
    }

    res.status(500).json({ 
      error: 'Error al registrar el pedido',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SERVER_ERROR'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Obtiene todos los pedidos activos (pendientes o en preparación)
 * @route GET /api/manualSale/pedidos-pendientes
 */
const getPedidosPendientes = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.idPedido,
        p.fecha,
        p.estado,
        p.total,
        p.observaciones,
        m.numero as numeroMesa,
        m.idMesa,
        m.estado as estadoMesa,
        s.nombre as sede,
        s.idSede,
        COUNT(DISTINCT pp.idProducto) as cantidadProductos,
        SUM(pp.cantidad) as cantidadItems
      FROM pedido p
      INNER JOIN mesa m ON p.idMesa = m.idMesa
      INNER JOIN sede s ON p.idSede = s.idSede
      LEFT JOIN pedido_producto pp ON p.idPedido = pp.idPedido
      WHERE p.estado IN ('pendiente', 'en preparación', 'listo')
        AND p.tipo_pedido = 'mesa'
      GROUP BY p.idPedido, p.fecha, p.estado, p.total, p.observaciones,
               m.numero, m.idMesa, m.estado, s.nombre, s.idSede
      ORDER BY p.fecha DESC
    `;
    const [pedidos] = await db.query(query);
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos pendientes:', error);
    res.status(500).json({ 
      error: 'Error al cargar los pedidos pendientes',
      details: error.message 
    });
  }
};

/**
 * Obtiene el detalle completo de un pedido específico
 * @route GET /api/manualSale/pedido/:idPedido
 */
const getDetallePedido = async (req, res) => {
  try {
    const { idPedido } = req.params;

    if (!idPedido || isNaN(idPedido)) {
      return res.status(400).json({ 
        error: 'ID de pedido inválido',
        code: 'INVALID_ID'
      });
    }

    // Obtener información del pedido
    const queryPedido = `
      SELECT 
        p.idPedido,
        p.fecha,
        p.estado,
        p.total,
        p.observaciones,
        p.tipo_pedido,
        m.numero as numeroMesa,
        m.idMesa,
        m.estado as estadoMesa,
        s.nombre as sede,
        s.idSede,
        c.nombre as cliente,
        c.idCliente
      FROM pedido p
      LEFT JOIN mesa m ON p.idMesa = m.idMesa
      INNER JOIN sede s ON p.idSede = s.idSede
      INNER JOIN cliente c ON p.idCliente = c.idCliente
      WHERE p.idPedido = ?
    `;

    // Obtener productos del pedido
    const queryProductos = `
      SELECT 
        pp.idProducto,
        pr.nombre,
        pp.cantidad,
        pp.precio_unitario,
        pp.subtotal,
        c.nombre as categoria
      FROM pedido_producto pp
      INNER JOIN producto pr ON pp.idProducto = pr.idProducto
      INNER JOIN categoria c ON pr.idCategoria = c.id
      WHERE pp.idPedido = ?
      ORDER BY c.nombre, pr.nombre
    `;

    const [[pedido]] = await db.query(queryPedido, [idPedido]);
    const [productos] = await db.query(queryProductos, [idPedido]);

    if (!pedido) {
      return res.status(404).json({ 
        error: 'Pedido no encontrado',
        code: 'PEDIDO_NOT_FOUND'
      });
    }

    // Calcular resumen
    const resumen = {
      cantidadProductos: productos.length,
      cantidadItems: productos.reduce((sum, p) => sum + p.cantidad, 0),
      subtotal: productos.reduce((sum, p) => sum + parseFloat(p.subtotal), 0)
    };

    res.json({
      ...pedido,
      productos,
      resumen
    });

  } catch (error) {
    console.error('Error al obtener detalle del pedido:', error);
    res.status(500).json({ 
      error: 'Error al cargar el detalle del pedido',
      details: error.message 
    });
  }
};

/**
 * Procesa el pago de un pedido y libera la mesa
 * @route POST /api/manualSale/pagar
 * @body { idPedido, metodoPago }
 */
const procesarPago = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { idPedido, metodoPago = 'efectivo' } = req.body;

    // Validaciones
    if (!idPedido || isNaN(idPedido)) {
      return res.status(400).json({ 
        error: 'ID de pedido inválido',
        code: 'INVALID_ID'
      });
    }

    const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
    const metodoNormalizado = metodoPago.toLowerCase();
    
    if (!metodosValidos.includes(metodoNormalizado)) {
      return res.status(400).json({ 
        error: `Método de pago inválido. Use: ${metodosValidos.join(', ')}`,
        code: 'INVALID_PAYMENT_METHOD'
      });
    }

    // Verificar que el pedido existe y no está pagado
    const [pedidos] = await connection.query(
      'SELECT idPedido, estado, total FROM pedido WHERE idPedido = ?',
      [idPedido]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({ 
        error: 'Pedido no encontrado',
        code: 'PEDIDO_NOT_FOUND'
      });
    }

    if (pedidos[0].estado === 'entregado') {
      return res.status(409).json({ 
        error: 'El pedido ya ha sido pagado y cerrado',
        code: 'ALREADY_PAID'
      });
    }

    // Llamar al procedimiento almacenado
    const query = 'CALL sp_cerrar_pedido_pagado(?, ?)';
    await connection.query(query, [idPedido, metodoNormalizado]);

    res.json({
      success: true,
      message: 'Pedido pagado y cerrado exitosamente',
      data: {
        idPedido,
        metodoPago: metodoNormalizado,
        monto: pedidos[0].total,
        fechaPago: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error al procesar pago:', error);

    if (error.message.includes('Pedido no encontrado')) {
      return res.status(404).json({ 
        error: 'Pedido no encontrado',
        code: 'PEDIDO_NOT_FOUND'
      });
    }

    if (error.message.includes('ya está cerrado')) {
      return res.status(409).json({ 
        error: 'El pedido ya ha sido pagado',
        code: 'ALREADY_PAID'
      });
    }

    res.status(500).json({ 
      error: 'Error al procesar el pago',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'PAYMENT_ERROR'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Obtiene estadísticas del día actual
 * @route GET /api/manualSale/estadisticas
 */
const getEstadisticas = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT p.idPedido) as totalPedidosHoy,
        COALESCE(SUM(p.total), 0) as ventasTotalesHoy,
        COUNT(DISTINCT CASE WHEN p.estado IN ('pendiente', 'en preparación') THEN p.idPedido END) as pedidosActivos,
        COUNT(DISTINCT CASE WHEN p.estado = 'entregado' THEN p.idPedido END) as pedidosCompletados,
        (SELECT COUNT(*) FROM mesa WHERE estado = 'disponible') as mesasDisponibles,
        (SELECT COUNT(*) FROM mesa WHERE estado = 'ocupada') as mesasOcupadas
      FROM pedido p
      WHERE DATE(p.fecha) = CURDATE()
        AND p.tipo_pedido = 'mesa'
    `;
    
    const [stats] = await db.query(query);
    res.json(stats[0] || {});
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error al cargar estadísticas',
      details: error.message 
    });
  }
};

module.exports = {
  getMesas,
  getProductos,
  registrarVenta,
  getPedidosPendientes,
  getDetallePedido,
  procesarPago,
  getCategorias,
  getEstadisticas
};