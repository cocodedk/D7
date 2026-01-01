# Frontend Structure

## Component Hierarchy

```
App
├── AuthProvider (context)
├── ThemeProvider (context)
└── Router
    ├── LoginPage
    ├── DashboardPage
    ├── PlayersPage
    ├── TournamentsPage
    ├── GamePage (critical path)
    ├── ResultsPage
    └── SettingsPage
```

## Key Components

### GamePage (Critical Path)
- Staging area for I/X taps
- Local state only (no DB writes)
- Large tap targets
- Visual feedback on each tap
- Save button → ConfirmationScreen

### ConfirmationScreen
- Shows tournament, timestamp, summary
- Comment input (optional)
- Photo capture/upload (optional)
- "Confirm & Save" button
- Warning about irreversibility

### PlayerCard
- Avatar display
- Name and nickname
- Tap targets for I/X
- Visual remainder indicators

## State Management

- **Local state**: useState for UI state
- **Context**: Auth, theme, active tournament
- **API calls**: Custom hooks (usePlayers, useTournaments, etc.)
- **Game staging**: Local state until confirmation

## Routing

- React Router for navigation
- Protected routes (require auth)
- Mobile-optimized navigation (bottom tabs or drawer)

## Performance

- Lazy loading for pages
- Optimistic UI updates
- Debounced API calls where appropriate
- Sub-100ms tap response (local state)
