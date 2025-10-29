// Administrador/ManualSale.jsx
import React, { useState, useEffect } from 'react';
import './ManualSale.css';

const ManualSale = () => {
  // Estados
  const [productos, setProductos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);

  // Cargar datos al montar
  useEffect(() => {
    cargarDatosIniciales();
    // Actualizar estadísticas cada 30 segundos
    const interval = setInterval(cargarEstadisticas, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    await Promise.all([
      cargarProductos(),
      cargarMesas(),
      cargarCategorias(),
      cargarEstadisticas()
    ]);
    setLoading(false);
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/manualSale/estadisticas');
      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const cargarMesas = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/manualSale/mesas');
      if (!response.ok) throw new Error('Error al cargar mesas');
      const data = await response.json();
      setMesas(data);
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al cargar las mesas', 'error');
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/manualSale/productos');
      if (!response.ok) throw new Error('Error al cargar productos');
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al cargar los productos', 'error');
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/manualSale/categorias');
      if (!response.ok) throw new Error('Error al cargar categorías');
      const data = await response.json();
      setCategorias(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) {
      mostrarMensaje('Producto sin stock disponible', 'error');
      return;
    }

    const productoExistente = carrito.find(item => item.idProducto === producto.idProducto);
    
    if (productoExistente) {
      if (productoExistente.cantidad >= producto.stock) {
        mostrarMensaje('Stock insuficiente', 'error');
        return;
      }
      setCarrito(carrito.map(item =>
        item.idProducto === producto.idProducto
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
      mostrarMensaje(`+1 ${producto.nombre}`, 'exito');
    } else {
      setCarrito([...carrito, {
        idProducto: producto.idProducto,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
        stockDisponible: producto.stock
      }]);
      mostrarMensaje(`${producto.nombre} agregado`, 'exito');
    }
  };

  const modificarCantidad = (idProducto, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(idProducto);
      return;
    }

    const item = carrito.find(i => i.idProducto === idProducto);
    if (item && nuevaCantidad > item.stockDisponible) {
      mostrarMensaje('Stock insuficiente', 'error');
      return;
    }

    setCarrito(carrito.map(item =>
      item.idProducto === idProducto
        ? { ...item, cantidad: nuevaCantidad }
        : item
    ));
  };

  const eliminarDelCarrito = (idProducto) => {
    const item = carrito.find(i => i.idProducto === idProducto);
    setCarrito(carrito.filter(item => item.idProducto !== idProducto));
    if (item) {
      mostrarMensaje(`${item.nombre} eliminado`, 'info');
    }
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  const confirmarPedido = async () => {
    if (!mesaSeleccionada) {
      mostrarMensaje('Debe seleccionar una mesa', 'error');
      return;
    }

    if (carrito.length === 0) {
      mostrarMensaje('El carrito está vacío', 'error');
      return;
    }

    // Confirmación
    const mesaInfo = mesas.find(m => m.idMesa === parseInt(mesaSeleccionada));
    const confirmar = window.confirm(
      `¿Confirmar pedido para ${mesaInfo?.numero}?\n` +
      `Total: $${calcularTotal().toLocaleString()}\n` +
      `Items: ${carrito.reduce((sum, p) => sum + p.cantidad, 0)}`
    );

    if (!confirmar) return;

    setLoading(true);

    try {
      const pedidoData = {
        idMesa: parseInt(mesaSeleccionada),
        idSede: 1,
        productos: carrito.map(item => ({
          idProducto: item.idProducto,
          cantidad: item.cantidad
        }))
      };

      const response = await fetch('http://localhost:3006/api/manualSale/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoData)
      });

      const result = await response.json();

      if (response.ok) {
        mostrarMensaje(
          `✅ Pedido #${result.data.idPedido} registrado - Total: $${result.data.total.toLocaleString()}`,
          'exito'
        );
        // Limpiar
        setCarrito([]);
        setMesaSeleccionada('');
        // Recargar datos
        await Promise.all([cargarMesas(), cargarProductos(), cargarEstadisticas()]);
      } else {
        const errorMsg = result.error || 'Error al registrar el pedido';
        mostrarMensaje(errorMsg, 'error');
        
        // Si es error de stock, mostrar detalles
        if (result.code === 'INSUFFICIENT_STOCK' && result.producto) {
          mostrarMensaje(
            `Stock insuficiente: ${result.producto} (Disponible: ${result.disponible})`,
            'error'
          );
        }
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al conectar con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const limpiarCarrito = () => {
    if (carrito.length > 0) {
      if (window.confirm('¿Limpiar el carrito?')) {
        setCarrito([]);
        mostrarMensaje('Carrito limpiado', 'info');
      }
    }
  };

  const mostrarMensaje = (texto, tipo = 'exito') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 5000);
  };

  // Filtrar productos
  const productosFiltrados = productos.filter(p => {
    const coincideCategoria = !categoriaFiltro || p.categoria === categoriaFiltro;
    const coincideBusqueda = !busqueda || 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  const mesaActual = mesas.find(m => m.idMesa === parseInt(mesaSeleccionada));

  return (
    <div className="manual-sale-container">
      {/* Header */}
      <div className="manual-sale-header">
        <div className="header-title">
          <h1>🍔 Venta Manual - Frank Furt</h1>
          {estadisticas && (
            <div className="estadisticas-header">
              <span>📊 Pedidos Hoy: {estadisticas.totalPedidosHoy}</span>
              <span>💰 Ventas: ${parseFloat(estadisticas.ventasTotalesHoy || 0).toLocaleString()}</span>
              <span>🪑 Mesas: {estadisticas.mesasDisponibles} disponibles</span>
            </div>
          )}
        </div>

        <div className="mesa-selector">
          <label htmlFor="mesa">Mesa:</label>
          <select
            id="mesa"
            value={mesaSeleccionada}
            onChange={(e) => setMesaSeleccionada(e.target.value)}
            disabled={loading}
            className="select-mesa"
          >
            <option value="">Selecciona una mesa</option>
            {mesas.map(mesa => (
              <option 
                key={mesa.idMesa} 
                value={mesa.idMesa}
                disabled={mesa.estado !== 'disponible'}
              >
                {mesa.numero} {mesa.estado !== 'disponible' ? '(Ocupada)' : ''}
              </option>
            ))}
          </select>
          {mesaActual && (
            <span className={`estado-mesa ${mesaActual.estado}`}>
              {mesaActual.estado === 'disponible' ? '✓ Disponible' : '✕ Ocupada'}
            </span>
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="manual-sale-content">
        {/* Sección de Productos */}
        <div className="productos-section">
          <div className="productos-header">
            <h2>Productos Disponibles</h2>
            <div className="filtros-container">
              <div className="busqueda-input">
                <input
                  type="text"
                  placeholder="🔍 Buscar producto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="input-busqueda"
                />
              </div>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="select-categoria"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.nombre}>
                    {cat.nombre} ({cat.cantidadProductos})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="productos-grid">
            {loading ? (
              <div className="loading-productos">
                <div className="spinner"></div>
                <p>Cargando productos...</p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <p className="no-productos">
                {busqueda || categoriaFiltro 
                  ? 'No se encontraron productos con esos filtros' 
                  : 'No hay productos disponibles'}
              </p>
            ) : (
              productosFiltrados.map(producto => (
                <div 
                  key={producto.idProducto} 
                  className={`producto-card ${producto.stock <= 0 ? 'sin-stock' : ''}`}
                >
                  <div className="producto-badge">{producto.categoria}</div>
                  <h3 className="producto-nombre">{producto.nombre}</h3>
                  {producto.descripcion && (
                    <p className="producto-descripcion">{producto.descripcion}</p>
                  )}
                  <div className="producto-footer">
                    <div className="producto-info">
                      <p className="precio">${producto.precio.toLocaleString()}</p>
                      <p className={`stock ${producto.stock <= 5 ? 'stock-bajo' : ''}`}>
                        Stock: {producto.stock}
                      </p>
                    </div>
                    <button
                      className="btn-agregar"
                      onClick={() => agregarAlCarrito(producto)}
                      disabled={producto.stock <= 0 || loading}
                    >
                      {producto.stock <= 0 ? 'Sin Stock' : '+ Agregar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sección del Carrito */}
        <div className="carrito-section">
          <div className="carrito-header">
            <h2>🛒 Pedido Actual</h2>
            {carrito.length > 0 && (
              <button 
                className="btn-limpiar-carrito"
                onClick={limpiarCarrito}
                disabled={loading}
                title="Limpiar carrito"
              >
                🗑️ Limpiar
              </button>
            )}
          </div>

          {carrito.length === 0 ? (
            <div className="carrito-vacio">
              <p>🛒 El carrito está vacío</p>
              <small>Selecciona productos para comenzar</small>
            </div>
          ) : (
            <div className="carrito-contenido">
              <div className="carrito-items">
                {carrito.map(item => (
                  <div key={item.idProducto} className="carrito-item">
                    <div className="item-info">
                      <h4>{item.nombre}</h4>
                      <p className="item-precio">${item.precio.toLocaleString()}</p>
                    </div>
                    <div className="cantidad-controls">
                      <button
                        onClick={() => modificarCantidad(item.idProducto, item.cantidad - 1)}
                        disabled={loading}
                        className="btn-cantidad"
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span className="cantidad-display">{item.cantidad}</span>
                      <button
                        onClick={() => modificarCantidad(item.idProducto, item.cantidad + 1)}
                        disabled={loading || item.cantidad >= item.stockDisponible}
                        className="btn-cantidad"
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                    <div className="item-subtotal">
                      ${(item.precio * item.cantidad).toLocaleString()}
                    </div>
                    <button
                      className="btn-eliminar"
                      onClick={() => eliminarDelCarrito(item.idProducto)}
                      disabled={loading}
                      title="Eliminar del carrito"
                      aria-label="Eliminar producto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="carrito-resumen">
                <div className="resumen-detalles">
                  <div className="detalle-linea">
                    <span>Productos:</span>
                    <span>{carrito.length}</span>
                  </div>
                  <div className="detalle-linea">
                    <span>Unidades:</span>
                    <span>{carrito.reduce((sum, item) => sum + item.cantidad, 0)}</span>
                  </div>
                  <div className="detalle-linea total-linea">
                    <span>Total:</span>
                    <span className="total-precio">${calcularTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                className="btn-confirmar"
                onClick={confirmarPedido}
                disabled={loading || !mesaSeleccionada}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Procesando...
                  </>
                ) : (
                  <>✓ Confirmar Pedido</>
                )}
              </button>

              {!mesaSeleccionada && carrito.length > 0 && (
                <p className="advertencia-mesa">⚠️ Selecciona una mesa para continuar</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mensajes Toast */}
      {mensaje && (
        <div className={`mensaje-toast ${mensaje.tipo}`}>
          <span className="mensaje-icono">
            {mensaje.tipo === 'exito' ? '✓' : mensaje.tipo === 'error' ? '✕' : 'ℹ'}
          </span>
          <span className="mensaje-texto">{mensaje.texto}</span>
          <button 
            className="mensaje-cerrar" 
            onClick={() => setMensaje(null)}
            aria-label="Cerrar mensaje"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ManualSale;