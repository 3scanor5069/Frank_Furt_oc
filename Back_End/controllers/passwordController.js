// Back_end/controllers/passwordController.js

const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// =================================================================
// CONFIGURACIÓN DE NODEMAILER
// =================================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verificar la configuración del transporter
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Error en la configuración de email:', error);
    } else {
        console.log('✅ Servidor de email listo para enviar mensajes');
    }
});

// =================================================================
// 1. SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// =================================================================
exports.forgotPassword = async (req, res) => {
    const { correo } = req.body;

    if (!correo) {
        return res.status(400).json({ 
            success: false,
            message: 'El correo es requerido' 
        });
    }

    try {
        // Verificar si el usuario existe
        const [rows] = await pool.query(
            'SELECT idUsuario, nombre, correo FROM usuario WHERE correo = ?',
            [correo.trim().toLowerCase()]
        );

        // Por seguridad, siempre respondemos lo mismo aunque el correo no exista
        if (rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Si el correo existe, recibirás un enlace de recuperación'
            });
        }

        const user = rows[0];

        // Generar token JWT con expiración corta (15 minutos)
        const resetToken = jwt.sign(
            { 
                id: user.idUsuario, 
                correo: user.correo,
                type: 'password-reset'
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // URL del frontend para resetear contraseña
        const resetURL = `http://localhost:3002/reset-password/${resetToken}`;

        // Configurar el correo
        const mailOptions = {
            from: `"Frank Furt" <${process.env.EMAIL_USER}>`,
            to: user.correo,
            subject: '🔐 Recuperación de Contraseña - Frank Furt',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            color: #333;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            background: white;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
                            color: white;
                            padding: 30px;
                            text-align: center;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 28px;
                            font-weight: bold;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .content h2 {
                            color: #333;
                            margin-top: 0;
                        }
                        .content p {
                            margin: 15px 0;
                            color: #666;
                        }
                        .button-container {
                            text-align: center;
                            margin: 30px 0;
                        }
                        .button {
                            display: inline-block;
                            padding: 15px 40px;
                            background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
                            color: white;
                            text-decoration: none;
                            border-radius: 25px;
                            font-weight: bold;
                            font-size: 16px;
                            transition: transform 0.3s ease;
                        }
                        .button:hover {
                            transform: translateY(-2px);
                        }
                        .warning {
                            background-color: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 4px;
                        }
                        .footer {
                            background-color: #f8f9fa;
                            padding: 20px;
                            text-align: center;
                            color: #666;
                            font-size: 12px;
                        }
                        .link-alt {
                            word-break: break-all;
                            color: #FF8C00;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🍔 FRANK FURT</h1>
                        </div>
                        <div class="content">
                            <h2>Hola, ${user.nombre}!</h2>
                            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
                            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                            
                            <div class="button-container">
                                <a href="${resetURL}" class="button">Restablecer Contraseña</a>
                            </div>

                            <div class="warning">
                                <strong>⚠️ Importante:</strong>
                                <ul style="margin: 10px 0; padding-left: 20px;">
                                    <li>Este enlace expirará en <strong>15 minutos</strong></li>
                                    <li>Si no solicitaste este cambio, ignora este correo</li>
                                    <li>Tu contraseña actual seguirá siendo válida</li>
                                </ul>
                            </div>

                            <p style="margin-top: 30px; color: #999; font-size: 14px;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:
                            </p>
                            <p style="font-size: 12px;">
                                <a href="${resetURL}" class="link-alt">${resetURL}</a>
                            </p>
                        </div>
                        <div class="footer">
                            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                            <p>&copy; ${new Date().getFullYear()} Frank Furt. Todos los derechos reservados.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);

        console.log(`✅ Correo de recuperación enviado a: ${user.correo}`);

        res.status(200).json({
            success: true,
            message: 'Si el correo existe, recibirás un enlace de recuperación'
        });

    } catch (error) {
        console.error('❌ Error en forgotPassword:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud. Intenta nuevamente.'
        });
    }
};

// =================================================================
// 2. RESTABLECER CONTRASEÑA
// =================================================================
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            message: 'La nueva contraseña es requerida'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 6 caracteres'
        });
    }

    try {
        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar que sea un token de reset de contraseña
        if (decoded.type !== 'password-reset') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        // Verificar que el usuario aún exista
        const [rows] = await pool.query(
            'SELECT idUsuario, correo, nombre FROM usuario WHERE idUsuario = ? AND correo = ?',
            [decoded.id, decoded.correo]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = rows[0];

        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Actualizar la contraseña en la base de datos
        await pool.query(
            'UPDATE usuario SET password = ? WHERE idUsuario = ?',
            [hashedPassword, user.idUsuario]
        );

        console.log(`✅ Contraseña actualizada para: ${user.correo}`);

        // Opcional: Enviar correo de confirmación
        const confirmationMailOptions = {
            from: `"Frank Furt" <${process.env.EMAIL_USER}>`,
            to: user.correo,
            subject: '✅ Contraseña Actualizada - Frank Furt',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            color: #333;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            background: white;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                            color: white;
                            padding: 30px;
                            text-align: center;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 28px;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .success-icon {
                            text-align: center;
                            font-size: 60px;
                            margin-bottom: 20px;
                        }
                        .footer {
                            background-color: #f8f9fa;
                            padding: 20px;
                            text-align: center;
                            color: #666;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🍔 FRANK FURT</h1>
                        </div>
                        <div class="content">
                            <div class="success-icon">✅</div>
                            <h2 style="text-align: center; color: #28a745;">¡Contraseña Actualizada!</h2>
                            <p>Hola, ${user.nombre}!</p>
                            <p>Tu contraseña ha sido actualizada exitosamente.</p>
                            <p>Si no realizaste este cambio, por favor contacta a nuestro equipo de soporte inmediatamente.</p>
                            <p style="margin-top: 30px;">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} Frank Furt. Todos los derechos reservados.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(confirmationMailOptions);

        res.status(200).json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'El enlace ha expirado. Solicita uno nuevo.'
            });
        }

        console.error('❌ Error en resetPassword:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la contraseña'
        });
    }
};