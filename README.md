# Genezis GamerStore - Proyecto E-commerce Full-Stack

**Genezis GamerStore** es un proyecto de e-commerce full-stack completamente funcional, diseñado como proyecto final universitario. La plataforma simula una tienda real de hardware y periféricos de gaming, implementando un flujo de compra de punta a punta, desde el catálogo de productos hasta un panel de administración integral.

El proyecto está dividido en dos repositorios: una **API de backend** robusta construida con Node.js y un **cliente de frontend** moderno construido con React.

![Captura HERO - Genezis GamerStore](./HERO.png)

## Demos en Vivo

  * **Sitio Frontend (Vercel):** [https://gamerstore-genezis.vercel.app/](https://gamerstore-genezis.vercel.app/)
  * **Documentación de la API (Railway):** [https://genezis-repo-backend-ecommerce-production.up.railway.app/api-docs/](https://genezis-repo-backend-ecommerce-production.up.railway.app/api-docs/)

  -----  
  
### Backend
![Node.js](https://img.shields.io/badge/Node.js-20.x+-green)
![Express.js](https://img.shields.io/badge/Express.js-4.x-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-SQL-blue)
![JWT](https://img.shields.io/badge/JWT-Auth-purple)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-blueviolet)

### Frontend
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)
![React Router](https://img.shields.io/badge/React%20Router-v7-CA4245)
![SASS/SCSS](https://img.shields.io/badge/SASS-SCSS-CC6699)
![jsPDF](https://img.shields.io/badge/jsPDF-Client%20PDF-red)

### Integraciones y Servicios
![Mercado Pago](https://img.shields.io/badge/Mercado%20Pago-SDK-009EE3)
![Cloudinary](https://img.shields.io/badge/Cloudinary-SDK-3448C5)
![Google AI](https://img.shields.io/badge/Google%20AI-Gemini-4285F4)
<br>

-----

## Stack Tecnológico

| Área | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Backend** | Node.js | Entorno de ejecución de servidor. |
| | Express.js | Framework para el servidor y enrutamiento de la API RESTful. |
| | PostgreSQL | Base de datos relacional para persistencia de datos. |
| | JWT (jsonwebtoken) | Autenticación basada en tokens y seguridad de rutas. |
| | Mercado Pago SDK | Pasarela de pagos para procesar compras reales. |
| | Cloudinary SDK | Almacenamiento y optimización de imágenes en la nube. |
| | Google Generative AI | Generación de especificaciones de producto (`specs`) vía IA. |
| | `bcryptjs` | Hasheo seguro de contraseñas de usuario. |
| | `express-validator` | Validación y sanitización de todas las entradas de la API. |
| | `multer` | Middleware para la subida de archivos (`FormData`). |
| | `pg` (node-postgres) | Cliente de PostgreSQL con pool de conexiones y manejo de transacciones. |
| | Swagger (JSDoc) | Documentación interactiva de la API. |
| **Frontend** | React (con Vite) | Librería de UI reactiva y moderna. |
| | React Router v7 | Enrutamiento del lado del cliente (SPA). |
| | SASS / SCSS | Preprocesador de CSS para estilos avanzados y mantenibles. |
| | React Context API | Gestión de estado global (Autenticación, Carrito, Productos). |
| | `jsPDF` & `html2canvas` | Generación de facturas/órdenes en PDF del lado del cliente. |

-----

## Arquitectura y Modelado de Datos

Aquí está el Diagrama de Entidad-Relación (DER) que define la estructura de nuestra base de datos PostgreSQL. Este diseño fue fundamental para construir la lógica de negocio, incluyendo el borrado lógico (`"isActive"`) y las relaciones transaccionales.

![Diagrama de Base de Datos - Genezis GamerStore](./DERGAMERSTORE.png)
-----

## Características Principales

Este proyecto no es solo un CRUD, sino una aplicación completa con lógica de negocio compleja.

### Backend y Lógica de Negocio (El Núcleo)

  * **Autenticación y Autorización:** Sistema completo de registro (`bcrypt`) y login (`JWT`) con roles (`admin`, `customer`). Las rutas críticas están protegidas por middleware (`verifyToken`, `checkAdmin`).
  * **Gestión de Base de Datos (PostgreSQL):** Esquema relacional robusto (`create_tables.sql`) que incluye **borrado lógico** (`isActive`) para productos y usuarios, preservando la integridad de las órdenes antiguas.
  * **Gestión de Archivos en Cloudinary:** Uso de `multer` para interceptar `FormData` en el backend. Las imágenes de productos y galerías se suben y optimizan en Cloudinary, guardando únicamente la URL en la base de datos.
  * **Integración con IA (Google Gemini):** Un endpoint (`/products/:id/generate-specs`) que utiliza la API de Google Generative AI (`aiSpecGenerator.js`) para crear especificaciones técnicas detalladas de un producto (basado en su nombre) y las guarda en una columna de tipo `JSONB` en la base de datos.
  * **Validación de Entradas:** `express-validator` (`middleware/validator.js`) se utiliza en *todas* las rutas de entrada (auth, productos, usuarios) para prevenir datos corruptos o maliciosos.
  * **Pool de Conexiones de DB:** El archivo `db.js` utiliza un pool de conexiones (`pg.Pool`) para gestionar eficientemente las consultas a la base de datos y permitir el manejo de transacciones.
  * **Documentación de API (Swagger):** Toda la API está documentada usando `swagger-jsdoc`, proporcionando un explorador de interactivo para probar los endpoints.

### Experiencia del Cliente (Frontend)

  * **Catálogo de Productos Avanzado:** Página de catálogo (`ProductCatalog.jsx`) con:
      * Filtros por categoría y búsqueda de texto.
      * Ordenamiento por precio (ascendente/descendente).
      * Paginación (`Pagination.jsx`) para manejar grandes cantidades de productos.
      * Vistas intercambiables (Grid/List) con CSS (`ProductCard.scss`).
  * **Detalle de Producto Enriquecido:** Página de detalle (`ProductDetail.jsx`) que incluye:
      * Una galería de imágenes (`ProductGallery.jsx`) que combina la portada y las imágenes de la galería.
      * Renderizado de las especificaciones (`ProductSpecs.jsx`) generadas por la IA desde el campo `JSONB` del producto.
  * **Carrito de Compras Fluido:** Gestión de estado global (`CartContext.jsx`) que alimenta:
      * Un Sidebar (`CartSidebar.jsx`) que aparece automáticamente al añadir un producto.
      * Una página de Carrito (`Cart.jsx`) con lógica para actualizar cantidades y calcular totales (`useMemo`).
  * **Gestión de Sesión Robusta:**
      * `AuthContext.jsx` maneja el estado del usuario y el token en `localStorage`.
      * El servicio `api.js` intercepta errores **401 (No Autorizado)** y dispara un evento global.
      * Un `SessionExpiredModal.jsx` escucha este evento, cierra la sesión del usuario y le pide que vuelva a iniciar sesión.
  * **Checkout y Pago:**
      * Ruta `/checkout` protegida (`ProtectedRoute.jsx`).
      * Páginas de estado (`PaymentSuccess.jsx`, `PaymentFailure.jsx`) tras la redirección de Mercado Pago.
  * **Diseño Visual:** Página de inicio (`Home.jsx`) con componentes visuales como `HeroCarousel.jsx` y `BrandsCarousel.jsx` (animación de scroll infinito con CSS).

### Panel de Administración (Full-Stack)

  * **Acceso Doblemente Seguro:** La ruta `/admin` (`AdminRoute.jsx`) está protegida por una doble validación:
    1.  Verifica el rol del usuario (`user.role === 'admin'`).
    2.  Utiliza el hook `useIsDesktop.js` para bloquear el acceso en dispositivos móviles, renderizando `AdminMobileBlock.jsx`.
  * **CRUD de Productos:** Interfaz (`AdminProducts.jsx`) para crear, editar y "desactivar" (borrado lógico) productos.
  * **Gestión de Galería:** Un modal (`GalleryManagerModal.jsx`) que permite subir y eliminar imágenes secundarias de un producto directamente a Cloudinary.
  * **Gestión de Órdenes:** (`ManageOrders.jsx`)
      * Visualización de todas las órdenes de la base de datos.
      * Actualización de estado de la orden (Pagada, Enviada, etc.).
      * Apertura de un modal (`OrderDetailModal.jsx`) para ver los detalles de la compra.
  * **Generación de PDF:** El modal de detalle de orden utiliza `jsPDF` y `html2canvas` para generar una factura en PDF descargable.
  * **Gestión de Usuarios:** Interfaz (`ManageUsers.jsx`) para listar todos los usuarios registrados y "desactivarlos" (borrado lógico).
  * **Gestión de Perfil de Admin:** (`AdminProfile.jsx`) Permite al administrador actualizar sus propios datos personales y cambiar su contraseña.

-----

## Arquitectura Destacada: Flujo de Pago Transaccional

El flujo de pago es la lógica más compleja del sistema, asegurando que el stock sea consistente y que los pagos se procesen de forma atómica y segura.

1.  **Validación de Stock (Frontend -\> Backend):**

      * El cliente presiona "Pagar" en (`Checkout.jsx`).
      * Se envía una petición a la API (`/api/checkout/create_preference`) con los items del carrito.
      * **Paso Crítico:** El backend (`routes/checkout.js`) **NO** contacta a Mercado Pago aún. Primero, consulta la base de datos y verifica el stock de *cada* producto en el carrito.
      * Si un solo producto no tiene stock, la API rechaza la petición con un **error 409 (Conflicto)**, informando al usuario *antes* de intentar pagar.

2.  **Creación de la Preferencia (Backend \<-\> Mercado Pago):**

      * Si hay stock para todo, el backend crea la preferencia de pago en Mercado Pago y devuelve el `init_point` (URL de pago) al frontend.
      * El frontend redirige al usuario a la pasarela de Mercado Pago.

3.  **Confirmación y Webhook (Mercado Pago -\> Backend):**

      * El cliente completa el pago.
      * Mercado Pago **NO** redirige al frontend con la confirmación. En su lugar, envía una notificación asincrónica a nuestro endpoint de **Webhook** (`/api/orders/webhook/mercadopago`).

4.  **Transacción SQL (Backend):**

      * El endpoint del webhook (`routes/orders.js`) recibe la notificación de pago "aprobado".
      * Para garantizar la atomicidad, el servidor obtiene un cliente del pool de `db.js` e inicia una **Transacción SQL** (`BEGIN`).
      * Dentro de la transacción, ejecuta 3 operaciones:
        1.  `INSERT` en la tabla `Orders` (crea la orden).
        2.  `INSERT` en `OrderDetails` (guarda los productos comprados).
        3.  `UPDATE` en la tabla `Products` (descuenta el stock de cada producto).
      * **Resultado:** Si las 3 operaciones tienen éxito, se ejecuta `COMMIT` y la orden es definitiva. Si *alguna* de ellas falla (ej. el stock se agotó en el último segundo), se ejecuta `ROLLBACK`, revirtiendo todos los cambios y evitando una orden inconsistente.

-----

## Configuración y Despliegue

Sigue estos pasos para levantar el proyecto en tu entorno local.

## Prerrequisitos

  * Node.js (v20.x o superior)
  * `npm` o `yarn`
  * Un servidor de PostgreSQL
  * Cuentas en: [Cloudinary](https://cloudinary.com/), [Mercado Pago (Developers)](https://www.mercadopago.com/developers) y [Google AI Studio](https://aistudio.google.com/).

## 1\. Backend (API)

1.  **Clona el repositorio del backend**

<!-- end list -->

```bash
git clone https://github.com/PowerSystem2024/Genezis-Repo-Backend-Ecommerce.git
```

```bash
cd Genezis-Repo-Backend-Ecommerce
```

3.  **Instala las dependencias**

<!-- end list -->

```bash
npm install
```

4.  **Configura las variables de entorno (crea un archivo .env)**
    (Ver la sección 'Variables de Entorno' más abajo)

5.  **Configura la Base de Datos**
    \- Conéctate a tu servidor PostgreSQL.
    \- Crea una nueva base de datos (ej. genezis\_db).
    \- Ejecuta el script `sql/create_tables.sql` para crear la estructura.
    \- (Opcional) Ejecuta `sql/seed_data.sql` para poblar con datos de prueba.

6.  **Inicia el servidor de desarrollo**
    node server.js
    (o usa nodemon si lo prefieres)

**El backend estará disponible en http://localhost:3000**

## 2\. Frontend (Cliente)

1.  **Clona el repositorio del frontend en una carpeta separada**

<!-- end list -->

```bash
git clone https://github.com/PowerSystem2024/Genezis-Repo-Frontend-Ecommerce.git
```

```bash
cd Genezis-Repo-Frontend-Ecommerce
```

2.  **Instala las dependencias**

<!-- end list -->

```bash
npm install
```

3.  **Configura las variables de entorno (crea un archivo .env)**
    (Ver la sección 'Variables de Entorno' más abajo)

4.  **Inicia el servidor de desarrollo de Vite**

<!-- end list -->

```bash
npm run dev
```

**El frontend estará disponible en http://localhost:5173**

-----

## Variables de Entorno

Para funcionar, el proyecto requiere las siguientes variables de entorno.

## Backend (`.env`)

```env
# Base de Datos (PostgreSQL)
DB_USER=tu_usuario_postgres
DB_HOST=localhost
DB_NAME=genezis_db
DB_PASSWORD=tu_contraseña_postgres
DB_PORT=5432

# URL de conexión (usada por Railway/Render)
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Seguridad
JWT_SECRET=genera_una_cadena_secreta_muy_larga_y_aleatoria

# Servicios de Terceros
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxx
GOOGLE_API_KEY=AIzaSyxxxxxxxxxx
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Despliegue y CORS
CORS_ALLOWED_ORIGIN_DEV=http://localhost:5173
CORS_ALLOWED_ORIGIN_PROD=https://gamerstore-genezis.vercel.app
```

## Frontend (`.env`)

```env
# URL de la API de backend desplegada
VITE_API_BASE_URL=https://genezis-repo-backend-ecommerce-production.up.railway.app/api
```

-----

## Equipo

Este proyecto fue diseñado, desarrollado y liderado por:

  * **Luciano Cortez** (Líder de Proyecto / Arquitecto Backend)
  * **Fernando Alma** (Líder de Proyecto / Arquitecto Backend)
  * **Nicolas Fernandez** (Programador Frontend)
  * **Javier Quiroga** (Programador Frontend)
  * **Marcos Rodriguez** (Programador Frontend)
  * **Gabriel Garino** (Programador Frontend)
  * **Brisa Salvatierra** (Programadora Frontend)

<div align="center">
<br>

<img src="./logo-genezis-new.png" alt="Logo Genezis" width="250">
<h2>Grupo GENEZIS - COHORTE 2024</h2>

</div>
