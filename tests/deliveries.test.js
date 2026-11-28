import { expect } from 'chai';
import { api, expectError, expectSuccess, expectPublicUser } from './helpers/api.js';
import { clearDatabase } from './helpers/db.js';
import { createClient, createCourier, createOrder, createDelivery, NON_EXISTENT_ID, INVALID_ID } from './helpers/fixtures.js';
import { DELIVERY_STATUS, USER_ROLES } from '../src/constants/index.js';

describe('Deliveries - /api/deliveries', () => {
  let client;
  let courier;
  let order;

  beforeEach(async () => {
    await clearDatabase();
    client = await createClient();
    courier = await createCourier();
    order = await createOrder(client._id);
  });

  describe('POST /api/deliveries', () => {
    it('crea una entrega "pending" sin repartidor y genera el código de seguimiento', async () => {
      const delivery = expectSuccess(await api.post('/api/deliveries').send({ order: order._id, estimatedDate: '2026-12-01' }), 201);

      expect(delivery).to.include.keys('_id', 'order', 'courier', 'status', 'trackingCode', 'estimatedDate', 'deliveredAt');
      expect(delivery.order).to.equal(order._id);
      expect(delivery.courier).to.equal(null);
      expect(delivery.status).to.equal(DELIVERY_STATUS.PENDING);
      expect(delivery.trackingCode).to.match(/^SN-[0-9A-F]{10}$/);
      expect(delivery.deliveredAt).to.equal(null);
    });

    it('crea una entrega "assigned" cuando se indica un repartidor', async () => {
      const delivery = expectSuccess(await api.post('/api/deliveries').send({ order: order._id, courier: courier._id }), 201);
      expect(delivery.status).to.equal(DELIVERY_STATUS.ASSIGNED);
      expect(delivery.courier).to.equal(courier._id);
    });

    it('responde 409 DELIVERY_ALREADY_EXISTS si el pedido ya tiene entrega', async () => {
      await createDelivery(order._id);
      expectError(await api.post('/api/deliveries').send({ order: order._id }), 409, 'DELIVERY_ALREADY_EXISTS');
    });

    it('responde 400 VALIDATION_ERROR si falta el pedido', async () => {
      expectError(await api.post('/api/deliveries').send({}), 400, 'VALIDATION_ERROR');
    });

    it('responde 400 VALIDATION_ERROR si la fecha estimada no es válida', async () => {
      expectError(await api.post('/api/deliveries').send({ order: order._id, estimatedDate: 'mañana' }), 400, 'VALIDATION_ERROR');
    });

    it('responde 400 INVALID_ID si el pedido tiene un formato inválido', async () => {
      expectError(await api.post('/api/deliveries').send({ order: INVALID_ID }), 400, 'INVALID_ID');
    });

    it('responde 404 ORDER_NOT_FOUND si el pedido no existe', async () => {
      expectError(await api.post('/api/deliveries').send({ order: NON_EXISTENT_ID }), 404, 'ORDER_NOT_FOUND');
    });

    it('responde 400 USER_NOT_COURIER si el repartidor indicado es un cliente', async () => {
      expectError(await api.post('/api/deliveries').send({ order: order._id, courier: client._id }), 400, 'USER_NOT_COURIER');
    });

    it('responde 404 USER_NOT_FOUND si el repartidor no existe', async () => {
      expectError(await api.post('/api/deliveries').send({ order: order._id, courier: NON_EXISTENT_ID }), 404, 'USER_NOT_FOUND');
    });
  });

  describe('GET /api/deliveries', () => {
    it('lista las entregas con los datos públicos del pedido y del repartidor', async () => {
      await createDelivery(order._id, { courier: courier._id, status: DELIVERY_STATUS.ASSIGNED });

      const deliveries = expectSuccess(await api.get('/api/deliveries'), 200);

      expect(deliveries).to.have.lengthOf(1);
      const [delivery] = deliveries;
      expect(delivery.order).to.include({ _id: order._id, status: order.status });
      expect(delivery.order).to.include.keys('total', 'priority', 'deliveryAddress');
      expectPublicUser(delivery.courier);
      expect(delivery.courier.role).to.equal(USER_ROLES.COURIER);
    });
  });

  describe('GET /api/deliveries/:id', () => {
    it('devuelve la entrega indicada', async () => {
      const created = await createDelivery(order._id);
      const delivery = expectSuccess(await api.get(`/api/deliveries/${created._id}`), 200);
      expect(delivery._id).to.equal(created._id);
      expect(delivery.order._id).to.equal(order._id);
      expect(delivery.trackingCode).to.equal(created.trackingCode);
    });

    it('responde 404 DELIVERY_NOT_FOUND si la entrega no existe', async () => {
      expectError(await api.get(`/api/deliveries/${NON_EXISTENT_ID}`), 404, 'DELIVERY_NOT_FOUND');
    });

    it('responde 400 INVALID_ID si el ID tiene un formato inválido', async () => {
      expectError(await api.get(`/api/deliveries/${INVALID_ID}`), 400, 'INVALID_ID');
    });
  });

  describe('PATCH /api/deliveries/:id/status', () => {
    it('lleva una entrega con repartidor hasta "delivered" y completa deliveredAt', async () => {
      const created = await createDelivery(order._id, { courier: courier._id, status: DELIVERY_STATUS.ASSIGNED });

      const inTransit = expectSuccess(await api.patch(`/api/deliveries/${created._id}/status`).send({ status: DELIVERY_STATUS.IN_TRANSIT }), 200);
      expect(inTransit.status).to.equal(DELIVERY_STATUS.IN_TRANSIT);
      expect(inTransit.deliveredAt).to.equal(null);

      const delivered = expectSuccess(await api.patch(`/api/deliveries/${created._id}/status`).send({ status: DELIVERY_STATUS.DELIVERED }), 200);
      expect(delivered.status).to.equal(DELIVERY_STATUS.DELIVERED);
      expect(new Date(delivered.deliveredAt).getTime()).to.be.a('number').and.not.NaN;
    });

    it('permite cancelar una entrega sin repartidor', async () => {
      const created = await createDelivery(order._id);
      const delivery = expectSuccess(await api.patch(`/api/deliveries/${created._id}/status`).send({ status: DELIVERY_STATUS.CANCELLED }), 200);
      expect(delivery.status).to.equal(DELIVERY_STATUS.CANCELLED);
    });

    it('responde 400 INVALID_DELIVERY_STATUS si el estado no existe', async () => {
      const created = await createDelivery(order._id);
      const res = await api.patch(`/api/deliveries/${created._id}/status`).send({ status: 'on_the_way' });
      expectError(res, 400, 'INVALID_DELIVERY_STATUS');
    });

    it('responde 409 DELIVERY_COURIER_REQUIRED si se intenta pasar a "in_transit" sin repartidor', async () => {
      const created = await createDelivery(order._id);
      const res = await api.patch(`/api/deliveries/${created._id}/status`).send({ status: DELIVERY_STATUS.IN_TRANSIT });
      expectError(res, 409, 'DELIVERY_COURIER_REQUIRED');
    });

    it('responde 409 DELIVERY_STATUS_LOCKED si la entrega ya fue entregada', async () => {
      const created = await createDelivery(order._id, { courier: courier._id, status: DELIVERY_STATUS.DELIVERED, deliveredAt: new Date() });
      const res = await api.patch(`/api/deliveries/${created._id}/status`).send({ status: DELIVERY_STATUS.CANCELLED });
      expectError(res, 409, 'DELIVERY_STATUS_LOCKED');
    });

    it('responde 404 DELIVERY_NOT_FOUND si la entrega no existe', async () => {
      const res = await api.patch(`/api/deliveries/${NON_EXISTENT_ID}/status`).send({ status: DELIVERY_STATUS.CANCELLED });
      expectError(res, 404, 'DELIVERY_NOT_FOUND');
    });

    it('responde 400 INVALID_ID si el ID tiene un formato inválido', async () => {
      const res = await api.patch(`/api/deliveries/${INVALID_ID}/status`).send({ status: DELIVERY_STATUS.CANCELLED });
      expectError(res, 400, 'INVALID_ID');
    });
  });

  describe('PATCH /api/deliveries/:id/courier', () => {
    it('asigna el repartidor y pasa la entrega de "pending" a "assigned"', async () => {
      const created = await createDelivery(order._id);

      const delivery = expectSuccess(await api.patch(`/api/deliveries/${created._id}/courier`).send({ courier: courier._id }), 200);

      expect(delivery.status).to.equal(DELIVERY_STATUS.ASSIGNED);
      expectPublicUser(delivery.courier);
      expect(delivery.courier._id).to.equal(courier._id);
    });

    it('responde 400 VALIDATION_ERROR si no se indica el repartidor', async () => {
      const created = await createDelivery(order._id);
      expectError(await api.patch(`/api/deliveries/${created._id}/courier`).send({}), 400, 'VALIDATION_ERROR');
    });

    it('responde 400 USER_NOT_COURIER si el usuario no es repartidor', async () => {
      const created = await createDelivery(order._id);
      expectError(await api.patch(`/api/deliveries/${created._id}/courier`).send({ courier: client._id }), 400, 'USER_NOT_COURIER');
    });

    it('responde 404 USER_NOT_FOUND si el repartidor no existe', async () => {
      const created = await createDelivery(order._id);
      expectError(await api.patch(`/api/deliveries/${created._id}/courier`).send({ courier: NON_EXISTENT_ID }), 404, 'USER_NOT_FOUND');
    });

    it('responde 409 DELIVERY_STATUS_LOCKED si la entrega fue cancelada', async () => {
      const created = await createDelivery(order._id, { status: DELIVERY_STATUS.CANCELLED });
      expectError(await api.patch(`/api/deliveries/${created._id}/courier`).send({ courier: courier._id }), 409, 'DELIVERY_STATUS_LOCKED');
    });

    it('responde 404 DELIVERY_NOT_FOUND si la entrega no existe', async () => {
      expectError(await api.patch(`/api/deliveries/${NON_EXISTENT_ID}/courier`).send({ courier: courier._id }), 404, 'DELIVERY_NOT_FOUND');
    });
  });
});
