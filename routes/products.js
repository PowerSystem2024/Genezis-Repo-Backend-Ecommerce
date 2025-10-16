// Archivo: routes/products.js (Versión Corregida y Final)
const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const checkAdmin = require('../middleware/adminMiddleware');

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
    } catch (error){
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

/**
 * @swagger
 * /api/products/{id}/image:
 *   put:
 *     summary: Actualiza la imagen de portada de un producto (Solo Administradores).
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del producto cuya imagen de portada se actualizará.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productImage:
 *                 type: string
 *                 format: binary
 *                 description: El archivo de imagen para la portada del producto.
 *     responses:
 *       '200':
 *         description: Imagen de portada actualizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 coverImageUrl: { type: string }
 *       '400':
 *         description: No se proporcionó un archivo.
 *       '401':
 *         description: No autorizado.
 *       '403':
 *         description: Prohibido (rol no es admin).
 *       '404':
 *         description: Producto no encontrado.
 *       '500':
 *         description: Error interno del servidor.
 */
// RUTA PARA IMAGEN DE PORTADA
router.put('/:id/image', [verifyToken, checkAdmin, upload.single('productImage')], async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se ha proporcionado ningún archivo.' });
        
        const { id } = req.params;
        cloudinary.uploader.upload_stream({ folder: 'genezis_products', transformation: [{ width: 800, height: 600, crop: 'limit' }] },
            async (error, result) => {
                if (error) return next(new Error('Error al subir la imagen del producto.'));
                
                // Nombre de columna exacto: coverimageurl
                const query = `UPDATE products SET coverimageurl = $1 WHERE id = $2 RETURNING coverimageurl;`;
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
 *         schema:
 *           type: integer
 *         description: El ID del producto al que se añadirá la imagen.
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
 *                 description: El archivo de imagen para la galería.
 *               altText:
 *                 type: string
 *                 description: (Opcional) Texto alternativo para la imagen.
 *     responses:
 *       '201':
 *         description: Imagen añadida a la galería exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 image: { type: object }
 *       '400':
 *         description: No se proporcionó un archivo.
 *       '401':
 *         description: No autorizado.
 *       '403':
 *         description: Prohibido (rol no es admin).
 *       '500':
 *         description: Error interno del servidor.
 */
// RUTA PARA AÑADIR A LA GALERÍA
router.post('/:id/gallery', [verifyToken, checkAdmin, upload.single('galleryImage')], async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se ha proporcionado ningún archivo.' });

        const { id: productId } = req.params;
        const { altText } = req.body;
        cloudinary.uploader.upload_stream({ folder: 'genezis_products_gallery' },
            async (error, result) => {
                if (error) return next(new Error('Error al subir la imagen de la galería.'));

                // Nombres de columna exactos: imageurl, alttext, productid
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
 *         schema:
 *           type: integer
 *         description: El ID de la imagen a eliminar (de la tabla productimages).
 *     responses:
 *       '200':
 *         description: Imagen eliminada de la galería exitosamente.
 *       '401':
 *         description: No autorizado.
 *       '403':
 *         description: Prohibido (rol no es admin).
 *       '404':
 *         description: Imagen no encontrada en la galería.
 *       '500':
 *         description: Error interno del servidor.
 */
// RUTA PARA ELIMINAR DE LA GALERÍA
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