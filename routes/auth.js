// Archivo: routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Importamos nuestra configuración de la BD

const router = express.Router();

// --- RUTA DE REGISTRO ---
// URL: POST /api/auth/register
router.post('/register', async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // 1. Validar que los datos necesarios están presentes
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        // 2. Verificar si el email ya existe
        const existingUser = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }

        // 3. Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Guardar el nuevo usuario en la base de datos (rol 'customer' por defecto)
        const newUserQuery = `
            INSERT INTO Users (firstName, lastName, email, password, role) 
            VALUES ($1, $2, $3, $4, 'customer') 
            RETURNING id, email, role, createdAt;
        `;
        const newUser = await db.query(newUserQuery, [firstName, lastName, email, hashedPassword]);

        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: newUser.rows[0]
        });

    } catch (error) {
        // Le pasamos el error a nuestro manejador centralizado
        next(error);
    }
});

// --- RUTA DE INICIO DE SESIÓN ---
// URL: POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Validar que los datos necesarios están presentes
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
        }

        // 2. Buscar el usuario en la base de datos
        const userResult = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' }); // Mensaje genérico por seguridad
        }
        const user = userResult.rows[0];

        // 3. Comparar la contraseña recibida con la encriptada
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 4. Si coinciden, crear el token JWT
        const payload = {
            userId: user.id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // El token expirará en 1 hora
        );

        // 5. Devolver el token al cliente
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token: token
        });

    } catch (error) {
        // Le pasamos el error a nuestro manejador centralizado
        next(error);
    }
});

module.exports = router;