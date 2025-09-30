// Archivo: server.js

// Importamos la aplicación Express configurada desde app.js
const app = require('./app');

// Definimos el puerto. Usará el puerto definido en las variables de entorno (para producción)
// o el puerto 3000 si no está definido (para desarrollo local).
const PORT = process.env.PORT || 3000;

// Iniciamos el servidor para que escuche las peticiones en el puerto especificado.
app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});