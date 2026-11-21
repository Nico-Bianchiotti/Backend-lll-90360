import { ERRORS } from './errorDictionary.js';
import { USER_ROLES, PRODUCT_STATUS, ORDER_STATUS, ORDER_PRIORITY, DELIVERY_STATUS, MOCKS } from '../constants/index.js';

// Error base de la aplicación: toma el status y el mensaje del diccionario.
// Se puede pasar un mensaje más específico sin cambiar el código.
export class AppError extends Error {
  constructor(code, message, options = {}) {
    const definition = ERRORS[code] ?? ERRORS.INTERNAL_ERROR;
    super(message ?? definition.message, options);
    this.name = this.constructor.name;
    this.code = ERRORS[code] ? code : 'INTERNAL_ERROR';
    this.statusCode = definition.statusCode;
  }
}

const list = (values) => Object.values(values).join(', ');

// ---------- Generales ----------

export class RequestValidationError extends AppError {
  constructor(message) {
    super('VALIDATION_ERROR', message);
  }
}

export class InvalidIdError extends AppError {
  constructor(field, value) {
    super('INVALID_ID', `El valor "${value}" no es un ID válido para el campo "${field}" (se esperan 24 caracteres hexadecimales)`);
  }
}

export class DatabaseUnavailableError extends AppError {
  constructor() {
    super('DATABASE_UNAVAILABLE');
  }
}

export class RouteNotFoundError extends AppError {
  constructor(method, url) {
    super('ROUTE_NOT_FOUND', `La ruta ${method} ${url} no existe`);
  }
}

// ---------- Usuarios ----------

export class UserNotFoundError extends AppError {
  constructor(message) {
    super('USER_NOT_FOUND', message);
  }
}

export class EmailAlreadyRegisteredError extends AppError {
  constructor() {
    super('EMAIL_ALREADY_REGISTERED');
  }
}

export class InvalidRoleError extends AppError {
  constructor(role) {
    super('INVALID_ROLE', `El rol "${role}" no es válido. Valores permitidos: ${list(USER_ROLES)}`);
  }
}

export class AdminRoleNotAllowedError extends AppError {
  constructor() {
    super('ADMIN_ROLE_NOT_ALLOWED');
  }
}

// ---------- Productos ----------

export class ProductNotFoundError extends AppError {
  constructor() {
    super('PRODUCT_NOT_FOUND');
  }
}

export class ProductCodeAlreadyExistsError extends AppError {
  constructor(code) {
    super('PRODUCT_CODE_ALREADY_EXISTS', `Ya existe un producto con el código ${code}`);
  }
}

export class InvalidProductStatusError extends AppError {
  constructor(status) {
    super('INVALID_PRODUCT_STATUS', `El estado "${status}" no es válido para un producto. Valores permitidos: ${list(PRODUCT_STATUS)}`);
  }
}

export class InvalidPriceError extends AppError {
  constructor() {
    super('INVALID_PRICE');
  }
}

export class ShippingConfigError extends AppError {
  constructor() {
    super('SHIPPING_CONFIG_INVALID');
  }
}

// ---------- Pedidos ----------

export class OrderNotFoundError extends AppError {
  constructor() {
    super('ORDER_NOT_FOUND');
  }
}

export class InvalidOrderStatusError extends AppError {
  constructor(status) {
    super('INVALID_ORDER_STATUS', `El estado "${status}" no es válido para un pedido. Valores permitidos: ${list(ORDER_STATUS)}`);
  }
}

export class InvalidOrderPriorityError extends AppError {
  constructor(priority) {
    super('INVALID_ORDER_PRIORITY', `La prioridad "${priority}" no es válida. Valores permitidos: ${list(ORDER_PRIORITY)}`);
  }
}

export class OrderOwnerNotClientError extends AppError {
  constructor(role) {
    super('ORDER_OWNER_NOT_CLIENT', `Solo los usuarios con rol "${USER_ROLES.USER}" pueden tener pedidos (el usuario indicado tiene rol "${role}")`);
  }
}

export class OrderStatusLockedError extends AppError {
  constructor(status) {
    super('ORDER_STATUS_LOCKED', `El pedido está en estado "${status}" y ya no puede cambiar de estado`);
  }
}

// ---------- Entregas ----------

export class DeliveryNotFoundError extends AppError {
  constructor() {
    super('DELIVERY_NOT_FOUND');
  }
}

export class DeliveryAlreadyExistsError extends AppError {
  constructor() {
    super('DELIVERY_ALREADY_EXISTS');
  }
}

export class InvalidDeliveryStatusError extends AppError {
  constructor(status) {
    super('INVALID_DELIVERY_STATUS', `El estado "${status}" no es válido para una entrega. Valores permitidos: ${list(DELIVERY_STATUS)}`);
  }
}

export class UserNotCourierError extends AppError {
  constructor(role) {
    super('USER_NOT_COURIER', `El usuario indicado tiene rol "${role}"; solo un usuario con rol "${USER_ROLES.COURIER}" puede hacer entregas`);
  }
}

export class DeliveryCourierRequiredError extends AppError {
  constructor(status) {
    super('DELIVERY_COURIER_REQUIRED', `La entrega necesita un repartidor asignado para pasar al estado "${status}"`);
  }
}

export class DeliveryStatusLockedError extends AppError {
  constructor(status) {
    super('DELIVERY_STATUS_LOCKED', `La entrega está en estado "${status}" y ya no puede modificarse`);
  }
}

// ---------- Mocks ----------

export class InvalidMockQuantityError extends AppError {
  constructor(param, value) {
    super('INVALID_MOCK_QUANTITY', `El parámetro "${param}" debe ser un número entero (valor recibido: "${value}")`);
  }
}

export class NegativeMockQuantityError extends AppError {
  constructor(param, value) {
    super('NEGATIVE_MOCK_QUANTITY', `El parámetro "${param}" no puede ser negativo (valor recibido: ${value})`);
  }
}

export class MockQuantityOutOfRangeError extends AppError {
  constructor(param, min, value) {
    super('MOCK_QUANTITY_OUT_OF_RANGE', `El parámetro "${param}" debe estar entre ${min} y ${MOCKS.MAX_QTY} (valor recibido: ${value})`);
  }
}

export class MockSeedFailedError extends AppError {
  constructor({ rolledBack, cause }) {
    const detail = rolledBack
      ? 'No se guardó ningún registro.'
      : 'Puede haber quedado información parcial: usá DELETE /api/mocks/seed para limpiarla.';
    super('MOCK_SEED_FAILED', `No se pudieron cargar los datos de prueba en la base. ${detail}`, { cause });
  }
}
