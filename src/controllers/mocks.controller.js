import mocksService from '../services/mocks.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class MocksController {
  // Datos simulados: se devuelven sin guardarse
  async getUsers(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: mocksService.getUsers(req.query) });
    } catch (error) {
      next(error);
    }
  }

  async getCouriers(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: mocksService.getCouriers(req.query) });
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: mocksService.getOrders(req.query) });
    } catch (error) {
      next(error);
    }
  }

  async getDeliveries(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: mocksService.getDeliveries(req.query) });
    } catch (error) {
      next(error);
    }
  }

  async getScenario(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: mocksService.getScenario(req.query) });
    } catch (error) {
      next(error);
    }
  }

  // Carga de datos de prueba en MongoDB.
  // Los parámetros pueden venir en el body (JSON) o por query; si están en ambos, gana el body.
  async seedUsers(req, res, next) {
    try {
      const result = await mocksService.seedUsers({ ...req.query, ...req.body });
      res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: result });
    } catch (error) {
      next(error);
    }
  }

  async seedScenario(req, res, next) {
    try {
      const result = await mocksService.seedScenario({ ...req.query, ...req.body });
      res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: result });
    } catch (error) {
      next(error);
    }
  }

  async clearSeed(req, res, next) {
    try {
      const result = await mocksService.clearSeed();
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new MocksController();
