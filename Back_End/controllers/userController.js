const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- GENERAR TOKEN ---
function generateToken(user) {
    // Se usa idUsuario y correo para la identidad del token
    return jwt.sign(
        { id: user.idUsuario, correo: user.correo, rol: user.rol }, // Incluir el rol en el token es útil
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || '1h' }
    );
}

// =================================================================
// 1. OBTENER TODOS LOS USUARIOS
// =================================================================
exports.getAllUsers = async (req, res) => {
    try {
        const sql = `
            SELECT 
                idUsuario, 
                nombre, 
                correo, 
                telefono, 
                direccion, 
                rol,
                fecha_registro, 
                activo 
            FROM 
                usuario
            ORDER BY fecha_registro DESC
        `;
        const [rows] = await pool.query(sql);

        const users = rows.map(row => {
            const nameParts = row.nombre ? row.nombre.split(' ') : ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            return {
                id: row.idUsuario,
                firstName: firstName,
                lastName: lastName,
                correo: row.correo,
                phone: row.telefono,
                location: row.direccion,
                hobby: 'N/A', // Campo de ejemplo, mantenerlo si es necesario en el frontend
                status: row.activo === 1 ? 'active' : 'inactive',
                dateCreated: row.fecha_registro ? new Date(row.fecha_registro).toISOString().split('T')[0] : null,
                avatar: (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
            };
        });
        res.json(users);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
    }
};

// =================================================================
// 2. CREAR UN NUEVO USUARIO (ADMIN/CMS) - Incluye Contraseña
// =================================================================
exports.createUser = async (req, res) => {
    // Se extrae la contraseña (password) para hashearla
    const { firstName, lastName, correo, phone, location, status, rol, password } = req.body; 
    
    const nombreCompleto = `${firstName} ${lastName}`.trim();
    const activo = status === 'active' ? 1 : 0;
    const rolAsignado = rol || 'cliente';

    // Se necesita una contraseña, si no viene, se asigna un valor por defecto que debe hashearse
    const rawPassword = password || 'default_password'; 

    try {
        // Hashing de la contraseña para la inserción
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const sql = `
            INSERT INTO usuario (nombre, correo, telefono, direccion, password, rol, activo)
            VALUES (?, ?, ?, ?, ?, ?, ?) 
        `;
        
        const [result] = await pool.query(sql, [
            nombreCompleto, 
            correo, 
            phone, 
            location, 
            hashedPassword, // Usamos la contraseña hasheada
            rolAsignado, 
            activo
        ]);
        
        const newUser = {
            id: result.insertId,
            firstName,
            lastName,
            correo,
            phone,
            location,
            rol: rolAsignado,
            status,
            dateCreated: new Date().toISOString().split('T')[0],
            avatar: (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
        };
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        // Error 1062 es duplicado (correo)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El correo ya está registrado.', error: error.message });
        }
        res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
    }
};

// =================================================================
// 3. ACTUALIZAR UN USUARIO EXISTENTE (ADMIN/CMS)
// =================================================================
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    // Se incluye password en el body, pero es opcional
    const { firstName, lastName, correo, phone, location, rol, status, password } = req.body;
    const nombreCompleto = `${firstName} ${lastName}`.trim();
    const activo = status === 'active' ? 1 : 0;

    try {
        let updateFields = 'nombre = ?, correo = ?, telefono = ?, direccion = ?, rol = ?, activo = ?';
        let updateValues = [nombreCompleto, correo, phone, location, rol, activo];

        // Lógica para actualizar la contraseña solo si se proporciona una nueva
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields += ', password = ?';
            updateValues.push(hashedPassword);
        }

        const sql = `
            UPDATE usuario
            SET ${updateFields}
            WHERE idUsuario = ?
        `;
        updateValues.push(id); // Agregar el ID al final

        const [result] = await pool.query(sql, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Si la actualización es exitosa, se devuelve la data actualizada
        const updatedUser = {
            id: parseInt(id),
            firstName,
            lastName,
            correo,
            phone,
            location,
            rol,
            status,
            avatar: (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
        };
        res.json(updatedUser);
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
    }
};

// =================================================================
// 4. ELIMINAR UN USUARIO
// =================================================================
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        // NOTA: Si este usuario está referenciado en la tabla 'pedido' a través de la FK
        // con ON DELETE CASCADE, los pedidos de este usuario serán eliminados automáticamente.
        const sql = 'DELETE FROM usuario WHERE idUsuario = ?';
        const [result] = await pool.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
    }
};

// =================================================================
// 5. REGISTRAR UN USUARIO (Frontend/Cliente)
// =================================================================
exports.registerUser = async (req, res) => {
    // Se usa 'nombre' para el registro simple del cliente
    const { nombre, correo, password } = req.body; 

    if (!nombre || !correo || !password) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    try {
        const [existingUser] = await pool.query('SELECT correo FROM usuario WHERE correo = ?', [correo]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'El correo ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // NOTA: Las columnas 'rol', 'activo', 'fecha_registro' tomarán sus valores DEFAULT de la BD
        const sql = `INSERT INTO usuario (nombre, correo, password) VALUES (?, ?, ?)`; 
        await pool.query(sql, [nombre, correo, hashedPassword]);

        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ message: 'Error del servidor al registrar el usuario', error: error.message });
    }
};

// =================================================================
// 6. LOGIN con JWT
// =================================================================
exports.loginUser = async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
    }

    try {
        // Seleccionamos TODOS los campos incluyendo 'rol' para el token
        const [rows] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
        const user = rows[0];

        if (!user || user.activo === 0) { // Verificar si el usuario existe y está activo
            return res.status(404).json({ message: 'Credenciales inválidas o usuario inactivo' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        // Actualizar último acceso (opcional)
        await pool.query('UPDATE usuario SET ultimo_acceso = NOW() WHERE idUsuario = ?', [user.idUsuario]);

        // Generar token
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user.idUsuario,
                nombre: user.nombre,
                correo: user.correo,
                rol: user.rol // Devolver el rol para el manejo en el frontend
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};

// =================================================================
// 7. VERIFICAR TOKEN
// =================================================================
exports.verifyToken = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ success: true, user: decoded });
    } catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

// =================================================================
// 8. CERRAR SESIÓN (Logout) y 9. PERFIL (Profile)
// =================================================================
exports.logoutUser = async (req, res) => {
    res.status(200).json({ success: true, message: 'Sesión cerrada correctamente' });
};

exports.getProfile = (req, res) => {
    // Asumiendo que req.user es inyectado por un middleware de autenticación
    res.json({
        message: 'Perfil del usuario',
        user: req.user
    });
};