# Genezis E-commerce - Backend API

API RESTful robusta y escalable para la plataforma de e-commerce Genezis. Construida con Node.js, Express y PostgreSQL, esta API maneja la autenticación de usuarios, gestión dinámica de productos (con subida de imágenes a Cloudinary), gestión de perfiles de usuario, y un flujo de órdenes de compra completo integrado con Mercado Pago y webhooks de notificación (n8n), siguiendo las mejores prácticas de seguridad y desarrollo.

-----

## 📋 Tabla de Contenidos

- [Genezis E-commerce - Backend API](#genezis-e-commerce---backend-api)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [Características Principales](#características-principales)
  - [Stack Tecnológico](#stack-tecnológico)
  - [Cómo Empezar](#cómo-empezar)
    - [Prerrequisitos](#prerrequisitos)
    - [Instalación](#instalación)
  - [Documentación de la API (Swagger)](#documentación-de-la-api-swagger)
  - [Endpoints de la API](#endpoints-de-la-api)
  - [Variables de Entorno](#variables-de-entorno)
  - [Equipo de Backend](#equipo-de-backend)
  - [Licencia](#licencia)

-----

## Características Principales

  * **Autenticación y Autorización (JWT):** Sistema seguro de registro/login y protección de rutas basada en roles (`customer`, `admin`).
  * **Gestión de Perfil de Usuario:** Endpoints para que los usuarios actualicen sus datos personales (nombre, apellido) y contraseña de forma segura.
  * **Gestión de Archivos en la Nube:** Integración con **Cloudinary** y `multer` para la subida, optimización y almacenamiento de imágenes de productos.
  * **Gestión Dinámica de Productos y Categorías:** Operaciones CRUD completas para administradores, incluyendo subida de imágenes de portada y galerías.
  * **Borrado Lógico (Soft Delete):** Los productos y usuarios no se eliminan, sino que se marcan como inactivos (`isActive = false`) para mantener la integridad referencial de las órdenes antiguas.
  * **Flujo de Órdenes Completo:** Creación de órdenes de compra a través de webhooks de pago y gestión manual por parte del administrador (creación y actualización de estado).
  * **Integración de Pagos Automatizada:** Checkout seguro con la API de Mercado Pago. Las órdenes se crean automáticamente tras la confirmación de un pago exitoso vía Webhook.
  * **Validación de Stock:** Verificación automática de stock *antes* de crear la preferencia de pago en Mercado Pago, previniendo ventas de productos agotados.
  * **Integración de Webhooks (n8n):** Tras una compra exitosa, la API dispara un webhook a un servicio externo (como n8n) con los detalles del pedido para automatizar tareas (ej. envío de emails).
  * **Validación Robusta de Entradas:** Middleware con `express-validator` que limpia y valida todos los datos de entrada para garantizar la integridad de los datos.
  * **Documentación Interactiva:** Documentación autogenerada y lista para probar con **Swagger (OpenAPI)**, incluyendo soporte para autorización JWT.
  * **Manejo de Errores Centralizado:** Middleware que previene caídas del servidor y asegura respuestas de error consistentes y seguras.
  * **Transacciones Seguras:** Uso de transacciones SQL (`BEGIN`, `COMMIT`, `ROLLBACK`) en operaciones críticas (como la creación de órdenes) para garantizar la atomicidad y consistencia de los datos.

-----

## Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Backend** |   |
| **Base de Datos** |  |
| **Autenticación** |   |
| **Pagos** |  |
| **Manejo de Archivos**|  `multer` |
| **Peticiones HTTP** | `axios` (para webhooks de n8n) |
| **Validación** | `express-validator` |
| **Documentación** |  |

-----

## Cómo Empezar

Sigue estos pasos para tener una copia del proyecto funcionando en tu máquina local.

### Prerrequisitos

  * [Node.js](https://nodejs.org/) (v18.x o superior)
  * [npm](https://www.npmjs.com/) (viene con Node.js)
  * [PostgreSQL](https://www.postgresql.org/) (v14.x o superior)
  * [Git](https://git-scm.com/)

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

      * Crea un archivo `.env` en la raíz (puedes copiar el contenido de abajo).
      * **Importante:** Reemplaza los valores con tus propias credenciales.

    <!-- end list -->

    ```env
    # Variables de la Base de Datos
    DB_USER=tu_usuario_postgres
    DB_HOST=localhost
    DB_NAME=backend_ecommerce
    DB_PASSWORD=tu_contraseña_postgres
    DB_PORT=5432

    # URL de conexión (para producción como Render/Railway)
    # DATABASE_URL=postgresql://user:password@host:port/database

    # Secreto para JSON Web Token (JWT)
    JWT_SECRET=genera_una_cadena_secreta_muy_larga_y_aleatoria

    # Credenciales de Mercado Pago (usa las de prueba)
    MERCADO_PAGO_ACCESS_TOKEN=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

    # Credenciales de Cloudinary (para subida de imágenes)
    CLOUDINARY_CLOUD_NAME=tu_cloud_name
    CLOUDINARY_API_KEY=tu_api_key
    CLOUDINARY_API_SECRET=tu_api_secret

    # Webhook para notificaciones de órdenes (ej. n8n)
    N8N_ORDER_WEBHOOK_URL=https://tu-webhook-url.com/endpoint

    # Orígenes permitidos por CORS
    CORS_ALLOWED_ORIGIN_DEV=http://localhost:5173
    CORS_ALLOWED_ORIGIN_PROD=https://tu-frontend.vercel.app
    ```

4.  **Configura la Base de Datos:**

      * Conéctate a tu servidor PostgreSQL.
      * Crea una nueva base de datos (ej. `backend_ecommerce`).
      * Ejecuta los scripts `sql/create_tables.sql` y `sql/seed_data.sql` para crear y poblar la base de datos.

5.  **Inicia el servidor:**

    ```bash
    node server.js
    ```

    El servidor estará disponible en `http://localhost:3000`.

-----

## Documentación de la API (Swagger)

Esta API está completamente documentada de forma interactiva. Una vez que el servidor esté corriendo, puedes acceder a la documentación en tu navegador:

➡️ **Documentación Local:** [**http://localhost:3000/api-docs**](http://localhost:3000/api-docs)
➡️ **Documentación en Producción:** [**https://genezis-repo-backend-ecommerce-production.up.railway.app/api-docs/**](https://genezis-repo-backend-ecommerce-production.up.railway.app/api-docs/)

Desde esta página podrás ver todos los endpoints, sus parámetros y probar la API directamente, incluyendo las rutas protegidas usando el botón "Authorize".

-----

## Endpoints de la API

Aquí tienes un resumen de las rutas disponibles. (🔒 indica que la ruta requiere autenticación).

  * **Auth Routes (`/api/auth`)**

      * `POST /register`: Registra un nuevo usuario.
      * `POST /login`: Inicia sesión y obtiene un token JWT.

  * **User Routes (`/api/users`)**

      * `GET /`: Obtiene la lista de todos los usuarios (🔒 Admin).
      * `PATCH /profile/details`: Actualiza el nombre/apellido del usuario autenticado (🔒 Usuario).
      * `PATCH /profile/password`: Actualiza la contraseña del usuario autenticado (🔒 Usuario).
      * `DELETE /:id`: Desactiva un usuario (Borrado Lógico) (🔒 Admin).

  * **Product Routes (`/api/products`)**

      * `GET /`: Obtiene todos los productos **activos** (Pública).
      * `GET /admin/all`: Obtiene **todos** los productos, incluyendo inactivos (🔒 Admin).
      * `GET /:id`: Obtiene un producto por su ID (Pública).
      * `POST /`: Crea un nuevo producto (con subida de imagen de portada) (🔒 Admin).
      * `PUT /:id`: Actualiza un producto (con subida de imagen opcional) (🔒 Admin).
      * `DELETE /:id`: Desactiva un producto (Borrado Lógico) (🔒 Admin).
      * `POST /:id/gallery`: Añade una imagen a la galería del producto (🔒 Admin).
      * `DELETE /gallery/:imageId`: Elimina una imagen de la galería (🔒 Admin).

  * **Category Routes (`/api/categories`)**

      * `GET /`: Obtiene todas las categorías (Pública).
      * `POST /`: Crea una nueva categoría (🔒 Admin).
      * `PUT /:id`: Actualiza una categoría (🔒 Admin).
      * `DELETE /:id`: Elimina una categoría (🔒 Admin).

  * **Checkout Routes (`/api/checkout`)**

      * `POST /create_preference`: Crea una preferencia de pago en Mercado Pago (con validación de stock) (🔒 Usuario).

  * **Order Routes (`/api/orders`)**

      * `GET /`: Obtiene todas las órdenes del sistema (🔒 Admin).
      * `GET /my-orders`: Obtiene el historial de órdenes del usuario actual (🔒 Usuario).
      * `GET /:id`: Obtiene el detalle de una orden específica (🔒 Admin o Propietario).
      * `POST /`: Crea una orden manualmente (🔒 Admin).
      * `PUT /:id/status`: Actualiza el estado de una orden (🔒 Admin).
      * `POST /webhook/mercadopago`: Webhook para recibir notificaciones de Mercado Pago (dispara webhook a n8n).

  * **Test Routes (`/api/test`)**

      * `GET /n8n`: Endpoint de prueba para disparar el webhook de n8n (Pública).

-----

## Variables de Entorno

| Variable | Descripción |
| :--- | :--- |
| `DB_USER` | Usuario para conectar a PostgreSQL. |
| `DB_HOST` | Dirección del servidor de la base de datos. |
| `DB_NAME` | Nombre de la base de datos. |
| `DB_PASSWORD` | Contraseña del usuario de la base de datos. |
| `DB_PORT` | Puerto de PostgreSQL (usualmente `5432`). |
| `DATABASE_URL` | (Opcional) String de conexión completa para entornos de producción. |
| `JWT_SECRET` | Cadena secreta larga y aleatoria para firmar los tokens JWT. |
| `MERCADO_PAGO_ACCESS_TOKEN` | Access Token de Mercado Pago (del [dashboard de desarrollador](https://www.mercadopago.com/developers/panel/credentials)). |
| `CLOUDINARY_CLOUD_NAME` | Cloud Name de tu cuenta de Cloudinary. |
| `CLOUDINARY_API_KEY` | API Key de tu cuenta de Cloudinary. |
| `CLOUDINARY_API_SECRET` | API Secret de tu cuenta de Cloudinary. |
| `N8N_ORDER_WEBHOOK_URL`| URL del endpoint de tu workflow de n8n para recibir notificaciones de órdenes. |
| `CORS_ALLOWED_ORIGIN_DEV` | URL del frontend en entorno de desarrollo (ej. `http://localhost:5173`). |
| `CORS_ALLOWED_ORIGIN_PROD`| URL del frontend en producción (ej. `https://gamerstore-genezis.vercel.app`). |

-----

## Equipo de Backend

Este proyecto fue desarrollado por:

  * **Luciano Cortez**
  * **Fernando Alma**

-----

## Licencia

Este proyecto está bajo la Licencia MIT.
