/**
 * Scoring Engine - Backend version
 * Same logic as frontend but for use in Netlify Functions
 */

export type ScoreEventType = 'I' | 'X'

export interface ScoreEvent {
  playerId: string
  type: ScoreEventType
}

export interface PlayerScore {
  plusRemainder: number
  minusRemainder: number
  plusClusters: number
  minusClusters: number
  netScore: number
}

export interface InitialRemainders {
  plus: number
  minus: number
}

export function calculatePlayerScore(
  events: ScoreEvent[],
  initialRemainders?: InitialRemainders
): PlayerScore {
  let plusCount = initialRemainders?.plus ?? 0
  let minusCount = initialRemainders?.minus ?? 0

  for (const event of events) {
    if (event.type === 'I') {
      plusCount++
    } else if (event.type === 'X') {
      minusCount++
    }
  }

  const plusClusters = Math.floor(plusCount / 4)
  const minusClusters = Math.floor(minusCount / 4)
  const plusRemainder = plusCount % 4
  const minusRemainder = minusCount % 4
  const netScore = plusClusters - minusClusters

  return {
    plusRemainder,
    minusRemainder,
    plusClusters,
    minusClusters,
    netScore,
  }
}

export function calculateTournamentScores(
  events: ScoreEvent[],
  playerIds: string[],
  initialRemainders?: Record<string, InitialRemainders>
): Record<string, PlayerScore> {
  const scores: Record<string, PlayerScore> = {}

  for (const playerId of playerIds) {
    const playerEvents = events.filter((e) => e.playerId === playerId)
    const initial = initialRemainders?.[playerId]
    scores[playerId] = calculatePlayerScore(playerEvents, initial)
  }

  return scores
}
