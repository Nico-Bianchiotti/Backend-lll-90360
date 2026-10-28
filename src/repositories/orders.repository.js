import Order from '../models/order.model.js';

class OrdersRepository {
  get collectionName() {
    return Order.collection.collectionName;
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
