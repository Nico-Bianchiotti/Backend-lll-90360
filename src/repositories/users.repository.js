import mongoose from 'mongoose';
import User from '../models/user.model.js';

// Único lugar que conoce el modelo User.
// La contraseña nunca sale de esta capa: la proyección la excluye siempre.

const PUBLIC_FIELDS = '-password -__v';

const toPublicUser = (userDocument) => {
  const user = userDocument.toObject({ versionKey: false });
  delete user.password;
  return user;
};

class UsersRepository {
  async findAll() {
    return User.find()
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return User.findById(id).select(PUBLIC_FIELDS).lean();
  }

  // excludeId permite ignorar al propio usuario al editarlo
  async existsByEmail(email, excludeId = null) {
    const filter = { email: String(email).trim().toLowerCase() };
    if (excludeId && mongoose.isValidObjectId(excludeId)) filter._id = { $ne: excludeId };
    const user = await User.exists(filter);
    return Boolean(user);
  }

  async create(data) {
    const user = await User.create(data);
    return toPublicUser(user);
  }

  async update(id, data) {
    if (!mongoose.isValidObjectId(id)) return null;
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .select(PUBLIC_FIELDS)
      .lean();
  }

  async delete(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return User.findByIdAndDelete(id).select(PUBLIC_FIELDS).lean();
  }
}

export default new UsersRepository();
