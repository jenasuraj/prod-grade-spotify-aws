import baseConfig from '../jest.config.js';

/** @type {import('jest').Config} */
export default {
  ...baseConfig,
  rootDir: '.',
  testRegex: '.*\\.e2e-spec\\.ts$',
};
