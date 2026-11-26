import { expect } from 'chai';
import { api } from './helpers/api.js';

describe('Swagger - /api/docs', () => {
  it('GET /api/docs/ devuelve la página de Swagger UI', async () => {
    const res = await api.get('/api/docs/');

    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.match(/text\/html/);
    expect(res.text).to.include('swagger-ui');
    expect(res.text).to.include('ShipNow API - Documentación');
  });

  it('GET /api/docs.json devuelve la especificación OpenAPI con su información, tags y schemas', async () => {
    const res = await api.get('/api/docs.json');

    expect(res.status).to.equal(200);
    expect(res.body.openapi).to.equal('3.0.3');
    expect(res.body.info).to.include({ title: 'ShipNow API', version: '1.0.0' });
    expect(res.body.tags.map((tag) => tag.name)).to.include.members(['Users', 'Orders', 'Deliveries', 'Mocks', 'Logger']);
    expect(res.body.components.schemas).to.include.keys('User', 'Order', 'OrderItem', 'Delivery', 'ErrorResponse', 'SuccessResponse');
  });
});
