// Archivo: routes/products.js
const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const checkAdmin = require('../middleware/adminMiddleware');

// Importaciones para la subida de archivos y validación
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinaryConfig');
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
 *     summary: Obtiene una lista de todos los productos ACTIVOS (para la vista pública).
 *     tags: [Products]
 *     responses:
 *       '200':
 *         description: Lista de productos activos obtenida exitosamente.
 */
router.get('/', async (req, res, next) => {
    try {
        const query = `
            SELECT p.*, c.name AS "categoryName"
            FROM products p
            LEFT JOIN categories c ON p.categoryid = c.id
            WHERE p."isActive" = TRUE
            ORDER BY p.createdat DESC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error){
        next(error);
    }
});

/**
 * @swagger
 * /api/products/admin/all:
 *   get:
 *     summary: Obtiene TODOS los productos, incluyendo inactivos (Solo Administradores).
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista completa de todos los productos del sistema.
 */
router.get('/admin/all', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        const query = `
            SELECT p.*, c.name AS "categoryName"
            FROM products p
            LEFT JOIN categories c ON p.categoryid = c.id
            ORDER BY p.createdat DESC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtiene los detalles de un solo producto (público si está activo, admin si está inactivo).
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Detalles del producto.
 */
router.get('/:id', idParamValidationRules(), validate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT p.*, c.name AS "categoryName"
            FROM products p
            LEFT JOIN categories c ON p.categoryid = c.id
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
 *     summary: Crea un nuevo producto con su imagen de portada (Solo Administradores).
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price, stock, categoryID, productImage]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoryID:
 *                 type: integer
 *               productImage:
 *                 type: string
 *                 format: binary
 *                 description: "La imagen de portada para el nuevo producto."
 *     responses:
 *       '201':
 *         description: "Producto creado exitosamente."
 */
router.post(
    '/',
    [verifyToken, checkAdmin, upload.single('productImage')],
    async (req, res, next) => {
        try {
            const { name, description, price, stock, categoryID } = req.body;
            if (!req.file) {
                return res.status(400).json({ message: 'La imagen de portada es obligatoria para crear un producto.' });
            }
            cloudinary.uploader.upload_stream(
                {
                    folder: 'genezis_products',
                    transformation: [{ width: 800, height: 600, crop: 'limit' }]
                },
                async (error, result) => {
                    if (error) return next(new Error('Error al subir la imagen del producto.'));
                    const coverImageURL = result.secure_url;
                    const query = `INSERT INTO products (name, description, price, stock, coverimageurl, categoryid) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
                    const values = [name, description, price, stock, coverImageURL, categoryID];
                    const { rows } = await db.query(query, values);
                    res.status(201).json({ message: 'Producto creado exitosamente.', product: rows[0] });
                }
            ).end(req.file.buffer);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualiza un producto existente, incluyendo opcionalmente la imagen (Solo Administradores).
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *               categoryID:
 *                 type: integer
 *               productImage:
 *                 type: string
 *                 format: binary
 *                 description: "(Opcional) Una nueva imagen de portada para reemplazar la actual."
 *     responses:
 *       '200':
 *         description: "Producto actualizado exitosamente."
 */
router.put(
    '/:id',
    [verifyToken, checkAdmin, upload.single('productImage')],
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { name, description, price, stock, categoryID } = req.body;
            let coverImageURL;

            if (req.file) {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: 'genezis_products', transformation: [{ width: 800, height: 600, crop: 'limit' }] },
                        (error, result) => {
                            if (error) reject(new Error('Error al subir la nueva imagen.'));
                            else resolve(result);
                        }
                    );
                    stream.end(req.file.buffer);
                });
                coverImageURL = result.secure_url;
            }

            let query;
            let values;

            if (coverImageURL) {
                query = `UPDATE products SET name = $1, description = $2, price = $3, stock = $4, categoryid = $5, coverimageurl = $6, updatedat = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *;`;
                values = [name, description, price, stock, categoryID, coverImageURL, id];
            } else {
                query = `UPDATE products SET name = $1, description = $2, price = $3, stock = $4, categoryid = $5, updatedat = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *;`;
                values = [name, description, price, stock, categoryID, id];
            }

            const { rows } = await db.query(query, values);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Producto no encontrado para actualizar.' });
            }
            res.status(200).json({ message: 'Producto actualizado exitosamente.', product: rows[0] });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Desactiva (archiva) un producto (Borrado Lógico, Solo Administradores).
 *     description: En lugar de borrar el producto de la base de datos, lo marca como inactivo ('isActive' = false).
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Producto archivado exitosamente.
 */
router.delete('/:id', [verifyToken, checkAdmin], idParamValidationRules(), validate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = `
            UPDATE products SET "isActive" = FALSE, updatedat = CURRENT_TIMESTAMP 
            WHERE id = $1 RETURNING id;
        `;
        const result = await db.query(query, [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Producto no encontrado para archivar.' });
        }
        res.status(200).json({ message: 'Producto archivado exitosamente.' });
    } catch (error) {
        next(error);
    }
});

router.put('/:id/image', [verifyToken, checkAdmin, upload.single('productImage')], async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se ha proporcionado ningún archivo.' });
        const { id } = req.params;
        cloudinary.uploader.upload_stream({ folder: 'genezis_products', transformation: [{ width: 800, height: 600, crop: 'limit' }] },
            async (error, result) => {
                if (error) return next(new Error('Error al subir la imagen del producto.'));
                const query = `UPDATE products SET coverimageurl = $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2 RETURNING coverimageurl;`;
                const { rows } = await db.query(query, [result.secure_url, id]);
                if (rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado.' });
                res.status(200).json({ message: 'Imagen de portada actualizada.', coverImageUrl: rows[0].coverimageurl });
            }
        ).end(req.file.buffer);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/products/{id}/gallery:
 *   post:
 *     summary: Añade una nueva imagen a la galería de un producto (Solo Administradores).
 *     tags: [Products]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               galleryImage:
 *                 type: string
 *                 format: binary
 *               altText:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Imagen añadida a la galería exitosamente.
 */
router.post('/:id/gallery', [verifyToken, checkAdmin, upload.single('galleryImage')], async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se ha proporcionado ningún archivo.' });
        const { id: productId } = req.params;
        const { altText } = req.body;
        cloudinary.uploader.upload_stream({ folder: 'genezis_products_gallery' },
            async (error, result) => {
                if (error) return next(new Error('Error al subir la imagen de la galería.'));
                const query = `INSERT INTO productimages (imageurl, alttext, productid) VALUES ($1, $2, $3) RETURNING *;`;
                const { rows } = await db.query(query, [result.secure_url, altText || '', productId]);
                res.status(201).json({ message: 'Imagen añadida a la galería.', image: rows[0] });
            }
        ).end(req.file.buffer);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/products/gallery/{imageId}:
 *   delete:
 *     summary: Elimina una imagen de la galería de un producto (Solo Administradores).
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Imagen eliminada de la galería exitosamente.
 */
router.delete('/gallery/:imageId', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        const { imageId } = req.params;
        const result = await db.query('DELETE FROM productimages WHERE id = $1', [imageId]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Imagen no encontrada en la galería.' });
        res.status(200).json({ message: 'Imagen eliminada de la galería.' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;