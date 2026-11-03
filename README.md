# ShipNow API

API de ShipNow con Node.js, Express y MongoDB, organizada en una arquitectura por capas (Controller → Service → Repository), con un módulo de mocking para generar y cargar datos de prueba y un manejo de errores centralizado.

## Requisitos

- Node.js 18 o superior
- MongoDB (local o Atlas)

## Cómo correr el proyecto

1. Instalar las dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo `.env` a partir del ejemplo y completar los valores:

   ```bash
   cp .env.example .env
   ```

   | Variable | Descripción | Ejemplo |
   | --- | --- | --- |
   | `PORT` | Puerto del servidor | `8080` |
   | `MONGODB_URI` | Cadena de conexión a MongoDB | `mongodb://localhost:27017/shipnow` |
   | `NODE_ENV` | Entorno: `development`, `production` o `test` | `development` |
   | `SHIPPING_API_KEY` | API key del servicio de envíos | `una_clave` |

3. Levantar el servidor:

   ```bash
   npm run dev   # desarrollo, con nodemon
   npm start     # producción
   ```

Si falta alguna variable obligatoria (por ejemplo `MONGODB_URI`), la app no arranca y muestra cuál falta:

```
Error: Configuración inválida: faltan las variables de entorno MONGODB_URI. Revisá tu archivo .env (podés copiar .env.example como base).
```

## Estructura

```
src/
├── config/
│   ├── env.config.js      # Único lugar que lee process.env; valida las variables al arrancar
│   └── db.js              # Conexión a MongoDB
├── constants/
│   └── index.js           # Roles, estados, prioridades, tarifas, parámetros de mocks y status HTTP (Object.freeze)
├── models/                # Schemas de Mongoose: User, Product, Order y Delivery
├── mocks/                 # Generadores de datos falsos con Faker (forma de cada modelo)
├── repositories/          # Único lugar que usa los modelos de Mongoose
├── services/              # Reglas de negocio
├── controllers/           # Entrada HTTP: lee req, llama al service, arma res
├── routes/                # Conectan cada path con su método del controller
├── errors/
│   ├── errorDictionary.js # Diccionario: código → status HTTP y mensaje
│   └── customErrors.js    # AppError y los errores del dominio (UserNotFoundError, etc.)
├── middlewares/
│   └── errorHandler.js    # Middleware global: única salida de las respuestas de error
├── utils/
│   └── emailProvider.js   # Proveedor de email simulado
├── app.js                 # Arma la app de Express
└── server.js              # Valida la config, conecta la base y levanta el servidor
```

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| GET / PUT / DELETE | `/api/users/:id` | Obtener / actualizar / eliminar usuario |
| GET | `/api/products` | Listar productos con stock (`?all=true` incluye los que no tienen) |
| POST | `/api/products` | Crear producto |
| GET / PUT / DELETE | `/api/products/:id` | Obtener / actualizar / eliminar producto |
| GET | `/api/products/:id/shipping-cost` | Cotizar el envío de un producto |
| GET | `/api/orders` | Listar pedidos (con los datos públicos del usuario) |
| POST | `/api/orders` | Crear pedido (`user`, `items`, `deliveryAddress`, `priority` opcional) |
| GET | `/api/orders/:id` | Obtener un pedido |
| PATCH | `/api/orders/:id/status` | Cambiar el estado de un pedido (`{ "status": "assigned" }`) |
| — | `/api/mocks/...` | Datos simulados y carga de datos de prueba (ver abajo) |

Las respuestas exitosas tienen la forma `{ "status": "success", "payload": ... }`. Las de error se explican en [Manejo de errores](#manejo-de-errores).

## Por qué separé la lógica entre Service y Repository

El criterio fue preguntarme, para cada línea, si cambiaría porque cambia **el negocio** o porque cambia **la base de datos**.

**En el Service quedaron las reglas de ShipNow**, que existirían igual aunque los datos estuvieran en otra base:

- El estado de un producto depende del stock (`stock > 0` → `available`, si no → `out_of_stock`).
- El catálogo público muestra solo productos disponibles, salvo que se pida `?all=true`.
- El costo de envío: tarifa plana de $10 en desarrollo, y $50 + 1% del valor declarado en producción.
- No se pueden crear ni ascender administradores desde la API pública.
- No puede haber dos productos con el mismo código ni dos usuarios con el mismo email.
- Avisar por email cuando se crea un producto.

**En el Repository quedó todo lo que depende de Mongoose**, y nada más:

- Las consultas y sus filtros (`findAvailable` filtra en la base con `{ stock: { $gt: 0 }, status: 'available' }` en lugar de traer todo y filtrar en memoria).
- Las proyecciones: el repositorio de usuarios nunca devuelve el campo `password`, y ninguno devuelve `__v`.
- Validar que un ID tenga formato de ObjectId antes de consultar (si no lo tiene, se devuelve `null` y el Service responde 404, en lugar de un 500 por `CastError`).
- Devolver objetos planos (`.lean()`) en lugar de documentos de Mongoose, para que las demás capas no dependan de Mongoose.

Así, el Repository no es un "pasamanos" que solo hace `return Model.find()`, pero tampoco decide reglas: por ejemplo, ofrece `findAll()` y `findAvailable()`, y es el Service el que decide cuál usar.

Además, los Services reciben sus dependencias por el constructor (repositorio, proveedor de email y configuración). Eso permite probarlos más adelante con mocks, sin base de datos.

## Módulo de mocking (`/api/mocks`)

Genera usuarios, repartidores, pedidos y entregas de prueba con [Faker](https://fakerjs.dev/), sin cargar datos a mano. Los datos tienen la misma forma que los modelos reales y usan las constantes de `src/constants/index.js` para roles, estados y prioridades.

> Las rutas de mocks **solo existen fuera de producción**. Con `NODE_ENV=production`, `/api/mocks` responde 404.

### Endpoints

**Datos simulados (no se guardan en la base):**

| Método | Ruta | Parámetros | Qué devuelve |
| --- | --- | --- | --- |
| GET | `/api/mocks/users` | `qty`, `role` (opcional) | Usuarios. Sin `role`, mezcla clientes (`user`) y repartidores (`courier`) |
| GET | `/api/mocks/couriers` | `qty` | Repartidores (rol `courier`) |
| GET | `/api/mocks/orders` | `qty` | Pedidos con items, dirección de entrega, total, estado y prioridad |
| GET | `/api/mocks/deliveries` | `qty` | Entregas, cada una asociada a un pedido |
| GET | `/api/mocks/scenario` | `users`, `couriers`, `orders` | Un escenario completo y relacionado: clientes, repartidores, pedidos y entregas |

**Carga de datos de prueba (se guardan en MongoDB):**

| Método | Ruta | Parámetros | Qué hace |
| --- | --- | --- | --- |
| POST | `/api/mocks/seed` | `qty`, `role` (opcional) | Inserta `qty` usuarios |
| POST | `/api/mocks/seed/scenario` | `users`, `couriers`, `orders` | Inserta un escenario relacionado en `users`, `orders` y `deliveries` |
| DELETE | `/api/mocks/seed` | — | Borra **solo** los datos generados por los mocks |

- `qty`: entero entre 1 y 100 (por defecto 5).
- `role`: `admin`, `user` o `courier`.
- `scenario`: por defecto `users=5`, `couriers=2`, `orders=10`. `couriers` y `orders` pueden ser 0.
- Un valor inválido, negativo o fuera de rango, o un rol inexistente, responde `400` con el formato de error estándar (ver [Manejo de errores](#manejo-de-errores)).

### Ejemplos

`GET /api/mocks/users?qty=2`

```json
{
  "status": "success",
  "payload": [
    { "_id": "9c6c4dad4bdcdb3a71194d0d", "firstName": "María Eugenia", "lastName": "Espino Quintana", "email": "mariaeugenia.espinoquintana.9cnq@shipnow-mock.test", "role": "user" },
    { "_id": "f8c3fea8f27aa6fb046ddee0", "firstName": "Luisa", "lastName": "Ballesteros Tamayo", "email": "luisa.ballesterostamayo.b6gg@shipnow-mock.test", "role": "courier" }
  ]
}
```

`POST /api/mocks/seed?qty=10`

```json
{ "status": "success", "payload": { "inserted": 10, "collection": "users" } }
```

`POST /api/mocks/seed/scenario?users=5&couriers=2&orders=10`

```json
{
  "status": "success",
  "payload": {
    "inserted": { "users": 7, "orders": 10, "deliveries": 10 },
    "detail": { "clients": 5, "couriers": 2 }
  }
}
```

`DELETE /api/mocks/seed`

```json
{ "status": "success", "payload": { "deleted": { "users": 7, "orders": 10, "deliveries": 10 } } }
```

### Cómo probarlo

1. Levantar el servidor con `npm run dev` (`NODE_ENV=development`).
2. Desde Postman o el navegador, pedir datos simulados: `GET http://localhost:8080/api/mocks/scenario?users=2&couriers=1&orders=4`.
3. Cargar datos en la base: `POST http://localhost:8080/api/mocks/seed/scenario`.
4. Revisarlos en MongoDB Atlas (*Browse Collections*): las colecciones `users`, `orders` y `deliveries` tienen los registros nuevos, y `GET /api/users` lista los usuarios cargados.
5. Al terminar, limpiar con `DELETE http://localhost:8080/api/mocks/seed`.

### Evidencia de pruebas (Postman)

**Datos simulados:** `GET /api/mocks/scenario?users=2&couriers=1&orders=4` devuelve clientes, repartidores, pedidos y entregas relacionados, sin guardarlos.

![GET /api/mocks/scenario](docs/screenshots/01-get-scenario.png)

**Carga en MongoDB:** `POST /api/mocks/seed/scenario` inserta 7 usuarios (5 clientes y 2 repartidores), 10 pedidos y 10 entregas, y responde `201 Created`.

![POST /api/mocks/seed/scenario](docs/screenshots/02-post-seed-scenario.png)

**Limpieza:** `DELETE /api/mocks/seed` borra exactamente los registros que había cargado el seed.

![DELETE /api/mocks/seed](docs/screenshots/03-delete-seed.png)

### Relaciones y reglas que respetan los datos

- **Pedido ↔ usuario:** cada pedido pertenece a un usuario con rol `user` (cliente).
- **Entrega ↔ pedido:** cada pedido tiene exactamente una entrega (`order` es único en `deliveries`).
- **Entrega ↔ repartidor:** la entrega lleva repartidor solo si el estado del pedido lo requiere, y ese repartidor siempre tiene rol `courier`:

| Estado del pedido | Estado de la entrega | ¿Repartidor? |
| --- | --- | --- |
| `created` | `pending` | No |
| `assigned` | `assigned` | Sí |
| `picked_up` | `in_transit` | Sí |
| `in_transit` | `in_transit` | Sí |
| `delivered` | `delivered` (con `deliveredAt`) | Sí |
| `cancelled` | `cancelled` | No |

- Si se piden 0 repartidores, los pedidos solo pueden quedar `created` o `cancelled`.
- El `total` del pedido es la suma de `cantidad × precio unitario` de sus items.
- Los usuarios generados nunca son administradores, salvo que se pida `role=admin` explícitamente.
- La contraseña nunca se devuelve en las respuestas.

### Cómo se reparte en las capas

- `mocks/`: generadores que solo arman objetos con la forma de cada modelo (nombres, emails, direcciones, items). No deciden roles, estados ni relaciones.
- `services/mocks.service.js`: las reglas. Valida los parámetros, elige roles y estados, arma las relaciones entre pedidos, entregas y repartidores, y calcula el total de cada pedido.
- `repositories/`: la inserción masiva (`insertMany`) y el borrado de los datos de prueba. Son los únicos que tocan Mongoose.
- `controllers/mocks.controller.js` y `routes/mocks.router.js`: solo HTTP; la ruta conecta el path con el método del controller.

Los datos de prueba se identifican por el dominio de email `shipnow-mock.test` (un dominio reservado que no existe). Así `DELETE /api/mocks/seed` borra únicamente lo que generaron los mocks, sin tocar los datos cargados a mano.

## Manejo de errores

Todos los errores de la API salen de un único lugar, el middleware global `src/middlewares/errorHandler.js`, y siempre con la misma estructura.

### Estructura de la respuesta de error

```json
{
  "status": "error",
  "statusCode": 404,
  "error": "USER_NOT_FOUND",
  "message": "El usuario solicitado no existe"
}
```

| Campo | Qué es |
| --- | --- |
| `status` | Siempre `"error"` |
| `statusCode` | El mismo código HTTP de la respuesta |
| `error` | Código fijo del diccionario, pensado para que lo lea el frontend (`if (data.error === "USER_NOT_FOUND")`) |
| `message` | Explicación para personas. Puede incluir el detalle del caso (qué parámetro falló, qué valores se permiten) |

### Cómo está organizado

1. **Diccionario (`src/errors/errorDictionary.js`):** cada error conocido tiene un código, un status HTTP y un mensaje por defecto. Es la única fuente de esos valores.
2. **Errores personalizados (`src/errors/customErrors.js`):** `AppError` extiende `Error` y toma status y mensaje del diccionario. Cada caso del dominio tiene su clase: `UserNotFoundError`, `OrderNotFoundError`, `InvalidOrderStatusError`, `NegativeMockQuantityError`, `MockSeedFailedError`, etc.
3. **Detección en los services:** los services detectan el problema y **lanzan** el error (`throw new OrderNotFoundError()`). No conocen Express ni arman respuestas.
4. **Controllers:** no responden errores; solo los derivan con `next(error)`.
5. **Middleware global:** convierte cualquier error en la respuesta uniforme. Además traduce errores que no son nuestros:

| Origen | Código |
| --- | --- |
| Body con JSON mal formado | `INVALID_JSON` (400) |
| Validación del schema de Mongoose | `VALIDATION_ERROR` (400) |
| Clave duplicada en MongoDB | `DUPLICATE_KEY` (409) |
| Sin conexión con MongoDB | `DATABASE_UNAVAILABLE` (503) |
| Ruta inexistente | `ROUTE_NOT_FOUND` (404) |
| Cualquier error no previsto (un bug) | `INTERNAL_ERROR` (500), con mensaje genérico |

En los errores 500 el detalle técnico (stack, mensaje original) va **solo al log del servidor**; al cliente nunca le llegan rutas internas ni datos de conexión. Los errores 4xx se registran en el log como advertencia (`[WARN]`).

### Diccionario de errores

| Código | Status | Cuándo ocurre |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Faltan datos obligatorios o tienen formato incorrecto |
| `INVALID_JSON` | 400 | El body no es un JSON válido |
| `INVALID_ID` | 400 | Un ID con formato inválido en un campo de referencia |
| `ROUTE_NOT_FOUND` | 404 | La ruta no existe |
| `DUPLICATE_KEY` | 409 | Un campo único ya existe en la base |
| `DATABASE_UNAVAILABLE` | 503 | La base de datos no responde |
| `INTERNAL_ERROR` | 500 | Error inesperado |
| `USER_NOT_FOUND` | 404 | El usuario no existe (también al crear un pedido para un usuario inexistente) |
| `EMAIL_ALREADY_REGISTERED` | 409 | El email ya está registrado |
| `INVALID_ROLE` | 400 | Rol inexistente |
| `ADMIN_ROLE_NOT_ALLOWED` | 403 | Intento de crear o ascender un administrador |
| `PRODUCT_NOT_FOUND` | 404 | El producto no existe |
| `PRODUCT_CODE_ALREADY_EXISTS` | 409 | Ya hay un producto con ese código |
| `INVALID_PRODUCT_STATUS` | 400 | Estado de producto inexistente |
| `INVALID_PRICE` | 400 | Precio negativo o no numérico |
| `SHIPPING_CONFIG_INVALID` | 500 | Falta la configuración del servicio de envíos |
| `ORDER_NOT_FOUND` | 404 | El pedido no existe |
| `INVALID_ORDER_STATUS` | 400 | Estado de pedido inexistente (por ejemplo `on_the_way`) |
| `INVALID_ORDER_PRIORITY` | 400 | Prioridad inexistente |
| `ORDER_OWNER_NOT_CLIENT` | 400 | Se intenta crear un pedido para un repartidor o un admin |
| `ORDER_STATUS_LOCKED` | 409 | Se intenta cambiar el estado de un pedido entregado o cancelado |
| `INVALID_MOCK_QUANTITY` | 400 | La cantidad de mocks no es un número entero (`abc`, `2.5`) |
| `NEGATIVE_MOCK_QUANTITY` | 400 | La cantidad de mocks es negativa |
| `MOCK_QUANTITY_OUT_OF_RANGE` | 400 | La cantidad de mocks está fuera del rango (1 a 100; 0 a 100 para `couriers` y `orders` del escenario) |
| `MOCK_SEED_FAILED` | 500 | Falló la carga de datos de prueba en MongoDB |

### Fallas durante la carga de mocks en MongoDB

- **Antes de cargar**, el seed verifica que haya conexión con la base. Si no la hay, responde enseguida `503 DATABASE_UNAVAILABLE`, sin intentar guardar nada.
- **Si la carga falla a mitad de camino** (por ejemplo, se guardaron los usuarios pero fallan los pedidos), el service borra lo que se llegó a guardar y responde `500 MOCK_SEED_FAILED` con el mensaje *"No se guardó ningún registro"*. Esto es posible porque los IDs se generan antes de insertar, así que se sabe exactamente qué borrar.
- Si además la base se cayó y no se pudo deshacer, el mensaje lo avisa y sugiere limpiar con `DELETE /api/mocks/seed`.

### Cómo probar los casos inválidos

Con el servidor levantado (`npm run dev`), desde Postman:

**Módulo de mocks**

| Petición | Respuesta esperada |
| --- | --- |
| `GET /api/mocks/users?qty=-5` | 400 `NEGATIVE_MOCK_QUANTITY` |
| `GET /api/mocks/users?qty=abc` | 400 `INVALID_MOCK_QUANTITY` |
| `GET /api/mocks/users?qty=2.5` | 400 `INVALID_MOCK_QUANTITY` |
| `GET /api/mocks/users?qty=0` | 400 `MOCK_QUANTITY_OUT_OF_RANGE` |
| `GET /api/mocks/users?qty=500` | 400 `MOCK_QUANTITY_OUT_OF_RANGE` |
| `GET /api/mocks/users?role=jefe` | 400 `INVALID_ROLE` |
| `GET /api/mocks/scenario?couriers=-1` | 400 `NEGATIVE_MOCK_QUANTITY` |
| `POST /api/mocks/seed?qty=-3` | 400 `NEGATIVE_MOCK_QUANTITY` |
| `POST /api/mocks/seed` con la base caída | 503 `DATABASE_UNAVAILABLE` |

Para probar la falla de base: con el servidor corriendo, pausá el cluster en Atlas (o cortá internet) y esperá unos segundos a que se pierda la conexión antes de llamar al seed.

**Usuarios y productos**

| Petición | Respuesta esperada |
| --- | --- |
| `GET /api/users/652f1c2b9b1e8a0012345678` | 404 `USER_NOT_FOUND` |
| `POST /api/users` con un email ya registrado | 409 `EMAIL_ALREADY_REGISTERED` |
| `POST /api/users` con `"role": "admin"` | 403 `ADMIN_ROLE_NOT_ALLOWED` |
| `POST /api/users` con `"role": "jefe"` | 400 `INVALID_ROLE` |
| `POST /api/users` con `{ "firstName": "Ana" }` | 400 `VALIDATION_ERROR` |
| `POST /api/users` con un body mal formado (`{mal json`) | 400 `INVALID_JSON` |
| `GET /api/products/123` | 404 `PRODUCT_NOT_FOUND` |
| `POST /api/products` con `"price": -1` | 400 `INVALID_PRICE` |
| `POST /api/products` con un `code` repetido | 409 `PRODUCT_CODE_ALREADY_EXISTS` |

**Pedidos** (los tres casos del material del módulo)

| Petición | Respuesta esperada |
| --- | --- |
| `POST /api/orders` con un `user` que no existe | 404 `USER_NOT_FOUND` |
| `POST /api/orders` sin `items` o sin dirección | 400 `VALIDATION_ERROR` |
| `PATCH /api/orders/:id/status` con `{ "status": "on_the_way" }` | 400 `INVALID_ORDER_STATUS` |
| `GET /api/orders/652f1c2b9b1e8a0012345678` | 404 `ORDER_NOT_FOUND` |
| `POST /api/orders` con el ID de un repartidor como `user` | 400 `ORDER_OWNER_NOT_CLIENT` |
| `PATCH /api/orders/:id/status` sobre un pedido `delivered` | 409 `ORDER_STATUS_LOCKED` |
| `GET /api/nada` | 404 `ROUTE_NOT_FOUND` |

Body de ejemplo para crear un pedido válido (reemplazá `user` por el `_id` de un usuario con rol `user`):

```json
{
  "user": "ID_DE_UN_USUARIO",
  "items": [{ "description": "Caja mediana", "quantity": 2, "unitPrice": 1500 }],
  "deliveryAddress": { "street": "Belgrano 120", "city": "Córdoba", "province": "Córdoba", "zipCode": "5000" },
  "priority": "high"
}
```

El pedido se crea siempre en estado `created` y con el `total` calculado por el service, aunque el body traiga otro `status` o `total`.
