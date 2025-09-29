// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.header('Authorization'); // esperamos: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'No token, autorización denegada' });
  }

  try {
    // si envías "Bearer xxx", separa el prefijo
    const tokenReal = token.split(' ')[1];
    const decoded = jwt.verify(tokenReal, process.env.JWT_SECRET);
    req.user = decoded; // guardamos el usuario en la request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

// 🔑 ¡Aquí definimos y exportamos correctamente!
module.exports = authMiddleware;
