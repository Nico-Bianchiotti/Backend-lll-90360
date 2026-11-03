import { HTTP_STATUS } from '../constants/index.js';

// Diccionario de errores de ShipNow.
// Cada error conocido tiene un código fijo (para que lo lean los programas),
// un status HTTP y un mensaje por defecto (para las personas).

export const ERRORS = Object.freeze({
  // Generales
  VALIDATION_ERROR: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Los datos enviados no son válidos' },
  INVALID_JSON: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'El body no es un JSON válido' },
  INVALID_ID: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'El ID indicado no tiene un formato válido' },
  ROUTE_NOT_FOUND: { statusCode: HTTP_STATUS.NOT_FOUND, message: 'La ruta solicitada no existe' },
  DUPLICATE_KEY: { statusCode: HTTP_STATUS.CONFLICT, message: 'Ya existe un registro con esos datos' },
  DATABASE_UNAVAILABLE: { statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'La base de datos no está disponible en este momento. Intentá de nuevo más tarde' },
  INTERNAL_ERROR: { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Ocurrió un error inesperado' },

  // Usuarios
  USER_NOT_FOUND: { statusCode: HTTP_STATUS.NOT_FOUND, message: 'El usuario solicitado no existe' },
  EMAIL_ALREADY_REGISTERED: { statusCode: HTTP_STATUS.CONFLICT, message: 'Este email ya se encuentra registrado' },
  INVALID_ROLE: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'El rol indicado no es válido' },
  ADMIN_ROLE_NOT_ALLOWED: { statusCode: HTTP_STATUS.FORBIDDEN, message: 'No es posible asignar el rol de administrador desde este endpoint' },

  // Productos
  PRODUCT_NOT_FOUND: { statusCode: HTTP_STATUS.NOT_FOUND, message: 'El producto solicitado no existe' },
  PRODUCT_CODE_ALREADY_EXISTS: { statusCode: HTTP_STATUS.CONFLICT, message: 'Ya existe un producto con ese código' },
  INVALID_PRODUCT_STATUS: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'El estado indicado no es válido para un producto' },
  INVALID_PRICE: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'El precio debe ser un número mayor o igual a 0' },
  SHIPPING_CONFIG_INVALID: { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'El servicio de envíos no está configurado correctamente' },

  // Pedidos
  ORDER_NOT_FOUND: { statusCode: HTTP_STATUS.NOT_FOUND, message: 'El pedido solicitado no existe' },
  INVALID_ORDER_STATUS: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'El estado indicado no es válido para un pedido' },
  INVALID_ORDER_PRIORITY: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'La prioridad indicada no es válida para un pedido' },
  ORDER_OWNER_NOT_CLIENT: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Solo los usuarios con rol cliente pueden tener pedidos' },
  ORDER_STATUS_LOCKED: { statusCode: HTTP_STATUS.CONFLICT, message: 'El pedido ya fue entregado o cancelado y no puede cambiar de estado' },

  // Mocks
  INVALID_MOCK_QUANTITY: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'La cantidad de datos a generar debe ser un número entero' },
  NEGATIVE_MOCK_QUANTITY: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'La cantidad de datos a generar no puede ser negativa' },
  MOCK_QUANTITY_OUT_OF_RANGE: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'La cantidad de datos a generar está fuera del rango permitido' },
  MOCK_SEED_FAILED: { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'No se pudieron cargar los datos de prueba en la base' }
});
