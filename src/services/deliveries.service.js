import { randomBytes } from 'node:crypto';
import deliveriesRepository from '../repositories/deliveries.repository.js';
import ordersRepository from '../repositories/orders.repository.js';
import usersRepository from '../repositories/users.repository.js';
import {
  RequestValidationError,
  OrderNotFoundError,
  UserNotFoundError,
  DeliveryNotFoundError,
  DeliveryAlreadyExistsError,
  InvalidDeliveryStatusError,
  UserNotCourierError,
  DeliveryCourierRequiredError,
  DeliveryStatusLockedError
} from '../errors/customErrors.js';
import { USER_ROLES, DELIVERY_STATUS } from '../constants/index.js';
import { logger } from '../config/logger.js';

// Estados finales: una entrega completada o cancelada ya no cambia.
const FINAL_STATUSES = Object.freeze([DELIVERY_STATUS.DELIVERED, DELIVERY_STATUS.CANCELLED]);

// Estados que solo tienen sentido si hay un repartidor asignado.
const STATUSES_WITH_COURIER = Object.freeze([
  DELIVERY_STATUS.ASSIGNED,
  DELIVERY_STATUS.IN_TRANSIT,
  DELIVERY_STATUS.DELIVERED
]);

const generateTrackingCode = () => `SN-${randomBytes(5).toString('hex').toUpperCase()}`;

export class DeliveriesService {
  constructor({ deliveries, orders, users }) {
    this.deliveriesRepository = deliveries;
    this.ordersRepository = orders;
    this.usersRepository = users;
  }

  // Regla: solo un usuario existente con rol repartidor puede hacer entregas.
  async assertCourier(courierId) {
    const courier = await this.usersRepository.findById(courierId);
    if (!courier) {
      throw new UserNotFoundError('No se encontró el repartidor indicado');
    }
    if (courier.role !== USER_ROLES.COURIER) {
      throw new UserNotCourierError(courier.role);
    }
  }

  assertNotFinal(delivery) {
    if (FINAL_STATUSES.includes(delivery.status)) {
      throw new DeliveryStatusLockedError(delivery.status);
    }
  }

  async getAll() {
    return this.deliveriesRepository.findAll();
  }

  async getById(id) {
    const delivery = await this.deliveriesRepository.findById(id);
    if (!delivery) throw new DeliveryNotFoundError();
    return delivery;
  }

  async create(data) {
    const { order: orderId, courier: courierId, estimatedDate } = data;

    if (!orderId) {
      throw new RequestValidationError('La entrega debe indicar el pedido (order)');
    }
    if (estimatedDate !== undefined && Number.isNaN(new Date(estimatedDate).getTime())) {
      throw new RequestValidationError('estimatedDate debe ser una fecha válida (por ejemplo 2026-12-01)');
    }

    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError();
    }
    // Regla: cada pedido tiene, como máximo, una entrega.
    if (await this.deliveriesRepository.existsByOrder(order._id)) {
      throw new DeliveryAlreadyExistsError();
    }
    if (courierId) {
      await this.assertCourier(courierId);
    }

    // El estado inicial y el código de seguimiento los define el negocio
    const delivery = await this.deliveriesRepository.create({
      order: order._id,
      courier: courierId ?? null,
      status: courierId ? DELIVERY_STATUS.ASSIGNED : DELIVERY_STATUS.PENDING,
      trackingCode: generateTrackingCode(),
      estimatedDate
    });

    if (!courierId) {
      logger.warning(`Entrega ${delivery._id} creada sin repartidor asignado`, { orderId: String(order._id) });
    }
    logger.info(`Entrega creada correctamente: ${delivery._id}`, {
      orderId: String(order._id),
      trackingCode: delivery.trackingCode
    });
    return delivery;
  }

  async updateStatus(id, status) {
    if (!Object.values(DELIVERY_STATUS).includes(status)) {
      throw new InvalidDeliveryStatusError(status);
    }

    const delivery = await this.getById(id);
    this.assertNotFinal(delivery);

    if (STATUSES_WITH_COURIER.includes(status) && !delivery.courier) {
      throw new DeliveryCourierRequiredError(status);
    }

    const changes = { status };
    if (status === DELIVERY_STATUS.DELIVERED) {
      changes.deliveredAt = new Date();
    }

    const updated = await this.deliveriesRepository.update(id, changes);
    logger.info(`Entrega ${id} cambió de estado: ${delivery.status} → ${status}`);
    return updated;
  }

  async assignCourier(id, courierId) {
    if (!courierId) {
      throw new RequestValidationError('Se debe indicar el repartidor (courier)');
    }

    const delivery = await this.getById(id);
    this.assertNotFinal(delivery);
    await this.assertCourier(courierId);

    const changes = { courier: courierId };
    // Una entrega pendiente pasa a "asignada" al recibir repartidor
    if (delivery.status === DELIVERY_STATUS.PENDING) {
      changes.status = DELIVERY_STATUS.ASSIGNED;
    }

    const updated = await this.deliveriesRepository.update(id, changes);
    logger.info(`Entrega ${id}: repartidor asignado`, { courierId: String(courierId) });
    return updated;
  }
}

export default new DeliveriesService({
  deliveries: deliveriesRepository,
  orders: ordersRepository,
  users: usersRepository
});
