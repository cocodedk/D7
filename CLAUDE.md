# CLAUDE.md — D7 (Hafte Kasif Tournament Tracker)

## Project Overview

D7 is a tournament tracking web app for Hafte Kasif (Bisheori), a card game played by a group of friends in Denmark. It tracks bi-weekly tournament results, player profiles, scores, and rankings. Built with React, TypeScript, and Vite; deployed to Netlify with a PostgreSQL (Neon) backend via Netlify Functions.

- **Language / Runtime**: TypeScript, Node.js 18+
- **Framework**: React 18, Vite, Tailwind CSS
- **Architecture**: Client-side React + Netlify Functions (serverless) + PostgreSQL (Neon)
- **Package / Namespace**: `d7-card-game`

---

## Required Skills — ALWAYS Invoke These

These skills **must** be invoked when the relevant situation arises. Never skip them.

| Situation | Skill |
|-----------|-------|
| Before any new feature or screen | `superpowers:brainstorming` |
| Planning multi-step changes | `superpowers:writing-plans` |
| Writing or fixing core logic | `superpowers:test-driven-development` |
| First sign of a bug or failure | `superpowers:systematic-debugging` |
| Before completing a feature branch | `superpowers:requesting-code-review` |
| Before claiming any task done | `superpowers:verification-before-completion` |
| Working on UI / frontend | `frontend-design:frontend-design` |
| After implementing — reviewing quality | `simplify` |

---

## Architecture

```
D7/
├── src/
│   ├── pages/         ← Route-level page components
│   ├── components/    ← Reusable UI components
│   ├── contexts/      ← React context providers (state)
│   ├── hooks/         ← Custom React hooks
│   ├── lib/           ← Utilities and API client
│   └── integration/   ← Integration tests (database)
├── netlify/
│   └── functions/     ← Serverless API functions
├── gh-pages/          ← Static public results page (GitHub Pages)
├── public/            ← Static assets served by Vite
└── .github/workflows/ ← CI and Pages automation
```

### Layer Rules
- `pages/` and `components/` depend on `contexts/` and `hooks/` — never on `netlify/`
- `lib/` is pure utilities — no React hooks or context
- Integration tests in `src/integration/` require a live database; exclude from unit test runs

---

## Coding Conventions

- [ ] All models are **immutable** — use spread/`Object.assign` for mutations
- [ ] Functions are **pure** where possible — no hidden side effects
- [ ] State is a single source of truth per feature (React Context or hook)
- [ ] No hardcoded strings — use constants for player names, score values, labels
- [ ] Strict TypeScript everywhere (`strict: true` in tsconfig)

---

## Engineering Principles

### File Size
- **200-line maximum per file** — extract a component, hook, or utility when approaching the limit

### DRY · SOLID · KISS · YAGNI
- Extract shared logic into named utilities; never copy-paste
- Single Responsibility: one component/function does one thing
- Don't add features not yet needed
- Delete dead code immediately

### TDD
- Write the failing test first, make it pass, then refactor
- Test names describe behaviour: `"should calculate correct tournament rankings"`
- One assertion per test — keep tests focused and readable

### Commit hygiene
- Follow Conventional Commits: `feat: ...` / `fix: ...` / `chore: ...`
- The `commit-msg` hook enforces this automatically

---

## Build Commands

```bash
npm run dev              # Start local dev server (port 3000)
npm run build            # TypeScript compile + Vite build to dist/
npm run lint             # ESLint check
npm run test:unit        # Run unit tests (excludes integration)
npm run test:all         # Run all tests (requires live DB)
npm run preview          # Preview built output locally
```

### Smoke check (CI)
```bash
npm ci && npm run lint && npm run test:unit && npm run build
```

---

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — project conventions and session startup |
| `vite.config.ts` | Vite build configuration |
| `vitest.config.ts` | Vitest test configuration |
| `.github/workflows/` | CI and Pages automation |
| `.githooks/` | Pre-commit and commit-msg hooks |
| `scripts/install-hooks.sh` | One-time hook installer |
| `scripts/setup-repo.sh` | One-time branch protection + repo settings |
| `gh-pages/` | Static public results page |

---

## Starting a New Session

1. Read this file
2. Run `npm ci && npm run lint && npm run test:unit` to confirm everything passes
3. Invoke `superpowers:brainstorming` before touching any feature
4. Follow the Required Skills table — every skill is mandatory, not optional
