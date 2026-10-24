import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/logic-gates-simulator-rewrite/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
