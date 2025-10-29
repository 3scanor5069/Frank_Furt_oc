const pool = require("../config/db");

// 📌 Obtener todo el inventario con info del producto
exports.getAllInventory = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.idInventario, i.idProducto, p.nombre, p.precio, i.idSede,
             i.stockDisponible, i.stock_minimo, i.stock_maximo, i.fechaActualizacion
      FROM inventario i
      JOIN producto p ON i.idProducto = p.idProducto
      ORDER BY i.fechaActualizacion DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    res.status(500).json({ message: "Error al obtener inventario", error: error.message });
  }
};

// 📌 Crear un nuevo registro de inventario
exports.createInventory = async (req, res) => {
  const { idProducto, idSede, stockDisponible, stock_minimo, stock_maximo } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO inventario (idProducto, idSede, stockDisponible, stock_minimo, stock_maximo, fechaActualizacion)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [idProducto, idSede, stockDisponible, stock_minimo, stock_maximo]
    );

    res.status(201).json({
      idInventario: result.insertId,
      idProducto,
      idSede,
      stockDisponible,
      stock_minimo,
      stock_maximo
    });
  } catch (error) {
    console.error("Error al crear inventario:", error);
    res.status(500).json({ message: "Error al crear inventario", error: error.message });
  }
};

// 📌 Actualizar inventario
exports.updateInventory = async (req, res) => {
  const { id } = req.params;
  const { stockDisponible, stock_minimo, stock_maximo } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE inventario
       SET stockDisponible=?, stock_minimo=?, stock_maximo=?, fechaActualizacion=NOW()
       WHERE idInventario=?`,
      [stockDisponible, stock_minimo, stock_maximo, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inventario no encontrado" });
    }

    res.json({ message: "Inventario actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar inventario:", error);
    res.status(500).json({ message: "Error al actualizar inventario", error: error.message });
  }
};

// 📌 Eliminar inventario
exports.deleteInventory = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM inventario WHERE idInventario = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inventario no encontrado" });
    }

    res.json({ message: "Inventario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar inventario:", error);
    res.status(500).json({ message: "Error al eliminar inventario", error: error.message });
  }
};
