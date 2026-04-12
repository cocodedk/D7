# Contributing to D7

Built by [Cocode](https://cocode.dk).

## Local Setup
1. Install Node.js 18+ and npm.
2. Clone the repository and install dependencies: `npm ci`
3. Copy `.env.example` to `.env` and fill in database credentials.

## Install Git Hooks
```bash
./scripts/install-hooks.sh
```

## Local Git Setup
Run these once after cloning:
```bash
git config pull.rebase true
git config core.autocrlf input
git config push.autoSetupRemote true
git config init.defaultBranch main
```

## Build and Test Commands
```bash
npm run dev              # Start local dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run test:unit        # Run unit tests (no database required)
npm run test:all         # Run all tests (requires live database)
```

## Smoke Check (used in CI and pre-commit)
```bash
npm ci && npm run lint && npm run test:unit && npm run build
```

## Coding Style
- TypeScript strict mode — no `any` without justification
- Keep files small and focused (200-line maximum)
- Prefer clear naming and explicit behaviour over hidden side effects

## Branch Naming

| Branch prefix | Conventional Commit type | Example |
|---|---|---|
| `feature/` | `feat:` | `feature/add-tournament-standings` |
| `fix/` | `fix:` | `fix/crash-on-empty-roster` |
| `chore/` | `chore:` | `chore/update-dependencies` |
| `docs/` | `docs:` | `docs/update-contributing` |
| `refactor/` | `refactor:` | `refactor/extract-scoring-logic` |
| `ci/` | `ci:` | `ci/add-dependabot` |

## PR Checklist
- [ ] Smoke check passes (`npm run lint && npm run test:unit && npm run build`)
- [ ] Manual test completed for changed functionality
- [ ] No regressions in adjacent features
- [ ] Updated docs if behaviour changed
