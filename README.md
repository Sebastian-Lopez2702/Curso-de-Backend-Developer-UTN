# MercadoNexus API — E-Commerce RESTful API

[![API CI/CD Pipeline](https://github.com/Sebastian-Lopez2702/Curso-de-Backend-Developer-UTN/actions/workflows/ci-cd.yaml/badge.svg)](https://github.com/Sebastian-Lopez2702/Curso-de-Backend-Developer-UTN/actions/workflows/ci-cd.yaml)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)

API RESTful para una plataforma de **E-Commerce de alcance nacional (Marketplace)**, desarrollada como **Trabajo Práctico Final** para el curso de **Backend Developer en UTN.BA** (*"Desarrollo de API RESTful con CRUD y Capa de Servicios"*).

El sistema modela un mercado web multi-vendedor con logística centralizada por provincias y tres roles diferenciados:
- **Administradores (`ADMIN`):** Supervisan la plataforma, administran el catálogo de categorías, configuran las tarifas de envío para las 24 provincias argentinas, auditan usuarios y órdenes globales, y gestionan las transiciones del estado logístico de los pedidos.
- **Vendedores (`SELLER`):** Publican sus propios productos, administran precios, stock y categorías, realizan bajas lógicas de su inventario y consultan su historial detallado de ventas.
- **Clientes (`CLIENT`):** Exploran el catálogo público con filtros y paginación, gestionan su carrito de compras persistente, ejecutan el proceso de *checkout* con verificación en tiempo real de stock y precios, reciben su **Factura B** electrónica simulada y realizan el seguimiento de envío mediante código de rastreo (**UUIDv7**).

---

## Tabla de Contenidos

1. [Tecnologías Utilizadas](#1-tecnologías-utilizadas)
2. [Arquitectura y Decisiones de Diseño](#2-arquitectura-y-decisiones-de-diseño)
3. [Esquema de Base de Datos (MongoDB / Mongoose)](#3-esquema-de-base-de-datos-mongodb--mongoose)
4. [Configuración e Instrucciones de Ejecución](#4-configuración-e-instrucciones-de-ejecución)
5. [Variables de Entorno (`.env.example`)](#5-variables-de-entorno-envexample)
6. [Listado Completo de Endpoints](#6-listado-completo-de-endpoints)
7. [Ejemplos de Peticiones JSON (Mocks)](#7-ejemplos-de-peticiones-json-mocks)
8. [Funcionalidades Implementadas y Trabajo Futuro](#8-funcionalidades-implementadas-y-trabajo-futuro)

---

## 1. Tecnologías Utilizadas

| Categoría | Tecnología / Herramienta | Propósito en el Proyecto |
| :--- | :--- | :--- |
| **Entorno y Lenguaje** | **Node.js** + **TypeScript 5.6** (`strict: true`) | Ejecución en servidor y tipado estático estricto en todas las capas. |
| **Gestor de Paquetes** | **Yarn 4** (Corepack) / compatible con `npm` | Gestión determinista de dependencias (`yarn.lock`). |
| **Framework Web** | **Express.js 4** | Enrutamiento HTTP, manejo de middlewares y payloads JSON. |
| **Base de Datos y ODM** | **MongoDB 7** + **Mongoose 8** | Persistencia documental NoSQL, índices compuestos/parciales y hooks de esquema. |
| **Autenticación y Seguridad** | **JSON Web Tokens (`jsonwebtoken`)**, **bcrypt**, **CORS**, **dotenv** | Autenticación stateless vía JWT, hash de contraseñas en hook `pre('save')`, control de acceso por roles (RBAC) y variables de entorno. |
| **Logging y Auditoría** | **Winston 3** | Logging estructurado en JSON con sanitización automática de datos sensibles (`[REDACTED]`), salida por consola y archivos locales (`logs/error.log`, `logs/combined.log`). |
| **Documentación Interactiva** | **Swagger UI Express** (OpenAPI 3.0) | Documentación técnica consultable en `/api/docs`. |
| **Utilidades** | **UUID (`v7`)** | Generación de códigos de seguimiento logístico (`trackingCode`) ordenables temporalmente. |
| **Testing y Calidad** | **Jest 29**, **ts-jest**, **Supertest**, **ESLint**, **Prettier** | Pruebas unitarias aisladas, pruebas de integración contra MongoDB real y análisis estático de código. |
| **Infraestructura y CI** | **Docker Compose** + **GitHub Actions** | Contenedor local `mongo:7` con *healthcheck* y pipeline de Integración Continua en cada *push* o *Pull Request* a `main`. |

---

## 2. Arquitectura y Decisiones de Diseño

El proyecto aplica estrictamente **Separación de Responsabilidades (SoC)**, principios **SOLID**, el **Patrón Repositorio (Repository Pattern)** e **Inyección Manual de Dependencias (DI)** por constructor.

### Flujo de Capas
```text
Request ──► Route ──► Middleware (JWT / RBAC) ──► Controller ──► Service ──► Repository ──► Mongoose Schema (MongoDB)
```

### Estructura de Directorios
```text
curso_utn_backend/
├── .github/workflows/
│   └── ci-cd.yaml                # Pipeline CI: Instalación, Build, Tests (con Mongo 7) y Linter
├── src/
│   ├── config/
│   │   ├── db.ts                 # Conexión a MongoDB
│   │   ├── env.ts                # Carga de dotenv y validación fail-fast de variables obligatorias
│   │   ├── logger.ts             # Configuración de Winston y sanitización de claves sensibles
│   │   ├── seeder.ts             # Seeder idempotente (Admin inicial, 24 Provincias y Categorías)
│   │   └── swagger.ts            # Especificación OpenAPI 3.0 servida en /api/docs
│   ├── controllers/              # Capa HTTP delgada (try/catch + sendError, serialización de respuestas)
│   ├── dtos/                     # Contratos de datos de entrada (DTOs)
│   ├── errors/
│   │   └── DomainErrors.ts       # Errores de dominio puros (sin códigos HTTP acoplados)
│   ├── interfaces/               # Contratos de repositorios (IUserRepository, etc.) y tipos JWT
│   ├── middleware/
│   │   ├── verifyToken.ts        # Autenticación JWT y autorización por roles (allowRoles)
│   │   ├── errorMappers.ts       # Traducción centralizada de DomainErrors a códigos HTTP
│   │   └── errorHandler.ts       # Helper sendError, manejador 404 y fallback global 500
│   ├── models/                   # Entidades de dominio puras con encapsulamiento y autovalidación
│   │   └── error-messages/       # Catálogos de mensajes de validación por entidad
│   ├── repositories/             # Implementaciones de acceso a datos con Mongoose
│   │   └── schemas/              # Esquemas Mongoose, índices y hook pre('save') con bcrypt
│   ├── routes/                   # Definición de rutas e inyección manual de dependencias
│   ├── services/                 # Lógica de negocio pura, reglas de propiedad y compensación de stock
│   ├── utils/                    # Helpers de respuesta uniforme (apiResponse), JWT, redondeo (round2) y duplicateKey
│   ├── app.ts                    # Configuración de Express (exportado sin listen para Supertest)
│   └── server.ts                 # Punto de entrada: conecta DB, ejecuta Seeder y levanta el servidor HTTP
├── tests/                        # Suites de pruebas (models, services, repositories, routes, middleware, config)
├── docker-compose.yaml           # Contenedor MongoDB 7 para desarrollo y pruebas locales
├── .env.example                  # Plantilla de variables de entorno
├── jest.config.js                # Configuración de Jest con guardia de seguridad (*_test_db)
├── tsconfig.json                 # Configuración base de TypeScript (IDE y ts-jest)
├── tsconfig.build.json           # Configuración de compilación a producción (src/ -> dist/)
└── package.json
```

### Decisiones de diseño tomadas

1. **Protección de Integridad al Eliminar Categorías (`409 Conflict`):**
   Un administrador no puede eliminar una categoría (`DELETE /api/categories/:id`) si existen productos asociados a ella, el sistema rechaza la operación con código `409 Conflict`.
2. **Descuento Atómico de Stock y Compensación en Checkout:**
   En `POST /api/orders/:id/checkout`, cada ítem descuenta su stock de forma atómica en MongoDB mediante `findOneAndUpdate({ _id, isActive: true, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })`. Si algún ítem posterior falla por falta de stock o inactividad, el servicio ejecuta una **compensación automática** restituyendo el stock de los ítems previamente descontados antes de lanzar el error.
3. **Simplificación en Factura B (IVA 21%):**
   Los precios de venta (`salePrice`) se tratan como valores netos sobre los cuales se adiciona el **21% de IVA** (`tax`) más el costo de envío provincial (`shippingCost`) al momento de emitir la `Factura B` en el checkout. Todos los cálculos monetarios utilizan la función `round2` (`src/utils/money.ts`) para evitar errores de punto flotante.

---

## 3. Esquema de Base de Datos (MongoDB / Mongoose)

La base de datos cuenta con **5 colecciones**, todas configuradas con `{ timestamps: true }` (`createdAt`, `updatedAt`).

```mermaid
Diagram
    USER {
        ObjectId _id
        string firstName
        string lastName
        string dni "unique, index"
        string email "unique, lowercase, index"
        string phone "optional"
        string password "bcrypt hash (pre-save)"
        string role "ADMIN | CLIENT | SELLER"
        array savedAddresses "street, number, city, provinceId, zipCode"
    }

    CATEGORY {
        ObjectId _id
        string name "unique, trim"
        string description "optional, trim"
    }

    PROVINCE {
        ObjectId _id
        string name "unique"
        number shippingCost "min: 0"
    }

    PRODUCT {
        ObjectId _id
        string sku "unique, trim"
        string name "trim"
        string description "trim"
        number salePrice "min: 1"
        number stock "min: 0"
        ObjectId categoryId "ref: Category, index"
        ObjectId sellerId "ref: User, index"
        boolean isActive "default: true"
    }

    ORDER {
        ObjectId _id
        ObjectId userId "ref: User"
        string orderStatus "CART | PENDING_DISPATCH | IN_TRANSIT | DELIVERED | CANCELLED"
        array items "productId, sellerId, quantity, recordedSalePrice"
        object invoice "invoiceType, subtotal, tax, shippingCost, total, date"
        object shipping "address, provinceId, provinceName, cost, trackingCode"
    }
```

### Detalle de Colecciones

#### 3.1. `users` (`src/repositories/schemas/userSchema.ts`)
- `firstName` (`String`, requerido): Nombre del usuario.
- `lastName` (`String`, requerido): Apellido del usuario.
- `dni` (`String`, requerido, `unique`, `index`): Documento de identidad (7 u 8 dígitos numéricos).
- `email` (`String`, requerido, `unique`, `lowercase`, `index`): Correo electrónico único.
- `phone` (`String`, opcional): Teléfono de contacto.
- `password` (`String`, requerido): Contraseña hasheada automáticamente mediante el hook `userSchema.pre('save')` con `bcrypt` (solo cuando `this.isModified('password')` es verdadero).
- `role` (`String`, requerido, `enum: ['ADMIN', 'CLIENT', 'SELLER']`, `default: 'CLIENT'`, `index`): Rol de autorización en el sistema.
- `savedAddresses` (`Array` de subdocumentos): Direcciones postales asociadas (`street`, `number`, `city`, `provinceId` ref `Province`, `zipCode`).

#### 3.2. `categories` (`src/repositories/schemas/categorySchema.ts`)
- `name` (`String`, requerido, `unique`, `trim`): Nombre único de la categoría.
- `description` (`String`, opcional, `trim`): Descripción de la categoría.

#### 3.3. `provinces` (`src/repositories/schemas/provinceSchema.ts`)
- `name` (`String`, requerido, `unique`): Nombre de la provincia.
- `shippingCost` (`Number`, requerido, `min: 0`): Costo de envío hacia esa provincia.

#### 3.4. `products` (`src/repositories/schemas/productSchema.ts`)
- `sku` (`String`, requerido, `unique`, `trim`): Código identificador único de inventario.
- `name` (`String`, requerido, `trim`): Nombre comercial del producto.
- `description` (`String`, requerido, `trim`): Descripción detallada.
- `salePrice` (`Number`, requerido, `min: 1`): Precio unitario neto de venta.
- `stock` (`Number`, requerido, `min: 0`): Unidades disponibles en inventario.
- `categoryId` (`ObjectId`, ref `'Category'`, requerido, `index`): Referencia a la categoría del producto.
- `sellerId` (`ObjectId`, ref `'User'`, requerido, `index`): Referencia al usuario `SELLER` propietario.
- `isActive` (`Boolean`, requerido, `default: true`): Indicador de vigencia (baja lógica en `DELETE`).
- **Índice compuesto:** `{ isActive: 1, categoryId: 1, createdAt: -1 }` para optimizar el listado público filtrado y paginado.

#### 3.5. `orders` (`src/repositories/schemas/orderSchema.ts`)
- `userId` (`ObjectId`, ref `'User'`, requerido): Cliente titular del carrito u orden.
- `orderStatus` (`String`, requerido, `enum: ['CART', 'PENDING_DISPATCH', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']`, `default: 'CART'`, `index`): Estado actual del pedido.
- `items` (`Array` de subdocumentos sin `_id`):
  - `productId` (`ObjectId`, ref `'Product'`, requerido).
  - `sellerId` (`ObjectId`, ref `'User'`): Snapshot del vendedor dueño del producto.
  - `quantity` (`Number`, requerido, `min: 1`): Cantidad solicitada.
  - `recordedSalePrice` (`Number`, `min: 0`): Precio unitario sincronizado en el carrito y congelado al confirmar el checkout.
- `invoice` (Subdocumento embebido sin `_id`, generado al ejecutar el checkout):
  - `invoiceType` (`String`, `default: 'B'`, expuesto como `'Factura B'`).
  - `subtotal` (`Number`): Suma de `quantity * recordedSalePrice` redondeada a 2 decimales.
  - `tax` (`Number`): IVA (21% sobre `subtotal`), redondeado a 2 decimales.
  - `shippingCost` (`Number`): Costo de envío congelado en la factura.
  - `total` (`Number`): `subtotal + tax + shippingCost`, redondeado a 2 decimales.
  - `date` (`Date`): Fecha y hora de emisión del comprobante.
- `shipping` (Subdocumento embebido sin `_id`, generado en checkout):
  - `address` (`String`, `trim`): Dirección postal de entrega.
  - `provinceId` (`ObjectId`, ref `'Province'`).
  - `provinceName` (`String`, `trim`): Nombre de la provincia al momento de la compra.
  - `cost` (`Number`, `min: 0`): Snapshot histórico de la tarifa de envío provincial.
  - `trackingCode` (`String`, opcional): Código **UUIDv7** generado automáticamente cuando el administrador despacha el pedido (`IN_TRANSIT`).
- **Índice único parcial:** `{ userId: 1 }` con `partialFilterExpression: { orderStatus: 'CART' }`, garantizando a nivel de motor de base de datos que cada cliente pueda tener como máximo un carrito abierto a la vez.

---

## 4. Configuración e Instrucciones de Ejecución

### Prerrequisitos
- **Node.js** `v20` o superior.
- **Yarn** (habilitado mediante `corepack enable`) o **npm**.
- **Docker** y **Docker Compose** (para levantar la base de datos MongoDB 7 local).

### Paso a Paso para Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone git@github.com:Sebastian-Lopez2702/Curso-de-Backend-Developer-UTN.git
   cd Curso-de-Backend-Developer-UTN
   ```

2. **Habilitar Corepack e instalar dependencias:**
   ```bash
   corepack enable
   yarn install
   ```
   *(Alternativamente con npm: `npm install`)*

3. **Configurar las variables de entorno:**
   Copiar el archivo de ejemplo `.env.example` a `.env` y ajustar los valores si se desea (por defecto apunta a `mongodb://localhost:27017/ecommerce_test_db`):
   ```bash
   cp .env.example .env
   ```

4. **Iniciar la base de datos MongoDB con Docker Compose:**
   ```bash
   docker compose up -d
   ```

5. **Compilar y ejecutar la aplicación:**
   - **Modo Desarrollo:**
     ```bash
     yarn dev
     # o: npm run dev
     ```
   - **Modo Producción:**
     ```bash
     yarn build
     yarn start
     # o: npm run build && npm start
     ```

6. **Verificar que el servidor está activo:**
   - Endpoint de salud: `GET http://localhost:3000/`
   - Documentación interactiva Swagger UI: `http://localhost:3000/api/docs`

### Datos Iniciales Automáticos (Seeder)
Al iniciar el servidor (`src/server.ts`), antes de aceptar peticiones HTTP, se ejecuta automáticamente un **Seeder idempotente** (`src/config/seeder.ts`) que inicializa:
1. **Usuario `ADMIN` Inicial:** Si no existe ningún administrador en la colección `users`, crea uno utilizando las variables `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` e `INITIAL_ADMIN_DNI` definidas en `.env` (pasando por el hook `pre('save')` para hashear su contraseña).
2. **Las 24 provincias Argentinas (`provinces`):** Si la colección está vacía, inserta las 23 provincias argentinas más CABA con sus costos de envío escalonados (desde `$3000` en CABA hasta `$10500` en Tierra del Fuego).
3. **Categorías Iniciales (`categories`):** Si la colección está vacía, inserta las categorías base: `Novelas`, `Utiles`, `Electrodomesticos` y `Papeleria`.

### Ejecución de Pruebas Automatizadas y Linter

> **Nota de Seguridad en Tests:** `jest.config.js` verifica que la URI de MongoDB apunte obligatoriamente a una base de datos cuyo nombre termine en `_test_db` (por defecto `ecommerce_test_db`). Si detecta otro nombre, aborta la ejecución para proteger datos de desarrollo o producción.

```bash
# Ejecutar la suite completa (unitarias + integración en serie)
yarn test
# o: npm test

# Ejecutar únicamente pruebas unitarias (modelos, servicios con mocks y middlewares)
yarn test:unit

# Ejecutar únicamente pruebas de integración con Supertest y MongoDB real
yarn test:integration

# Ejecutar pruebas detectando handles abiertos
yarn test:detect

# Ejecutar análisis estático de código (ESLint)
yarn lint

# Formatear código con Prettier
yarn format
```

---

## 5. Variables de Entorno (`.env.example`)

Por razones de seguridad y buenas prácticas, el archivo `.env` real se encuentra excluido mediante `.gitignore` y no se entrega en el repositorio. A continuación se muestra el contenido de `.env.example` con los valores de referencia necesarios para ejecutar y probar el proyecto:

```dotenv
NODE_ENV=test
PORT=3000
LOG_LEVEL=info

MONGO_URI=mongodb://localhost:27017/ecommerce_test_db

JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=1h

BCRIPT_ROUNDS=4

INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=ChangeMe123!
INITIAL_ADMIN_DNI=12345678
```

| Variable | Obligatoria | Descripción |
| :--- | :---: | :--- |
| `NODE_ENV` | No | Entorno de ejecución (`development`, `test`, `production`). Por defecto `development`. |
| `PORT` | Sí | Puerto HTTP donde escucha Express (ej. `3000`). |
| `LOG_LEVEL` | No | Nivel mínimo de logging para Winston (`error`, `warn`, `info`, `debug`). Por defecto `info`. |
| `MONGO_URI` | Sí | Cadena de conexión a MongoDB. Para correr Jest debe finalizar en `_test_db`. |
| `JWT_SECRET` | Sí | Clave secreta para firmar y verificar tokens JWT. |
| `JWT_EXPIRES_IN` | No | Tiempo de expiración del token JWT (por defecto `1h`). |
| `BCRIPT_ROUNDS` | Sí | Factor de costo (*salt rounds*) para el hash de `bcrypt` (`4` en test para velocidad, `10` o más recomendado en producción). |
| `INITIAL_ADMIN_EMAIL` | Sí | Email del usuario `ADMIN` creado automáticamente por el Seeder. |
| `INITIAL_ADMIN_PASSWORD` | Sí | Contraseña inicial del usuario `ADMIN` (mínimo 6 caracteres). |
| `INITIAL_ADMIN_DNI` | Sí | DNI del usuario `ADMIN` inicial (7 u 8 dígitos numéricos). |

---

## 6. Listado Completo de Endpoints

Todas las respuestas de la API siguen una estructura JSON uniforme:
```json
{
  "success": true,
  "data": {},
  "message": "Mensaje descriptivo opcional",
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```
Las rutas protegidas requieren el encabezado HTTP:
```http
Authorization: Bearer <token_jwt>
```

| Módulo | Método | Endpoint | Autenticación / Rol | Descripción |
| :--- | :---: | :--- | :---: | :--- |
| **Health** | `GET` | `/` | Público | Verifica el estado de salud del servicio. |
| **Docs** | `GET` | `/api/docs` | Público | Interfaz gráfica de documentación OpenAPI 3.0 (Swagger UI). |
| **Usuarios** | `POST` | `/api/users/register` | Público | Registra un nuevo usuario con rol `CLIENT` (por defecto) o `SELLER`. Rechaza `ADMIN` (`403`). |
| **Usuarios** | `POST` | `/api/users/login` | Público | Autentica credenciales y retorna el token JWT junto con los datos del usuario. |
| **Usuarios** | `GET` | `/api/users/me` | JWT (`Cualquier rol`) | Retorna el perfil del usuario autenticado (sin contraseña). |
| **Usuarios** | `GET` | `/api/users` | JWT (`ADMIN`) | Lista todos los usuarios registrados en la plataforma. |
| **Categorías** | `GET` | `/api/categories` | Público | Lista todas las categorías ordenadas alfabéticamente. |
| **Categorías** | `POST` | `/api/categories` | JWT (`ADMIN`) | Crea una nueva categoría de productos. |
| **Categorías** | `DELETE` | `/api/categories/:id` | JWT (`ADMIN`) | Elimina una categoría si no posee productos asociados (`409` si tiene productos). |
| **Provincias** | `GET` | `/api/provinces` | Público | Lista todas las provincias con sus tarifas de envío vigentes. |
| **Provincias** | `PUT` | `/api/provinces/:id` | JWT (`ADMIN`) | Actualiza el costo de envío (`shippingCost`) de una provincia. |
| **Productos** | `GET` | `/api/products` | Público | Lista productos activos con paginación y filtros (`?page=1&limit=10&category=<id>&q=<texto>`). |
| **Productos** | `GET` | `/api/products/:id` | Público | Obtiene el detalle de un producto activo junto con su objeto `category`. |
| **Productos** | `GET` | `/api/products/mine` | JWT (`SELLER`) | Lista todos los productos propios del vendedor autenticado (activos e inactivos). |
| **Productos** | `POST` | `/api/products` | JWT (`SELLER`) | Publica un nuevo producto asignando automáticamente el `sellerId` del token. |
| **Productos** | `PUT` | `/api/products/:id` | JWT (`SELLER`) | Actualiza un producto activo propio del vendedor (`404` si no le pertenece o está inactivo). |
| **Productos** | `DELETE` | `/api/products/:id` | JWT (`SELLER`) | Realiza la baja lógica (`isActive = false`) de un producto propio del vendedor. |
| **Órdenes / Carrito** | `GET` | `/api/orders/cart` | JWT (`CLIENT`) | Obtiene el carrito activo del cliente sincronizando precios vigentes de los productos. |
| **Órdenes / Carrito** | `POST` | `/api/orders/cart` | JWT (`CLIENT`) | Agrega un producto activo al carrito (o incrementa su cantidad si ya existía). |
| **Órdenes / Carrito** | `PUT` | `/api/orders/cart/items/:productId` | JWT (`CLIENT`) | Modifica la cantidad exacta de un producto dentro del carrito. |
| **Órdenes / Carrito** | `DELETE` | `/api/orders/cart/items/:productId` | JWT (`CLIENT`) | Elimina un producto del carrito activo. |
| **Órdenes / Carrito** | `POST` | `/api/orders/:id/checkout` | JWT (`CLIENT`) | Confirma la compra del carrito: valida y descuenta stock atómicamente, congela precios/envío y emite Factura B. |
| **Órdenes / Carrito** | `GET` | `/api/orders/my-orders` | JWT (`CLIENT`) | Lista el historial de órdenes confirmadas del cliente y su estado de envío. |
| **Órdenes / Carrito** | `GET` | `/api/orders/seller-sales` | JWT (`SELLER`) | Lista las ventas de productos pertenecientes al vendedor autenticado (filtrando ítems de otros vendedores). |
| **Órdenes / Carrito** | `GET` | `/api/orders` | JWT (`ADMIN`) | Lista todas las órdenes confirmadas del sistema. |
| **Órdenes / Carrito** | `PATCH` | `/api/orders/:id/shipping` | JWT (`ADMIN`) | Actualiza el estado de una orden (`IN_TRANSIT`, `DELIVERED`, `CANCELLED`). Genera `trackingCode` o restituye stock. |

---

## 7. Ejemplos de Peticiones JSON (Mocks)

### 7.1. Health Check — `GET /`
- **Autenticación:** No requiere.
- **Body / Parámetros:** No requiere.

---

### 7.2. Usuarios (`/api/users`)

#### A) Registro de Usuario — `POST /api/users/register`
- **Autenticación:** No requiere.
- **Request Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "dni": "35123456",
  "email": "juan.perez@example.com",
  "password": "MiPassword123!",
  "phone": "+54 11 4444-5555",
  "role": "CLIENT"
}
```
*(El campo `role` acepta `"CLIENT"` o `"SELLER"`. Si se omite, se asigna `"CLIENT"`).*

#### B) Inicio de Sesión — `POST /api/users/login`
- **Autenticación:** No requiere.
- **Request Body:**
```json
{
  "email": "juan.perez@example.com",
  "password": "MiPassword123!"
}
```

#### C) Perfil Propio — `GET /api/users/me`
- **Headers:** `Authorization: Bearer <token>`
- **Body / Parámetros:** No requiere.

#### D) Listado Global de Usuarios — `GET /api/users` (Rol `ADMIN`)
- **Headers:** `Authorization: Bearer <admin_token>`
- **Body / Parámetros:** No requiere.

---

### 7.3. Categorías (`/api/categories`)

#### A) Listar Categorías — `GET /api/categories`
- **Autenticación:** No requiere.
- **Body / Parámetros:** No requiere.

#### B) Crear Categoría — `POST /api/categories` (Rol `ADMIN`)
- **Headers:** `Authorization: Bearer <admin_token>`
- **Request Body:**
```json
{
  "name": "Tecnología",
  "description": "Dispositivos electrónicos, periféricos y computación"
}
```

#### C) Eliminar Categoría — `DELETE /api/categories/:id` (Rol `ADMIN`)
- **Headers:** `Authorization: Bearer <admin_token>`
- **Path Params:** `id` (ObjectId de la categoría, ej. `66f7d0b3a4e5f67890123460`).

---

### 7.4. Provincias (`/api/provinces`)

#### A) Listar Provincias — `GET /api/provinces`
- **Autenticación:** No requiere.
- **Body / Parámetros:** No requiere.

#### B) Actualizar Costo de Envío — `PUT /api/provinces/:id` (Rol `ADMIN`)
- **Headers:** `Authorization: Bearer <admin_token>`
- **Path Params:** `id` (ObjectId de la provincia, ej. `66f7d0b3a4e5f67890123471`).
- **Request Body:**
```json
{
  "shippingCost": 4200
}
```

---

### 7.5. Productos (`/api/products`)

#### A) Crear Producto — `POST /api/products` (Rol `SELLER`)
- **Headers:** `Authorization: Bearer <seller_token>`
- **Request Body:**
```json
{
  "sku": "AUR-BT-001",
  "name": "Auriculares Bluetooth Noise Cancelling",
  "description": "Auriculares inalámbricos con cancelación activa de ruido y 30 horas de batería",
  "salePrice": 45000,
  "stock": 25,
  "categoryId": "66f7d0b3a4e5f67890123460"
}
```

#### B) Listar Catálogo Público con Paginación y Filtros — `GET /api/products`
- **Autenticación:** No requiere.
- **Query Params (opcionales):**
  - `page`: Número de página (por defecto `1`).
  - `limit`: Cantidad de resultados por página (por defecto `10`, máximo `100`).
  - `category`: ID de la categoría a filtrar (ej. `66f7d0b3a4e5f67890123460`).
  - `q`: Texto de búsqueda por nombre o descripción (ej. `auriculares`).
  - *Ejemplo:* `GET /api/products?page=1&limit=10&category=66f7d0b3a4e5f67890123460&q=auriculares`

#### C) Obtener Detalle de Producto — `GET /api/products/:id`
- **Autenticación:** No requiere.
- **Path Params:** `id` (ObjectId del producto, ej. `66f7d0b3a4e5f67890123499`).

#### D) Listar Productos Propios del Vendedor — `GET /api/products/mine` (Rol `SELLER`)
- **Headers:** `Authorization: Bearer <seller_token>`
- **Body / Parámetros:** No requiere.

#### E) Actualizar Producto — `PUT /api/products/:id` (Rol `SELLER`)
- **Headers:** `Authorization: Bearer <seller_token>`
- **Path Params:** `id` (ObjectId del producto propio, ej. `66f7d0b3a4e5f67890123499`).
- **Request Body (todos los campos son opcionales):**
```json
{
  "sku": "AUR-BT-001",
  "name": "Auriculares Bluetooth Noise Cancelling",
  "description": "Auriculares inalámbricos con cancelación activa de ruido y 30 horas de batería",
  "salePrice": 48000,
  "stock": 30,
  "categoryId": "66f7d0b3a4e5f67890123460"
}
```

#### F) Baja Lógica de Producto — `DELETE /api/products/:id` (Rol `SELLER`)
- **Headers:** `Authorization: Bearer <seller_token>`
- **Path Params:** `id` (ObjectId del producto propio, ej. `66f7d0b3a4e5f67890123499`).

---

### 7.6. Carrito de Compras, Checkout y Órdenes (`/api/orders`)

#### A) Agregar Producto al Carrito — `POST /api/orders/cart` (Rol `CLIENT`)
- **Headers:** `Authorization: Bearer <client_token>`
- **Request Body:**
```json
{
  "productId": "66f7d0b3a4e5f67890123499",
  "quantity": 2
}
```

#### B) Consultar Carrito Activo — `GET /api/orders/cart` (Rol `CLIENT`)
- **Headers:** `Authorization: Bearer <client_token>`
- **Body / Parámetros:** No requiere.

#### C) Actualizar Cantidad de un Ítem — `PUT /api/orders/cart/items/:productId` (Rol `CLIENT`)
- **Headers:** `Authorization: Bearer <client_token>`
- **Path Params:** `productId` (ObjectId del producto en el carrito, ej. `66f7d0b3a4e5f67890123499`).
- **Request Body:**
```json
{
  "quantity": 3
}
```

#### D) Eliminar un Ítem del Carrito — `DELETE /api/orders/cart/items/:productId` (Rol `CLIENT`)
- **Headers:** `Authorization: Bearer <client_token>`
- **Path Params:** `productId` (ObjectId del producto en el carrito, ej. `66f7d0b3a4e5f67890123499`).

#### E) Ejecutar Checkout del Carrito — `POST /api/orders/:id/checkout` (Rol `CLIENT`)
- **Headers:** `Authorization: Bearer <client_token>`
- **Path Params:** `id` (ObjectId de la orden en estado `CART`, ej. `66f7d0b3a4e5f67890123500`).
- **Request Body:**
```json
{
  "provinceId": "66f7d0b3a4e5f67890123471",
  "address": "Av. Corrientes 1234, Piso 4, CABA"
}
```

#### F) Historial de Órdenes del Cliente — `GET /api/orders/my-orders` (Rol `CLIENT`)
- **Headers:** `Authorization: Bearer <client_token>`
- **Body / Parámetros:** No requiere.

#### G) Historial de Ventas del Vendedor — `GET /api/orders/seller-sales` (Rol `SELLER`)
- **Headers:** `Authorization: Bearer <seller_token>`
- **Body / Parámetros:** No requiere.

#### H) Listado Global de Órdenes — `GET /api/orders` (Rol `ADMIN`)
- **Headers:** `Authorization: Bearer <admin_token>`
- **Body / Parámetros:** No requiere.

#### I) Actualizar Estado de Envío — `PATCH /api/orders/:id/shipping` (Rol `ADMIN`)
- **Headers:** `Authorization: Bearer <admin_token>`
- **Path Params:** `id` (ObjectId de la orden confirmada, ej. `66f7d0b3a4e5f67890123500`).
- **Transiciones válidas:**
  - `PENDING_DISPATCH` ──► `IN_TRANSIT` o `CANCELLED`.
  - `IN_TRANSIT` ──► `DELIVERED` o `CANCELLED`.
- **Request Body:**
```json
{
  "orderStatus": "IN_TRANSIT"
}
```

---

## 8. Funcionalidades Implementadas y Trabajo Futuro

### Funcionalidades Implementadas
- [x] **Autenticación y Autorización RBAC:** Registro (`CLIENT` / `SELLER`), login con JWT, hash de contraseñas con `bcrypt` en hook `pre('save')` de Mongoose y middleware `verifyToken` + `allowRoles`.
- [x] **Seeder Idempotente de Arranque:** Creación automática del usuario `ADMIN` inicial, las 24 jurisdicciones argentinas con tarifas de envío y las categorías iniciales.
- [x] **Gestión de Categorías:** Listado alfabético público, alta por `ADMIN` y baja protegida contra eliminación cuando existen productos asociados (`409 Conflict`).
- [x] **Gestión de Provincias y Tarifas Logísticas:** Consulta pública y actualización de costos de envío por `ADMIN`.
- [x] **CRUD Completo de Productos con Baja Lógica:** Alta, modificación y desactivación lógica (`isActive = false`) con validación estricta de propiedad del `SELLER`, listado de productos propios (`/mine`) y catálogo público paginado con filtros por categoría y búsqueda textual (`q`).
- [x] **Carrito de Compras Único por Cliente:** Índice único parcial en MongoDB, sincronización automática de precios vigentes al consultar el carrito y gestión completa de ítems.
- [x] **Checkout en 2 Pasos con Consistencia Atómica:** Descuento atómico de stock por ítem, mecanismo de compensación automática ante fallos parciales, snapshot del costo de envío provincial y generación de **Factura B** con cálculo de IVA (21%) redondeado a 2 decimales.
- [x] **Gestión Logística y Panel de Ventas:** Despacho por `ADMIN` con generación automática de `trackingCode` (**UUIDv7**), restitución automática de stock en cancelaciones y vista de ventas filtrada por vendedor (`/seller-sales`).
- [x] **Observabilidad y Documentación:** Logging estructurado con `winston` (con sanitización de campos sensibles) y documentación interactiva OpenAPI 3.0 en `/api/docs`.
- [x] **Suite Completa de Testing y CI:** Pruebas unitarias y de integración con Jest y Supertest ejecutadas automáticamente en GitHub Actions contra MongoDB 7.

### Trabajo Futuro (Próximas Iteraciones)
- [ ] **Gestión de Direcciones Guardadas del Usuario:** Endpoints dedicados para que el `CLIENT` administre su libreta de direcciones (`savedAddresses`) y seleccione una por ID en el checkout.
- [ ] **Refresh Tokens y Recuperación de Contraseña:** Flujo de rotación de tokens y envío de correos transaccionales para restablecimiento de credenciales.
- [ ] **Carga de Imágenes de Productos:** Integración con almacenamiento de objetos compatible con S3 / Cloudinary para imagenes de catálogo.
