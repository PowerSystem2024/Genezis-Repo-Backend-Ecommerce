// Archivo: services/aiSpecGenerator.js (NUEVO ARCHIVO)
require('dotenv').config();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// 1. Inicialización del Cliente de IA
// Asegurarnos de que la variable de entorno está cargada
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
    console.error("Error: GOOGLE_API_KEY no está definida en .env. El servicio de IA no funcionará.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Configuración de seguridad para el modelo (bloquear contenido sensible)
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Limpia la respuesta de la IA para extraer únicamente el bloque JSON.
 * La IA a veces envuelve la respuesta en ```json ... ```
 * @param {string} rawText - La respuesta de texto cruda del modelo.
 * @returns {string} - El string JSON limpio.
 */
function cleanAiResponse(rawText) {
    // Buscar el inicio de un bloque de código JSON
    const jsonMatch = rawText.match(/```(json)?([\s\S]*?)```/);
    
    if (jsonMatch && jsonMatch[2]) {
        // Si encuentra un bloque ```json ... ```, devuelve el contenido
        return jsonMatch[2].trim();
    }
    
    // Si no, asumimos que la respuesta es JSON crudo (o un intento de)
    // Intentamos encontrar el primer '{' y el último '}'
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return rawText.substring(firstBrace, lastBrace + 1).trim();
    }

    // Si todo falla, devolvemos el texto original
    return rawText;
}

/**
 * Llama a la API de Gemini para generar especificaciones de producto.
 * @param {string} productName - El nombre del producto (ej. "RTX 5070 ti").
 * @returns {Promise<object>} - El objeto JSON con las especificaciones.
 */
async function generateSpecsForProduct(productName) {
    if (!API_KEY) {
        throw new Error("La clave de API de Google no está configurada en el servidor.");
    }
    
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            safetySettings 
        });

        // 2. Definición del Prompt (clave para el éxito)
        const prompt = `Eres un experto en hardware de PC y componentes de e-commerce. 
Extrae las especificaciones técnicas clave para el producto: "${productName}".
Devuelve la respuesta únicamente como un objeto JSON estructurado. 
Agrupa las especificaciones por categorías lógicas (ej. "CARACTERISTICAS GENERALES", "ESPECIFICACIONES DE LA CPU", "MEMORIA").
Las claves del JSON deben estar en MAYÚSCULAS y los valores deben ser strings o números.
No incluyas explicaciones, solo el objeto JSON.

Ejemplo de formato esperado:
{
  "CARACTERISTICAS GENERALES": {
    "Modelo": "Ryzen 5 8600G",
    "Socket": "AM5"
  },
  "ESPECIFICACIONES DE LA CPU": {
    "Núcleos": 6,
    "Frecuencia": "4.3 GHz"
  }
}`;

        // 3. Llamada a la API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        // 4. Limpieza y Parseo
        const cleanedText = cleanAiResponse(rawText);
        
        try {
            const jsonObject = JSON.parse(cleanedText);
            return jsonObject;
        } catch (parseError) {
            console.error("Error: La IA no devolvió un JSON válido.", cleanedText);
            throw new Error("La IA no generó una respuesta JSON válida. Inténtalo de nuevo.");
        }

    } catch (error) {
        console.error("Error llamando a la API de Google Gemini:", error);
        throw new Error("Error al comunicarse con el servicio de IA.");
    }
}

module.exports = {
    generateSpecsForProduct
};