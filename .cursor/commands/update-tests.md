# Update Tests

Review and update all tests to ensure they reflect recent code changes. This includes:

## Backend Tests
- Update tests in `backend/tests/` to match any changes in:
  - API endpoints (`backend/app_helpers/routes/`)
  - Database queries (`backend/database/queries/`)
  - Services (`backend/services/`)
  - Models (`backend/models.py`, `backend/database/models.py`)
  - CV generation logic (`backend/cv_generator/`, `backend/cv_generator_docx/`)

## Frontend Tests
- Update tests in `frontend/src/__tests__/` to match any changes in:
  - Components (`frontend/src/components/`)
  - App helpers (`frontend/src/app_helpers/`)
  - Services (`frontend/src/services/`)
  - Types (`frontend/src/types/`)

## Test Requirements
- Ensure all new functionality has corresponding tests
- Update existing tests if behavior changed
- Maintain minimum 70% test coverage for backend
- Fix any failing tests
- Ensure tests follow project conventions (pytest for backend, Vitest for frontend)

## Running Tests
After updating tests, verify they pass by running:
- `npm run test:backend` (or `scripts/run-tests.sh` for all tests)
- `npm run test:frontend`
