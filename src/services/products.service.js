import productsRepository from '../repositories/products.repository.js';
import emailProvider from '../utils/emailProvider.js';
import { config } from '../config/env.config.js';
import {
  ProductNotFoundError,
  ProductCodeAlreadyExistsError,
  InvalidProductStatusError,
  InvalidPriceError,
  RequestValidationError,
  ShippingConfigError
} from '../errors/customErrors.js';
import { PRODUCT_STATUS, SHIPPING_RATES } from '../constants/index.js';

export class ProductsService {
  constructor(repository, notifier, appConfig) {
    this.repository = repository;
    this.notifier = notifier;
    this.config = appConfig;
  }

  resolveStatus(stock) {
    return stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
  }

  normalizeStatus(status) {
    const normalized = String(status).trim().toLowerCase();
    if (!Object.values(PRODUCT_STATUS).includes(normalized)) {
      throw new InvalidProductStatusError(status);
    }
    return normalized;
  }

  async getAll({ includeOutOfStock = false } = {}) {
    return includeOutOfStock
      ? this.repository.findAll()
      : this.repository.findAvailable();
  }

  async getById(id) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new ProductNotFoundError();
    }
    return product;
  }

  async create(data) {
    const { title, code, price } = data;

    if (!title || !code || price === undefined) {
      throw new RequestValidationError('Faltan campos obligatorios: title, code y price');
    }
    if (typeof price !== 'number' || price < 0) {
      throw new InvalidPriceError();
    }
    if (await this.repository.existsByCode(code)) {
      throw new ProductCodeAlreadyExistsError(code);
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
      throw new ProductCodeAlreadyExistsError(changes.code);
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
      throw new ProductNotFoundError();
    }
    return product;
  }

  async delete(id) {
    const product = await this.repository.delete(id);
    if (!product) {
      throw new ProductNotFoundError();
    }
    return product;
  }

  calculateShippingCost(declaredValue) {
    if (!this.config.shippingApiKey) {
      throw new ShippingConfigError();
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
