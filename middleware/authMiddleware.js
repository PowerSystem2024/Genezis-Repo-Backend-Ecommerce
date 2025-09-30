// Archivo: middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    // 1. Obtener el token del encabezado 'Authorization'
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ message: 'No se proveyó un token.' });
    }

    // El formato del header es "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'Formato de token inválido.' });
    }

    // 2. Verificar la validez del token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // Si el token expiró o es inválido
            return res.status(401).json({ message: 'No autorizado. Token inválido o expirado.' });
        }

        // 3. Si el token es válido, guardar los datos del usuario en el objeto `req`
        // para que las rutas protegidas puedan usarlos (ej. req.user.userId)
        req.user = decoded;

        // 4. Permitir que la petición continúe hacia la ruta protegida
        next();
    });
}

module.exports = verifyToken;