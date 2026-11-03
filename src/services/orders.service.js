import ordersRepository from '../repositories/orders.repository.js';
import usersRepository from '../repositories/users.repository.js';
import {
  RequestValidationError,
  UserNotFoundError,
  OrderNotFoundError,
  InvalidOrderStatusError,
  InvalidOrderPriorityError,
  OrderOwnerNotClientError,
  OrderStatusLockedError
} from '../errors/customErrors.js';
import { USER_ROLES, ORDER_STATUS, ORDER_PRIORITY } from '../constants/index.js';

// Estados finales: un pedido entregado o cancelado ya no cambia.
const FINAL_STATUSES = Object.freeze([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED]);

// Regla de negocio compartida (también la usa el módulo de mocks)
export const calculateOrderTotal = (items) => {
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return Math.round(total * 100) / 100;
};

export class OrdersService {
  constructor({ orders, users }) {
    this.ordersRepository = orders;
    this.usersRepository = users;
  }

  validateItems(items) {
    items.forEach((item, index) => {
      const position = `Item ${index + 1}`;
      if (!item || typeof item.description !== 'string' || !item.description.trim()) {
        throw new RequestValidationError(`${position}: la descripción es obligatoria`);
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new RequestValidationError(`${position}: la cantidad debe ser un número entero mayor o igual a 1`);
      }
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        throw new RequestValidationError(`${position}: el precio unitario debe ser un número mayor o igual a 0`);
      }
    });
  }

  async getAll() {
    return this.ordersRepository.findAll();
  }

  async getById(id) {
    const order = await this.ordersRepository.findById(id);
    if (!order) throw new OrderNotFoundError();
    return order;
  }

  async create(data) {
    const { user: userId, items, deliveryAddress, priority } = data;

    if (!userId || !Array.isArray(items) || items.length === 0 || !deliveryAddress?.street || !deliveryAddress?.city) {
      throw new RequestValidationError('El pedido debe incluir user, items y dirección de entrega (street y city)');
    }
    this.validateItems(items);

    if (priority !== undefined && !Object.values(ORDER_PRIORITY).includes(priority)) {
      throw new InvalidOrderPriorityError(priority);
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError('No se encontró el usuario indicado para crear el pedido');
    }
    if (user.role !== USER_ROLES.USER) {
      throw new OrderOwnerNotClientError(user.role);
    }

    // El estado inicial y el total los define el negocio, no el cliente
    return this.ordersRepository.create({
      user: userId,
      items,
      deliveryAddress,
      priority: priority ?? ORDER_PRIORITY.NORMAL,
      status: ORDER_STATUS.CREATED,
      total: calculateOrderTotal(items)
    });
  }

  async updateStatus(id, status) {
    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new InvalidOrderStatusError(status);
    }

    const order = await this.getById(id);
    if (FINAL_STATUSES.includes(order.status)) {
      throw new OrderStatusLockedError(order.status);
    }

    return this.ordersRepository.updateStatus(id, status);
  }
}

export default new OrdersService({ orders: ordersRepository, users: usersRepository });
