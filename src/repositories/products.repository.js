import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import { PRODUCT_STATUS } from '../constants/index.js';

// Único lugar (junto con users.repository) que conoce Mongoose.
// Encapsula: filtros por defecto, proyección de campos, validación de IDs
// y devuelve objetos planos (lean) en lugar de documentos de Mongoose.

const PUBLIC_FIELDS = '-__v';

class ProductsRepository {
  async findAll() {
    return Product.find()
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
  }

  // Filtro por defecto del catálogo: solo productos que se pueden vender.
  // La consulta filtra en la base, en vez de traer todo y filtrar en memoria.
  async findAvailable() {
    return Product.find({ stock: { $gt: 0 }, status: PRODUCT_STATUS.AVAILABLE })
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Product.findById(id).select(PUBLIC_FIELDS).lean();
  }

  // excludeId permite ignorar el propio producto al editarlo
  async existsByCode(code, excludeId = null) {
    const filter = { code: String(code).trim() };
    if (excludeId && mongoose.isValidObjectId(excludeId)) filter._id = { $ne: excludeId };
    const product = await Product.exists(filter);
    return Boolean(product);
  }

  async create(data) {
    const product = await Product.create(data);
    return product.toObject({ versionKey: false });
  }

  async update(id, data) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Product.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .select(PUBLIC_FIELDS)
      .lean();
  }

  async delete(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Product.findByIdAndDelete(id).select(PUBLIC_FIELDS).lean();
  }
}

export default new ProductsRepository();
