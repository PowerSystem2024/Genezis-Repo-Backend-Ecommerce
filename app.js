// Archivo: app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors'); // <-- IMPORTAR CORS (ya estaba)

// --- 1. IMPORTAR SWAGGER --- (sin cambios)
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerConfig');

// Importación de rutas (sin cambios)
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');

// Importación de middlewares (sin cambios)
const verifyToken = require('./middleware/authMiddleware');

const app = express();

// --- MIDDLEWARES GLOBALES ---

// --- CONFIGURACIÓN DE CORS MEJORADA ---
const allowedOrigins = [
  process.env.CORS_ALLOWED_ORIGIN_DEV || 'http://localhost:5173', // Origen de desarrollo (con fallback)
  process.env.CORS_ALLOWED_ORIGIN_PROD || 'https://gamerstore-genezis.vercel.app',
  process.env.CORS_ALLOWED_ORIGIN_DOCS || 'https://backend-genezis.onrender.com/' // Origen para documentación Swagger (con fallback)
].filter(Boolean); // Filtra por si alguna variable no está definida

const corsOptions = {
  origin: function (origin, callback) {
    // Permite solicitudes sin 'origin' (como Postman) o si el origen está en la lista blanca
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS Bloqueado para Origen: ${origin}`); // Log para depuración
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas
  // credentials: true // Descomentar si necesitas enviar/recibir cookies o encabezados de autorización complejos
};

app.use(cors(corsOptions)); // <-- APLICAR OPCIONES DE CORS
// --- FIN CONFIGURACIÓN DE CORS ---

// Middleware para que Express entienda JSON (sin cambios)
app.use(express.json());

// --- RUTA DE DOCUMENTACIÓN SWAGGER --- (sin cambios)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- RUTAS --- (sin cambios)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);

// --- EJEMPLO DE RUTA PROTEGIDA --- (sin cambios)
app.get('/api/profile', verifyToken, (req, res) => {
    res.json({
        message: 'Bienvenido a tu perfil protegido.',
        userData: req.user
    });
});

// Ruta de bienvenida (sin cambios)
app.get('/', (req, res) => {
    res.send('API de E-commerce funcionando!');
});


// --- MANEJADOR DE ERRORES CENTRALIZADO --- (sin cambios)
app.use((err, req, res, next) => {
    console.error("--- ¡ERROR ATRAPADO POR EL MANEJADOR CENTRAL! ---");
    console.error("Mensaje del Error:", err.message);
    console.error("Stack Trace Completo:", err.stack);
    console.error("--- FIN DEL REPORTE DE ERROR ---");
    res.status(500).json({ message: 'Ha ocurrido un error inesperado en el servidor.' });
});


// Exportamos la app (sin cambios)
module.exports = app;