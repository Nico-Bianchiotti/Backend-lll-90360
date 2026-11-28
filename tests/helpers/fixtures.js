// Datos de prueba controlados: se crean dentro del test, directamente en la base de testing.
// Se apoyan en los generadores del módulo de mocks, así tienen la misma forma que los datos reales.
import User from '../../src/models/user.model.js';
import Product from '../../src/models/product.model.js';
import Order from '../../src/models/order.model.js';
import Delivery from '../../src/models/delivery.model.js';
import { generateUser } from '../../src/mocks/users.mock.js';
import { USER_ROLES, ORDER_STATUS, ORDER_PRIORITY, DELIVERY_STATUS, PRODUCT_STATUS } from '../../src/constants/index.js';

// ID con formato válido que no existe en la base (para probar 404)
export const NON_EXISTENT_ID = '652f1c2b9b1e8a0012345678';
// ID con formato inválido (para probar 400 INVALID_ID)
export const INVALID_ID = 'abc';

const toPlain = (doc) => JSON.parse(JSON.stringify(doc.toObject({ versionKey: false })));

export const createUser = async (overrides = {}) => {
  const user = await User.create({ ...generateUser({ role: USER_ROLES.USER }), ...overrides });
  return toPlain(user);
};

export const createClient = (overrides = {}) => createUser({ role: USER_ROLES.USER, ...overrides });
export const createCourier = (overrides = {}) => createUser({ role: USER_ROLES.COURIER, ...overrides });

export const createProduct = async (overrides = {}) => {
  const product = await Product.create({
    title: 'Caja mediana',
    code: `CAJA-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    price: 1500,
    stock: 10,
    status: PRODUCT_STATUS.AVAILABLE,
    ...overrides
  });
  return toPlain(product);
};

// Body válido para crear un pedido por la API
export const validOrderBody = (userId) => ({
  user: userId,
  items: [
    { description: 'Caja mediana', quantity: 2, unitPrice: 1500 },
    { description: 'Sobre', quantity: 1, unitPrice: 250.5 }
  ],
  deliveryAddress: { street: 'Belgrano 120', city: 'Córdoba', province: 'Córdoba', zipCode: '5000' },
  priority: ORDER_PRIORITY.HIGH
});

export const createOrder = async (userId, overrides = {}) => {
  const body = validOrderBody(userId);
  const order = await Order.create({ ...body, total: 3250.5, status: ORDER_STATUS.CREATED, ...overrides });
  return toPlain(order);
};

export const createDelivery = async (orderId, overrides = {}) => {
  const delivery = await Delivery.create({
    order: orderId,
    courier: null,
    status: DELIVERY_STATUS.PENDING,
    trackingCode: `SN-TEST${Math.round(Math.random() * 1e9)}`,
    ...overrides
  });
  return toPlain(delivery);
};
