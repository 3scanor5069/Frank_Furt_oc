// routes/manualSale.js
const express = require('express');
const router = express.Router();
const manualSaleController = require('../controllers/manualSaleController');

// Ruta para crear un pedido manual
router.post('/manual', manualSaleController.crearPedidoManual);

// Ruta para obtener todos los pedidos pendientes
router.get('/pendientes', manualSaleController.obtenerPedidosPendientes);

// Ruta para obtener el detalle de un pedido específico
router.get('/:idPedido', manualSaleController.obtenerDetallePedido);

// Ruta para marcar un pedido como pagado
router.put('/:idPedido/pagar', manualSaleController.marcarComoPagado);

// Ruta para cancelar un pedido
router.delete('/:idPedido', manualSaleController.cancelarPedido);

// Ruta para obtener el historial de pedidos de una mesa
router.get('/mesa/:idMesa/historial', manualSaleController.obtenerHistorialMesa);

// Ruta para obtener estadísticas de ventas manuales
router.get('/estadisticas/ventas', manualSaleController.obtenerEstadisticas);

module.exports = router;