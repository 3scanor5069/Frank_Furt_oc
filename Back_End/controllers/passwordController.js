// controllers/passwordController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'mi_secreto_para_tokens';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email es requerido' });

    // Buscar usuario por correo
    const [users] = await pool.query('SELECT idCliente, correo FROM cliente WHERE correo = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'No existe un usuario con ese correo' });
    }

    const user = users[0];

    // Generar token (15 minutos)
    const token = jwt.sign({ idCliente: user.idCliente }, SECRET, { expiresIn: '15m' });

    // Enlace hacia tu frontend (por defecto http://localhost:3000)
    const resetLink = `${FRONTEND_URL}/Restablecer?token=${token}`;

    // Log para debug (en producción enviar email con nodemailer)
    console.log('[PASSWORD] reset link:', resetLink);

    return res.json({
      message: 'Se ha generado el enlace de recuperación (simulado)',
      resetLink
    });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    return res.status(500).json({ message: 'Error al procesar la solicitud', detail: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });

    let decoded;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch (err) {
      console.error('JWT verify error:', err);
      if (err.name === 'TokenExpiredError') return res.status(400).json({ message: 'El enlace ha expirado' });
      return res.status(400).json({ message: 'Token inválido' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query('UPDATE cliente SET password = ? WHERE idCliente = ?', [hashedPassword, decoded.idCliente]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({ message: 'Error al procesar la solicitud', detail: error.message });
  }
};
