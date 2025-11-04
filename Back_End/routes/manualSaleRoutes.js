// ========================================
// 🍔 MANUAL SALE ROUTES - DEFINITIVO
// Frank Furt TPV System
// ========================================
// Rutas completas para el módulo de venta manual
// ========================================

const express = require('express');
const router = express.Router();
const manualSaleController = require('../controllers/manualSaleController');

// ==========================================
// 📋 RUTAS DE CONSULTA
// ==========================================

/**
 * @route   GET /api/manualSale/mesas
 * @desc    Obtener todas las mesas con su estado
 * @access  Private (Administrador)
 */
router.get('/mesas', manualSaleController.getMesas);

/**
 * @route   GET /api/manualSale/productos
 * @desc    Obtener todos los productos disponibles con stock
 * @access  Private (Administrador)
 */
router.get('/productos', manualSaleController.getProductos);

/**
 * @route   GET /api/manualSale/personalizaciones
 * @desc    Obtener todas las opciones de personalización disponibles
 * @access  Private (Administrador)
 */
router.get('/personalizaciones', manualSaleController.getPersonalizaciones);

/**
 * @route   GET /api/manualSale/categorias
 * @desc    Obtener todas las categorías activas
 * @access  Private (Administrador)
 */
router.get('/categorias', manualSaleController.getCategorias);

/**
 * @route   GET /api/manualSale/estadisticas
 * @desc    Obtener estadísticas del día actual
 * @access  Private (Administrador)
 */
router.get('/estadisticas', manualSaleController.getEstadisticas);

// ==========================================
// 📤 RUTAS DE ACCIÓN
// ==========================================

/**
 * @route   POST /api/manualSale/registrar
 * @desc    Registrar una nueva venta en mesa CON SOPORTE DE PERSONALIZACIÓN
 * @body    { 
 *   idMesa, 
 *   idSede, 
 *   idUsuario,
 *   productos: [{ 
 *     idProducto, 
 *     cantidad,
 *     personalizaciones: [idPersonalizacion],
 *     notas: "string opcional"
 *   }],
 *   observaciones: "observaciones generales del pedido"
 * }
 * @access  Private (Administrador)
 */
router.post('/registrar', manualSaleController.registrarVenta);

module.exports = router;