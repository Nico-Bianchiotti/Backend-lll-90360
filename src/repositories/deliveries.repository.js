import mongoose from 'mongoose';
import Delivery from '../models/delivery.model.js';
import '../models/order.model.js'; // registra Order y User para poder hacer populate
import '../models/user.model.js';

const PUBLIC_FIELDS = '-__v';
const ORDER_PUBLIC_FIELDS = 'status priority total deliveryAddress';
const COURIER_PUBLIC_FIELDS = 'firstName lastName email role';

class DeliveriesRepository {
  get collectionName() {
    return Delivery.collection.collectionName;
  }

  // Entregas con los datos públicos del pedido y del repartidor
  async findAll() {
    return Delivery.find()
      .select(PUBLIC_FIELDS)
      .populate('order', ORDER_PUBLIC_FIELDS)
      .populate('courier', COURIER_PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Delivery.findById(id)
      .select(PUBLIC_FIELDS)
      .populate('order', ORDER_PUBLIC_FIELDS)
      .populate('courier', COURIER_PUBLIC_FIELDS)
      .lean();
  }

  async existsByOrder(orderId) {
    const delivery = await Delivery.exists({ order: orderId });
    return Boolean(delivery);
  }

  async create(data) {
    const delivery = await Delivery.create(data);
    return delivery.toObject({ versionKey: false });
  }

  async update(id, changes) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Delivery.findByIdAndUpdate(id, changes, { new: true, runValidators: true })
      .select(PUBLIC_FIELDS)
      .populate('order', ORDER_PUBLIC_FIELDS)
      .populate('courier', COURIER_PUBLIC_FIELDS)
      .lean();
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
