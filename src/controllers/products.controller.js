import productsService from '../services/products.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class ProductsController {
  async getAll(req, res, next) {
    try {
      const products = await productsService.getAll({ includeOutOfStock: req.query.all === 'true' });
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: products });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productsService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: product });
    } catch (error) {
      next(error);
    }
  }

  async getShippingCost(req, res, next) {
    try {
      const quote = await productsService.getShippingCost(req.params.id);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: quote });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productsService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: product });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productsService.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: product });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const product = await productsService.delete(req.params.id);
      res.status(HTTP_STATUS.OK).json({ status: 'success', message: 'Producto eliminado', payload: product });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductsController();
