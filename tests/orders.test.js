import { expect } from 'chai';
import { api, expectError, expectSuccess, expectPublicUser } from './helpers/api.js';
import { clearDatabase } from './helpers/db.js';
import { createClient, createOrder, validOrderBody, NON_EXISTENT_ID } from './helpers/fixtures.js';
import { ORDER_STATUS, ORDER_PRIORITY } from '../src/constants/index.js';

describe('Orders - /api/orders', () => {
  let client;

  // Cada test arranca con la base vacía y un cliente válido creado para él
  beforeEach(async () => {
    await clearDatabase();
    client = await createClient();
  });

  describe('Obtener, crear y consultar pedidos', () => {
    it('GET /api/orders lista los pedidos con los datos públicos de su usuario', async () => {
      await createOrder(client._id);
      await createOrder(client._id);

      const orders = expectSuccess(await api.get('/api/orders'), 200);

      expect(orders).to.be.an('array').with.lengthOf(2);
      orders.forEach((order) => {
        expect(order).to.include.keys('_id', 'user', 'items', 'deliveryAddress', 'total', 'status', 'priority');
        expectPublicUser(order.user);
        expect(order.user._id).to.equal(client._id);
      });
    });

    it('POST /api/orders crea un pedido válido en estado "created" y calcula el total', async () => {
      const order = expectSuccess(await api.post('/api/orders').send(validOrderBody(client._id)), 201);

      expect(order).to.include.keys('_id', 'user', 'items', 'deliveryAddress', 'total', 'status', 'priority', 'createdAt');
      expect(order.user).to.equal(client._id);
      expect(order.status).to.equal(ORDER_STATUS.CREATED);
      expect(order.priority).to.equal(ORDER_PRIORITY.HIGH);
      expect(order.total).to.equal(3250.5); // 2 × 1500 + 1 × 250.5
      expect(order.items).to.have.lengthOf(2);
    });

    it('POST /api/orders responde 400 VALIDATION_ERROR si faltan los items o la dirección', async () => {
      const res = await api.post('/api/orders').send({ user: client._id });
      expectError(res, 400, 'VALIDATION_ERROR');
      expect(res.body.message).to.include('items');
    });

    it('GET /api/orders/:id devuelve el pedido con los datos públicos del usuario', async () => {
      const created = await createOrder(client._id);

      const order = expectSuccess(await api.get(`/api/orders/${created._id}`), 200);

      expect(order._id).to.equal(created._id);
      expect(order.total).to.equal(created.total);
      expectPublicUser(order.user);
    });

    it('GET /api/orders/:id responde 404 ORDER_NOT_FOUND si el pedido no existe', async () => {
      expectError(await api.get(`/api/orders/${NON_EXISTENT_ID}`), 404, 'ORDER_NOT_FOUND');
    });
  });

  describe('Actualizar estados', () => {
    it('PATCH /api/orders/:id/status actualiza el estado del pedido', async () => {
      const created = await createOrder(client._id);

      const order = expectSuccess(
        await api.patch(`/api/orders/${created._id}/status`).send({ status: ORDER_STATUS.ASSIGNED }),
        200
      );
      expect(order._id).to.equal(created._id);
      expect(order.status).to.equal(ORDER_STATUS.ASSIGNED);
    });

    it('PATCH /api/orders/:id/status responde 400 INVALID_ORDER_STATUS si el estado no existe', async () => {
      const created = await createOrder(client._id);
      const res = await api.patch(`/api/orders/${created._id}/status`).send({ status: 'on_the_way' });
      expectError(res, 400, 'INVALID_ORDER_STATUS');
      expect(res.body.message).to.include('on_the_way');
    });
  });
});
