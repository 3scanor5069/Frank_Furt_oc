// backend/routes/userProfileRoutes.js
const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const authMiddleware = require('../middleware/authMiddleware');

// ============================================================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================================================
// El authMiddleware verifica que el usuario tenga un JWT válido
// y extrae la información del usuario (idUsuario, rol, etc.) del token

// ============================================================================
// RUTAS DEL PERFIL DE USUARIO
// ============================================================================

// GET /api/users/profile - Obtener datos del perfil del usuario logueado
router.get('/profile', authMiddleware, userProfileController.getProfile);

// PUT /api/users/profile/update - Actualizar nombre y correo del usuario
router.put('/profile/update', authMiddleware, userProfileController.updateProfile);

// PUT /api/users/profile/password - Cambiar contraseña del usuario
router.put('/profile/password', authMiddleware, userProfileController.changePassword);

// DELETE /api/users/profile/delete - Eliminar cuenta del usuario
router.delete('/profile/delete', authMiddleware, userProfileController.deleteAccount);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================
module.exports = router;