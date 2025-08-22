/** @type {import('vitest/config').UserConfig} */
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: { enabled: false }
  }
});
