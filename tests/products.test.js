import { expect } from 'chai';
import { api, expectError, expectSuccess } from './helpers/api.js';
import { clearDatabase } from './helpers/db.js';
import { createProduct, NON_EXISTENT_ID, INVALID_ID } from './helpers/fixtures.js';
import { PRODUCT_STATUS, SHIPPING_RATES } from '../src/constants/index.js';

describe('Products - /api/products', () => {
  beforeEach(clearDatabase);

  describe('GET /api/products', () => {
    it('por defecto lista solo los productos con stock', async () => {
      await createProduct({ title: 'Con stock', stock: 5 });
      await createProduct({ title: 'Sin stock', stock: 0, status: PRODUCT_STATUS.OUT_OF_STOCK });

      const products = expectSuccess(await api.get('/api/products'), 200);

      expect(products).to.have.lengthOf(1);
      expect(products[0]).to.include({ title: 'Con stock', status: PRODUCT_STATUS.AVAILABLE });
    });

    it('con all=true incluye también los productos sin stock', async () => {
      await createProduct({ stock: 5 });
      await createProduct({ stock: 0, status: PRODUCT_STATUS.OUT_OF_STOCK });

      const products = expectSuccess(await api.get('/api/products?all=true'), 200);
      expect(products).to.have.lengthOf(2);
    });
  });

  describe('POST /api/products', () => {
    it('crea el producto y calcula el estado según el stock', async () => {
      const product = expectSuccess(await api.post('/api/products').send({ title: 'Caja', code: 'CAJA-01', price: 1500, stock: 0 }), 201);

      expect(product).to.include({ title: 'Caja', code: 'CAJA-01', price: 1500, stock: 0, status: PRODUCT_STATUS.OUT_OF_STOCK });
      expect(product).to.have.property('_id');
    });

    it('responde 400 VALIDATION_ERROR si faltan campos obligatorios', async () => {
      expectError(await api.post('/api/products').send({ title: 'Caja' }), 400, 'VALIDATION_ERROR');
    });

    it('responde 400 INVALID_PRICE si el precio es negativo', async () => {
      expectError(await api.post('/api/products').send({ title: 'Caja', code: 'C-1', price: -1 }), 400, 'INVALID_PRICE');
    });

    it('responde 409 PRODUCT_CODE_ALREADY_EXISTS si el código ya existe', async () => {
      await createProduct({ code: 'CAJA-01' });
      expectError(await api.post('/api/products').send({ title: 'Otra', code: 'CAJA-01', price: 10 }), 409, 'PRODUCT_CODE_ALREADY_EXISTS');
    });
  });

  describe('GET, PUT y DELETE /api/products/:id', () => {
    it('devuelve el producto indicado', async () => {
      const created = await createProduct();
      const product = expectSuccess(await api.get(`/api/products/${created._id}`), 200);
      expect(product).to.include({ _id: created._id, code: created.code });
    });

    it('al dejar el stock en 0 el producto pasa a "out_of_stock"', async () => {
      const created = await createProduct({ stock: 3 });
      const product = expectSuccess(await api.put(`/api/products/${created._id}`).send({ stock: 0 }), 200);
      expect(product).to.include({ stock: 0, status: PRODUCT_STATUS.OUT_OF_STOCK });
    });

    it('responde 400 INVALID_PRODUCT_STATUS si el estado no existe', async () => {
      const created = await createProduct();
      expectError(await api.put(`/api/products/${created._id}`).send({ status: 'agotado' }), 400, 'INVALID_PRODUCT_STATUS');
    });

    it('elimina el producto', async () => {
      const created = await createProduct();
      const res = await api.delete(`/api/products/${created._id}`);
      expectSuccess(res, 200);
      expect(res.body.message).to.equal('Producto eliminado');
      expectError(await api.get(`/api/products/${created._id}`), 404, 'PRODUCT_NOT_FOUND');
    });

    it('responde 404 PRODUCT_NOT_FOUND si el producto no existe', async () => {
      expectError(await api.get(`/api/products/${NON_EXISTENT_ID}`), 404, 'PRODUCT_NOT_FOUND');
    });

    it('responde 400 INVALID_ID si el ID tiene un formato inválido', async () => {
      expectError(await api.get(`/api/products/${INVALID_ID}`), 400, 'INVALID_ID');
    });
  });

  describe('GET /api/products/:id/shipping-cost', () => {
    it('cotiza el envío con la tarifa plana fuera de producción', async () => {
      const created = await createProduct({ price: 1000 });
      const quote = expectSuccess(await api.get(`/api/products/${created._id}/shipping-cost`), 200);
      expect(quote).to.deep.equal({ product: created._id, declaredValue: 1000, shippingCost: SHIPPING_RATES.DEVELOPMENT_FLAT_RATE });
    });

    it('responde 404 PRODUCT_NOT_FOUND si el producto no existe', async () => {
      expectError(await api.get(`/api/products/${NON_EXISTENT_ID}/shipping-cost`), 404, 'PRODUCT_NOT_FOUND');
    });
  });
});
