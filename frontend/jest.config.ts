import type { Config } from 'jest';
// next no declara campo "exports", asi que bajo resolucion ESM hay que dar la
// extension explicita. Sin el .js, jest falla con ERR_MODULE_NOT_FOUND.
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    // e2e/ son specs de Playwright (npm run test:e2e), no de jest.
    '<rootDir>/e2e/',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};

export default createJestConfig(config);
