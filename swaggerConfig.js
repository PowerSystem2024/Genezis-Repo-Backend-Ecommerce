// Archivo: swaggerConfig.js (Versión Final para Producción)
const swaggerJsdoc = require('swagger-jsdoc');

// Determinamos la URL del servidor basándonos en el entorno
const serverUrl = process.env.NODE_ENV === 'production'
    ? 'https://genezis-repo-backend-ecommerce-production.up.railway.app' //  URL de producción en Render
: 'http://localhost:3000';              //  URL de desarrollo local

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Genezis E-commerce API',
      version: '1.0.0',
      description: 'Documentación completa para la API del backend del e-commerce Genezis.',
    },
    // Hacemos que la lista de servidores sea dinámica
    servers: [
      {
        url: serverUrl,
        description: process.env.NODE_ENV === 'production' ? 'Servidor de Producción' : 'Servidor de Desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;