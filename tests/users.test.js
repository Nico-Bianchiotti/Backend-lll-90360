import { expect } from 'chai';
import { api, expectError, expectSuccess, expectPublicUser } from './helpers/api.js';
import { clearDatabase } from './helpers/db.js';
import { createClient, createCourier, NON_EXISTENT_ID } from './helpers/fixtures.js';
import { USER_ROLES } from '../src/constants/index.js';

describe('Users - /api/users', () => {
  // Cada test arranca con la base de testing vacía
  beforeEach(clearDatabase);

  it('GET /api/users lista los usuarios con sus datos públicos y sin la contraseña', async () => {
    await createClient();
    await createCourier();

    const users = expectSuccess(await api.get('/api/users'), 200);

    expect(users).to.be.an('array').with.lengthOf(2);
    users.forEach(expectPublicUser);
    expect(users.map((user) => user.role)).to.have.members([USER_ROLES.USER, USER_ROLES.COURIER]);
  });

  it('GET /api/users/:id responde 404 USER_NOT_FOUND si el usuario no existe', async () => {
    expectError(await api.get(`/api/users/${NON_EXISTENT_ID}`), 404, 'USER_NOT_FOUND');
  });
});
