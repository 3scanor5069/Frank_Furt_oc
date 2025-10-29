require('dotenv').config(); // << CARGAR VARIABLES .ENV

const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const passwordRoutes = require('./routes/passwordRoutes'); 
const menuRoutes = require('./routes/menuRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const inventoryHistoryRoutes = require('./routes/inventoryHistoryRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const manualSaleRoutes = require('./routes/manualSaleRoutes'); // << NUEVA RUTA

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/users', userRoutes); 
app.use('/api', passwordRoutes); 
app.use('/api/menu', menuRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inventoryHistory', inventoryHistoryRoutes);
app.use('/api/venta', ventaRoutes);                    // <- Ruta original (cambié el path)
app.use('/api/manualSale', manualSaleRoutes);          // <- Nueva ruta con mesas

// Ruta de prueba principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Frank Furt funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      menu: '/api/menu',
      dashboard: '/api/dashboard',
      inventory: '/api/inventory',
      inventoryHistory: '/api/inventoryHistory',
      venta: '/api/venta',
      manualSale: '/api/manualSale'
    }
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(' Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    message: 'Verifica que la URL sea correcta'
  });
});

// Puerto
const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log('🚀 =========================================');
  console.log(`🍔 Servidor Frank Furt corriendo en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log('📡 Endpoints disponibles:');
  console.log('   - Users:       /api/users');
  console.log('   - Menu:        /api/menu');
  console.log('   - Dashboard:   /api/dashboard');
  console.log('   - Inventory:   /api/inventory');
  console.log('   - History:     /api/inventoryHistory');
  console.log('   - Venta:       /api/venta');
  console.log('   - Manual Sale: /api/manualSale');
  console.log('🚀 =========================================');
});

module.exports = app;