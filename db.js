// Archivo: db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Exportamos un método 'query' para poder usar el pool desde otros archivos
module.exports = {
    query: (text, params) => pool.query(text, params),
};