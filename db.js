// Archivo: db.js (Versión Final para Despliegue)
const { Pool } = require('pg');
require('dotenv').config();

// Configuración base para la conexión
const config = {
    // Usamos la DATABASE_URL de Render en producción, o las variables locales en desarrollo
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
};

// Si estamos en producción (en Render), añadimos la configuración SSL
if (process.env.NODE_ENV === 'production') {
    config.ssl = {
        rejectUnauthorized: false
    };
}

const pool = new Pool(config);

module.exports = {
    query: (text, params) => pool.query(text, params),
};