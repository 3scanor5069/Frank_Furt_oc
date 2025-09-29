import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import "./InventoryCrud.css";

const InventoryCrud = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    idProducto: "", // ahora obligatorio para crear inventario
    idSede: 1, // por ahora fijo en la sede 1
    stockDisponible: "",
    stock_minimo: "",
    stock_maximo: "",
  });

  const statuses = ["Todos", "En Stock", "Stock Bajo", "Stock Crítico", "Agotado"];

  // Función para determinar el estado basado en stock
  const getStockStatus = (current, min) => {
    if (current === 0) return "Agotado";
    if (current <= min * 0.5) return "Stock Crítico";
    if (current <= min) return "Stock Bajo";
    return "En Stock";
  };

  // 🔹 Cargar datos desde la API
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:3006/api/inventory");
      const data = await res.json();
      const updated = data.map((item) => ({
        ...item,
        status: getStockStatus(item.stockDisponible, item.stock_minimo),
      }));
      setInventoryItems(updated);
    } catch (err) {
      console.error("Error cargando inventario:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Guardar inventario (crear o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingItem) {
        // actualizar
        await fetch(`http://localhost:3006/api/inventory/${editingItem.idInventario}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // crear
        await fetch("http://localhost:3006/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      fetchInventory();
      handleCloseModal();
    } catch (err) {
      console.error("Error guardando inventario:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Editar inventario
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      idProducto: item.idProducto,
      idSede: 1,
      stockDisponible: item.stockDisponible,
      stock_minimo: item.stock_minimo,
      stock_maximo: item.stock_maximo,
    });
    setShowModal(true);
  };

  // 🔹 Eliminar inventario
  const handleDelete = async (idInventario) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este registro?")) {
      try {
        await fetch(`http://localhost:3006/api/inventory/${idInventario}`, {
          method: "DELETE",
        });
        fetchInventory();
      } catch (err) {
        console.error("Error eliminando inventario:", err);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      idProducto: "",
      idSede: 1,
      stockDisponible: "",
      stock_minimo: "",
      stock_maximo: "",
    });
  };

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todas" || item.categoria === selectedCategory;
    const matchesStatus = selectedStatus === "Todos" || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: inventoryItems.length,
    enStock: inventoryItems.filter((i) => i.status === "En Stock").length,
    stockBajo: inventoryItems.filter((i) => i.status === "Stock Bajo").length,
    stockCritico: inventoryItems.filter((i) => i.status === "Stock Crítico").length,
    agotado: inventoryItems.filter((i) => i.status === "Agotado").length,
    valorTotal: inventoryItems.reduce(
      (total, i) => total + i.stockDisponible * i.precio,
      0
    ),
  };

  return (
    <div className="inventory-crud">
      <div className="header-invent">
        <div className="header-title-invent">
          <h1>Gestión de Inventario</h1>
          <p>Controla el stock y suministros de Frank Furt</p>
        </div>
        <div className="header-actions-invent">
          <button className="btn-refresh" onClick={fetchInventory} disabled={isLoading}>
            <RefreshCw size={20} className={isLoading ? "spinning" : ""} />
            {isLoading ? "Actualizando..." : "Actualizar"}
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Agregar Inventario
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon total"><Package size={24} /></div>
          <div className="stat-info"><h3>{stats.total}</h3><p>Total Registros</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><TrendingUp size={24} /></div>
          <div className="stat-info"><h3>{stats.enStock}</h3><p>En Stock</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><AlertTriangle size={24} /></div>
          <div className="stat-info"><h3>{stats.stockBajo + stats.stockCritico}</h3><p>Requiere Atención</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><TrendingDown size={24} /></div>
          <div className="stat-info"><h3>{stats.agotado}</h3><p>Agotados</p></div>
        </div>
        <div className="stat-card valor">
          <div className="stat-info"><h3>${stats.valorTotal.toLocaleString()}</h3><p>Valor Total Inventario</p></div>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio Unit.</th>
              <th>Stock</th>
              <th>Min/Máx</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.idInventario}>
                <td>{item.nombre}</td>
                <td>${item.precio.toLocaleString()}</td>
                <td>{item.stockDisponible}</td>
                <td>{item.stock_minimo}/{item.stock_maximo}</td>
                <td>
                  <span
                    className={`status-badge status-${item.status.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td>
                  <button className="btn-action btn-edit" onClick={() => handleEdit(item)}>
                    <Edit size={16} />
                  </button>
                  <button className="btn-action btn-delete" onClick={() => handleDelete(item.idInventario)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-invent">
              <h2>{editingItem ? "Editar Inventario" : "Agregar Inventario"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>ID Producto</label>
                  <input
                    type="number"
                    value={formData.idProducto}
                    onChange={(e) => setFormData({ ...formData, idProducto: e.target.value })}
                    disabled={!!editingItem} // No se puede cambiar en edición
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock Disponible</label>
                  <input
                    type="number"
                    value={formData.stockDisponible}
                    onChange={(e) => setFormData({ ...formData, stockDisponible: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Stock Mínimo</label>
                  <input
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Stock Máximo</label>
                  <input
                    type="number"
                    value={formData.stock_maximo}
                    onChange={(e) => setFormData({ ...formData, stock_maximo: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button onClick={handleCloseModal} className="btn-secondary">Cancelar</button>
                <button onClick={handleSubmit} className="btn-primary" disabled={isLoading}>
                  {isLoading ? "Guardando..." : editingItem ? "Actualizar" : "Agregar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryCrud;
