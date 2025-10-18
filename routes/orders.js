// Archivo: routes/orders.js
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

// --- RUTAS DE CONSULTA ---

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
 *         description: Lista de órdenes con los nombres de los clientes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer }
 *                   firstname: { type: string }
 *                   lastname: { type: string }
 *                   email: { type: string }
 *                   totalamount: { type: number }
 *                   status: { type: string }
 *                   paymentgatewayid: { type: string }
 *                   createdat: { type: string, format: date-time }
 */
router.get('/', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        const query = `
            SELECT 
                o.id,
                u.firstname,
                u.lastname,
                u.email,
                o.totalamount,
                o.status,
                o.paymentgatewayid,
                o.createdat
            FROM orders o
            JOIN users u ON o.userid = u.id
            ORDER BY o.createdat DESC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});

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
        const query = 'SELECT * FROM orders WHERE userID = $1 ORDER BY createdAt DESC;';
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obtiene el detalle completo de una orden específica (Admin y usuario propietario).
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Detalle completo de la orden.
 */
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.user;
        const orderHeaderQuery = `
            SELECT o.id, o.userid, o.totalamount, o.status, o.paymentgatewayid, o.createdat,
                   u.firstname, u.lastname, u.email
            FROM orders o
            JOIN users u ON o.userid = u.id
            WHERE o.id = $1;
        `;
        const orderHeaderResult = await db.query(orderHeaderQuery, [id]);
        if (orderHeaderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }
        const orderHeader = orderHeaderResult.rows[0];
        if (role !== 'admin' && orderHeader.userid !== userId) {
            return res.status(403).json({ message: 'No tienes permiso para ver esta orden.' });
        }
        const orderDetailsQuery = `
            SELECT 
                od.quantity,
                od.priceatpurchase,
                p.id as "productId",
                p.name as "productName",
                p.coverimageurl
            FROM orderdetails od
            JOIN products p ON od.productid = p.id
            WHERE od.orderid = $1;
        `;
        const orderDetailsResult = await db.query(orderDetailsQuery, [id]);
        const details = orderDetailsResult.rows;
        const fullOrder = { ...orderHeader, items: details };
        res.status(200).json(fullOrder);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crea una nueva orden manualmente (Solo Administradores).
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 example: "paid"
 *               totalAmount:
 *                 type: number
 *               paymentGatewayId:
 *                 type: string
 *                 example: "Transferencia-123"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     priceAtPurchase:
 *                       type: number
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
 *               status:
 *                 type: string
 *                 enum: ["pending", "paid", "shipped", "cancelled"]
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

/**
 * @swagger
 * /api/orders/webhook/mercadopago:
 *   post:
 *     summary: Webhook para recibir notificaciones de pago de Mercado Pago.
 *     tags: [Orders]
 *     description: Este endpoint es para uso exclusivo de la API de Mercado Pago. No debe ser llamado directamente.
 *     requestBody:
 *       description: Payload enviado por Mercado Pago.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Notificación recibida.
 */
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