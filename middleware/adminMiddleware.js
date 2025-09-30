// middleware/adminMiddleware.js
// Middleware para verificar si el usuario tiene rol de 'admin'
function checkAdmin(req, res, next) {
    // Este middleware debe ejecutarse DESPUÉS de verifyToken.
    // verifyToken añade el objeto 'user' a la petición (req).

    if (req.user && req.user.role === 'admin') {
        // Si el usuario existe y su rol es 'admin', permite continuar.
        next();
    } else {
        // Si no, deniega el acceso.
        res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
}

module.exports = checkAdmin;