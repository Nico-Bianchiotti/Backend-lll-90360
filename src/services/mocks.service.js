import usersRepository from '../repositories/users.repository.js';
import ordersRepository from '../repositories/orders.repository.js';
import deliveriesRepository from '../repositories/deliveries.repository.js';
import { generateUser } from '../mocks/users.mock.js';
import { generateOrder } from '../mocks/orders.mock.js';
import { generateDelivery } from '../mocks/deliveries.mock.js';
import { faker } from '../mocks/faker.js';
import { calculateOrderTotal } from './orders.service.js';
import { logger } from '../config/logger.js';
import {
  InvalidMockQuantityError,
  NegativeMockQuantityError,
  MockQuantityOutOfRangeError,
  InvalidRoleError,
  MockSeedFailedError,
  DatabaseUnavailableError
} from '../errors/customErrors.js';
import {
  USER_ROLES,
  ORDER_STATUS,
  DELIVERY_STATUS,
  MOCKS
} from '../constants/index.js';

// Qué estado tiene la entrega según el estado del pedido,
// y si ese estado necesita un repartidor asignado.
const DELIVERY_RULES = Object.freeze({
  [ORDER_STATUS.CREATED]: { status: DELIVERY_STATUS.PENDING, needsCourier: false },
  [ORDER_STATUS.ASSIGNED]: { status: DELIVERY_STATUS.ASSIGNED, needsCourier: true },
  [ORDER_STATUS.PICKED_UP]: { status: DELIVERY_STATUS.IN_TRANSIT, needsCourier: true },
  [ORDER_STATUS.IN_TRANSIT]: { status: DELIVERY_STATUS.IN_TRANSIT, needsCourier: true },
  [ORDER_STATUS.DELIVERED]: { status: DELIVERY_STATUS.DELIVERED, needsCourier: true },
  [ORDER_STATUS.CANCELLED]: { status: DELIVERY_STATUS.CANCELLED, needsCourier: false }
});

// Roles que se generan cuando no se pide uno en particular
// (los administradores no se crean al azar).
const DEFAULT_MOCK_ROLES = Object.freeze([USER_ROLES.USER, USER_ROLES.COURIER]);

export class MocksService {
  constructor({ users, orders, deliveries }) {
    this.usersRepository = users;
    this.ordersRepository = orders;
    this.deliveriesRepository = deliveries;
  }

  // ---------- Validaciones ----------

  parseQty(value, name = 'qty', defaultValue = MOCKS.DEFAULT_QTY, min = 1) {
    if (value === undefined || value === '') return defaultValue;

    const qty = Number(value);
    if (Number.isFinite(qty) && qty < 0) {
      throw new NegativeMockQuantityError(name, value);
    }
    if (!Number.isInteger(qty)) {
      throw new InvalidMockQuantityError(name, value);
    }
    if (qty < min || qty > MOCKS.MAX_QTY) {
      throw new MockQuantityOutOfRangeError(name, min, qty);
    }
    return qty;
  }

  parseRole(role) {
    if (role === undefined || role === '') return null;

    const normalized = String(role).trim().toLowerCase();
    if (!Object.values(USER_ROLES).includes(normalized)) {
      throw new InvalidRoleError(role);
    }
    return normalized;
  }

  parseScenario(query) {
    const { SCENARIO_DEFAULTS } = MOCKS;
    const scenario = {
      users: this.parseQty(query.users, 'users', SCENARIO_DEFAULTS.users),
      couriers: this.parseQty(query.couriers, 'couriers', SCENARIO_DEFAULTS.couriers, 0),
      orders: this.parseQty(query.orders, 'orders', SCENARIO_DEFAULTS.orders, 0)
    };
    return scenario;
  }

  // ---------- Reglas de negocio ----------

  // Sin repartidores disponibles, un pedido solo puede estar creado o cancelado.
  pickOrderStatus(hasCouriers) {
    const allowed = Object.values(ORDER_STATUS)
      .filter((status) => hasCouriers || !DELIVERY_RULES[status].needsCourier);
    return faker.helpers.arrayElement(allowed);
  }

  toPublicUser({ password, ...user }) {
    return user;
  }

  // ---------- Construcción de datos (en memoria) ----------

  buildUsers(qty, role = null) {
    return Array.from({ length: qty }, () => generateUser({
      role: role ?? faker.helpers.arrayElement(DEFAULT_MOCK_ROLES)
    }));
  }

  // Arma un escenario completo y relacionado:
  // cada pedido pertenece a un cliente y tiene exactamente una entrega;
  // la entrega lleva repartidor solo si el estado del pedido lo requiere.
  buildScenario({ users, couriers, orders }) {
    const clients = this.buildUsers(users, USER_ROLES.USER);
    const courierUsers = this.buildUsers(couriers, USER_ROLES.COURIER);
    const hasCouriers = courierUsers.length > 0;

    const builtOrders = [];
    const builtDeliveries = [];

    for (let i = 0; i < orders; i++) {
      const client = faker.helpers.arrayElement(clients);
      const order = generateOrder({ userId: client._id, status: this.pickOrderStatus(hasCouriers) });
      order.total = calculateOrderTotal(order.items);

      const rule = DELIVERY_RULES[order.status];
      const courier = rule.needsCourier ? faker.helpers.arrayElement(courierUsers) : null;

      builtOrders.push(order);
      builtDeliveries.push(generateDelivery({
        orderId: order._id,
        courierId: courier?._id ?? null,
        status: rule.status,
        isDelivered: rule.status === DELIVERY_STATUS.DELIVERED
      }));
    }

    return { clients, couriers: courierUsers, orders: builtOrders, deliveries: builtDeliveries };
  }

  // ---------- Datos simulados (no se guardan) ----------

  getUsers(query) {
    const qty = this.parseQty(query.qty);
    const role = this.parseRole(query.role);
    logger.info(`Mocks generados (sin guardar): ${qty} usuarios`, { role: role ?? 'mixto' });
    return this.buildUsers(qty, role).map(this.toPublicUser);
  }

  getCouriers(query) {
    const qty = this.parseQty(query.qty);
    logger.info(`Mocks generados (sin guardar): ${qty} repartidores`);
    return this.buildUsers(qty, USER_ROLES.COURIER).map(this.toPublicUser);
  }

  getOrders(query) {
    const qty = this.parseQty(query.qty);
    const scenario = this.buildScenario({
      users: Math.ceil(qty / 2),
      couriers: Math.ceil(qty / 4),
      orders: qty
    });
    logger.info(`Mocks generados (sin guardar): ${qty} pedidos`);
    return scenario.orders;
  }

  getDeliveries(query) {
    const qty = this.parseQty(query.qty);
    const scenario = this.buildScenario({
      users: Math.ceil(qty / 2),
      couriers: Math.ceil(qty / 4),
      orders: qty
    });
    logger.info(`Mocks generados (sin guardar): ${qty} entregas`);
    return scenario.deliveries;
  }

  getScenario(query) {
    const params = this.parseScenario(query);
    this.warnIfNoCouriers(params);
    const scenario = this.buildScenario(params);
    logger.info('Mocks generados (sin guardar): escenario completo', params);
    return {
      users: scenario.clients.map(this.toPublicUser),
      couriers: scenario.couriers.map(this.toPublicUser),
      orders: scenario.orders,
      deliveries: scenario.deliveries
    };
  }

  // Un escenario sin repartidores es válido, pero conviene dejar constancia
  warnIfNoCouriers({ couriers, orders }) {
    if (couriers === 0 && orders > 0) {
      logger.warning(`Escenario sin repartidores: los ${orders} pedidos quedarán solo en estado created o cancelled`);
    }
  }

  // ---------- Carga de datos de prueba (se guardan en MongoDB) ----------

  // Si la carga falla a mitad de camino, borra lo que se haya llegado a guardar.
  // Como los IDs se generan antes de insertar, se sabe exactamente qué borrar.
  async rollback({ userIds = [], orderIds = [] }) {
    if (!this.usersRepository.isAvailable()) {
      logger.error('No se pudo deshacer la carga parcial de mocks: no hay conexión con la base');
      return false;
    }
    try {
      await this.deliveriesRepository.deleteByOrders(orderIds);
      await this.ordersRepository.deleteByIds(orderIds);
      await this.usersRepository.deleteByIds(userIds);
      logger.info('Carga de mocks deshecha: se borró lo que se había llegado a guardar');
      return true;
    } catch (error) {
      logger.error(`No se pudo deshacer la carga parcial de mocks: ${error.message}`, { stack: error.stack });
      return false;
    }
  }

  // Antes de cargar, se verifica que la base esté conectada para fallar rápido
  assertDatabaseAvailable() {
    if (!this.usersRepository.isAvailable()) {
      throw new DatabaseUnavailableError();
    }
  }

  async seedUsers(query) {
    const qty = this.parseQty(query.qty);
    const role = this.parseRole(query.role);
    this.assertDatabaseAvailable();
    const users = this.buildUsers(qty, role);

    try {
      const inserted = await this.usersRepository.insertMany(users);
      logger.info(`Seed de mocks: ${inserted.length} usuarios insertados en MongoDB`, { role: role ?? 'mixto' });
      return { inserted: inserted.length, collection: this.usersRepository.collectionName };
    } catch (cause) {
      const rolledBack = await this.rollback({ userIds: users.map((user) => user._id) });
      throw new MockSeedFailedError({ rolledBack, cause });
    }
  }

  async seedScenario(query) {
    const params = this.parseScenario(query);
    this.warnIfNoCouriers(params);
    const scenario = this.buildScenario(params);
    this.assertDatabaseAvailable();
    const allUsers = [...scenario.clients, ...scenario.couriers];

    let users;
    let orders;
    let deliveries;
    try {
      users = await this.usersRepository.insertMany(allUsers);
      orders = await this.ordersRepository.insertMany(scenario.orders);
      deliveries = await this.deliveriesRepository.insertMany(scenario.deliveries);
    } catch (cause) {
      const rolledBack = await this.rollback({
        userIds: allUsers.map((user) => user._id),
        orderIds: scenario.orders.map((order) => order._id)
      });
      throw new MockSeedFailedError({ rolledBack, cause });
    }

    logger.info('Seed de mocks: escenario insertado en MongoDB', {
      users: users.length,
      orders: orders.length,
      deliveries: deliveries.length
    });

    return {
      inserted: {
        [this.usersRepository.collectionName]: users.length,
        [this.ordersRepository.collectionName]: orders.length,
        [this.deliveriesRepository.collectionName]: deliveries.length
      },
      detail: {
        clients: scenario.clients.length,
        couriers: scenario.couriers.length
      }
    };
  }

  // Borra solo los datos generados por los mocks (identificados por el dominio de email)
  async clearSeed() {
    const userIds = await this.usersRepository.findIdsByEmailDomain(MOCKS.EMAIL_DOMAIN);
    const orderIds = await this.ordersRepository.findIdsByUsers(userIds);

    const deliveries = await this.deliveriesRepository.deleteByOrders(orderIds);
    const orders = await this.ordersRepository.deleteByIds(orderIds);
    const users = await this.usersRepository.deleteByIds(userIds);

    logger.info('Datos de mocks eliminados de MongoDB', { users, orders, deliveries });

    return {
      deleted: {
        [this.usersRepository.collectionName]: users,
        [this.ordersRepository.collectionName]: orders,
        [this.deliveriesRepository.collectionName]: deliveries
      }
    };
  }
}

export default new MocksService({
  users: usersRepository,
  orders: ordersRepository,
  deliveries: deliveriesRepository
});
