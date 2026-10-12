import productsRepository from '../repositories/products.repository.js';
import emailProvider from '../utils/emailProvider.js';
import { config } from '../config/env.config.js';
import AppError from '../utils/errors.js';
import { PRODUCT_STATUS, SHIPPING_RATES, HTTP_STATUS } from '../constants/index.js';

// Reglas de negocio de los productos. No conoce Express (req/res)
// ni Mongoose: recibe sus dependencias por el constructor.

export class ProductsService {
  constructor(repository, notifier, appConfig) {
    this.repository = repository;
    this.notifier = notifier;
    this.config = appConfig;
  }

  // Regla: el estado depende del stock.
  resolveStatus(stock) {
    return stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
  }

  normalizeStatus(status) {
    const normalized = String(status).trim().toLowerCase();
    if (!Object.values(PRODUCT_STATUS).includes(normalized)) {
      throw new AppError(
        `Estado inválido. Valores permitidos: ${Object.values(PRODUCT_STATUS).join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
    return normalized;
  }

  // Regla: el catálogo público muestra solo productos con stock,
  // salvo que se pidan todos explícitamente.
  async getAll({ includeOutOfStock = false } = {}) {
    return includeOutOfStock
      ? this.repository.findAll()
      : this.repository.findAvailable();
  }

  async getById(id) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new AppError('Producto no encontrado', HTTP_STATUS.NOT_FOUND);
    }
    return product;
  }

  async create(data) {
    const { title, code, price } = data;

    if (!title || !code || price === undefined) {
      throw new AppError('Faltan campos obligatorios: title, code y price', HTTP_STATUS.BAD_REQUEST);
    }
    if (typeof price !== 'number' || price < 0) {
      throw new AppError('El precio debe ser un número mayor o igual a 0', HTTP_STATUS.BAD_REQUEST);
    }
    if (await this.repository.existsByCode(code)) {
      throw new AppError(`Ya existe un producto con el código ${code}`, HTTP_STATUS.CONFLICT);
    }

    const stock = data.stock ?? 0;
    const product = await this.repository.create({
      ...data,
      stock,
      status: this.resolveStatus(stock)
    });

    await this.notifier.send('Producto creado: ' + product.title);
    return product;
  }

  async update(id, data) {
    const changes = { ...data };

    if (changes.code !== undefined && await this.repository.existsByCode(changes.code, id)) {
      throw new AppError(`Ya existe un producto con el código ${changes.code}`, HTTP_STATUS.CONFLICT);
    }

    if (changes.status !== undefined) {
      changes.status = this.normalizeStatus(changes.status);
    }
    // Si cambia el stock, el estado se recalcula y tiene prioridad.
    if (changes.stock !== undefined) {
      changes.status = this.resolveStatus(changes.stock);
    }

    const product = await this.repository.update(id, changes);
    if (!product) {
      throw new AppError('Producto no encontrado', HTTP_STATUS.NOT_FOUND);
    }
    return product;
  }

  async delete(id) {
    const product = await this.repository.delete(id);
    if (!product) {
      throw new AppError('Producto no encontrado', HTTP_STATUS.NOT_FOUND);
    }
    return product;
  }

  // Regla: en desarrollo la tarifa es plana; en producción, base + 1% de seguro.
  calculateShippingCost(declaredValue) {
    if (!this.config.shippingApiKey) {
      throw new AppError('Configuración inválida: falta la API key de envíos', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    if (!this.config.isProduction) {
      return SHIPPING_RATES.DEVELOPMENT_FLAT_RATE;
    }
    const cost = SHIPPING_RATES.PRODUCTION_BASE_COST + declaredValue * SHIPPING_RATES.INSURANCE_RATE;
    return Math.round(cost * 100) / 100;
  }

  async getShippingCost(id) {
    const product = await this.getById(id);
    return {
      product: product._id,
      declaredValue: product.price,
      shippingCost: this.calculateShippingCost(product.price)
    };
  }
}

export default new ProductsService(productsRepository, emailProvider, config);
