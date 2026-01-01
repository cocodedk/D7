# Backend API Structure

## Netlify Functions

All API endpoints are serverless functions in `netlify/functions/`.

## Authentication

### POST /api/auth/login
- Body: `{ password: string }`
- Returns: JWT token or session cookie
- Validates against Netlify env var

### POST /api/auth/logout
- Clears session

## Players

### GET /api/players
- Returns: List of active players

### POST /api/players
- Body: `{ name, nickname, avatar? }`
- Returns: Created player

### PUT /api/players/:id
- Body: `{ name?, nickname?, avatar? }`
- Returns: Updated player

### DELETE /api/players/:id
- Soft delete (sets deleted_at)

## Tournaments

### GET /api/tournaments
- Returns: All tournaments with state

### GET /api/tournaments/active
- Returns: Current active tournament (if exists)

### POST /api/tournaments
- Body: `{ name }`
- Returns: Created tournament (draft state)

### PUT /api/tournaments/:id/start
- Transitions: draft → active
- Validates: only one active tournament

### PUT /api/tournaments/:id/close
- Body: `{ confirmation: string }` (tournament name)
- Transitions: active → closed

## Games

### POST /api/games
- Body: `{ tournamentId, events: [{playerId, type}], comment?, photo? }`
- Returns: Created game with events

### GET /api/games/:id
- Returns: Game with all score events

### DELETE /api/games/:id
- Only if created within 60 seconds
- Hard delete (cascade to score_events)

## Results

### GET /api/tournaments/:id/results
- Returns: Per-player scores (clusters, net)

### GET /api/results/yearly/:year
- Returns: Aggregated results by calendar year
