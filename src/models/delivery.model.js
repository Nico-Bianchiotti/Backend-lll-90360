import mongoose from 'mongoose';
import { DELIVERY_STATUS } from '../constants/index.js';

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'La entrega debe estar asociada a un pedido'],
    unique: true
  },
  courier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: Object.values(DELIVERY_STATUS),
    default: DELIVERY_STATUS.PENDING
  },
  trackingCode: {
    type: String,
    required: [true, 'El código de seguimiento es obligatorio'],
    unique: true,
    trim: true
  },
  estimatedDate: {
    type: Date
  },
  deliveredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;
