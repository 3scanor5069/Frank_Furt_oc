import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  Plus,
  RefreshCw,
  Clock,
  ChefHat,
  CheckCircle,
  DollarSign,
  Users,
  UtensilsCrossed,
  Search,
  X
} from 'lucide-react';
import HeaderDashboard from '../components/HeaderDashboard';
import Footer from '../components/Footer';
import './OrderManagementPage.css';

const API_BASE_URL = 'http://localhost:3006/api';

// ============================================================================
// COMPONENTE: ORDER CARD (Tarjeta de Pedido)
// ============================================================================
const OrderCard = ({ order, onUpdateStatus, onPay, isUpdating }) => {
  const getStatusColor = (status) => {
    const colors = {
      'pendiente': '#FFA500',
      'en_preparacion': '#2196F3',
      'entregado': '#4CAF50',
      'pagado': '#9E9E9E'
    };
    return colors[status] || '#9E9E9E';
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pendiente': 'en_preparacion',
      'en_preparacion': 'entregado',
      'entregado': 'pagado'
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      'pendiente': 'Enviar a Cocina',
      'en_preparacion': 'Marcar Entregado',
      'entregado': 'Finalizado'
    };
    return labels[currentStatus] || 'Siguiente';
  };

  const handleMoveToNext = () => {
    const nextStatus = getNextStatus(order.estado);
    if (nextStatus) {
      onUpdateStatus(order.idPedido, nextStatus);
    }
  };

  const handlePay = () => {
    onPay(order);
  };

  return (
    <div 
      className="order-card" 
      style={{ borderLeft: `4px solid ${getStatusColor(order.estado)}` }}
    >

      {/* Header del Pedido */}
      <div className="order-card-header">
        <div className="order-id">
          <strong>#{order.idPedido}</strong>
        </div>
        <div className="order-location">
          {order.mesa ? (
            <>
              <UtensilsCrossed size={16} />
              <span>Mesa {order.mesa.numero}</span>
            </>
          ) : (
            <>
              <Users size={16} />
              <span>{order.usuario?.nombre || 'Cliente'}</span>
            </>
          )}
        </div>
      </div>

      {/* Productos del Pedido (Comanda) */}
      <div className="order-products">
        <div className="products-label">Productos:</div>
        {order.productos && order.productos.length > 0 ? (
          <ul className="products-list">
            {order.productos.map((producto, index) => (
              <li key={index} className="product-item">
                <span className="product-name">{producto.nombre}</span>
                <span className="product-quantity">x{producto.cantidad}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-products">Sin productos</p>
        )}
      </div>

      {/* Total del Pedido */}
      <div className="order-total">
        <strong>Total:</strong>
        <span className="total-amount">
          ${order.total ? Number(order.total).toLocaleString('es-CO') : '0'}
        </span>
      </div>

      {/* Fecha del Pedido */}
      <div className="order-date">
        <Clock size={14} />
        <span>{new Date(order.fecha).toLocaleString('es-CO')}</span>
      </div>

      {/* Acciones */}
      <div className="order-actions">
        {/* Botón de Siguiente Estado (si no está pagado) */}
        {order.estado !== 'pagado' && order.estado !== 'entregado' && (
          <button
            className="btn-next-status"
            onClick={handleMoveToNext}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <div className="btn-spinner"></div>
                <span>Actualizando...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>{getNextStatusLabel(order.estado)}</span>
              </>
            )}
          </button>
        )}

        {/* Botón de Cobrar (solo visible en ENTREGADO) */}
        {order.estado === 'entregado' && (
          <button
            className="btn-pay"
            onClick={handlePay}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <div className="btn-spinner"></div>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <DollarSign size={16} />
                <span>Cobrar</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: CREATE ORDER MODAL
// ============================================================================
const CreateOrderModal = ({ isOpen, onClose, onCreateOrder }) => {
  const [formData, setFormData] = useState({
    tipo: 'mesa', // 'mesa' o 'cliente'
    idMesa: '',
    idUsuario: '',
    productos: []
  });

  const [mesas, setMesas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadMesas();
      loadProductos();
      loadUsuarios();
    }
  }, [isOpen]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadMesas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mesas/available`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setMesas(data.mesas || []);
    } catch (error) {
      console.error('Error al cargar mesas:', error);
    }
  };

  const loadProductos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/products`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setProductos(data.productos || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const loadUsuarios = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/clientes`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setUsuarios(data.usuarios || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct || cantidad <= 0) {
      toast.error('Selecciona un producto y cantidad válida');
      return;
    }

    const productToAdd = {
      idProducto: selectedProduct.idProducto,
      nombre: selectedProduct.nombre,
      precio: selectedProduct.precio,
      cantidad: cantidad,
      subtotal: selectedProduct.precio * cantidad
    };

    setFormData({
      ...formData,
      productos: [...formData.productos, productToAdd]
    });

    setSelectedProduct(null);
    setCantidad(1);
    setSearchTerm('');
    toast.success('Producto agregado');
  };

  const handleRemoveProduct = (index) => {
    const newProductos = formData.productos.filter((_, i) => i !== index);
    setFormData({ ...formData, productos: newProductos });
  };

  const calculateTotal = () => {
    return formData.productos.reduce((sum, p) => sum + p.subtotal, 0);
  };

  const handleSubmit = async () => {
    // Validaciones
    if (formData.tipo === 'mesa' && !formData.idMesa) {
      toast.error('Selecciona una mesa');
      return;
    }

    if (formData.tipo === 'cliente' && !formData.idUsuario) {
      toast.error('Selecciona un cliente');
      return;
    }

    if (formData.productos.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    setLoading(true);

    try {
      await onCreateOrder({
        idMesa: formData.tipo === 'mesa' ? formData.idMesa : null,
        idUsuario: formData.tipo === 'cliente' ? formData.idUsuario : null,
        productos: formData.productos
      });

      // Limpiar formulario
      setFormData({
        tipo: 'mesa',
        idMesa: '',
        idUsuario: '',
        productos: []
      });

      onClose();
    } catch (error) {
      console.error('Error al crear pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 className="modal-title">Crear Pedido / Venta Manual</h2>

        {/* Tipo de Pedido */}
        <div className="form-section">
          <label className="form-label">Tipo de Pedido:</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                value="mesa"
                checked={formData.tipo === 'mesa'}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value, idUsuario: '' })}
              />
              <UtensilsCrossed size={18} />
              <span>Mesa</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                value="cliente"
                checked={formData.tipo === 'cliente'}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value, idMesa: '' })}
              />
              <Users size={18} />
              <span>Cliente Registrado</span>
            </label>
          </div>
        </div>

        {/* Selección de Mesa o Cliente */}
        {formData.tipo === 'mesa' ? (
          <div className="form-section">
            <label className="form-label">Seleccionar Mesa:</label>
            <select
              className="form-select"
              value={formData.idMesa}
              onChange={(e) => setFormData({ ...formData, idMesa: e.target.value })}
            >
              <option value="">-- Selecciona una mesa --</option>
              {mesas.map(mesa => (
                <option key={mesa.idMesa} value={mesa.idMesa}>
                  Mesa {mesa.numero} (Capacidad: {mesa.capacidad})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="form-section">
            <label className="form-label">Seleccionar Cliente:</label>
            <select
              className="form-select"
              value={formData.idUsuario}
              onChange={(e) => setFormData({ ...formData, idUsuario: e.target.value })}
            >
              <option value="">-- Selecciona un cliente --</option>
              {usuarios.map(usuario => (
                <option key={usuario.idUsuario} value={usuario.idUsuario}>
                  {usuario.nombre} ({usuario.correo})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Agregar Productos */}
        <div className="form-section">
          <label className="form-label">Agregar Productos:</label>
          <div className="product-search">
            <div className="search-input-wrapper">
              <Search size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {searchTerm && filteredProducts.length > 0 && (
              <div className="search-results">
                {filteredProducts.map(producto => (
                  <div
                    key={producto.idProducto}
                    className={`search-result-item ${selectedProduct?.idProducto === producto.idProducto ? 'selected' : ''}`}
                    onClick={() => setSelectedProduct(producto)}
                  >
                    <span className="product-name">{producto.nombre}</span>
                    <span className="product-price">${Number(producto.precio).toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="selected-product">
              <div className="selected-product-info">
                <strong>{selectedProduct.nombre}</strong>
                <span>${Number(selectedProduct.precio).toLocaleString('es-CO')}</span>
              </div>
              <div className="quantity-controls">
                <label>Cantidad:</label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                  className="quantity-input"
                />
                <button className="btn-add" onClick={handleAddProduct}>
                  <Plus size={16} />
                  Agregar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Productos Agregados */}
        {formData.productos.length > 0 && (
          <div className="form-section">
            <label className="form-label">Productos en el Pedido:</label>
            <div className="added-products-list">
              {formData.productos.map((producto, index) => (
                <div key={index} className="added-product-item">
                  <div className="product-details">
                    <span className="product-name">{producto.nombre}</span>
                    <span className="product-quantity">x{producto.cantidad}</span>
                  </div>
                  <div className="product-actions">
                    <span className="product-subtotal">
                      ${producto.subtotal.toLocaleString('es-CO')}
                    </span>
                    <button
                      className="btn-remove"
                      onClick={() => handleRemoveProduct(index)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-total-preview">
              <strong>Total:</strong>
              <span className="total-amount">
                ${calculateTotal().toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || formData.productos.length === 0}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>Crear Pedido</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL: ORDER MANAGEMENT PAGE
// ============================================================================
const OrderManagementPage = () => {
  const [orders, setOrders] = useState({
    pendiente: [],
    en_preparacion: [],
    entregado: [],
    pagado: []
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Cargar pedidos
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/pedidos/status-board`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar pedidos');
      }

      const data = await response.json();
      
      setOrders({
        pendiente: data.pendiente || [],
        en_preparacion: data.en_preparacion || [],
        entregado: data.entregado || [],
        pagado: data.pagado || []
      });

    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      toast.error('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Actualizar estado del pedido
  const handleUpdateStatus = async (idPedido, newStatus) => {
    try {
      setUpdatingOrderId(idPedido);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/pedidos/${idPedido}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newStatus })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      toast.success('Estado actualizado correctamente');
      await loadOrders();

    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('Error al actualizar el estado del pedido');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Procesar pago
  const handlePay = async (order) => {
    try {
      setUpdatingOrderId(order.idPedido);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/pedidos/${order.idPedido}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          montoTotal: order.total,
          idUsuarioCobro: 1 // ID del usuario que está cobrando (puedes obtenerlo del contexto)
        })
      });

      if (!response.ok) {
        throw new Error('Error al procesar pago');
      }

      toast.success('¡Pago procesado correctamente!');
      await loadOrders();

    } catch (error) {
      console.error('Error al procesar pago:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Crear pedido
  const handleCreateOrder = async (orderData) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/pedidos/manual-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Error al crear pedido');
      }

      toast.success('Pedido creado correctamente');
      await loadOrders();

    } catch (error) {
      console.error('Error al crear pedido:', error);
      toast.error('Error al crear el pedido');
      throw error;
    }
  };

  const getColumnIcon = (status) => {
    const icons = {
      'pendiente': <Clock size={20} />,
      'en_preparacion': <ChefHat size={20} />,
      'entregado': <CheckCircle size={20} />,
      'pagado': <DollarSign size={20} />
    };
    return icons[status];
  };

  const getColumnTitle = (status) => {
    const titles = {
      'pendiente': 'Pendiente',
      'en_preparacion': 'En Preparación',
      'entregado': 'Entregado',
      'pagado': 'Pagado / Cerrado'
    };
    return titles[status];
  };

  return (
    <div className="order-management-page">
      {/* Header */}
      <HeaderDashboard/>
      <div className="page-header">
        <div className="header-left">
          <h1>Gestión de Pedidos</h1>
          <p>Administra los pedidos del restaurante</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-refresh"
            onClick={loadOrders}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            <span>Actualizar</span>
          </button>
          <button
            className="btn-create"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span>Crear Pedido / Venta Manual</span>
          </button>
        </div>
        
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {['pendiente', 'en_preparacion', 'entregado', 'pagado'].map(status => (
          <div key={status} className="kanban-column">
            <div className="column-header">
              <div className="column-icon">{getColumnIcon(status)}</div>
              <h3 className="column-title">{getColumnTitle(status)}</h3>
              <span className="column-count">{orders[status].length}</span>
            </div>

            <div className="column-body">
              {orders[status].length === 0 ? (
                <div className="empty-column">
                  <p>No hay pedidos</p>
                </div>
              ) : (
                orders[status].map(order => (
                  <OrderCard
                    key={order.idPedido}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onPay={handlePay}
                    isUpdating={updatingOrderId === order.idPedido}
                  />
                ))
              )}
            </div>
            
          </div>
        ))}
      </div>
     
      {/* Modal de Creación de Pedido */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateOrder={handleCreateOrder}
      />
    </div>
  );
};

export default OrderManagementPage;