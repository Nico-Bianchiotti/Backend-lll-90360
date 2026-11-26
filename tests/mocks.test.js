import { expect } from 'chai';
import { api, expectError, expectSuccess } from './helpers/api.js';
import { clearDatabase } from './helpers/db.js';
import User from '../src/models/user.model.js';
import { USER_ROLES, ORDER_STATUS, ORDER_PRIORITY, MOCKS } from '../src/constants/index.js';

const MOCK_EMAIL = new RegExp(`@${MOCKS.EMAIL_DOMAIN.replace(/\./g, '\\.')}$`);

describe('Mocks - /api/mocks', () => {
  beforeEach(clearDatabase);

  it('GET /api/mocks/users?qty=3 devuelve 3 usuarios simulados con roles válidos y sin guardarlos', async () => {
    const users = expectSuccess(await api.get('/api/mocks/users?qty=3'), 200);

    expect(users).to.have.lengthOf(3);
    users.forEach((user) => {
      expect(user).to.have.all.keys('_id', 'firstName', 'lastName', 'email', 'role');
      expect(user.email).to.match(MOCK_EMAIL);
      expect([USER_ROLES.USER, USER_ROLES.COURIER]).to.include(user.role);
    });
    expect(await User.countDocuments()).to.equal(0);
  });

  it('GET /api/mocks/orders genera pedidos con estado, prioridad y total válidos', async () => {
    const orders = expectSuccess(await api.get('/api/mocks/orders?qty=4'), 200);

    expect(orders).to.have.lengthOf(4);
    orders.forEach((order) => {
      expect(order).to.include.keys('_id', 'user', 'items', 'deliveryAddress', 'status', 'priority', 'total');
      expect(Object.values(ORDER_STATUS)).to.include(order.status);
      expect(Object.values(ORDER_PRIORITY)).to.include(order.priority);
      const expectedTotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      expect(order.total).to.be.closeTo(expectedTotal, 0.01);
    });
  });

  it('POST /api/mocks/seed inserta los usuarios de prueba en MongoDB', async () => {
    const result = expectSuccess(await api.post('/api/mocks/seed').send({ qty: 4 }), 201);

    expect(result).to.deep.equal({ inserted: 4, collection: 'users' });
    expect(await User.countDocuments()).to.equal(4);
  });

  it('GET /api/mocks/users?qty=-5 responde 400 NEGATIVE_MOCK_QUANTITY', async () => {
    const res = await api.get('/api/mocks/users?qty=-5');
    expectError(res, 400, 'NEGATIVE_MOCK_QUANTITY');
    expect(res.body.message).to.include('-5');
  });

  it('GET /api/mocks/users?qty=abc responde 400 INVALID_MOCK_QUANTITY', async () => {
    expectError(await api.get('/api/mocks/users?qty=abc'), 400, 'INVALID_MOCK_QUANTITY');
  });
});
