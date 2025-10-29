const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const authMiddleware = require('../middleware/authMiddleware');


router.get("/",  inventoryController.getAllInventory);
router.post("/",  inventoryController.createInventory);
router.put("/:id",  inventoryController.updateInventory);
router.delete("/:id", inventoryController.deleteInventory);

module.exports = router;