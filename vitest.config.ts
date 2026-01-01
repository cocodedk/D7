import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { config } from 'dotenv'

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') })

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    globalSetup: ['./src/integration/setup.ts'],
    globalTeardown: ['./src/integration/teardown.ts'],
    // Run tests sequentially to avoid database conflicts in integration tests
    maxWorkers: 1,
    minWorkers: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test-utils.tsx',
        'src/test-helpers.ts',
        'src/test-setup.ts',
        'src/integration/**',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js}',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
})
