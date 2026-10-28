export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
  COURIER: 'courier'
});

export const PRODUCT_STATUS = Object.freeze({
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out_of_stock'
});

export const ORDER_STATUS = Object.freeze({
  CREATED: 'created',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
});

export const ORDER_PRIORITY = Object.freeze({
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
});

export const DELIVERY_STATUS = Object.freeze({
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
});

export const SHIPPING_RATES = Object.freeze({
  DEVELOPMENT_FLAT_RATE: 10,
  PRODUCTION_BASE_COST: 50,
  INSURANCE_RATE: 0.01
});

// Parámetros del módulo de mocking
export const MOCKS = Object.freeze({
  DEFAULT_QTY: 5,
  MAX_QTY: 100,
  EMAIL_DOMAIN: 'shipnow-mock.test',
  DEFAULT_PASSWORD: 'mock1234',
  SCENARIO_DEFAULTS: Object.freeze({ users: 5, couriers: 2, orders: 10 })
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
});
