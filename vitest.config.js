import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: { NODE_ENV: 'test' },
    include: ['backend/tests/**/*.test.js'],
    sequence: { concurrent: false },
  },
});
