// Archivo: app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors'); // <-- 1. IMPORTAR CORS

// --- 1. IMPORTAR SWAGGER ---
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerConfig'); // Importa nuestra configuración

// Importación de rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const checkoutRoutes = require('./routes/checkout');

// Importación de middlewares
const verifyToken = require('./middleware/authMiddleware');

const app = express();

// --- MIDDLEWARES GLOBALES ---

// <-- 2. AÑADIR MIDDLEWARE DE CORS
// Esto permitirá que tu futuro frontend (ej. en localhost:5173) se comunique con tu API.
app.use(cors());

// Middleware para que Express entienda JSON en el cuerpo de las peticiones
app.use(express.json());

// --- 2. AÑADIR LA RUTA DE DOCUMENTACIÓN ---
// Esta ruta servirá la interfaz de usuario de Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);

// --- EJEMPLO DE RUTA PROTEGIDA ---
app.get('/api/profile', verifyToken, (req, res) => {
    res.json({
        message: 'Bienvenido a tu perfil protegido.',
        userData: req.user
    });
});

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.send('API de E-commerce funcionando!');
});


// <-- 3. AÑADIR MANEJADOR DE ERRORES CENTRALIZADO
// IMPORTANTE: Este debe ser el ÚLTIMO app.use()
// Es una "red de seguridad" que atrapa cualquier error que ocurra en las rutas.
app.use((err, req, res, next) => {
    console.error(err.stack); // Muestra el error detallado en la consola del servidor
    res.status(500).json({ message: 'Ha ocurrido un error inesperado en el servidor.' });
});


// Exportamos la app para que pueda ser utilizada por otros archivos (como server.js)
module.exports = app;