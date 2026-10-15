import usersService from '../services/users.service.js';
import { HTTP_STATUS } from '../constants/index.js';

class UsersController {
  async getAll(req, res, next) {
    try {
      const users = await usersService.getAll();
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: users });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await usersService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: user });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const user = await usersService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({ status: 'success', payload: user });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await usersService.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({ status: 'success', payload: user });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const user = await usersService.delete(req.params.id);
      res.status(HTTP_STATUS.OK).json({ status: 'success', message: 'Usuario eliminado', payload: user });
    } catch (error) {
      next(error);
    }
  }
}

export default new UsersController();
