import { describe, it, expect } from 'vitest'
import {
  calculatePlayerScore,
  calculateTournamentScores,
  aggregateEventsByPlayer,
  type ScoreEvent,
} from './scoring'

describe('Scoring Engine', () => {
  describe('calculatePlayerScore', () => {
    it('should calculate clusters correctly', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
      ]

      const score = calculatePlayerScore(events)
      expect(score.plusClusters).toBe(1)
      expect(score.plusRemainder).toBe(0)
      expect(score.netScore).toBe(1)
    })

    it('should handle remainders correctly', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
      ]

      const score = calculatePlayerScore(events)
      expect(score.plusClusters).toBe(0)
      expect(score.plusRemainder).toBe(3)
      expect(score.netScore).toBe(0)
    })

    it('should track plus and minus independently', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'X' },
        { playerId: '1', type: 'X' },
        { playerId: '1', type: 'X' },
        { playerId: '1', type: 'X' },
      ]

      const score = calculatePlayerScore(events)
      expect(score.plusClusters).toBe(1)
      expect(score.minusClusters).toBe(1)
      expect(score.plusRemainder).toBe(0)
      expect(score.minusRemainder).toBe(0)
      expect(score.netScore).toBe(0)
    })

    it('should handle initial remainders', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
      ]

      const score = calculatePlayerScore(events, { plus: 3, minus: 0 })
      expect(score.plusClusters).toBe(1)
      expect(score.plusRemainder).toBe(0)
      expect(score.netScore).toBe(1)
    })

    it('should handle empty events', () => {
      const score = calculatePlayerScore([])
      expect(score.plusClusters).toBe(0)
      expect(score.minusClusters).toBe(0)
      expect(score.plusRemainder).toBe(0)
      expect(score.minusRemainder).toBe(0)
      expect(score.netScore).toBe(0)
    })

    it('should handle large number of events', () => {
      const events: ScoreEvent[] = Array(17).fill(null).map(() => ({
        playerId: '1',
        type: 'I' as const,
      }))

      const score = calculatePlayerScore(events)
      expect(score.plusClusters).toBe(4)
      expect(score.plusRemainder).toBe(1)
      expect(score.netScore).toBe(4)
    })

    it('should handle remainder boundaries for plus (0, 1, 2, 3)', () => {
      expect(calculatePlayerScore([]).plusRemainder).toBe(0)
      expect(calculatePlayerScore([{ playerId: '1', type: 'I' }]).plusRemainder).toBe(1)
      expect(calculatePlayerScore([{ playerId: '1', type: 'I' }, { playerId: '1', type: 'I' }]).plusRemainder).toBe(2)
      expect(calculatePlayerScore([
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
      ]).plusRemainder).toBe(3)
    })

    it('should handle remainder boundaries for minus (0, 1, 2, 3)', () => {
      expect(calculatePlayerScore([]).minusRemainder).toBe(0)
      expect(calculatePlayerScore([{ playerId: '1', type: 'X' }]).minusRemainder).toBe(1)
      expect(calculatePlayerScore([{ playerId: '1', type: 'X' }, { playerId: '1', type: 'X' }]).minusRemainder).toBe(2)
      expect(calculatePlayerScore([
        { playerId: '1', type: 'X' },
        { playerId: '1', type: 'X' },
        { playerId: '1', type: 'X' },
      ]).minusRemainder).toBe(3)
    })

    it('should calculate negative net scores', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'X' },
        { playerId: '1', type: 'X' },
        { playerId: '1', type: 'X' },
        { playerId: '1', type: 'X' },
      ]

      const score = calculatePlayerScore(events)
      expect(score.minusClusters).toBe(1)
      expect(score.netScore).toBe(-1)
    })

    it('should handle very large event counts', () => {
      const events: ScoreEvent[] = Array(101).fill(null).map(() => ({
        playerId: '1',
        type: 'I' as const,
      }))

      const score = calculatePlayerScore(events)
      expect(score.plusClusters).toBe(25)
      expect(score.plusRemainder).toBe(1)
      expect(score.netScore).toBe(25)
    })

    it('should handle mixed remainders', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'X' },
        { playerId: '1', type: 'X' },
        { playerId: '1', type: 'X' },
      ]

      const score = calculatePlayerScore(events)
      expect(score.plusRemainder).toBe(2)
      expect(score.minusRemainder).toBe(3)
      expect(score.plusClusters).toBe(0)
      expect(score.minusClusters).toBe(0)
      expect(score.netScore).toBe(0)
    })

    it('should handle initial remainders at boundaries', () => {
      const events: ScoreEvent[] = [{ playerId: '1', type: 'I' }]

      // Initial remainder 0
      const score0 = calculatePlayerScore(events, { plus: 0, minus: 0 })
      expect(score0.plusRemainder).toBe(1)

      // Initial remainder 3
      const score3 = calculatePlayerScore(events, { plus: 3, minus: 0 })
      expect(score3.plusClusters).toBe(1)
      expect(score3.plusRemainder).toBe(0)
    })
  })

  describe('calculateTournamentScores', () => {
    it('should calculate scores for multiple players', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '2', type: 'X' },
        { playerId: '2', type: 'X' },
        { playerId: '2', type: 'X' },
        { playerId: '2', type: 'X' },
      ]

      const scores = calculateTournamentScores(events, ['1', '2'])
      expect(scores['1'].plusClusters).toBe(1)
      expect(scores['2'].minusClusters).toBe(1)
      expect(scores['1'].netScore).toBe(1)
      expect(scores['2'].netScore).toBe(-1)
    })

    it('should handle empty player list', () => {
      const scores = calculateTournamentScores([], [])
      expect(Object.keys(scores)).toHaveLength(0)
    })

    it('should handle players with no events', () => {
      const scores = calculateTournamentScores([], ['1', '2'])
      expect(scores['1'].plusClusters).toBe(0)
      expect(scores['1'].minusClusters).toBe(0)
      expect(scores['1'].netScore).toBe(0)
      expect(scores['2'].plusClusters).toBe(0)
      expect(scores['2'].minusClusters).toBe(0)
      expect(scores['2'].netScore).toBe(0)
    })

    it('should handle multiple players with mixed scores', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '2', type: 'X' },
        { playerId: '2', type: 'X' },
        { playerId: '3', type: 'I' },
        { playerId: '3', type: 'I' },
      ]

      const scores = calculateTournamentScores(events, ['1', '2', '3'])
      expect(scores['1'].netScore).toBe(1)
      expect(scores['2'].netScore).toBe(0) // 2 X's = remainder only
      expect(scores['3'].netScore).toBe(0) // 2 I's = remainder only
    })

    it('should handle initial remainders for multiple players', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
        { playerId: '2', type: 'X' },
      ]

      const initialRemainders = {
        '1': { plus: 3, minus: 0 },
        '2': { plus: 0, minus: 3 },
      }

      const scores = calculateTournamentScores(events, ['1', '2'], initialRemainders)
      expect(scores['1'].plusClusters).toBe(1)
      expect(scores['1'].plusRemainder).toBe(0)
      expect(scores['2'].minusClusters).toBe(1)
      expect(scores['2'].minusRemainder).toBe(0)
    })

    it('should handle tournament with single player', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
      ]

      const scores = calculateTournamentScores(events, ['1'])
      expect(scores['1'].plusClusters).toBe(1)
      expect(scores['1'].netScore).toBe(1)
    })
  })

  describe('aggregateEventsByPlayer', () => {
    it('should handle empty events array', () => {
      const result = aggregateEventsByPlayer([])
      expect(Object.keys(result)).toHaveLength(0)
    })

    it('should aggregate events for single player', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'X' },
      ]

      const result = aggregateEventsByPlayer(events)
      expect(result['1']).toHaveLength(3)
      expect(result['1'][0].type).toBe('I')
      expect(result['1'][1].type).toBe('I')
      expect(result['1'][2].type).toBe('X')
    })

    it('should aggregate events for multiple players', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
        { playerId: '2', type: 'X' },
        { playerId: '1', type: 'I' },
        { playerId: '3', type: 'I' },
      ]

      const result = aggregateEventsByPlayer(events)
      expect(result['1']).toHaveLength(2)
      expect(result['2']).toHaveLength(1)
      expect(result['3']).toHaveLength(1)
    })

    it('should group events with same player ID correctly', () => {
      const events: ScoreEvent[] = [
        { playerId: '1', type: 'I' },
        { playerId: '1', type: 'X' },
        { playerId: '1', type: 'I' },
        { playerId: '2', type: 'I' },
        { playerId: '1', type: 'X' },
      ]

      const result = aggregateEventsByPlayer(events)
      expect(result['1']).toHaveLength(4)
      expect(result['2']).toHaveLength(1)
    })
  })
})
