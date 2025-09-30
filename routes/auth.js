// Archivo: routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Importamos las reglas de validación y el manejador desde nuestro archivo centralizado
const {
    registerValidationRules,
    loginValidationRules,
    validate
} = require('../middleware/validator');

const router = express.Router();

// --- RUTA DE REGISTRO ---
// URL: POST /api/auth/register
// 1. La petición primero pasa por las reglas de 'registerValidationRules'.
// 2. Luego, el middleware 'validate' comprueba si hubo errores.
// 3. Si no hay errores, la petición finalmente llega a la lógica async (req, res, next).
router.post('/register', registerValidationRules(), validate, async (req, res, next) => {
    try {
        // Gracias a la validación, podemos extraer los datos del body con la certeza de que existen y tienen el formato correcto.
        const { firstName, lastName, email, password } = req.body;

        // Verificar si el email ya existe en la base de datos
        const existingUser = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            // Usamos un código 409 Conflict para indicar que el recurso ya existe.
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }

        // Encriptar la contraseña antes de guardarla
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Guardar el nuevo usuario en la base de datos con el rol 'customer' por defecto
        const newUserQuery = `
            INSERT INTO Users (firstName, lastName, email, password, role)
            VALUES ($1, $2, $3, $4, 'customer')
            RETURNING id, email, role, createdAt;
        `;
        const newUser = await db.query(newUserQuery, [firstName, lastName, email, hashedPassword]);

        // Enviar una respuesta de éxito
        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: newUser.rows[0]
        });

    } catch (error) {
        // Si ocurre cualquier otro error inesperado, lo pasamos a nuestro manejador de errores central.
        next(error);
    }
});

// --- RUTA DE INICIO DE SESIÓN ---
// URL: POST /api/auth/login
router.post('/login', loginValidationRules(), validate, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Buscar el usuario en la base de datos por su email
        const userResult = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            // Mensaje genérico por seguridad para no revelar si el email existe o no.
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const user = userResult.rows[0];

        // Comparar la contraseña proporcionada con la contraseña hasheada en la base de datos
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Si las credenciales son correctas, crear el payload para el token JWT
        const payload = {
            userId: user.id,
            role: user.role
        };

        // Firmar el token con nuestro secreto y establecer un tiempo de expiración
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // El token será válido por 1 hora
        );

        // Devolver el token al cliente
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token: token
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;