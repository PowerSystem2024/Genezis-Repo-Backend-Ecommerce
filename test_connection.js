// Carga las variables de entorno desde el archivo .env
require('dotenv').config();

// Importa la clase Pool del paquete 'pg'
const { Pool } = require('pg');

// Crea una nueva instancia de Pool para gestionar las conexiones
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Función asíncrona para probar la conexión
async function checkConnection() {
    let client;
    try {
        // Intenta obtener un cliente del pool de conexiones.
        // Este es el momento en que realmente se establece la conexión.
        console.log('Intentando conectar a la base de datos...');
        client = await pool.connect();
        
        console.log('✅ ¡Conexión inicial a la base de datos establecida!');

        // Realiza una consulta simple para verificar que todo funciona.
        // 'SELECT NOW()' pide a PostgreSQL la fecha y hora actual.
        const result = await client.query('SELECT NOW()');
        
        console.log('🎉 ¡Conexión exitosa! La base de datos respondió.');
        console.log('   Respuesta de PostgreSQL:', result.rows[0].now);

    } catch (error) {
        // Si algo sale mal, muestra el error en la consola.
        console.error('❌ Error al conectar a la base de datos:', error.stack);
    
    } finally {
        // Es crucial liberar al cliente para que vuelva al pool,
        // sin importar si la conexión fue exitosa o no.
        if (client) {
            client.release();
            console.log('Cliente de conexión liberado.');
        }
        // Cierra el pool para terminar el script limpiamente.
        await pool.end();
        console.log('Pool de conexiones cerrado.');
    }
}

// Llama a la función para ejecutar la prueba
checkConnection();