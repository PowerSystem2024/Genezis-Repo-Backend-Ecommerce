// Archivo: routes/checkout.js
const express = require('express');
const { MercadoPagoConfig, Preference } = require('mercadopago'); // CAMBIO 1: Importar MercadoPagoConfig y Preference
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// CAMBIO 2: Crear una instancia del cliente con tus credenciales
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

// Crear la ruta de checkout
// POST /api/checkout/create_preference
router.post('/create_preference', verifyToken, async (req, res) => {
    const { items: cartItems } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ message: 'El carrito está vacío.' });
    }

    try {
        // --- Validación de precios en el Backend (¡muy importante!) ---
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
                currency_id: 'ARS' // Ajusta según tu país
            };
        });
        
        // CAMBIO 3: La creación de la preferencia ahora se hace a través de una instancia de Preference
        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: preferenceItems,
                back_urls: {
                    success: 'https://youtube.com', // URL de tu frontend
                    failure: 'http://localhost:5173/payment-failure', // URL de tu frontend
                    pending: ''
                },
                auto_return: 'approved',
            }
        });

        // Devolver el init_point al frontend
        res.status(201).json({ init_point: result.init_point });

    } catch (error) {
        console.error("Error al crear la preferencia de pago:", error);
        res.status(500).json({ message: 'Error interno del servidor al crear la preferencia de pago.' });
    }
});

module.exports = router;