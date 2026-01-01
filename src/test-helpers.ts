import type { ScoreEvent } from './lib/scoring'
import type { Player } from './hooks/usePlayers'
import type { Tournament } from './hooks/useTournaments'
import type { Game } from './hooks/useGames'

export function createMockPlayer(overrides?: Partial<Player>): Player {
  return {
    id: 'player-1',
    name: 'John Doe',
    nickname: 'Johnny',
    avatar: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockTournament(overrides?: Partial<Tournament>): Tournament {
  return {
    id: 'tournament-1',
    date: '2024-01-01',
    state: 'draft',
    started_at: null,
    closed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockGame(overrides?: Partial<Game>): Game {
  return {
    id: 'game-1',
    tournament_id: 'tournament-1',
    comment: null,
    photo: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockScoreEvent(overrides?: Partial<ScoreEvent>): ScoreEvent {
  return {
    playerId: 'player-1',
    type: 'I',
    ...overrides,
  }
}

export function createMockScoreEvents(count: number, playerId: string, type: 'I' | 'X' = 'I'): ScoreEvent[] {
  return Array(count).fill(null).map(() => createMockScoreEvent({ playerId, type }))
}
