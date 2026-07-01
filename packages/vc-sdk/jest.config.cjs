/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@signa-chain/types$': '<rootDir>/../types/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: { ignoreCodes: [151002] },
      },
    ],
  },
  // @noble/* and canonicalize are pure ESM — must be transformed even from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@noble/ed25519|@noble/hashes|canonicalize)/)',
  ],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/**/index.ts'],
};

module.exports = config;
