import request from 'supertest';
import { expect } from 'chai';
import app from '../../src/app.js';

// Cliente HTTP de Supertest sobre la app de Express (sin abrir un puerto)
export const api = request(app);

// Verifica el formato de error definido en el módulo de errores:
// { status: "error", statusCode, error, message }
export const expectError = (res, statusCode, errorCode) => {
  expect(res.status).to.equal(statusCode);
  expect(res.headers['content-type']).to.match(/application\/json/);
  expect(res.body).to.have.all.keys('status', 'statusCode', 'error', 'message');
  expect(res.body.status).to.equal('error');
  expect(res.body.statusCode).to.equal(statusCode);
  expect(res.body.error).to.equal(errorCode);
  expect(res.body.message).to.be.a('string').and.not.be.empty;
};

// Verifica el formato de respuesta exitosa: { status: "success", payload }
export const expectSuccess = (res, statusCode) => {
  expect(res.status).to.equal(statusCode);
  expect(res.headers['content-type']).to.match(/application\/json/);
  expect(res.body).to.have.property('status', 'success');
  expect(res.body).to.have.property('payload');
  return res.body.payload;
};

// Un usuario público nunca expone la contraseña
export const expectPublicUser = (user) => {
  expect(user).to.include.keys('_id', 'firstName', 'lastName', 'email', 'role');
  expect(user).to.not.have.property('password');
};
