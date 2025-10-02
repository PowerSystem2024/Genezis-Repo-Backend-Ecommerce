// Archivo: routes/products.js (Versión Corregida y Final)
const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const checkAdmin = require('../middleware/adminMiddleware');
const {
    productValidationRules,
    idParamValidationRules,
    validate
} = require('../middleware/validator');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API para la gestión de productos del e-commerce.
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtiene una lista de todos los productos, incluyendo el nombre de su categoría.
 *     tags: [Products]
 *     responses:
 *       '200':
 *         description: Lista de productos obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer }
 *                   name: { type: string }
 *                   price: { type: number }
 *                   stock: { type: integer }
 *                   categoryID: { type: integer, nullable: true }
 *                   categoryName: { type: string, nullable: true, description: "Nombre de la categoría asociada." }
 *       '500':
 *         description: Error interno del servidor.
 */
router.get('/', async (req, res, next) => {
    try {
        // Esta es la única y correcta consulta que une las tablas Products y Categories
        const query = `
            SELECT 
                p.id, 
                p.name, 
                p.description, 
                p.price, 
                p.stock, 
                p.coverImageURL, 
                p.categoryID, 
                c.name AS categoryName
            FROM Products p
            LEFT JOIN Categories c ON p.categoryID = c.id
            ORDER BY p.createdAt DESC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error)
        next(error);
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtiene los detalles de un solo producto por su ID, incluyendo el nombre de su categoría.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID numérico del producto a obtener.
 *     responses:
 *       '200':
 *         description: Detalles del producto.
 *       '404':
 *         description: Producto no encontrado.
 *       '422':
 *         description: El ID proporcionado no es un número entero válido.
 *       '500':
 *         description: Error interno del servidor.
 */
router.get('/:id', idParamValidationRules(), validate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                p.id, 
                p.name, 
                p.description, 
                p.price, 
                p.stock, 
                p.coverImageURL, 
                p.categoryID, 
                c.name AS categoryName
            FROM Products p
            LEFT JOIN Categories c ON p.categoryID = c.id
            WHERE p.id = $1;
        `;
        const { rows } = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crea un nuevo producto (Solo Administradores).
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stock, categoryID]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               coverImageURL:
 *                 type: string
 *               categoryID:
 *                 type: integer
 *     responses:
 *       '201':
 *         description: Producto creado exitosamente.
 *       '401':
 *         description: No autorizado (token inválido o no proporcionado).
 *       '403':
 *         description: Prohibido (el usuario no es administrador).
 *       '422':
 *         description: Error de validación en los datos del producto.
 *       '500':
 *         description: Error interno del servidor.
 */
router.post('/', [verifyToken, checkAdmin], productValidationRules(), validate, async (req, res, next) => {
    try {
        const { name, description, price, stock, coverImageURL, categoryID } = req.body;
        const query = `
            INSERT INTO Products (name, description, price, stock, coverImageURL, categoryID)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        const values = [name, description, price, stock, coverImageURL, categoryID];
        const { rows } = await db.query(query, values);
        res.status(201).json({ message: 'Producto creado exitosamente.', product: rows[0] });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualiza un producto existente (Solo Administradores).
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del producto a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stock, categoryID]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               stock: { type: integer }
 *               coverImageURL: { type: string }
 *               categoryID: { type: integer }
 *     responses:
 *       '200':
 *         description: Producto actualizado exitosamente.
 *       '401':
 *         description: No autorizado.
 *       '403':
 *         description: Prohibido.
 *       '404':
 *         description: Producto no encontrado.
 *       '422':
 *         description: Error de validación.
 *       '500':
 *         description: Error interno del servidor.
 */
router.put('/:id', [verifyToken, checkAdmin], idParamValidationRules(), productValidationRules(), validate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, coverImageURL, categoryID } = req.body;
        const query = `
            UPDATE Products SET name = $1, description = $2, price = $3, stock = $4, coverImageURL = $5, categoryID = $6, updatedAt = CURRENT_TIMESTAMP
            WHERE id = $7 RETURNING *;`;
        const values = [name, description, price, stock, coverImageURL, categoryID, id];
        const { rows } = await db.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado para actualizar.' });
        }
        res.status(200).json({ message: 'Producto actualizado exitosamente.', product: rows[0] });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Elimina un producto (Solo Administradores).
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del producto a eliminar.
 *     responses:
 *       '200':
 *         description: Producto eliminado exitosamente.
 *       '401':
 *         description: No autorizado.
 *       '403':
 *         description: Prohibido.
 *       '404':
 *         description: Producto no encontrado.
 *       '409':
 *         description: Conflicto - El producto no se puede eliminar porque está asociado a órdenes existentes.
 *       '422':
 *         description: Error de validación en el ID.
 *       '500':
 *         description: Error interno del servidor.
 */
router.delete('/:id', [verifyToken, checkAdmin], idParamValidationRules(), validate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM Products WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Producto no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Producto eliminado exitosamente.' });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({
                message: 'No se puede eliminar el producto porque está asociado a una o más órdenes existentes.'
            });
        }
        next(error);
    }
});

module.exports = router;