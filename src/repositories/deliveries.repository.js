import Delivery from '../models/delivery.model.js';

class DeliveriesRepository {
  get collectionName() {
    return Delivery.collection.collectionName;
  }

  async insertMany(deliveries) {
    const created = await Delivery.insertMany(deliveries);
    return created.map((delivery) => delivery.toObject({ versionKey: false }));
  }

  async deleteByOrders(orderIds) {
    const result = await Delivery.deleteMany({ order: { $in: orderIds } });
    return result.deletedCount;
  }
}

export default new DeliveriesRepository();
