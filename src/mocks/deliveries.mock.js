import { faker } from './faker.js';

// Genera una entrega con la forma del modelo Delivery.
// Pedido, repartidor y estado los decide el service.
export const generateDelivery = ({ orderId, courierId, status, isDelivered }) => ({
  _id: faker.database.mongodbObjectId(),
  order: orderId,
  courier: courierId,
  status,
  trackingCode: `SN-${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`,
  estimatedDate: faker.date.soon({ days: 7 }),
  deliveredAt: isDelivered ? faker.date.recent({ days: 5 }) : null
});
