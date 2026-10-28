import { faker, ARGENTINE_LOCATIONS, ARGENTINE_STREETS } from './faker.js';
import { ORDER_PRIORITY } from '../constants/index.js';

const generateItem = () => ({
  description: faker.commerce.productName(),
  quantity: faker.number.int({ min: 1, max: 5 }),
  unitPrice: faker.number.float({ min: 500, max: 50000, fractionDigits: 2 })
});

// Genera un pedido con la forma del modelo Order.
// El usuario y el estado los decide el service; el total también se calcula allá.
export const generateOrder = ({ userId, status }) => {
  const location = faker.helpers.arrayElement(ARGENTINE_LOCATIONS);

  return {
    _id: faker.database.mongodbObjectId(),
    user: userId,
    items: faker.helpers.multiple(generateItem, { count: { min: 1, max: 4 } }),
    deliveryAddress: {
      street: `${faker.helpers.arrayElement(ARGENTINE_STREETS)} ${faker.number.int({ min: 1, max: 4000 })}`,
      city: location.city,
      province: location.province,
      zipCode: location.zipCode
    },
    status,
    priority: faker.helpers.arrayElement(Object.values(ORDER_PRIORITY))
  };
};
