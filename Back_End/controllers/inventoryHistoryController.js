const db = require("../config/db");

// Obtener historial
const getInventoryHistory = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM inventory_history ORDER BY fecha DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener historial", error });
  }
};

// Insertar movimiento
const addInventoryHistory = async (req, res) => {
  try {
    const { producto_id, tipo_movimiento, cantidad } = req.body;
    await db.query(
      "INSERT INTO inventory_history (producto_id, tipo_movimiento, cantidad, fecha) VALUES (?, ?, ?, NOW())",
      [producto_id, tipo_movimiento, cantidad]
    );
    res.json({ message: "Movimiento agregado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al insertar movimiento", error });
  }
};

module.exports = { getInventoryHistory, addInventoryHistory };
