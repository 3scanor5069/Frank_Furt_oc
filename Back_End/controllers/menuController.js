// menuController.js - OPTIMIZADO con mejoras de manejo de errores
const pool = require('../config/db');

// ===================================================================
// 1. OBTENER TODOS LOS PRODUCTOS DEL MENÚ
// ===================================================================
exports.getAllMenuItems = async (req, res) => {
  const sql = `
    SELECT
      p.idProducto, 
      p.nombre AS nombreProducto, 
      p.descripcion AS descripcionProducto, 
      p.precio,
      p.disponible,
      p.imagen_url,
      c.nombre AS categoria,
      m.nombre AS menu
    FROM producto p
    JOIN categoria c ON p.idCategoria = c.id
    JOIN menu m ON p.idMenu = m.idMenu
    ORDER BY p.nombre ASC
  `;

  try {
    const [result] = await pool.query(sql);
    const menuItems = result.map(item => ({
      id: item.idProducto,
      name: item.nombreProducto,
      description: item.descripcionProducto || '',
      price: parseFloat(item.precio),
      status: item.disponible === 1 ? 'Activo' : 'Inactivo',
      category: item.categoria,
      menu: item.menu,
      image: item.imagen_url || null
    }));

    res.status(200).json(menuItems);
  } catch (err) {
    console.error('❌ Error al obtener el menú:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los productos', 
      error: err.message 
    });
  }
};

// ===================================================================
// 2. CREAR UN NUEVO PRODUCTO
// ===================================================================
exports.createMenuItem = async (req, res) => {
  const { name, description, category, menu, price, status, image } = req.body;

  // Validaciones en backend
  if (!name || !name.trim()) {
    return res.status(400).json({ 
      success: false,
      message: 'El nombre del producto es obligatorio' 
    });
  }

  if (name.trim().length < 3) {
    return res.status(400).json({ 
      success: false,
      message: 'El nombre debe tener al menos 3 caracteres' 
    });
  }

  if (!price) {
    return res.status(400).json({ 
      success: false,
      message: 'El precio es obligatorio' 
    });
  }

  if (parseFloat(price) <= 0) {
    return res.status(400).json({ 
      success: false,
      message: 'El precio debe ser mayor a 0' 
    });
  }

  if (!menu || !menu.trim()) {
    return res.status(400).json({ 
      success: false,
      message: 'El menú es obligatorio' 
    });
  }

  // Validar URL de imagen si se proporciona
  if (image && !image.match(/^https?:\/\/.+/i)) {
    return res.status(400).json({ 
      success: false,
      message: 'La URL de la imagen debe comenzar con http:// o https://' 
    });
  }

  const activo = status === 'Activo' ? 1 : 0;

  try {
    // Verificar que la categoría existe
    const [categoryResult] = await pool.query(
      'SELECT id FROM categoria WHERE nombre = ?', 
      [category]
    );

    if (categoryResult.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: `La categoría "${category}" no existe` 
      });
    }
    const idCategoria = categoryResult[0].id;

    // Verificar que el menú existe
    const [menuResult] = await pool.query(
      'SELECT idMenu FROM menu WHERE nombre = ?', 
      [menu.trim()]
    );

    if (menuResult.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: `El menú "${menu}" no existe` 
      });
    }
    const idMenu = menuResult[0].idMenu;

    // Verificar si ya existe un producto con el mismo nombre
    const [existingProduct] = await pool.query(
      'SELECT idProducto FROM producto WHERE nombre = ?', 
      [name.trim()]
    );

    if (existingProduct.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: 'Ya existe un producto con ese nombre' 
      });
    }

    // Insertar el producto
    const insertSql = `
      INSERT INTO producto (nombre, descripcion, precio, idCategoria, idMenu, disponible, imagen_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(insertSql, [
      name.trim(), 
      description ? description.trim() : null, 
      parseFloat(price), 
      idCategoria, 
      idMenu, 
      activo, 
      image ? image.trim() : null
    ]);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: {
        id: result.insertId,
        name: name.trim(),
        description: description ? description.trim() : '',
        category,
        menu: menu.trim(),
        price: parseFloat(price),
        status,
        image: image ? image.trim() : null
      }
    });
  } catch (err) {
    console.error('❌ Error al crear el producto:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear el producto', 
      error: err.message 
    });
  }
};

// ===================================================================
// 3. ACTUALIZAR UN PRODUCTO
// ===================================================================
exports.updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const { name, description, category, menu, price, status, image } = req.body;

  // Validaciones
  if (!name || !name.trim()) {
    return res.status(400).json({ 
      success: false,
      message: 'El nombre del producto es obligatorio' 
    });
  }

  if (name.trim().length < 3) {
    return res.status(400).json({ 
      success: false,
      message: 'El nombre debe tener al menos 3 caracteres' 
    });
  }

  if (!price) {
    return res.status(400).json({ 
      success: false,
      message: 'El precio es obligatorio' 
    });
  }

  if (parseFloat(price) <= 0) {
    return res.status(400).json({ 
      success: false,
      message: 'El precio debe ser mayor a 0' 
    });
  }

  if (!menu || !menu.trim()) {
    return res.status(400).json({ 
      success: false,
      message: 'El menú es obligatorio' 
    });
  }

  if (image && !image.match(/^https?:\/\/.+/i)) {
    return res.status(400).json({ 
      success: false,
      message: 'La URL de la imagen debe comenzar con http:// o https://' 
    });
  }

  const activo = status === 'Activo' ? 1 : 0;

  try {
    // Verificar que el producto existe
    const [productExists] = await pool.query(
      'SELECT idProducto FROM producto WHERE idProducto = ?', 
      [id]
    );

    if (productExists.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    // Verificar si existe otro producto con el mismo nombre
    const [existingProduct] = await pool.query(
      'SELECT idProducto FROM producto WHERE nombre = ? AND idProducto != ?', 
      [name.trim(), id]
    );

    if (existingProduct.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: 'Ya existe otro producto con ese nombre' 
      });
    }

    // Verificar que la categoría existe
    const [categoryResult] = await pool.query(
      'SELECT id FROM categoria WHERE nombre = ?', 
      [category]
    );

    if (categoryResult.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: `La categoría "${category}" no existe` 
      });
    }
    const idCategoria = categoryResult[0].id;

    // Verificar que el menú existe
    const [menuResult] = await pool.query(
      'SELECT idMenu FROM menu WHERE nombre = ?', 
      [menu.trim()]
    );

    if (menuResult.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: `El menú "${menu}" no existe` 
      });
    }
    const idMenu = menuResult[0].idMenu;

    // Actualizar el producto
    const updateSql = `
      UPDATE producto 
      SET nombre = ?, descripcion = ?, precio = ?, idCategoria = ?, idMenu = ?, disponible = ?, imagen_url = ?
      WHERE idProducto = ?
    `;
    await pool.query(updateSql, [
      name.trim(), 
      description ? description.trim() : null, 
      parseFloat(price), 
      idCategoria, 
      idMenu, 
      activo, 
      image ? image.trim() : null, 
      id
    ]);

    res.status(200).json({ 
      success: true,
      message: 'Producto actualizado exitosamente',
      data: {
        id: parseInt(id),
        name: name.trim(),
        description: description ? description.trim() : '',
        category,
        menu: menu.trim(),
        price: parseFloat(price),
        status,
        image: image ? image.trim() : null
      }
    });
  } catch (err) {
    console.error('❌ Error al actualizar el producto:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar el producto', 
      error: err.message 
    });
  }
};

// ===================================================================
// 4. ELIMINAR UN PRODUCTO
// ===================================================================
exports.deleteMenuItem = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que el producto existe
    const [productExists] = await pool.query(
      'SELECT idProducto, nombre FROM producto WHERE idProducto = ?', 
      [id]
    );

    if (productExists.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    // Eliminar el producto
    const sql = `DELETE FROM producto WHERE idProducto = ?`;
    await pool.query(sql, [id]);

    res.status(200).json({ 
      success: true,
      message: `Producto "${productExists[0].nombre}" eliminado exitosamente` 
    });
  } catch (err) {
    console.error('❌ Error al eliminar el producto:', err);
    
    // Error de clave foránea
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ 
        success: false,
        message: 'No se puede eliminar el producto porque tiene registros asociados (pedidos, inventario, etc.)' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar el producto', 
      error: err.message 
    });
  }
};