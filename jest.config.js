// Los tests usan los valores de .env.example (dotenv no pisa variables ya definidas, p. ej. en CI).
require('dotenv').config({ path: '.env.example' });

const dbName = (process.env.MONGO_URI || '').split('/').pop().split('?')[0];
if (!dbName.endsWith('_test_db')) {
  throw new Error(
    `Los tests solo pueden correr contra una base cuyo nombre termine en "_test_db". Base actual: "${dbName}"`,
  );
}

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  passWithNoTests: true,
};
