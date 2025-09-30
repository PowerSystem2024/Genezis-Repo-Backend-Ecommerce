// Archivo: routes/products.js (Versión Refactorizada Final)
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

// ---------------------------------------------
// --- RUTAS PÚBLICAS ---
// ---------------------------------------------

router.get('/', async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM Products ORDER BY createdAt DESC');
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', idParamValidationRules(), validate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rows } = await db.query('SELECT * FROM Products WHERE id = $1', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
});

// ----------------------------------------------------
// --- RUTAS DE ADMINISTRADOR ---
// ----------------------------------------------------

router.post('/', [verifyToken, checkAdmin], productValidationRules(), validate, async (req, res, next) => {
    try {
        // La validación ya se hizo. Podemos confiar en que los datos existen y son correctos.
        const { name, description, price, stock, coverImageURL, categoryID } = req.body;

        const query = `
            INSERT INTO Products (name, description, price, stock, coverImageURL, categoryID)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [name, description, price, stock, coverImageURL, categoryID];
        const { rows } = await db.query(query, values);

        res.status(201).json({ message: 'Producto creado exitosamente.', product: rows[0] });

    } catch (error) {
        next(error);
    }
});

router.put('/:id', [verifyToken, checkAdmin], idParamValidationRules(), productValidationRules(), validate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, coverImageURL, categoryID } = req.body;
    
        const query = `
            UPDATE Products
            SET name = $1, description = $2, price = $3, stock = $4, coverImageURL = $5, categoryID = $6, updatedAt = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *;
        `;
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