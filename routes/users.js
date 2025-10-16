// Archivo: routes/users.js
const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinaryConfig');

const router = express.Router();

router.put('/profile/image', [verifyToken, upload.single('profileImage')], async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se ha proporcionado ningún archivo.' });

        cloudinary.uploader.upload_stream({ folder: 'genezis_profiles', transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }] },
            async (error, result) => {
                if (error) return next(new Error('Error al subir la imagen.'));

                const imageUrl = result.secure_url;
                const userId = req.user.userId;
                
                // Nombre de columna exacto: "profileImageUrl"
                const query = `UPDATE users SET "profileImageUrl" = $1 WHERE id = $2 RETURNING "profileImageUrl";`;
                const { rows } = await db.query(query, [imageUrl, userId]);

                res.status(200).json({ message: 'Imagen de perfil actualizada.', profileImageUrl: rows[0].profileImageUrl });
            }
        ).end(req.file.buffer);
    } catch (error) {
        next(error);
    }
});

module.exports = router;