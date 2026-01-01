# Tournament Management

## Tournament States

1. **Draft**: Players editable, no games
2. **Active**: Players locked, games allowed
3. **Closed**: No new games, scores frozen

## State Transitions

### Draft → Active
- Explicit "Start Tournament" action
- Validates: only one active tournament exists
- Locks all players in tournament
- Sets `started_at` timestamp

### Active → Closed
- Explicit "Close Tournament" action
- Requires typing tournament name to confirm
- Sets `closed_at` timestamp
- **Irreversible** operation

## Tournament Creation

- Name required (unique)
- Initial state: Draft
- Add players from available pool
- Remove players (Draft only)

## Active Tournament Rule

- Only **one** Active tournament at a time
- Cannot start new tournament if one is Active
- Must close current Active before starting new

## Tournament List View

- Show all tournaments
- Highlight Active tournament
- Display state, dates, player count
- Actions: Start (Draft), Close (Active), View (Closed)

## Player Assignment

- Add/remove players in Draft state only
- Players can be in multiple tournaments (different states)
- Active tournament locks player list

## Validation

- Tournament name required
- Cannot delete tournament with games
- Cannot modify Active tournament players
