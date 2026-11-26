import { expect } from 'chai';
import { api, expectSuccess } from './helpers/api.js';

describe('Logger - /api/loggerTest', () => {
  it('GET /api/loggerTest responde 200 con los niveles y la configuración activa del logger', async () => {
    const payload = expectSuccess(await api.get('/api/loggerTest'), 200);

    expect(payload).to.have.all.keys('message', 'levels', 'consoleLevel', 'files');
    expect(payload.levels).to.deep.equal(['fatal', 'error', 'warning', 'info', 'http', 'debug']);
    expect(payload.consoleLevel).to.equal('warning'); // nivel del entorno de testing
    expect(payload.files).to.have.all.keys('errors', 'combined');
  });
});
