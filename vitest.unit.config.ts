import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// `npm run test:unit` runs `vitest --exclude 'src/integration/**'`, so it
// never touches the test database - but vitest.config.ts's globalSetup
// (src/integration/setup.ts) always requires TEST_DATABASE_URL and connects
// to Postgres regardless of which test files are selected. CI (and any
// machine without a test database configured) fails before a single unit
// test runs. This is the same test config minus that DB-backed global
// setup/teardown; integration runs still use vitest.config.ts directly.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    maxWorkers: 1,
    minWorkers: 1,
  },
})
