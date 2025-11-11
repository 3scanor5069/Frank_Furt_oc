// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// ============================================================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================================================
// IMPORTANTE: Cada ruta tiene authMiddleware como segundo parámetro

// GET /api/pedidos/status-board - Obtener tablero Kanban con todos los pedidos
router.get('/pedidos/status-board', authMiddleware, orderController.getStatusBoard);

// GET /api/mesas/available - Obtener mesas disponibles
router.get('/mesas/available', authMiddleware, orderController.getAvailableMesas);

// GET /api/menu/products - Obtener productos del menú
router.get('/menu/products', authMiddleware, orderController.getMenuProducts);

// GET /api/users/clientes - Obtener lista de clientes
router.get('/users/clientes', authMiddleware, orderController.getClientes);

// POST /api/pedidos/manual-create - Crear pedido/venta manual
router.post('/pedidos/manual-create', authMiddleware, orderController.createManualOrder);

// PUT /api/pedidos/:idPedido/update-status - Actualizar estado del pedido
router.put('/pedidos/:idPedido/update-status', authMiddleware, orderController.updateOrderStatus);

// POST /api/pedidos/:idPedido/pay - Procesar pago y cerrar pedido
router.post('/pedidos/:idPedido/pay', authMiddleware, orderController.processPayment);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================
module.exports = router;