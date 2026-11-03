import ordersService from '../services/orders.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class OrdersController {
  async getAll(req, res, next) {
    try {
      const orders = await ordersService.getAll();
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: orders });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await ordersService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: order });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const order = await ordersService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: order });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const order = await ordersService.updateStatus(req.params.id, req.body.status);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: order });
    } catch (error) {
      next(error);
    }
  }
}

export default new OrdersController();
