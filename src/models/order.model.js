import mongoose from 'mongoose';
import { ORDER_STATUS, ORDER_PRIORITY } from '../constants/index.js';

const orderItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'La descripción del item es obligatoria'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'La cantidad es obligatoria'],
    min: [1, 'La cantidad mínima es 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'El precio unitario es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El pedido debe pertenecer a un usuario']
  },
  items: {
    type: [orderItemSchema],
    validate: {
      validator: (items) => items.length > 0,
      message: 'El pedido debe tener al menos un item'
    }
  },
  deliveryAddress: {
    street: { type: String, required: [true, 'La calle es obligatoria'], trim: true },
    city: { type: String, required: [true, 'La ciudad es obligatoria'], trim: true },
    province: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  total: {
    type: Number,
    required: [true, 'El total es obligatorio'],
    min: [0, 'El total no puede ser negativo']
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.CREATED
  },
  priority: {
    type: String,
    enum: Object.values(ORDER_PRIORITY),
    default: ORDER_PRIORITY.NORMAL
  }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
