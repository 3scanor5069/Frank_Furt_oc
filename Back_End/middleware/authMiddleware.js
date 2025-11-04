// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT
 * Verifica el token Bearer y agrega los datos del usuario a req.user
 */
function authMiddleware(req, res, next) {
  // Obtener el header Authorization
  const authHeader = req.header('Authorization');

  // Validar que existe el header
  if (!authHeader) {
    return res.status(401).json({ 
      message: 'No token, autorización denegada' 
    });
  }

  try {
    // Validar formato "Bearer <token>"
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Formato de token inválido. Use: Bearer <token>' 
      });
    }

    // Extraer el token (eliminar "Bearer " del inicio)
    const tokenReal = authHeader.split(' ')[1];
    
    // Validar que el token existe después del split
    if (!tokenReal) {
      return res.status(401).json({ 
        message: 'Token no proporcionado correctamente' 
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(tokenReal, process.env.JWT_SECRET);
    
    // Guardar el usuario decodificado en la request
    req.user = decoded;
    
    // Continuar con la siguiente función
    next();
    
  } catch (err) {
    // Manejo de errores específicos de JWT
    console.error('Error en authMiddleware:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token inválido' 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expirado. Por favor, inicie sesión nuevamente' 
      });
    }
    
    // Error genérico
    return res.status(401).json({ 
      message: 'Error de autenticación' 
    });
  }
}

// 🔑 Exportar el middleware
module.exports = authMiddleware;