// Back_end/routes/passwordRoutes.js

const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');

// Ruta para solicitar recuperación de contraseña
router.post('/forgot-password', passwordController.forgotPassword);

// Ruta para restablecer la contraseña con el token
router.post('/reset-password/:token', passwordController.resetPassword);

module.exports = router;