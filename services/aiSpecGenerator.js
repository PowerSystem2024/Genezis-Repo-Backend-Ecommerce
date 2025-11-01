// Archivo: services/aiSpecGenerator.js (Corregido y Mejorado)
require('dotenv').config();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// 1. Inicialización del Cliente de IA
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
    console.error("Error: GOOGLE_API_KEY no está definida en .env. El servicio de IA no funcionará.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Configuración de seguridad
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Limpia la respuesta de la IA para extraer únicamente el bloque JSON.
 * @param {string} rawText - La respuesta de texto cruda del modelo.
 * @returns {string} - El string JSON limpio.
 */
function cleanAiResponse(rawText) {
    const jsonMatch = rawText.match(/```(json)?([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[2]) {
        return jsonMatch[2].trim();
    }
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return rawText.substring(firstBrace, lastBrace + 1).trim();
    }
    return rawText;
}

/**
 * Llama a la API de Gemini para generar especificaciones de producto.
 * @param {string} productName - El nombre del producto (ej. "RTX 4070").
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

        // ========= INICIO DE LA MODIFICACIÓN DEL PROMPT =========
        const prompt = `Eres un experto en hardware de PC y componentes de e-commerce.
Tu tarea es extraer las especificaciones técnicas CLAVE para el producto: "${productName}".

REGLAS:
1.  Devuelve la respuesta ÚNICAMENTE como un objeto JSON estructurado.
2.  Agrupa las especificaciones por categorías lógicas (ej. "CARACTERISTICAS GENERALES", "ESPECIFICACIONES", "MEMORIA").
3.  Las claves de grupo (categorías) deben estar en MAYÚSCULAS.
4.  Los valores deben ser strings o números.

MUY IMPORTANTE:
Solo extrae especificaciones de productos que ya han sido lanzados oficialmente y tienen datos públicos confirmados. 
Si el producto es un rumor, es especulativo, o no ha sido anunciado (como "RTX 5070 ti" o "Ryzen 10"), NO ADIVINES.
En lugar de devolver "NO DISPONIBLE" o "RUMOREADO", simplemente devuelve un objeto JSON vacío: {}.

Ejemplo de producto EXISTENTE ("Ryzen 5 8600G"):
{
  "CARACTERISTICAS GENERALES": {
    "Modelo": "Ryzen 5 8600G",
    "Socket": "AM5"
  },
  "ESPECIFICACIONES DE LA CPU": {
    "Núcleos": 6,
    "Frecuencia": "4.3 GHz"
  }
}

Ejemplo de producto ESPECULATIVO ("RTX 5070 ti"):
{}
`;
        // ========= FIN DE LA MODIFICACIÓN DEL PROMPT =========

        // 3. Llamada a la API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        // 4. Limpieza y Parseo
        const cleanedText = cleanAiResponse(rawText);
        
        try {
            // Si el texto limpio es solo "{}" o está vacío, parseará bien
            const jsonObject = JSON.parse(cleanedText || "{}");
            
            // Verificamos si la IA obedeció y devolvió un objeto vacío
            if (Object.keys(jsonObject).length === 0) {
                 console.log(`[AI Specs] La IA determinó que el producto "${productName}" es especulativo o no tiene datos. Se guardará un JSON vacío.`);
            }

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