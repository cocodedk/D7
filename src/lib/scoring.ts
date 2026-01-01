/**
 * Scoring Engine - Pure functions for D7 card game scoring
 *
 * Rules:
 * - Plus (I) and minus (X) tracked independently (never cancel)
 * - 4 identical units = 1 cluster (IIII = +1, XXXX = -1)
 * - Mixed clusters never score
 * - Remainders (0-3) persist across games within tournament
 * - All scores derived from events, never stored directly
 */

export type ScoreEventType = 'I' | 'X'

export interface ScoreEvent {
  playerId: string
  type: ScoreEventType
}

export interface PlayerScore {
  plusRemainder: number  // 0-3
  minusRemainder: number // 0-3
  plusClusters: number
  minusClusters: number
  netScore: number
}

export interface InitialRemainders {
  plus: number
  minus: number
}

/**
 * Calculate player score from events with optional initial remainders
 */
export function calculatePlayerScore(
  events: ScoreEvent[],
  initialRemainders?: InitialRemainders
): PlayerScore {
  let plusCount = initialRemainders?.plus ?? 0
  let minusCount = initialRemainders?.minus ?? 0

  // Count events
  for (const event of events) {
    if (event.type === 'I') {
      plusCount++
    } else if (event.type === 'X') {
      minusCount++
    }
  }

  // Calculate clusters (4 identical units = 1 cluster)
  const plusClusters = Math.floor(plusCount / 4)
  const minusClusters = Math.floor(minusCount / 4)

  // Calculate remainders (0-3)
  const plusRemainder = plusCount % 4
  const minusRemainder = minusCount % 4

  // Net score = plus clusters - minus clusters
  const netScore = plusClusters - minusClusters

  return {
    plusRemainder,
    minusRemainder,
    plusClusters,
    minusClusters,
    netScore,
  }
}

/**
 * Calculate scores for all players in a tournament
 */
export function calculateTournamentScores(
  events: ScoreEvent[],
  playerIds: string[],
  initialRemainders?: Record<string, InitialRemainders>
): Record<string, PlayerScore> {
  const scores: Record<string, PlayerScore> = {}

  for (const playerId of playerIds) {
    const playerEvents = events.filter(e => e.playerId === playerId)
    const initial = initialRemainders?.[playerId]
    scores[playerId] = calculatePlayerScore(playerEvents, initial)
  }

  return scores
}

/**
 * Aggregate events by player
 */
export function aggregateEventsByPlayer(
  events: ScoreEvent[]
): Record<string, ScoreEvent[]> {
  const aggregated: Record<string, ScoreEvent[]> = {}

  for (const event of events) {
    if (!aggregated[event.playerId]) {
      aggregated[event.playerId] = []
    }
    aggregated[event.playerId].push(event)
  }

  return aggregated
}
