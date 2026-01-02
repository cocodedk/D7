# E2E Tests with Playwright

This directory contains end-to-end (E2E) tests for the D7 Card Game application using Playwright.

## Test Structure

```
tests/e2e/
├── fixtures/
│   └── auth.ts              # Authentication helpers
├── helpers/
│   └── test-data.ts         # Test data creation helpers
├── pages/
│   ├── LoginPage.ts         # Login page object model
│   ├── DashboardPage.ts    # Dashboard page object model
│   ├── GamePage.ts         # Game recording page object model
│   ├── ConfirmationScreen.ts # Confirmation screen object model
│   ├── TournamentsPage.ts  # Tournaments page object model
│   └── PlayersPage.ts      # Players page object model
├── auth.spec.ts            # Authentication tests
├── game-recording.spec.ts  # Game recording flow tests (CRITICAL)
├── tournament-lifecycle.spec.ts # Tournament lifecycle tests
├── player-management.spec.ts   # Player management tests
└── game-recording-edge-cases.spec.ts # Edge case tests
```

## Prerequisites

1. **Environment Variables**: Set `ADMIN_PASSWORD` environment variable for authentication tests. You can do this in two ways:

   **Option 1: Use `.env` file (Recommended)**
   ```bash
   # Create .env or .env.local in project root
   ADMIN_PASSWORD=your-admin-password
   ```
   Playwright automatically loads environment variables from `.env.local` or `.env` files (loaded in that order).

   **Option 2: Set environment variable directly**
   ```bash
   export ADMIN_PASSWORD=your-admin-password
   ```

2. **Database**: Ensure the test database is set up and accessible. The tests use the same database as the integration tests.

3. **Dev Server**: The Playwright config automatically starts the dev server, but you can also run it manually:
   ```bash
   npm run dev
   ```

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Tests with UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Run Tests in Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Tests on Mobile Viewport
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## Test Coverage

### Authentication Tests (`auth.spec.ts`)
- ✅ Successful login with valid password
- ✅ Login failure with invalid password
- ✅ Logout functionality
- ✅ Protected route redirection
- ✅ Public results link visibility

### Game Recording Tests (`game-recording.spec.ts`) - CRITICAL
- ✅ Complete game recording flow (staging → confirmation → save)
- ✅ Event counter updates
- ✅ Score calculations (net score, remainders, clusters)
- ✅ Confirmation screen validation
- ✅ Save button disabled with no events
- ✅ Clear events functionality
- ✅ Cancel confirmation and return to game page
- ✅ Cluster scoring (4 I's = +1, 4 X's = -1)

### Tournament Lifecycle Tests (`tournament-lifecycle.spec.ts`)
- ✅ Create and start tournament
- ✅ Close tournament with confirmation
- ✅ Only one active tournament enforcement
- ✅ Prevent game recording for closed tournament

### Player Management Tests (`player-management.spec.ts`)
- ✅ Create player
- ✅ Edit player
- ✅ Delete player

### Edge Cases (`game-recording-edge-cases.spec.ts`)
- ✅ No active tournament message
- ✅ Undo functionality (within 60 seconds)
- ✅ Multiple players game recording

## Page Object Models

The tests use Page Object Model (POM) pattern for maintainability:

- **LoginPage**: Handles login page interactions
- **DashboardPage**: Handles dashboard interactions and undo notifications
- **GamePage**: Handles game recording page (I/X taps, event counts, scores)
- **ConfirmationScreen**: Handles confirmation screen interactions
- **TournamentsPage**: Handles tournament management (create, start, close)
- **PlayersPage**: Handles player management (create, edit, delete)

## Test Data Management

Tests create their own test data using unique timestamps to avoid conflicts. However, tests may need cleanup if they fail mid-execution.

### Manual Cleanup
If tests leave test data in the database, you can clean it up manually:
```sql
-- Delete test players (adjust pattern as needed)
DELETE FROM players WHERE name LIKE 'Test Player%' OR name LIKE 'Delete Test%';
```

## Troubleshooting

### Tests Fail with "ADMIN_PASSWORD not set"
Set the environment variable using one of these methods:

**Option 1: Create `.env` or `.env.local` file (Recommended)**
```bash
# In project root, create .env or .env.local
ADMIN_PASSWORD=your-password
```

**Option 2: Set environment variable directly**
```bash
export ADMIN_PASSWORD=your-password
```

Playwright automatically loads `.env.local` first, then `.env` if `.env.local` doesn't exist.

### Tests Fail with "Connection refused" or "Cannot connect to localhost:3000"
Ensure the dev server is running:
```bash
npm run dev
```

Or let Playwright start it automatically (configured in `playwright.config.ts`).

### Tests Fail with Database Errors
Ensure:
1. Database is running and accessible
2. `DATABASE_URL` or `TEST_DATABASE_URL` is set correctly
3. Database migrations have been run

### Tests Are Flaky (Intermittent Failures)
Common causes:
1. **Timing issues**: Tests may need more wait time. Check for proper `waitFor` calls.
2. **Test data conflicts**: Ensure unique test data (timestamps help).
3. **Browser state**: Clear browser state between tests if needed.

### Screenshots and Videos
On test failure, Playwright automatically:
- Takes a screenshot (saved to `test-results/`)
- Records a video (saved to `test-results/`)

View them in the HTML report:
```bash
npx playwright show-report
```

## Configuration

Test configuration is in `playwright.config.ts`:
- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests/e2e`
- **Browsers**: Chromium, Firefox, WebKit
- **Viewports**: Desktop and mobile
- **Timeouts**: 30s default, 60s for game recording
- **Screenshots**: On failure
- **Videos**: On failure

## Best Practices

1. **Use Page Objects**: Always use page object models for interactions
2. **Unique Test Data**: Use timestamps or UUIDs for test data to avoid conflicts
3. **Wait for Elements**: Use `waitFor` instead of fixed `sleep` calls
4. **Isolated Tests**: Each test should be independent and not rely on other tests
5. **Clean Up**: Tests should clean up after themselves when possible

## CI/CD Integration

For CI/CD, ensure:
1. `ADMIN_PASSWORD` is set as a CI secret
2. Database is accessible from CI environment
3. Browsers are installed: `npx playwright install --with-deps`

Example GitHub Actions step:
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```
