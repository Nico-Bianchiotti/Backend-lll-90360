import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import '../models/user.model.js'; // registra User para poder hacer populate

const PUBLIC_FIELDS = '-__v';
const USER_PUBLIC_FIELDS = 'firstName lastName email role';

class OrdersRepository {
  get collectionName() {
    return Order.collection.collectionName;
  }

  async findAll() {
    return Order.find()
      .select(PUBLIC_FIELDS)
      .populate('user', USER_PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Order.findById(id)
      .select(PUBLIC_FIELDS)
      .populate('user', USER_PUBLIC_FIELDS)
      .lean();
  }

  async create(data) {
    const order = await Order.create(data);
    return order.toObject({ versionKey: false });
  }

  async updateStatus(id, status) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
      .select(PUBLIC_FIELDS)
      .lean();
  }

  async insertMany(orders) {
    const created = await Order.insertMany(orders);
    return created.map((order) => order.toObject({ versionKey: false }));
  }

  async findIdsByUsers(userIds) {
    const orders = await Order.find({ user: { $in: userIds } }).select('_id').lean();
    return orders.map((order) => order._id);
  }

  async deleteByIds(ids) {
    const result = await Order.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
  }
}

export default new OrdersRepository();
