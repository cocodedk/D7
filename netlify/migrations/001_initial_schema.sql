-- D7 Card Game Initial Schema

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  avatar_data BYTEA,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  state VARCHAR(20) NOT NULL CHECK (state IN ('draft', 'active', 'closed')),
  started_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id),
  comment VARCHAR(500),
  photo_data BYTEA,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Score events table (append-only, immutable)
CREATE TABLE IF NOT EXISTS score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  player_id UUID NOT NULL REFERENCES players(id),
  type VARCHAR(1) NOT NULL CHECK (type IN ('I', 'X')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_state ON tournaments(state);
CREATE INDEX IF NOT EXISTS idx_score_events_game_player ON score_events(game_id, player_id);
CREATE INDEX IF NOT EXISTS idx_games_tournament_created ON games(tournament_id, created_at);
CREATE INDEX IF NOT EXISTS idx_players_deleted_at ON players(deleted_at);
