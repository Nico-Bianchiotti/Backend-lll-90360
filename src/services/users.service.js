import usersRepository from '../repositories/users.repository.js';
import AppError from '../utils/errors.js';
import { USER_ROLES, HTTP_STATUS } from '../constants/index.js';

// Reglas de negocio de los usuarios. Recibe el repositorio por constructor.

export class UsersService {
  constructor(repository) {
    this.repository = repository;
  }

  // Regla: desde la API pública no se pueden crear ni ascender administradores.
  assertNotAdmin(role) {
    if (role === USER_ROLES.ADMIN) {
      throw new AppError('No es posible asignar el rol de administrador desde este endpoint', HTTP_STATUS.BAD_REQUEST);
    }
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError('Usuario no encontrado', HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }

  async create(data) {
    this.assertNotAdmin(data.role);

    if (data.email && await this.repository.existsByEmail(data.email)) {
      throw new AppError('Este email ya se encuentra registrado', HTTP_STATUS.CONFLICT);
    }

    return this.repository.create({ ...data, role: data.role ?? USER_ROLES.USER });
  }

  async update(id, data) {
    this.assertNotAdmin(data.role);

    if (data.email && await this.repository.existsByEmail(data.email, id)) {
      throw new AppError('Este email ya se encuentra registrado', HTTP_STATUS.CONFLICT);
    }

    const user = await this.repository.update(id, data);
    if (!user) {
      throw new AppError('Usuario no encontrado', HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }

  async delete(id) {
    const user = await this.repository.delete(id);
    if (!user) {
      throw new AppError('Usuario no encontrado', HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }
}

export default new UsersService(usersRepository);
