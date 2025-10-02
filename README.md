# Genezis E-commerce - Backend API

![Node.js](https://img.shields.io/badge/Node.js-18.x-blue?logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.x-green?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue?logo=postgresql)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

API RESTful robusta y escalable para la plataforma de e-commerce Genezis. Construida con Node.js, Express y PostgreSQL, esta API maneja la autenticación de usuarios, gestión dinámica de productos y categorías, y un flujo de órdenes de compra completo integrado con Mercado Pago, siguiendo las mejores prácticas de seguridad y desarrollo.

---

## 📋 Tabla de Contenidos

1.  [Características Principales](#-características-principales)
2.  [Stack Tecnológico](#️-stack-tecnológico)
3.  [Cómo Empezar](#-cómo-empezar)
    *   [Prerrequisitos](#prerrequisitos)
    *   [Instalación](#instalación)
4.  [Documentación de la API (Swagger)](#-documentación-de-la-api-swagger)
5.  [Endpoints de la API](#️-endpoints-de-la-api)
6.  [Variables de Entorno](#-variables-de-entorno)
7.  [Equipo de Backend](#-equipo-de-backend)
8.  [Licencia](#-licencia)

---

## Características Principales

*   **Autenticación y Autorización (JWT):** Sistema seguro de registro/login y protección de rutas basada en roles (`customer`, `admin`).
*   **Gestión Dinámica de Productos y Categorías:** Operaciones CRUD completas para que los administradores gestionen todo el catálogo de productos y sus categorías.
*   **Flujo de Órdenes Completo:** Creación de órdenes de compra a través de webhooks de pago y gestión manual por parte del administrador (creación y actualización de estado).
*   **Integración de Pagos Automatizada:** Checkout seguro con la API de Mercado Pago. Las órdenes se crean automáticamente tras la confirmación de un pago exitoso vía Webhook.
*   **Validación Robusta de Entradas:** Middleware con `express-validator` que limpia y valida todos los datos de entrada para garantizar la integridad de los datos.
*   **Documentación Interactiva:** Documentación autogenerada y lista para probar con **Swagger (OpenAPI)**, incluyendo soporte para autorización JWT.
*   **Manejo de Errores Centralizado:** Middleware que previene caídas del servidor y asegura respuestas de error consistentes y seguras.
*   **Optimización de Consultas:** Uso de `JOIN` en las consultas a la base de datos para enriquecer las respuestas de la API (ej. incluir el nombre de la categoría en los productos) y reducir la cantidad de peticiones necesarias por parte del frontend.
*   **Transacciones Seguras:** Uso de transacciones SQL (`BEGIN`, `COMMIT`, `ROLLBACK`) en operaciones críticas (como la creación de órdenes) para garantizar la atomicidad y consistencia de los datos.

---

## Stack Tecnológico

| Componente      | Tecnología                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **Backend**     | ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js) ![Express.js](https://img.shields.io/badge/-Express.js-000000?logo=express) |
| **Base de Datos** | ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql)                           |
| **Autenticación** | ![JWT](https://img.shields.io/badge/-JSON%20Web%20Tokens-000000?logo=jsonwebtokens) ![Bcrypt.js](https://img.shields.io/badge/-Bcrypt.js-blue) |
| **Pagos**       | ![Mercado Pago](https://img.shields.io/badge/-Mercado%20Pago-009EE3?logo=mercadopago)                   |
| **Validación**    | `express-validator`                                                                                     |
| **Documentación** | ![Swagger](https://img.shields.io/badge/-Swagger-85EA2D?logo=swagger)                                  |

---

## Cómo Empezar

Sigue estos pasos para tener una copia del proyecto funcionando en tu máquina local.

### Prerrequisitos

*   [Node.js](https://nodejs.org/) (v18.x o superior)
*   [npm](https://www.npmjs.com/) (viene con Node.js)
*   [PostgreSQL](https://www.postgresql.org/download/) (v14.x o superior)
*   [Git](https://git-scm.com/)

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/PowerSystem2024/Genezis-Repo-Backend-Ecommerce.git
    cd Genezis-Repo-Backend-Ecommerce
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    *   Crea un archivo `.env` en la raíz y copia el contenido del `env.example` (o usa el bloque de abajo).
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
    *   Conéctate a tu servidor PostgreSQL.
    *   Crea una nueva base de datos llamada `backend_ecommerce`.
    *   Ejecuta los scripts `sql/create_tables.sql` y `sql/seed_data.sql` para crear y poblar la base de datos.

5.  **Inicia el servidor:**
    ```bash
    node server.js
    ```
    El servidor estará disponible en `http://localhost:3000`.

---

## Documentación de la API (Swagger)

Esta API está completamente documentada de forma interactiva. Una vez que el servidor esté corriendo, puedes acceder a la documentación en tu navegador:

➡️ **Documentación Local:** [**http://localhost:3000/api-docs**](http://localhost:3000/api-docs)
➡️ **Documentación en Producción:** [**https://backend-genezis.onrender.com/api-docs/**](https://backend-genezis.onrender.com/api-docs/)

Desde esta página podrás ver todos los endpoints, sus parámetros y probar la API directamente, incluyendo las rutas protegidas usando el botón "Authorize".

---

## Endpoints de la API

Aquí tienes un resumen de las rutas disponibles. (🔒 indica que la ruta requiere autenticación).

*   **Auth Routes (`/api/auth`)**
    *   `POST /register`: Registra un nuevo usuario.
    *   `POST /login`: Inicia sesión y obtiene un token JWT.

*   **Product Routes (`/api/products`)**
    *   `GET /`: Obtiene todos los productos con su nombre de categoría (Pública).
    *   `GET /:id`: Obtiene un producto por su ID (Pública).
    *   `POST /`: Crea un nuevo producto (🔒 Admin).
    *   `PUT /:id`: Actualiza un producto (🔒 Admin).
    *   `DELETE /:id`: Elimina un producto (🔒 Admin).

*   **Category Routes (`/api/categories`)**
    *   `GET /`: Obtiene todas las categorías (Pública).
    *   `POST /`: Crea una nueva categoría (🔒 Admin).
    *   `PUT /:id`: Actualiza una categoría (🔒 Admin).
    *   `DELETE /:id`: Elimina una categoría (🔒 Admin).

*   **Checkout Routes (`/api/checkout`)**
    *   `POST /create_preference`: Crea una preferencia de pago en Mercado Pago (🔒 Usuario).

*   **Order Routes (`/api/orders`)**
    *   `GET /my-orders`: Obtiene el historial de órdenes del usuario actual (🔒 Usuario).
    *   `GET /`: Obtiene todas las órdenes del sistema (🔒 Admin).
    *   `POST /`: Crea una orden manualmente (🔒 Admin).
    *   `PUT /:id/status`: Actualiza el estado de una orden (🔒 Admin).
    *   `POST /webhook/mercadopago`: Endpoint para recibir notificaciones de Mercado Pago (No usar directamente).

---

## Variables de Entorno

| Variable                    | Descripción                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `DB_USER`                   | Usuario para conectar a PostgreSQL.                                                                        |
| `DB_HOST`                   | Dirección del servidor de la base de datos.                                                                |
| `DB_NAME`                   | Nombre de la base de datos.                                                                                |
| `DB_PASSWORD`               | Contraseña del usuario de la base de datos.                                                                |
| `DB_PORT`                   | Puerto de PostgreSQL (usualmente `5432`).                                                                  |
| `JWT_SECRET`                | Cadena secreta larga y aleatoria para firmar los tokens JWT.                                               |
| `MERCADO_PAGO_ACCESS_TOKEN` | Access Token (de prueba) de Mercado Pago, obtenido del [dashboard de desarrollador](https://www.mercadopago.com/developers/panel/credentials). |

---

## Equipo de Backend

Este proyecto fue desarrollado por:

*   **Luciano Cortez**
*   **Fernando Alma**
*   **Nicolas Fernandez**

---

## Licencia

Este proyecto está bajo la Licencia MIT.```