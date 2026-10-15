export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user'
});

export const PRODUCT_STATUS = Object.freeze({
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out_of_stock'
});

export const SHIPPING_RATES = Object.freeze({
  DEVELOPMENT_FLAT_RATE: 10,
  PRODUCTION_BASE_COST: 50,
  INSURANCE_RATE: 0.01
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
});
