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

// RUTA PROTEGIDA
router.get('/profile', authMiddleware, userController.getProfile);

// JWT
router.get('/verify', userController.verifyToken);
router.post('/logout', userController.logoutUser);

module.exports = router;
