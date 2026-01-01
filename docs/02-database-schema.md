# Database Schema

## Tables

### players

```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  avatar_data BYTEA,  -- Stored as binary instead of URL
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### tournaments

```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  state VARCHAR(20) NOT NULL CHECK (state IN ('draft', 'active', 'closed')),
  started_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### games

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id),
  comment VARCHAR(500),
  photo_data BYTEA,  -- Stored as binary instead of URL
  created_at TIMESTAMP DEFAULT NOW()
);
```

### score_events

```sql
CREATE TABLE score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  player_id UUID NOT NULL REFERENCES players(id),
  type VARCHAR(1) NOT NULL CHECK (type IN ('I', 'X')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Indexes

- `tournaments(state)` - for finding active tournament
- `score_events(game_id, player_id)` - for game queries
- `games(tournament_id, created_at)` - for tournament results

## Notes

- Images stored as BYTEA (binary) in PostgreSQL
- Soft deletes for players (deleted_at)
- Append-only score_events (immutable)
