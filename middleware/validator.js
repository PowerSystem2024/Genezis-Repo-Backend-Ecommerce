// Archivo: middleware/validator.js
const { body, param, validationResult } = require('express-validator');

// Middleware reutilizable para manejar los errores de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        // Si no hay errores, continuamos a la siguiente función (la lógica de la ruta)
        return next();
    }
    // Si hay errores, los extraemos y los enviamos como respuesta
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    return res.status(422).json({
        errors: extractedErrors,
    });
};

// Reglas de validación para el registro de usuario
const registerValidationRules = () => {
    return [
        // firstName no debe estar vacío
        body('firstName')
            .trim()
            .notEmpty().withMessage('El nombre es obligatorio.'),

        // lastName no debe estar vacío
        body('lastName')
            .trim()
            .notEmpty().withMessage('El apellido es obligatorio.'),

        // email debe ser un email válido
        body('email')
            .isEmail().withMessage('Debe ser una dirección de correo válida.')
            .normalizeEmail({ gmail_remove_dots: false }),

        // password debe tener al menos 6 caracteres
        body('password')
            .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    ];
};

// Reglas de validación para el login
const loginValidationRules = () => {
    return [
        body('email')
            .isEmail().withMessage('Debe ser una dirección de correo válida.')
            .normalizeEmail({ gmail_remove_dots: false }),
        body('password')
            .notEmpty().withMessage('La contraseña es obligatoria.'),
    ];
};

// (Opcional por ahora) Reglas de validación para crear/actualizar un producto
const productValidationRules = () => {
    return [
        body('name').trim().notEmpty().withMessage('El nombre del producto es obligatorio.'),
        body('price').isFloat({ gt: 0 }).withMessage('El precio debe ser un número positivo.'),
        body('stock').isInt({ min: 0 }).withMessage('El stock debe ser un número entero no negativo.'),
        body('categoryID').isInt({ min: 1 }).withMessage('El ID de la categoría es obligatorio y debe ser un número entero positivo.'),
    ];
};

// NUEVA FUNCIÓN: Reglas de validación para un parámetro 'id' en la URL
const idParamValidationRules = () => {
    return [
        // Verifica que el parámetro 'id' sea un número entero
        param('id').isInt().withMessage('El ID del parámetro debe ser un número entero válido.'),
    ];
};

const categoryValidationRules = () => {
    return [
        body('name').trim().notEmpty().withMessage('El nombre de la categoría es obligatorio.'),
        body('description').optional().trim(), // La descripción es opcional
    ];
};

// Reglas para actualizar los detalles del perfil de usuario
const updateUserDetailsRules = () => {
    return [
        body('firstName')
            .trim()
            .notEmpty().withMessage('El nombre es obligatorio.')
            .isString().withMessage('El nombre debe ser una cadena de texto.'),
        body('lastName')
            .trim()
            .notEmpty().withMessage('El apellido es obligatorio.')
            .isString().withMessage('El apellido debe ser una cadena de texto.'),
    ];
};

// Reglas para actualizar la contraseña del usuario
const updateUserPasswordRules = () => {
    return [
        // Podríamos añadir una validación para 'currentPassword' aquí para mayor seguridad
        body('newPassword')
            .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres.'),
    ];
};


module.exports = {
    validate,
    registerValidationRules,
    loginValidationRules,
    productValidationRules,
    idParamValidationRules,
    categoryValidationRules,
    updateUserDetailsRules,
    updateUserPasswordRules
};