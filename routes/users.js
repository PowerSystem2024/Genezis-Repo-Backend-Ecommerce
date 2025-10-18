// Archivo: routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const checkAdmin = require('../middleware/adminMiddleware');

const {
    updateUserDetailsRules,
    updateUserPasswordRules,
    validate
} = require('../middleware/validator');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints para la gestión de datos de usuarios.
 */

// --- RUTAS DE GESTIÓN DE PERFIL PROPIO (Cualquier usuario logueado) ---

/**
 * @swagger
 * /api/users/profile/details:
 *   patch:
 *     summary: Actualiza el nombre y apellido del usuario autenticado.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName]
 *             properties:
 *               firstName: { type: string, example: "Lionel" }
 *               lastName: { type: string, example: "Scaloni" }
 *     responses:
 *       '200':
 *         description: Datos del usuario actualizados exitosamente.
 */
router.patch(
    '/profile/details',
    [verifyToken, updateUserDetailsRules(), validate],
    async (req, res, next) => {
        try {
            const { firstName, lastName } = req.body;
            const userId = req.user.userId;

            // --- CORRECCIÓN: Eliminada "profileImageUrl" de la sentencia RETURNING ---
            const query = `
                UPDATE users 
                SET firstname = $1, lastname = $2, updatedat = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING id, firstname, lastname, email, role, createdat, updatedat, "isActive";
            `;
            const { rows } = await db.query(query, [firstName, lastName, userId]);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }
            
            // --- CORRECCIÓN: Eliminada "profileImageUrl" del objeto de respuesta ---
            const userResponse = {
                id: rows[0].id, firstName: rows[0].firstname, lastName: rows[0].lastname,
                email: rows[0].email, role: rows[0].role, createdAt: rows[0].createdat,
                updatedAt: rows[0].updatedat, isActive: rows[0].isActive
            };

            res.status(200).json({
                message: 'Datos actualizados exitosamente.',
                user: userResponse
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /api/users/profile/password:
 *   patch:
 *     summary: Actualiza la contraseña del usuario autenticado.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: "La nueva contraseña (mínimo 6 caracteres)."
 *     responses:
 *       '200':
 *         description: Contraseña actualizada exitosamente.
 */
router.patch(
    '/profile/password',
    [verifyToken, updateUserPasswordRules(), validate],
    async (req, res, next) => {
        try {
            const { newPassword } = req.body;
            const userId = req.user.userId;

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            const query = `
                UPDATE users 
                SET password = $1, updatedat = CURRENT_TIMESTAMP
                WHERE id = $2;
            `;
            const result = await db.query(query, [hashedPassword, userId]);

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }

            res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });
        } catch (error) {
            next(error);
        }
    }
);

// --- RUTAS DE ADMINISTRACIÓN ---

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtiene una lista de todos los usuarios del sistema (Solo Administradores).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de usuarios obtenida exitosamente.
 */
router.get('/', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        // --- CORRECCIÓN: Eliminada "profileImageUrl" de la sentencia SELECT ---
        const query = `
            SELECT id, firstname, lastname, email, role, "isActive", createdat, updatedat
            FROM users
            ORDER BY id ASC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Desactiva (archiva) un usuario (Borrado Lógico, Solo Administradores).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: El ID del usuario a desactivar.
 *     responses:
 *       '200':
 *         description: Usuario archivado exitosamente.
 */
router.delete('/:id', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        const adminUserId = req.user.userId;
        const userIdToDelete = parseInt(req.params.id, 10);

        if (adminUserId === userIdToDelete) {
            return res.status(403).json({ message: 'No puedes desactivar tu propia cuenta de administrador.' });
        }

        const query = `
            UPDATE users SET "isActive" = FALSE, updatedat = CURRENT_TIMESTAMP
            WHERE id = $1 RETURNING id;
        `;
        const result = await db.query(query, [userIdToDelete]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado para archivar.' });
        }
        
        res.status(200).json({ message: 'Usuario archivado exitosamente.' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;