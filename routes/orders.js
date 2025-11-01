// Archivo: routes/orders.js (CORREGIDO - Basado en la versión que funcionaba)
const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const axios = require('axios');
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
        const query = 'SELECT * FROM orders WHERE userid = $1 ORDER BY createdat DESC;';
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
 */
router.post('/', [verifyToken, checkAdmin], async (req, res, next) => {
    const { userId, status, totalAmount, paymentGatewayId, items } = req.body;
    
    if (!userId || !status || !totalAmount || !items || items.length === 0) {
        return res.status(400).json({ message: "Faltan datos para crear la orden." });
    }
    
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        
        // CORRECCIÓN: Nombres de columnas en minúscula
        const orderQuery = `
            INSERT INTO orders (userid, totalamount, status, paymentgatewayid) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id;
        `;
        const orderResult = await client.query(orderQuery, [userId, totalAmount, status, paymentGatewayId]);
        const newOrderId = orderResult.rows[0].id;
        
        for (const item of items) {
            // CORRECCIÓN: Nombres de columnas en minúscula
            const detailQuery = `
                INSERT INTO orderdetails (orderid, productid, quantity, priceatpurchase) 
                VALUES ($1, $2, $3, $4);
            `;
            await client.query(detailQuery, [newOrderId, item.productId, item.quantity, item.priceAtPurchase]);
            
            const stockQuery = 'UPDATE products SET stock = stock - $1 WHERE id = $2;';
            await client.query(stockQuery, [item.quantity, item.productId]);
        }
        
        await client.query('COMMIT');
        res.status(201).json({ 
            message: `Orden ${newOrderId} creada exitosamente.`, 
            orderId: newOrderId 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creando orden manualmente:', error);
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
 */
router.put('/:id/status', [verifyToken, checkAdmin], async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status || !["pending", "paid", "shipped", "cancelled"].includes(status)) {
            return res.status(400).json({ message: "Estado no válido." });
        }
        
        const query = `
            UPDATE orders 
            SET status = $1, updatedat = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING *;
        `;
        const { rows } = await db.query(query, [status, id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: "Orden no encontrada." });
        }
        
        res.status(200).json({ 
            message: "Estado de la orden actualizado.", 
            order: rows[0] 
        });
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
 *     description: Este endpoint es para uso exclusivo de la API de Mercado Pago.
 */
router.post('/webhook/mercadopago', async (req, res) => {
    console.log('=== WEBHOOK MERCADO PAGO RECIBIDO ===');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    
    const { type, data, action } = req.body;
    
    // Validar que tengamos data.id
    if (!data || !data.id) {
        console.log('⚠️ Webhook sin data.id, ignorando...');
        return res.sendStatus(200);
    }
    
    // Procesar solo notificaciones de pago
    if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
        const paymentId = data.id;
        console.log(`📨 Procesando pago ID: ${paymentId}`);
        
        try {
            // Obtener información del pago
            const payment = await new Payment(mpClient).get({ id: paymentId });
            
            console.log('📋 Información del pago:');
            console.log('- Status:', payment.status);
            console.log('- External Reference:', payment.external_reference);
            console.log('- Transaction Amount:', payment.transaction_amount);
            
            // Solo procesar pagos aprobados
            if (payment.status !== 'approved') {
                console.log(`⏸️ Pago no aprobado (status: ${payment.status}). Ignorando.`);
                return res.sendStatus(200);
            }
            
            // Validar external_reference (userId)
            if (!payment.external_reference) {
                console.error('❌ El pago no tiene external_reference (userId).');
                return res.sendStatus(400);
            }
            
            const userId = parseInt(payment.external_reference);
            const totalAmount = payment.transaction_amount;
            
            // Validar que existan items
            if (!payment.additional_info || 
                !payment.additional_info.items || 
                payment.additional_info.items.length === 0) {
                console.error('❌ El pago no contiene items.');
                return res.sendStatus(400);
            }
            
            const items = payment.additional_info.items.map(item => ({
                productId: parseInt(item.id),
                quantity: parseInt(item.quantity),
                priceAtPurchase: parseFloat(item.unit_price)
            }));
            
            console.log('🛒 Items del carrito:', items);
            
            // IMPORTANTE: Verificar si ya existe una orden con este paymentId
            const existingOrderCheck = await db.query(
                'SELECT id FROM orders WHERE paymentgatewayid = $1',
                [paymentId.toString()]
            );
            
            if (existingOrderCheck.rows.length > 0) {
                console.log(`⚠️ Ya existe una orden con paymentId ${paymentId}. Evitando duplicado.`);
                return res.sendStatus(200);
            }
            
            // Obtener información del usuario
            const userResult = await db.query(
                'SELECT firstname, email FROM users WHERE id = $1', 
                [userId]
            );
            
            if (userResult.rows.length === 0) {
                console.error(`❌ Usuario con ID ${userId} no encontrado.`);
                return res.sendStatus(400);
            }
            
            const userData = userResult.rows[0];
            console.log(`👤 Usuario: ${userData.firstname} (${userData.email})`);
            
            // Crear la orden con transacción
            const client = await db.getClient();
            let newOrderId;
            
            try {
                await client.query('BEGIN');
                
                // CORRECCIÓN: Nombres de columnas en minúscula
                const orderQuery = `
                    INSERT INTO orders (userid, totalamount, status, paymentgatewayid) 
                    VALUES ($1, $2, 'paid', $3) 
                    RETURNING id;
                `;
                const orderResult = await client.query(
                    orderQuery, 
                    [userId, totalAmount, paymentId.toString()]
                );
                newOrderId = orderResult.rows[0].id;
                
                console.log(`✅ Orden ${newOrderId} creada en la base de datos`);
                
                // Insertar detalles, actualizar stock y obtener nombres de productos
                const itemsWithNames = [];
                
                for (const item of items) {
                    // MODIFICACIÓN: Obtener stock Y nombre del producto
                    const productQuery = await client.query(
                        'SELECT stock, name FROM products WHERE id = $1',
                        [item.productId]
                    );
                    
                    if (productQuery.rows.length === 0) {
                        throw new Error(`Producto ${item.productId} no encontrado`);
                    }
                    
                    const product = productQuery.rows[0];
                    
                    if (product.stock < item.quantity) {
                        throw new Error(`Stock insuficiente para producto ${item.productId}`);
                    }
                    
                    // Guardar item con nombre para enviar a n8n
                    itemsWithNames.push({
                        productId: item.productId,
                        productName: product.name,
                        quantity: item.quantity,
                        priceAtPurchase: item.priceAtPurchase
                    });
                    
                    // CORRECCIÓN: Nombres de columnas en minúscula
                    const detailQuery = `
                        INSERT INTO orderdetails (orderid, productid, quantity, priceatpurchase) 
                        VALUES ($1, $2, $3, $4);
                    `;
                    await client.query(detailQuery, [
                        newOrderId, 
                        item.productId, 
                        item.quantity, 
                        item.priceAtPurchase
                    ]);
                    
                    const stockQuery = 'UPDATE products SET stock = stock - $1 WHERE id = $2;';
                    await client.query(stockQuery, [item.quantity, item.productId]);
                    
                    console.log(`  ✓ Item procesado: ${product.name} (ID: ${item.productId}), Cantidad: ${item.quantity}`);
                }
                
                await client.query('COMMIT');
                console.log(`✅ Orden ${newOrderId} completada exitosamente`);
                
                // Disparar webhook de n8n
                if (userData.email && process.env.N8N_ORDER_WEBHOOK_URL) {
                    try {
                        const n8nPayload = {
                            email: userData.email,
                            firstName: userData.firstname,
                            orderId: newOrderId,
                            totalAmount: totalAmount,
                            items: items,
                            paymentId: paymentId
                        };
                        
                        console.log('📤 Enviando notificación a n8n...');
                        console.log('URL:', process.env.N8N_ORDER_WEBHOOK_URL);
                        console.log('Payload:', JSON.stringify(n8nPayload, null, 2));
                        
                        const n8nResponse = await axios.post(
                            process.env.N8N_ORDER_WEBHOOK_URL, 
                            n8nPayload,
                            {
                                timeout: 10000,
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        
                        console.log(`✅ Webhook de n8n disparado exitosamente`);
                        console.log('Respuesta de n8n:', n8nResponse.status, n8nResponse.data);
                    } catch (n8nError) {
                        console.error(`⚠️ Error al disparar webhook de n8n:`, n8nError.message);
                        if (n8nError.response) {
                            console.error('Response status:', n8nError.response.status);
                            console.error('Response data:', n8nError.response.data);
                        }
                        if (n8nError.code === 'ECONNREFUSED') {
                            console.error('No se pudo conectar con n8n. ¿Está corriendo el servidor?');
                        }
                    }
                } else {
                    console.log('⚠️ No se enviará notificación a n8n:');
                    if (!userData.email) console.log('  - Usuario sin email');
                    if (!process.env.N8N_ORDER_WEBHOOK_URL) console.log('  - N8N_ORDER_WEBHOOK_URL no configurada');
                }
                
            } catch (txError) {
                await client.query('ROLLBACK');
                console.error('❌ Error en transacción, rollback ejecutado:', txError.message);
                console.error('Stack:', txError.stack);
                return res.sendStatus(500);
            } finally {
                client.release();
            }
            
        } catch (error) {
            console.error('❌ Error procesando webhook de Mercado Pago:', error.message);
            console.error('Stack completo:', error.stack);
            return res.sendStatus(500);
        }
    } else {
        console.log(`ℹ️ Webhook ignorado. Type: ${type}, Action: ${action}`);
    }
    
    res.sendStatus(200);
});

module.exports = router;