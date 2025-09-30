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


// --- Bloque de Definición de Swagger para la sección de Autenticación ---

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints para autenticación de usuarios (Registro e Inicio de Sesión).
 */

// --- Bloque de Documentación para la Ruta de Registro ---

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuevo usuario en la plataforma.
 *     tags: [Auth]
 *     description: Este endpoint recibe los datos de un nuevo usuario, valida la información, hashea la contraseña y lo guarda en la base de datos con un rol por defecto de 'customer'.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Nombre del usuario.
 *                 example: Juan
 *               lastName:
 *                 type: string
 *                 description: Apellido del usuario.
 *                 example: Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico único del usuario.
 *                 example: juan.perez@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña del usuario (mínimo 6 caracteres).
 *                 example: password123
 *     responses:
 *       '201':
 *         description: Usuario registrado exitosamente.
 *       '409':
 *         description: El correo electrónico ya está registrado.
 *       '422':
 *         description: Error de validación. El cuerpo de la petición no cumple con las reglas requeridas.
 *       '500':
 *         description: Error interno del servidor.
 */
router.post('/register', registerValidationRules(), validate, async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        const existingUser = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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
        next(error);
    }
});


// --- Bloque de Documentación para la Ruta de Login ---

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión y devuelve un token JWT para autorizar futuras peticiones.
 *     tags: [Auth]
 *     description: El usuario envía sus credenciales (email y password). El servidor las valida y, si son correctas, genera un JSON Web Token (JWT) con una validez de 1 hora.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *     responses:
 *       '200':
 *         description: Inicio de sesión exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Inicio de sesión exitoso.
 *                 token:
 *                   type: string
 *                   description: Token JWT para ser usado en el header 'Authorization' como 'Bearer <token>'.
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYxNzQwNjQwMCwiZXhwIjoxNjE3NDA5MDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *       '401':
 *         description: Credenciales inválidas.
 *       '422':
 *         description: Error de validación (datos de entrada incorrectos).
 *       '500':
 *         description: Error interno del servidor.
 */
router.post('/login', loginValidationRules(), validate, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const userResult = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const user = userResult.rows[0];

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const payload = {
            userId: user.id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token: token
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;