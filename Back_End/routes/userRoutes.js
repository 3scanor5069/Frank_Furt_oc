const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// CRUD BÁSICO
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// REGISTRO Y LOGIN
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// PRUEBA
router.get('/prueba', (req, res) => res.send('OK prueba'));


// JWT
router.get('/verify', userController.verifyToken);
router.post('/logout', userController.logoutUser);

// PERFIL DE USUARIO - RUTAS PROTEGIDAS
// 
// Obtener perfil del usuario autenticado
router.get('/profile', authMiddleware, userController.getProfile);

// Actualizar información del perfil (teléfono, dirección)
router.put('/profile/update', authMiddleware, userController.updateProfile);

// Eliminar cuenta propia (requiere contraseña)
router.delete('/profile/delete', authMiddleware, userController.deleteAccount);


module.exports = router;
