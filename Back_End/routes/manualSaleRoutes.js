// routes/manualSaleRoutes.js
const express = require('express');
const router = express.Router();
const manualSaleController = require('../controllers/manualSaleController');
const authMiddleware = require('../middleware/authMiddleware');


/**
 * GET /api/manualSale/mesas
 * Obtiene todas las mesas disponibles
 */
router.get('/mesas',  manualSaleController.getMesas);

/**
 * GET /api/manualSale/productos
 * Obtiene todos los productos disponibles del menú
 */
router.get('/productos',  manualSaleController.getProductos);

/**
 * POST /api/manualSale/registrar
 * Registra una nueva venta en mesa
 * Body: { idMesa: number, idSede: number, productos: Array }
 */
router.post('/registrar',  manualSaleController.registrarVenta);

/**
 * GET /api/manualSale/pedidos-pendientes
 * Obtiene todos los pedidos activos (pendientes o en preparación)
 */
router.get('/pedidos-pendientes',  manualSaleController.getPedidosPendientes);

/**
 * GET /api/manualSale/pedido/:idPedido
 * Obtiene el detalle de un pedido específico
 */
router.get('/pedido/:idPedido',  manualSaleController.getDetallePedido);

/**
 * POST /api/manualSale/pagar
 * Cierra un pedido y registra el pago
 * Body: { idPedido: number, metodoPago: string }
 */
router.post('/pagar',  manualSaleController.procesarPago);

/**
 * GET /api/manualSale/categorias
 * Obtiene todas las categorías para filtrar productos
 */
router.get('/categorias',  manualSaleController.getCategorias);

module.exports = router;