// Archivo: routes/checkout.js
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
 *     description: Recibe un array de productos y sus cantidades, valida los precios con la base de datos y genera una URL de pago (init_point) de Mercado Pago. Requiere autenticación.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 init_point:
 *                   type: string
 *                   description: La URL a la que se debe redirigir al usuario para completar el pago.
 *       '400':
 *         description: Petición incorrecta (ej. el carrito está vacío).
 *       '401':
 *         description: No autorizado (token inválido o no proporcionado).
 *       '500':
 *         description: Error interno al crear la preferencia de pago.
 */
router.post('/create_preference', verifyToken, async (req, res, next) => {
    const { items: cartItems } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ message: 'El carrito está vacío.' });
    }

    try {
        const productIds = cartItems.map(item => item.productId);
        const query = `SELECT id, name, price FROM Products WHERE id = ANY($1::int[])`;
        const { rows: productsFromDB } = await db.query(query, [productIds]);

        const productMap = productsFromDB.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});

        const preferenceItems = cartItems.map(item => {
            const product = productMap[item.productId];
            if (!product) {
                throw new Error(`El producto con ID ${item.productId} no fue encontrado.`);
            }
            return {
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
                    success: 'http://localhost:5173/payment-success',
                    failure: 'http://localhost:5173/payment-failure',
                    pending: ''
                },
                auto_return: 'approved',
            }
        });

        res.status(201).json({ init_point: result.init_point });

    } catch (error) {
        next(error);
    }
});

module.exports = router;