// Archivo: routes/orders.js (Reemplazar/Crear contenido completo)
const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const checkAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

const mpClient = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión de órdenes de compra.
 */

// --- RUTAS PARA GESTIÓN MANUAL DE ÓRDENES (ADMIN) ---

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crea una nueva orden manualmente (Solo Administradores).
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     description: Permite a un administrador crear una orden completa. El stock se descuenta al crear la orden.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: integer }
 *               status: { type: string, example: "paid" }
 *               totalAmount: { type: number }
 *               paymentGatewayId: { type: string, example: "Transferencia-123" }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: integer }
 *                     quantity: { type: integer }
 *                     priceAtPurchase: { type: number }
 *     responses:
 *       '201':
 *         description: Orden creada exitosamente.
 */
router.post('/', [verifyToken, checkAdmin], async (req, res, next) => {
    const { userId, status, totalAmount, paymentGatewayId, items } = req.body;

    if (!userId || !status || !totalAmount || !items || items.length === 0) {
        return res.status(400).json({ message: "Faltan datos para crear la orden." });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const orderQuery = `INSERT INTO Orders (userID, totalAmount, status, paymentGatewayID) VALUES ($1, $2, $3, $4) RETURNING id;`;
        const orderResult = await client.query(orderQuery, [userId, totalAmount, status, paymentGatewayId]);
        const newOrderId = orderResult.rows[0].id;
        
        for (const item of items) {
            const detailQuery = `INSERT INTO OrderDetails (orderID, productID, quantity, priceAtPurchase) VALUES ($1, $2, $3, $4);`;
            await client.query(detailQuery, [newOrderId, item.productId, item.quantity, item.priceAtPurchase]);
            const stockQuery = 'UPDATE Products SET stock = stock - $1 WHERE id = $2;';
            await client.query(stockQuery, [item.quantity, item.productId]);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: `Orden ${newOrderId} creada exitosamente.`, orderId: newOrderId });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Actualiza el estado de una orden (Solo Administradores).
 *     tags: [Orders]
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
 *             properties:
 *               status: { type: string, enum: ["pending", "paid", "shipped", "cancelled"] }
 *     responses:
 *       '200':
 *         description: Estado de la orden actualizado.
 */
router.put('/:id/status', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status || !["pending", "paid", "shipped", "cancelled"].includes(status)) {
            return res.status(400).json({ message: "Estado no válido." });
        }
        
        const query = 'UPDATE Orders SET status = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;';
        const { rows } = await db.query(query, [status, id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Orden no encontrada." });
        }
        res.status(200).json({ message: "Estado de la orden actualizado.", order: rows[0] });

    } catch (error) {
        next(error);
    }
});


// --- RUTAS DE CONSULTA ---

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Obtiene el historial de órdenes del usuario autenticado.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de órdenes del usuario.
 */
router.get('/my-orders', verifyToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const query = 'SELECT * FROM Orders WHERE userID = $1 ORDER BY createdAt DESC;';
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Obtiene todas las órdenes del sistema (Solo Administradores).
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista completa de todas las órdenes.
 */
router.get('/', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        const query = `
            SELECT o.*, u.email AS userEmail 
            FROM Orders o
            JOIN Users u ON o.userID = u.id
            ORDER BY o.createdAt DESC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});


// --- ENDPOINT DE WEBHOOK PARA MERCADO PAGO ---
router.post('/webhook/mercadopago', async (req, res) => {
    const { type, data } = req.body;

    if (type === 'payment') {
        const paymentId = data.id;
        console.log(`Webhook MP recibido: Procesando pago ${paymentId}`);
        try {
            const payment = await new Payment(mpClient).get({ id: paymentId });
            
            if (payment && payment.status === 'approved' && payment.external_reference) {
                const userId = parseInt(payment.external_reference);
                const totalAmount = payment.transaction_amount;
                const items = payment.additional_info.items.map(item => ({
                    productId: parseInt(item.id),
                    quantity: parseInt(item.quantity),
                    priceAtPurchase: parseFloat(item.unit_price)
                }));
                
                const client = await db.getClient();
                try {
                    await client.query('BEGIN');
                    const orderQuery = `INSERT INTO Orders (userID, totalAmount, status, paymentGatewayID) VALUES ($1, $2, 'paid', $3) RETURNING id;`;
                    const orderResult = await client.query(orderQuery, [userId, totalAmount, paymentId]);
                    const newOrderId = orderResult.rows[0].id;
                    
                    for (const item of items) {
                        const detailQuery = `INSERT INTO OrderDetails (orderID, productID, quantity, priceAtPurchase) VALUES ($1, $2, $3, $4);`;
                        await client.query(detailQuery, [newOrderId, item.productId, item.quantity, item.priceAtPurchase]);
                        const stockQuery = 'UPDATE Products SET stock = stock - $1 WHERE id = $2;';
                        await client.query(stockQuery, [item.quantity, item.productId]);
                    }
                    await client.query('COMMIT');
                    console.log(`Orden ${newOrderId} creada automáticamente por Webhook MP.`);
                } catch (txError) {
                    await client.query('ROLLBACK');
                    console.error('Webhook MP: Error en la transacción, rollback ejecutado:', txError);
                    return res.sendStatus(500);
                } finally {
                    client.release();
                }
            }
        } catch (error) {
            console.error('Error procesando webhook de Mercado Pago:', error);
            return res.sendStatus(500);
        }
    }
    res.sendStatus(200);
});

module.exports = router;