// Archivo: routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinaryConfig');
const {
    updateUserDetailsRules,
    updateUserPasswordRules,
    validate
} = require('../middleware/validator');

const router = express.Router();

// --- INICIO DE LA NUEVA IMPLEMENTACIÓN ---
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
 *               firstName:
 *                 type: string
 *                 example: Lionel
 *               lastName:
 *                 type: string
 *                 example: Scaloni
 *     responses:
 *       '200':
 *         description: Datos del usuario actualizados exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: "El objeto de usuario actualizado (sin la contraseña)."
 *       '401':
 *         description: No autorizado.
 *       '422':
 *         description: Error de validación en los datos de entrada.
 */
router.patch(
    '/profile/details',
    [verifyToken, updateUserDetailsRules(), validate],
    async (req, res, next) => {
        try {
            const { firstName, lastName } = req.body;
            const userId = req.user.userId;

            const query = `
                UPDATE users 
                SET firstname = $1, lastname = $2, updatedat = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING id, firstname, lastname, email, role, "profileImageUrl", createdat, updatedat;
            `;
            const { rows } = await db.query(query, [firstName, lastName, userId]);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }

            // Mapeamos a camelCase para consistencia en la respuesta
            const userResponse = {
                id: rows[0].id,
                firstName: rows[0].firstname,
                lastName: rows[0].lastname,
                email: rows[0].email,
                role: rows[0].role,
                profileImageUrl: rows[0].profileImageUrl,
                createdAt: rows[0].createdat,
                updatedAt: rows[0].updatedat
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
 *                 example: "nuevaContraseñaSegura123"
 *     responses:
 *       '200':
 *         description: Contraseña actualizada exitosamente.
 *       '401':
 *         description: No autorizado.
 *       '422':
 *         description: Error de validación (la nueva contraseña no cumple los requisitos).
 */
router.patch(
    '/profile/password',
    [verifyToken, updateUserPasswordRules(), validate],
    async (req, res, next) => {
        try {
            const { newPassword } = req.body;
            const userId = req.user.userId;

            // Hashear la nueva contraseña antes de guardarla
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
// --- FIN DE LA NUEVA IMPLEMENTACIÓN ---

module.exports = router;