const express = require("express");
const { getInventoryHistory, addInventoryHistory } = require("../controllers/inventoryHistoryController");

const router = express.Router();

// Obtener historial completo
router.get("/", getInventoryHistory);

// Agregar movimiento al historial
router.post("/", addInventoryHistory);

module.exports = router;
