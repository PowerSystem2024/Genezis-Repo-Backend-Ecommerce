// Archivo: routes/products.js
const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const checkAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

// ---------------------------------------------
// --- RUTAS PÚBLICAS (no requieren token) ---
// ---------------------------------------------

// OBTENER TODOS LOS PRODUCTOS
// GET /api/products
router.get('/', async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM Products ORDER BY createdAt DESC');
        res.status(200).json(rows);
    } catch (error) {
        // Le pasamos el error a nuestro manejador centralizado
        next(error);
    }
});

// OBTENER UN SOLO PRODUCTO POR ID
// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rows } = await db.query('SELECT * FROM Products WHERE id = $1', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        // Le pasamos el error a nuestro manejador centralizado
        next(error);
    }
});

// ----------------------------------------------------
// --- RUTAS DE ADMINISTRADOR (requieren token y rol 'admin') ---
// ----------------------------------------------------
// El array [verifyToken, checkAdmin] asegura que ambos middlewares se ejecuten en orden.

// CREAR UN NUEVO PRODUCTO
// POST /api/products
router.post('/', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        const { name, description, price, stock, coverImageURL, categoryID } = req.body;

        if (!name || !price || !stock || !categoryID) {
            return res.status(400).json({ message: 'Nombre, precio, stock y categoryID son obligatorios.' });
        }

        const query = `
            INSERT INTO Products (name, description, price, stock, coverImageURL, categoryID)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [name, description, price, stock, coverImageURL, categoryID];
        const { rows } = await db.query(query, values);

        res.status(201).json({ message: 'Producto creado exitosamente.', product: rows[0] });

    } catch (error) {
        // Le pasamos el error a nuestro manejador centralizado
        next(error);
    }
});

// ACTUALIZAR UN PRODUCTO EXISTENTE
// PUT /api/products/:id
router.put('/:id', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, coverImageURL, categoryID } = req.body;

        if (!name || !price || !stock || !categoryID) {
            return res.status(400).json({ message: 'Nombre, precio, stock y categoryID son obligatorios.' });
        }

        const query = `
            UPDATE Products
            SET name = $1, description = $2, price = $3, stock = $4, coverImageURL = $5, categoryID = $6, updatedAt = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *;
        `;
        const values = [name, description, price, stock, coverImageURL, categoryID, id];
        const { rows } = await db.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        res.status(200).json({ message: 'Producto actualizado exitosamente.', product: rows[0] });

    } catch (error) {
        // Le pasamos el error a nuestro manejador centralizado
        next(error);
    }
});

// ELIMINAR UN PRODUCTO
// DELETE /api/products/:id
router.delete('/:id', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM Products WHERE id = $1', [id]);

        // result.rowCount te dice cuántas filas fueron eliminadas.
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        res.status(200).json({ message: 'Producto eliminado exitosamente.' });

    } catch (error) {
        // Le pasamos el error a nuestro manejador centralizado
        next(error);
    }
});

module.exports = router;