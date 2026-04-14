import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
  },
  resolve: {
    alias: {
      // maps.js imports from ./constants.js — provide a minimal stub for test env
    },
  },
});
