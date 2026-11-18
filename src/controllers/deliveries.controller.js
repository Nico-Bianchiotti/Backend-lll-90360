import deliveriesService from '../services/deliveries.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class DeliveriesController {
  async getAll(req, res, next) {
    try {
      const deliveries = await deliveriesService.getAll();
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: deliveries });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const delivery = await deliveriesService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: delivery });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const delivery = await deliveriesService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: delivery });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const delivery = await deliveriesService.updateStatus(req.params.id, req.body.status);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: delivery });
    } catch (error) {
      next(error);
    }
  }

  async assignCourier(req, res, next) {
    try {
      const delivery = await deliveriesService.assignCourier(req.params.id, req.body.courier);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: delivery });
    } catch (error) {
      next(error);
    }
  }
}

export default new DeliveriesController();
