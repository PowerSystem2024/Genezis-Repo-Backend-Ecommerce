// Archivo: routes/test.js
// Esta es una ruta temporal SOLO para probar la conexión con n8n.
const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Test
 *     description: Endpoints de prueba (temporales).
 */

/**
 * @swagger
 * /api/test/n8n:
 *   get:
 *     summary: Dispara un webhook de prueba a n8n.
 *     tags: [Test]
 *     description: |
 *       Esta ruta simula los datos de una orden y los envía al Webhook de n8n configurado en `.env` 
 *       (N8N_ORDER_WEBHOOK_URL). Útil para probar la integración sin depender de Mercado Pago.
 *     operationId: testN8nWebhook
 *     responses:
 *       '200':
 *         description: Prueba exitosa. n8n recibió los datos correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "¡Prueba exitosa! Datos enviados a n8n. Revisa tu workflow."
 *                 payloadEnviado:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "cliente.prueba@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "Luciano (Prueba)"
 *                     orderId:
 *                       type: integer
 *                       example: 9999
 *                     totalAmount:
 *                       type: number
 *                       format: float
 *                       example: 123.45
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: integer
 *                             example: 1
 *                           quantity:
 *                             type: integer
 *                             example: 1
 *                           priceAtPurchase:
 *                             type: number
 *                             format: float
 *                             example: 123.45
 *       '500':
 *         description: Error interno. n8n no pudo ser contactado o la URL no está configurada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error de configuración: N8N_ORDER_WEBHOOK_URL no está definida en tu archivo .env"
 *                 error:
 *                   type: string
 *                   nullable: true
 *                   example: "Request failed with status code 404"
 */

router.get('/n8n', async (req, res) => {
    console.log("¡Recibida petición de prueba para n8n!");

    // 1. Verificamos que la URL de n8n esté en .env
    const n8nWebhookUrl = process.env.N8N_ORDER_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
        console.error("Error: N8N_ORDER_WEBHOOK_URL no está definida en .env");
        return res.status(500).json({
            message: "Error de configuración: N8N_ORDER_WEBHOOK_URL no está definida en tu archivo .env"
        });
    }

    // 2. Simulamos los datos que enviaría el webhook de Mercado Pago
    const testPayload = {
        email: "cliente.prueba@example.com",
        firstName: "Luciano (Prueba)",
        orderId: 9999,
        totalAmount: 123.45,
        items: [
            { productId: 1, quantity: 1, priceAtPurchase: 123.45 }
        ]
    };

    // 3. Intentamos enviar los datos a n8n
    try {
        console.log(`Enviando payload de prueba a: ${n8nWebhookUrl}`);
        
        await axios.post(n8nWebhookUrl, testPayload);
        
        console.log("¡Payload de prueba enviado a n8n exitosamente!");
        res.status(200).json({
            message: "¡Prueba exitosa! Datos enviados a n8n. Revisa tu workflow.",
            payloadEnviado: testPayload
        });
    } catch (error) {
        console.error("Error al enviar el webhook de prueba a n8n:", error.message);
        res.status(500).json({
            message: "Error al contactar n8n. Revisa la URL y que n8n esté 'escuchando'.",
            error: error.message
        });
    }
});

module.exports = router;