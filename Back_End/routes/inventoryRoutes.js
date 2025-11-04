const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// ========================================
// RUTAS DE INVENTARIO
// ========================================

// 📊 Endpoint principal - Stock actual
router.get('/', inventoryController.getInventory);

// 📈 Estadísticas para Stats Cards
router.get('/stats', inventoryController.getInventoryStats);

// 🔍 Filtros por estado
router.get('/in-stock', inventoryController.getInsumosInStock);
router.get('/low-stock', inventoryController.getInsumosLowStock);
router.get('/out-of-stock', inventoryController.getInsumosOutOfStock);

// 📋 Lista de insumos (para selector)
router.get('/insumos-list', inventoryController.getInsumosList);

// 📝 Registro de movimientos
router.post('/movement', inventoryController.recordInventoryMovement);

// 📜 Historial de movimientos
router.get('/movements', inventoryController.getAllMovements);
router.get('/movements/:nombre_insumo', inventoryController.getMovementHistory);

// 🔍 Búsqueda de insumo
router.get('/search', inventoryController.searchInsumo);

module.exports = router;