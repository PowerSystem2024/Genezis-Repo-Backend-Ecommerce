// Archivo: routes/orders.js
const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const axios = require('axios'); // <-- MODIFICACIÓN 1: Añadido axios
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const checkAdmin = require('../middleware/adminMiddleware');
const router = express.Router();
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         priceAtPurchase:
 *           type: number
 *           format: float
 *       required:
 *         - productId
 *         - quantity
 *         - priceAtPurchase
 *     OrderResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         email:
 *           type: string
 *         totalamount:
 *           type: number
 *           format: float
 *         status:
 *           type: string
 *         paymentgatewayid:
 *           type: string
 *           nullable: true
 *         createdat:
 *           type: string
 *           format: date-time
 *     FullOrderResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/OrderResponse'
 *         - type: object
 *           properties:
 *             userid:
 *               type: integer
 *             items:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                   priceatpurchase:
 *                     type: number
 *                     format: float
 *                   productId:
 *                     type: integer
 *                   productName:
 *                     type: string
 *                   coverimageurl:
 *                     type: string
 *                     nullable: true
 */

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Gestión de órdenes de compra.
 */

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
 *         description: Lista de órdenes con nombres de clientes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderResponse'
 *       '401':
 *         description: No autorizado (falta token).
 *       '403':
 *         description: Prohibido (no es administrador).
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
 *         description: Lista de órdenes del usuario autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderResponse'
 *       '401':
 *         description: No autorizado.
 */
router.get('/my-orders', verifyToken, async (req, res, next) => {
    try {
        const query = 'SELECT * FROM orders WHERE userID = $1 ORDER BY createdAt DESC;';
        const { rows } = await db.query(query, [req.user.userId]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obtiene el detalle completo de una orden específica (Admin o propietario).
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden.
 *     responses:
 *       '200':
 *         description: Detalle completo de la orden.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FullOrderResponse'
 *       '401':
 *         description: No autorizado.
 *       '403':
 *         description: Prohibido (no eres propietario ni administrador).
 *       '404':
 *         description: Orden no encontrada.
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
 *             required:
 *               - userId
 *               - status
 *               - totalAmount
 *               - items
 *             properties:
 *               userId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [pending, paid, shipped, cancelled]
 *                 example: paid
 *               totalAmount:
 *                 type: number
 *                 format: float
 *               paymentGatewayId:
 *                 type: string
 *                 nullable: true
 *                 example: "Transferencia-123"
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderItem'
 *     responses:
 *       '201':
 *         description: Orden creada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 orderId:
 *                   type: integer
 *       '400':
 *         description: Faltan datos requeridos.
 *       '401':
 *         description: No autorizado.
 *       '403':
 *         description: Prohibido (no es administrador).
 */
router.post('/', [verifyToken, checkAdmin], async (req, res, next) => {
    const { userId, status, totalAmount, paymentGatewayId, items } = req.body;
    if (!userId || !status || !totalAmount || !items || items.length === 0) {
        return res.status(400).json({ message: "Faltan datos para crear la orden." });
    }
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const orderQuery = `INSERT INTO orders (userID, totalAmount, status, paymentGatewayID) VALUES ($1, $2, $3, $4) RETURNING id;`;
        const orderResult = await client.query(orderQuery, [userId, totalAmount, status, paymentGatewayId]);
        const newOrderId = orderResult.rows[0].id;
        for (const item of items) {
            const detailQuery = `INSERT INTO orderdetails (orderID, productID, quantity, priceAtPurchase) VALUES ($1, $2, $3, $4);`;
            await client.query(detailQuery, [newOrderId, item.productId, item.quantity, item.priceAtPurchase]);
            const stockQuery = 'UPDATE products SET stock = stock - $1 WHERE id = $2;';
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
 *         schema:
 *           type: integer
 *         description: ID de la orden.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, shipped, cancelled]
 *     responses:
 *       '200':
 *         description: Estado actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/OrderResponse'
 *       '400':
 *         description: Estado no válido.
 *       '404':
 *         description: Orden no encontrada.
 *       '401':
 *         description: No autorizado.
 *       '403':
 *         description: Prohibido.
 */
router.put('/:id/status', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !["pending", "paid", "shipped", "cancelled"].includes(status)) {
            return res.status(400).json({ message: "Estado no válido." });
        }
        const query = 'UPDATE orders SET status = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;';
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
 *     summary: Webhook para notificaciones de pago de Mercado Pago.
 *     description: |
 *       **Solo debe ser llamado por Mercado Pago.** Procesa pagos aprobados y crea órdenes automáticamente.
 *       No requiere autenticación. Usa `external_reference` como `userId`.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: payment
 *               data:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID del pago en Mercado Pago.
 *     responses:
 *       '200':
 *         description: Notificación recibida y procesada.
 *       '500':
 *         description: Error interno al procesar el pago.
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
                const userResult = await db.query('SELECT firstname, email FROM users WHERE id = $1', [userId]);
                const userData = userResult.rows[0] || { firstname: 'Usuario', email: null };
                const client = await db.getClient();
                try {
                    await client.query('BEGIN');
                    const orderQuery = `INSERT INTO orders (userID, totalAmount, status, paymentGatewayID) VALUES ($1, $2, 'paid', $3) RETURNING id;`;
                    const orderResult = await client.query(orderQuery, [userId, totalAmount, paymentId]);
                    const newOrderId = orderResult.rows[0].id;
                    for (const item of items) {
                        const detailQuery = `INSERT INTO orderdetails (orderID, productID, quantity, priceAtPurchase) VALUES ($1, $2, $3, $4);`;
                        await client.query(detailQuery, [newOrderId, item.productId, item.quantity, item.priceAtPurchase]);
                        const stockQuery = 'UPDATE products SET stock = stock - $1 WHERE id = $2;';
                        await client.query(stockQuery, [item.quantity, item.productId]);
                    }
                    await client.query('COMMIT');
                    console.log(`Orden ${newOrderId} creada automáticamente por Webhook MP.`);

                    if (userData.email && process.env.N8N_ORDER_WEBHOOK_URL) {
                        try {
                            const n8nPayload = {
                                email: userData.email,
                                firstName: userData.firstname,
                                orderId: newOrderId,
                                totalAmount: totalAmount,
                                items: items
                            };
                            await axios.post(process.env.N8N_ORDER_WEBHOOK_URL, n8nPayload);
                            console.log(`Webhook de n8n para orden ${newOrderId} disparado exitosamente.`);
                        } catch (n8nError) {
                            console.error(`Error al disparar webhook de n8n para orden ${newOrderId}:`, n8nError.message);
                        }
                    }
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