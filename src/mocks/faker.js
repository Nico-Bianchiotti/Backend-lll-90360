import { fakerES } from '@faker-js/faker';

// Una sola instancia de Faker en español para todos los generadores
export const faker = fakerES;

// Ciudades argentinas para que las direcciones de envío sean verosímiles
export const ARGENTINE_LOCATIONS = Object.freeze([
  { city: 'Córdoba', province: 'Córdoba', zipCode: '5000' },
  { city: 'Alta Gracia', province: 'Córdoba', zipCode: '5186' },
  { city: 'Villa Carlos Paz', province: 'Córdoba', zipCode: '5152' },
  { city: 'Río Cuarto', province: 'Córdoba', zipCode: '5800' },
  { city: 'Buenos Aires', province: 'CABA', zipCode: '1000' },
  { city: 'La Plata', province: 'Buenos Aires', zipCode: '1900' },
  { city: 'Rosario', province: 'Santa Fe', zipCode: '2000' },
  { city: 'Mendoza', province: 'Mendoza', zipCode: '5500' },
  { city: 'San Miguel de Tucumán', province: 'Tucumán', zipCode: '4000' },
  { city: 'Salta', province: 'Salta', zipCode: '4400' }
]);

export const ARGENTINE_STREETS = Object.freeze([
  'Av. San Martín', 'Belgrano', 'Rivadavia', 'Sarmiento', 'Mitre', '9 de Julio',
  '25 de Mayo', 'Av. Colón', 'Dean Funes', 'Bv. San Juan', 'Av. Vélez Sarsfield',
  'Independencia', 'Tucumán', 'Moreno', 'Av. Hipólito Yrigoyen'
]);
