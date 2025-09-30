// Archivo: middleware/validator.js
const { body, validationResult } = require('express-validator');

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
            .normalizeEmail(),

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
            .normalizeEmail(),
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


module.exports = {
    validate,
    registerValidationRules,
    loginValidationRules,
    productValidationRules,
};