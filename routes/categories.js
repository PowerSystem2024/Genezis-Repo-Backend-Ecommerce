// Archivo: routes/categories.js
const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const checkAdmin = require('../middleware/adminMiddleware');
const { categoryValidationRules, idParamValidationRules, validate } = require('../middleware/validator');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: API para la gestión de categorías de productos.
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Obtiene una lista de todas las categorías.
 *     tags: [Categories]
 *     description: Ruta pública para que el frontend pueda obtener las categorías para filtros y formularios.
 *     responses:
 *       '200':
 *         description: Lista de categorías obtenida exitosamente.
 */
router.get('/', async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM Categories ORDER BY name ASC');
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crea una nueva categoría (Solo Administradores).
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Teclados" }
 *               description: { type: string, example: "Teclados mecánicos, de membrana y ergonómicos." }
 *     responses:
 *       '201':
 *         description: Categoría creada exitosamente.
 */
router.post('/', [verifyToken, checkAdmin], categoryValidationRules(), validate, async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const query = 'INSERT INTO Categories (name, description) VALUES ($1, $2) RETURNING *';
        const { rows } = await db.query(query, [name, description]);
        res.status(201).json({ message: 'Categoría creada exitosamente.', category: rows[0] });
    } catch (error) {
        // Manejar error de nombre duplicado
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' });
        }
        next(error);
    }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Actualiza una categoría existente (Solo Administradores).
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       '200':
 *         description: Categoría actualizada exitosamente.
 */
router.put('/:id', [verifyToken, checkAdmin], idParamValidationRules(), categoryValidationRules(), validate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const query = 'UPDATE Categories SET name = $1, description = $2, updatedAt = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
        const { rows } = await db.query(query, [name, description, id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Categoría no encontrada.' });
        }
        res.status(200).json({ message: 'Categoría actualizada exitosamente.', category: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' });
        }
        next(error);
    }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Elimina una categoría (Solo Administradores).
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Categoría eliminada exitosamente.
 */
router.delete('/:id', [verifyToken, checkAdmin], idParamValidationRules(), validate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM Categories WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Categoría no encontrada.' });
        }
        res.status(200).json({ message: 'Categoría eliminada exitosamente. Los productos asociados ahora no tendrán categoría.' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;