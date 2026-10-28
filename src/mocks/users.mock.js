import { faker } from './faker.js';
import { MOCKS } from '../constants/index.js';

// Quita acentos y espacios para armar un email válido
const slug = (text) => text
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-zA-Z0-9]/g, '')
  .toLowerCase();

// Genera un usuario con la misma forma que el modelo User.
// El rol lo decide quien lo llama (el service).
export const generateUser = ({ role }) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const suffix = faker.string.alphanumeric({ length: 4, casing: 'lower' });

  return {
    _id: faker.database.mongodbObjectId(),
    firstName,
    lastName,
    email: `${slug(firstName)}.${slug(lastName)}.${suffix}@${MOCKS.EMAIL_DOMAIN}`,
    password: MOCKS.DEFAULT_PASSWORD,
    role
  };
};
