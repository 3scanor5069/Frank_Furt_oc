// MenuCrud.jsx - COMPLETAMENTE CORREGIDO (Sin parpadeo)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Filter, Download, Eye, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './MenuCrud.css';

const MenuCrud = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Principales',
    menu: 'Frank Furt',
    price: '',
    description: '',
    status: 'Activo',
    image: ''
  });

  const categories = ['Todos', 'Principales', 'Acompañamientos', 'Bebidas', 'Postres'];

  // ===================================================================
  // 🔄 OBTENER PRODUCTOS DEL BACKEND (OPTIMIZADO - Sin toast inicial)
  // ===================================================================
  const fetchMenuItems = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3006/api/menu");
      const data = await res.json();
      setMenuItems(data);
      
      // Solo mostrar toast si es refresh manual
      if (showToast) {
        toast.success(`✅ ${data.length} productos cargados`, {
          position: "top-right",
          autoClose: 2000
        });
      }
    } catch (err) {
      console.error('Error al cargar menú:', err);
      if (showToast) {
        toast.error('❌ Error al cargar productos. Intente nuevamente.', {
          position: "top-right",
          autoClose: 3000
        });
      }
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias para evitar re-creación

  // Cargar productos solo UNA VEZ al montar
  useEffect(() => {
    fetchMenuItems(false);
  }, [fetchMenuItems]);

  // ===================================================================
  // 🔍 FILTRAR PRODUCTOS (OPTIMIZADO con useMemo)
  // ===================================================================
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory]); // Solo recalcula cuando cambian estas dependencias

  // ===================================================================
  // ✅ VALIDACIÓN DE FORMULARIO EN TIEMPO REAL
  // ===================================================================
  const validateField = useCallback((name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value.trim()) {
          error = 'El nombre es obligatorio';
        } else if (value.trim().length < 3) {
          error = 'El nombre debe tener al menos 3 caracteres';
        }
        break;
      case 'price':
        if (!value) {
          error = 'El precio es obligatorio';
        } else if (parseFloat(value) <= 0) {
          error = 'El precio debe ser mayor a 0';
        }
        break;
      case 'menu':
        if (!value.trim()) {
          error = 'El menú es obligatorio';
        }
        break;
      case 'image':
        if (value && !value.match(/^https?:\/\/.+/i)) {
          error = 'Ingrese una URL válida (debe comenzar con http:// o https://)';
        }
        break;
      default:
        break;
    }

    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));

    return error === '';
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.price) {
      errors.price = 'El precio es obligatorio';
    } else if (parseFloat(formData.price) <= 0) {
      errors.price = 'El precio debe ser mayor a 0';
    }

    if (!formData.menu.trim()) {
      errors.menu = 'El menú es obligatorio';
    }

    if (formData.image && !formData.image.match(/^https?:\/\/.+/i)) {
      errors.image = 'Ingrese una URL válida (debe comenzar con http:// o https://)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // ===================================================================
  // 💾 CREAR / ACTUALIZAR PRODUCTO
  // ===================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('❌ Por favor corrija los errores en el formulario', {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    setLoading(true);
    try {
      if (editingItem) {
        await fetch(`http://localhost:3006/api/menu/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        toast.success('✅ Producto actualizado exitosamente', {
          position: "top-right",
          autoClose: 3000
        });
      } else {
        await fetch('http://localhost:3006/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        toast.success('✅ Producto creado exitosamente', {
          position: "top-right",
          autoClose: 3000
        });
      }
      await fetchMenuItems(false); // Sin toast adicional
      handleCloseModal();
    } catch (err) {
      console.error('Error al guardar producto:', err);
      toast.error('❌ Error al guardar producto. Intente nuevamente.', {
        position: "top-right",
        autoClose: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  // ===================================================================
  // ✏️ EDITAR PRODUCTO
  // ===================================================================
  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setViewMode(false);
    setFormErrors({});
    setFormData({
      name: item.name,
      category: item.category,
      menu: item.menu,
      price: item.price.toString(),
      description: item.description,
      status: item.status,
      image: item.image || ''
    });
    setShowModal(true);
  }, []);

  // ===================================================================
  // 👁️ VER DETALLES
  // ===================================================================
  const handleView = useCallback((item) => {
    setEditingItem(item);
    setViewMode(true);
    setShowModal(true);
  }, []);

  // ===================================================================
  // 🗑️ ELIMINAR PRODUCTO (CON CONFIRMACIÓN)
  // ===================================================================
  const handleDeleteClick = useCallback((item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setLoading(true);
    try {
      await fetch(`http://localhost:3006/api/menu/${itemToDelete.id}`, { 
        method: 'DELETE' 
      });
      setMenuItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      toast.success('✅ Producto eliminado exitosamente', {
        position: "top-right",
        autoClose: 3000
      });
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      toast.error('❌ Error al eliminar producto. Intente nuevamente.', {
        position: "top-right",
        autoClose: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  }, []);

  // ===================================================================
  // ❌ CERRAR MODAL
  // ===================================================================
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingItem(null);
    setViewMode(false);
    setFormErrors({});
    setFormData({
      name: '',
      category: 'Principales',
      menu: 'Frank Furt',
      price: '',
      description: '',
      status: 'Activo',
      image: ''
    });
  }, []);

  // ===================================================================
  // 📥 EXPORTAR CSV
  // ===================================================================
  const handleExport = useCallback(() => {
    try {
      const csvContent = [
        ['ID', 'Nombre', 'Categoría', 'Menú', 'Precio', 'Descripción', 'Estado'],
        ...filteredItems.map(item => [
          item.id,
          `"${item.name}"`,
          item.category,
          item.menu,
          item.price,
          `"${item.description}"`,
          item.status
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menu_frank_furt_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('✅ CSV exportado exitosamente', {
        position: "top-right",
        autoClose: 2000
      });
    } catch (err) {
      console.error('Error al exportar CSV:', err);
      toast.error('❌ Error al exportar CSV', {
        position: "top-right",
        autoClose: 3000
      });
    }
  }, [filteredItems]);

  // Handler para refresh manual
  const handleRefresh = useCallback(() => {
    fetchMenuItems(true); // Con toast
  }, [fetchMenuItems]);

  // ===================================================================
  // 🎨 RENDERIZADO
  // ===================================================================
  return (
    <div className="menu-crud">
      <ToastContainer limit={3} />

      {/* Header */}
      <div className="header-dash">
        <div className="header-title-invent">
          <h1>Gestión de Menú</h1>
          <p>Administra los productos de Frank Furt</p>
        </div>
        <div className="header-actions-invent">
          <button 
            className="btn-refresh" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? 'spinning' : ''} />
            Actualizar
          </button>
          <button className="btn-export" onClick={handleExport}>
            <Download size={20} />
            Exportar CSV
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Buscar productos por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <Filter size={20} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-container">
        {loading && menuItems.length === 0 ? (
          <div className="loading-state">
            <RefreshCw className="spinning" size={40} />
            <p>Cargando productos...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No se encontraron productos</h3>
            <p>Intenta ajustar los filtros o crea un nuevo producto</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={20} />
              Crear primer producto
            </button>
          </div>
        ) : (
          <table className="menu-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Menú</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    <div className="product-info">
                      <img 
                        src={item.image || 'https://via.placeholder.com/60x48?text=Sin+Imagen'} 
                        alt={item.name} 
                        className="product-image"
                        loading="lazy"
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = 'https://via.placeholder.com/60x48?text=Error';
                        }}
                      />
                      <div>
                        <div className="product-name">{item.name}</div>
                        <div className="product-description">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`category-badge category-${item.category.toLowerCase()}`}>
                      {item.category}
                    </span>
                  </td>
                  <td>{item.menu}</td>
                  <td className="price">${item.price.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        className="btn-action btn-view" 
                        onClick={() => handleView(item)}
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-action btn-edit" 
                        onClick={() => handleEdit(item)}
                        title="Editar producto"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-action btn-delete" 
                        onClick={() => handleDeleteClick(item)}
                        title="Eliminar producto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Edición/Creación/Vista */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-invent">
              <h2>
                {viewMode 
                  ? 'Detalles del Producto' 
                  : editingItem 
                    ? 'Editar Producto' 
                    : 'Agregar Producto'
                }
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            {viewMode ? (
              // Vista de solo lectura
              <div className="modal-form">
                <div className="product-view-container">
                  <div className="product-view-image">
                    <img 
                      src={editingItem.image || 'https://via.placeholder.com/200x160?text=Sin+Imagen'} 
                      alt={editingItem.name}
                      loading="lazy"
                      onError={(e) => { 
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/200x160?text=Error';
                      }}
                    />
                  </div>
                  <div className="product-view-details">
                    <div className="view-group">
                      <label>Nombre:</label>
                      <p>{editingItem.name}</p>
                    </div>
                    <div className="view-group">
                      <label>Categoría:</label>
                      <span className={`category-badge category-${editingItem.category.toLowerCase()}`}>
                        {editingItem.category}
                      </span>
                    </div>
                    <div className="view-group">
                      <label>Menú:</label>
                      <p>{editingItem.menu}</p>
                    </div>
                    <div className="view-group">
                      <label>Precio:</label>
                      <p className="price">${editingItem.price.toLocaleString()}</p>
                    </div>
                    <div className="view-group">
                      <label>Descripción:</label>
                      <p>{editingItem.description || 'Sin descripción'}</p>
                    </div>
                    <div className="view-group">
                      <label>Estado:</label>
                      <span className={`status-badge status-${editingItem.status.toLowerCase()}`}>
                        {editingItem.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                    Cerrar
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={() => {
                      setViewMode(false);
                      handleEdit(editingItem);
                    }}
                  >
                    <Edit size={18} />
                    Editar
                  </button>
                </div>
              </div>
            ) : (
              // Formulario de edición/creación
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>
                    Nombre del Producto <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      validateField('name', e.target.value);
                    }}
                    onBlur={(e) => validateField('name', e.target.value)}
                    placeholder="Ej: Hamburguesa Clásica"
                    className={formErrors.name ? 'input-error' : ''}
                  />
                  {formErrors.name && (
                    <span className="error-message">
                      <AlertCircle size={14} /> {formErrors.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Principales">Principales</option>
                    <option value="Acompañamientos">Acompañamientos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Postres">Postres</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Menú <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.menu}
                    onChange={(e) => {
                      setFormData({...formData, menu: e.target.value});
                      validateField('menu', e.target.value);
                    }}
                    onBlur={(e) => validateField('menu', e.target.value)}
                    placeholder="Ej: Frank Furt"
                    className={formErrors.menu ? 'input-error' : ''}
                  />
                  {formErrors.menu && (
                    <span className="error-message">
                      <AlertCircle size={14} /> {formErrors.menu}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Precio <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({...formData, price: e.target.value});
                      validateField('price', e.target.value);
                    }}
                    onBlur={(e) => validateField('price', e.target.value)}
                    placeholder="0.00"
                    className={formErrors.price ? 'input-error' : ''}
                  />
                  {formErrors.price && (
                    <span className="error-message">
                      <AlertCircle size={14} /> {formErrors.price}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descripción del producto"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Imagen (URL)</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({...formData, image: e.target.value});
                      validateField('image', e.target.value);
                    }}
                    onBlur={(e) => validateField('image', e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className={formErrors.image ? 'input-error' : ''}
                  />
                  {formErrors.image && (
                    <span className="error-message">
                      <AlertCircle size={14} /> {formErrors.image}
                    </span>
                  )}
                  {formData.image && !formErrors.image && (
                    <div className="image-preview">
                      <img 
                        src={formData.image} 
                        alt="Preview"
                        loading="lazy"
                        onError={(e) => { 
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="spinning" size={18} />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        {editingItem ? 'Actualizar' : 'Crear'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-delete">
              <AlertCircle size={48} color="#E74C3C" />
              <h2>¿Eliminar Producto?</h2>
            </div>
            <div className="modal-body-delete">
              <p>
                ¿Estás seguro de que deseas eliminar el producto{' '}
                <strong>{itemToDelete?.name}</strong>?
              </p>
              <p className="warning-text">
                ⚠️ Esta acción no se puede deshacer. Se eliminará toda la información asociada.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={cancelDelete}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-delete-confirm" 
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="spinning" size={18} />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Sí, Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCrud;