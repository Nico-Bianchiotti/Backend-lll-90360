import usersRepository from '../repositories/users.repository.js';
import {
  UserNotFoundError,
  EmailAlreadyRegisteredError,
  InvalidRoleError,
  AdminRoleNotAllowedError
} from '../errors/customErrors.js';
import { USER_ROLES } from '../constants/index.js';
import { logger } from '../config/logger.js';

// Reglas de negocio de los usuarios. Recibe el repositorio por constructor.

export class UsersService {
  constructor(repository) {
    this.repository = repository;
  }

  // Regla: el rol tiene que existir, y desde la API pública
  // no se pueden crear ni ascender administradores.
  assertValidRole(role) {
    if (role === undefined) return;
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new InvalidRoleError(role);
    }
    if (role === USER_ROLES.ADMIN) {
      throw new AdminRoleNotAllowedError();
    }
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new UserNotFoundError();
    }
    return user;
  }

  async create(data) {
    this.assertValidRole(data.role);

    if (data.email && await this.repository.existsByEmail(data.email)) {
      throw new EmailAlreadyRegisteredError();
    }

    const user = await this.repository.create({ ...data, role: data.role ?? USER_ROLES.USER });
    logger.info(`Usuario creado: ${user._id}`, { role: user.role });
    return user;
  }

  async update(id, data) {
    this.assertValidRole(data.role);

    if (data.email && await this.repository.existsByEmail(data.email, id)) {
      throw new EmailAlreadyRegisteredError();
    }

    const user = await this.repository.update(id, data);
    if (!user) {
      throw new UserNotFoundError();
    }
    return user;
  }

  async delete(id) {
    const user = await this.repository.delete(id);
    if (!user) {
      throw new UserNotFoundError();
    }
    return user;
  }
}

export default new UsersService(usersRepository);
