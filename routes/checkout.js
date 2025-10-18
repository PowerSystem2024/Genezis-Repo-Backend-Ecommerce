// Archivo: routes/checkout.js (con validación de stock implementada)
const express = require('express');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

/**
 * @swagger
 * tags:
 *   name: Checkout
 *   description: Proceso de pago y creación de preferencias de Mercado Pago.
 */

/**
 * @swagger
 * /api/checkout/create_preference:
 *   post:
 *     summary: Crea una preferencia de pago en Mercado Pago para un carrito de compras.
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     description: Recibe un array de productos y sus cantidades, valida que haya stock suficiente, y luego genera una URL de pago (init_point) de Mercado Pago.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 description: Lista de productos en el carrito.
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       description: ID del producto.
 *                     quantity:
 *                       type: integer
 *                       description: Cantidad de unidades del producto.
 *           example:
 *             items:
 *               - productId: 1
 *                 quantity: 1
 *               - productId: 5
 *                 quantity: 2
 *     responses:
 *       '201':
 *         description: Preferencia de pago creada exitosamente.
 *       '400':
 *         description: Petición incorrecta (ej. el carrito está vacío).
 *       '401':
 *         description: No autorizado (token inválido o no proporcionado).
 *       '409':
 *         description: Conflicto (ej. stock insuficiente para uno de los productos).
 *       '500':
 *         description: Error interno al crear la preferencia de pago.
 */
router.post('/create_preference', verifyToken, async (req, res, next) => {
    const { items: cartItems } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ message: 'El carrito está vacío.' });
    }

    try {
        // --- 1. MODIFICACIÓN: Añadimos 'stock' a la consulta SQL ---
        const productIds = cartItems.map(item => item.productId);
        const query = `SELECT id, name, price, stock FROM Products WHERE id = ANY($1::int[])`;
        const { rows: productsFromDB } = await db.query(query, [productIds]);

        // --- 2. IMPLEMENTACIÓN: Bucle de validación de stock ---
        // Este bucle se ejecuta ANTES de intentar crear la preferencia de pago.
        for (const item of cartItems) {
            const product = productsFromDB.find(p => p.id === item.productId);
            
            // Verificamos si el producto existe (por si se eliminó mientras el usuario compraba)
            if (!product) {
                return res.status(404).json({ message: `El producto con ID ${item.productId} ya no está disponible.` });
            }

            // La validación clave: ¿hay suficiente stock?
            if (product.stock < item.quantity) {
                // Si no hay stock, devolvemos un error 409 Conflict y detenemos todo.
                return res.status(409).json({ 
                    message: `Stock insuficiente para el producto: "${product.name}".`,
                    details: {
                        productId: product.id,
                        availableStock: product.stock,
                        requestedQuantity: item.quantity
                    }
                });
            }
        }
        // --- FIN DE LA VALIDACIÓN ---

        // Si el código llega hasta aquí, significa que hay stock para todos los productos.
        // Ahora, el resto del código puede ejecutarse con normalidad.
        const productMap = productsFromDB.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});

        const preferenceItems = cartItems.map(item => {
            const product = productMap[item.productId];
            if (!product) {
                // Esta comprobación es redundante ahora, pero la dejamos por seguridad.
                throw new Error(`El producto con ID ${item.productId} no fue encontrado.`);
            }
            return {
                id: product.id.toString(),
                title: product.name,
                unit_price: Number(product.price),
                quantity: item.quantity,
                currency_id: 'ARS'
            };
        });
        
        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items: preferenceItems,
                back_urls: {
                    success: 'https://gamerstore-bice.vercel.app/payment-success',
                    failure: 'https://gamerstore-bice.vercel.app/payment-failure',
                    pending: 'https://www.youtube.com/@Genezis-TUP',
                },
                auto_return: 'approved',
                external_reference: req.user.userId.toString(),
            }
        });

        res.status(201).json({ init_point: result.init_point });

    } catch (error) {
        next(error);
    }
});

module.exports = router;