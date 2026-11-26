import { expect } from 'chai';
import { api, expectError } from './helpers/api.js';

describe('Rutas inexistentes', () => {
  it('una ruta que no existe responde 404 ROUTE_NOT_FOUND con el formato de error', async () => {
    const res = await api.get('/api/no-existe');
    expectError(res, 404, 'ROUTE_NOT_FOUND');
    expect(res.body.message).to.include('/api/no-existe');
  });
});
