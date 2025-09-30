# Genezis E-commerce - Backend API

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-blue?logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.x-green?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-blue?logo=postgresql)

API robusta y escalable para la plataforma de e-commerce Genezis. Construida con Node.js y Express, esta API RESTful maneja la autenticación de usuarios, gestión de productos, integración de pagos y más, siguiendo las mejores prácticas de seguridad y desarrollo.

---

##  Tabla de Contenidos

1.  [ Características Principales](#-características-principales)
2.  [ Stack Tecnológico](#️-stack-tecnológico)
3.  [ Cómo Empezar](#-cómo-empezar)
    *   [Prerrequisitos](#prerrequisitos)
    *   [Instalación](#instalación)
4.  [ Documentación de la API](#-documentación-de-la-api)
5.  [ Endpoints de la API](#️-endpoints-de-la-api)
6.  [ Variables de Entorno](#-variables-de-entorno)
7.  [ Equipo de Backend](#-equipo-de-backend)
8.  [ Licencia](#-licencia)

---

##  Características Principales

*   **Autenticación JWT:** Sistema seguro de registro e inicio de sesión con JSON Web Tokens.
*   **Autorización Basada en Roles:** Clara distinción entre usuarios (`customer`) y administradores (`admin`) con middlewares de protección de rutas.
*   **Gestión Completa de Productos (CRUD):** Los administradores pueden crear, leer, actualizar y eliminar productos.
*   **Integración de Pagos Segura:** Checkout con la API de Mercado Pago, validando precios en el backend para prevenir fraudes.
*   **Validación Robusta de Entradas:** Middleware con `express-validator` para limpiar y validar todos los datos de entrada antes de procesarlos.
*   **Documentación Interactiva:** Documentación autogenerada y lista para probar con **Swagger (OpenAPI)**.
*   **Manejo de Errores Centralizado:** Un middleware de "red de seguridad" que previene caídas del servidor y asegura respuestas de error consistentes.
*   **Configuración Profesional:** Habilitado para **CORS** y estructurado para facilitar las pruebas y el despliegue.

---

##  Stack Tecnológico

| Componente      | Tecnología                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **Backend**     | ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js) ![Express.js](https://img.shields.io/badge/-Express.js-000000?logo=express) |
| **Base de Datos** | ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql)                           |
| **Autenticación** | ![JWT](https://img.shields.io/badge/-JSON%20Web%20Tokens-000000?logo=jsonwebtokens) ![Bcrypt.js](https://img.shields.io/badge/-Bcrypt.js-blue) |
| **Pagos**       | ![Mercado Pago](https://img.shields.io/badge/-Mercado%20Pago-009EE3?logo=mercadopago)                   |
| **Validación**    | `express-validator`                                                                                     |
| **Documentación** | ![Swagger](https://img.shields.io/badge/-Swagger-85EA2D?logo=swagger)                                  |

---

##  Cómo Empezar

Sigue estos pasos para tener una copia del proyecto funcionando en tu máquina local.

### Prerrequisitos

Asegúrate de tener instalado el siguiente software:
*   [Node.js](https://nodejs.org/) (versión 18.x o superior)
*   [npm](https://www.npmjs.com/) (generalmente viene con Node.js)
*   [PostgreSQL](https://www.postgresql.org/download/) (versión 14.x o superior)
*   [Git](https://git-scm.com/)

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/PowerSystem2024/Genezis-Repo-Backend-Ecommerce.git
    cd Genezis-Repo-Backend-Ecommerce
    ```

2.  **Instala las dependencias del proyecto:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    *   Crea un archivo `.env` en la raíz del proyecto.
    *   Copia el contenido del siguiente bloque y pégalo en tu archivo `.env`.
    *   **Importante:** Reemplaza los valores con tus propias credenciales.

    ```env
    # Variables de la Base de Datos
    DB_USER=tu_usuario_postgres
    DB_HOST=localhost
    DB_NAME=backend_ecommerce
    DB_PASSWORD=tu_contraseña_postgres
    DB_PORT=5432

    # Secreto para JSON Web Token (JWT)
    JWT_SECRET=genera_una_cadena_secreta_muy_larga_y_aleatoria

    # Credenciales de Mercado Pago (usa las de prueba)
    MERCADO_PAGO_ACCESS_TOKEN=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    ```

4.  **Configura la Base de Datos:**
    *   Conéctate a tu servidor PostgreSQL (usando `psql`, pgAdmin4, etc.).
    *   Crea una nueva base de datos llamada `backend_ecommerce`.
    *   Ejecuta el script SQL para crear todas las tablas necesarias (el que generamos al principio).
    *   (Opcional pero recomendado) Ejecuta el script SQL para poblar las tablas con datos de ejemplo (`seeding`).

5.  **Inicia el servidor:**
    ```bash
    npm start
    ```

    Deberías ver el siguiente mensaje en tu consola, indicando que el servidor está listo:
    ` Servidor escuchando en http://localhost:3000`

---

##  Documentación de la API

Esta API está documentada de forma interactiva usando **Swagger UI**. Una vez que el servidor esté corriendo, puedes acceder a la documentación en tu navegador:

➡️ **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

Desde esta página podrás ver todos los endpoints, sus parámetros, los cuerpos de petición esperados y las posibles respuestas. Además, ¡puedes probar la API directamente desde la interfaz!

---

##  Endpoints de la API

Aquí tienes un resumen de las rutas disponibles. (🔒 indica que la ruta requiere autenticación).

*   **Auth Routes**
    *   `POST /api/auth/register` - Registra un nuevo usuario.
    *   `POST /api/auth/login` - Inicia sesión y obtiene un token JWT.

*   **Product Routes**
    *   `GET /api/products` - Obtiene todos los productos (Pública).
    *   `GET /api/products/:id` - Obtiene un producto por su ID (Pública).
    *   `POST /api/products` - Crea un nuevo producto (🔒 Admin).
    *   `PUT /api/products/:id` - Actualiza un producto (🔒 Admin).
    *   `DELETE /api/products/:id` - Elimina un producto (🔒 Admin).

*   **Checkout Routes**
    *   `POST /api/checkout/create_preference` - Crea una preferencia de pago en Mercado Pago (🔒 Usuario).

---

##  Variables de Entorno

| Variable                    | Descripción                                                                                                | Ejemplo                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `DB_USER`                   | El nombre de usuario para conectar a PostgreSQL.                                                           | `postgres`                                          |
| `DB_HOST`                   | La dirección del servidor de la base de datos.                                                             | `localhost`                                         |
| `DB_NAME`                   | El nombre de la base de datos a la que se conectará.                                                       | `backend_ecommerce`                                 |
| `DB_PASSWORD`               | La contraseña para el usuario de la base de datos.                                                         | `mypassword123`                                     |
| `DB_PORT`                   | El puerto en el que escucha el servidor de PostgreSQL.                                                     | `5432`                                              |
| `JWT_SECRET`                | Una cadena secreta larga y aleatoria para firmar los tokens JWT.                                           | `a_very_long_and_random_secret_string`              |
| `MERCADO_PAGO_ACCESS_TOKEN` | Tu Access Token de prueba de Mercado Pago. Lo obtienes de tu [dashboard de desarrollador](https://www.mercadopago.com/developers/panel/credentials). | `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`         |

---

##  Equipo de Backend

Este proyecto fue desarrollado por:

*   **Luciano Cortez**
*   **Fernando Alma**
*   **Nicolas Fernandez**

---

##  Licencia

Este proyecto está bajo la Licencia MIT.