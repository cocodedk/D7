# Scoring Engine

## Core Logic

The scoring engine is the **foundation** of the application. It must be:
- Pure functions (no side effects)
- Deterministic
- Testable
- Event-sourced

## Key Functions

### Calculate Player Score

```typescript
interface PlayerScore {
  plusRemainder: number;  // 0-3
  minusRemainder: number; // 0-3
  plusClusters: number;
  minusClusters: number;
  netScore: number;
}

function calculatePlayerScore(
  events: ScoreEvent[],
  initialRemainders?: { plus: number; minus: number }
): PlayerScore
```

### Cluster Formation

- 4 identical units (`I` or `X`) = 1 cluster
- Mixed units never cluster
- Remainders persist (0-3)

### Tournament Aggregation

- Sum all score_events for a tournament
- Calculate per-player totals
- Derive net scores (never stored)

## Implementation Rules

1. **No cancellation**: Plus and minus tracked independently
2. **Carry-over**: Remainders persist across games within tournament
3. **Derived values**: Clusters and net scores computed, never stored
4. **Event-sourced**: All calculations from raw events

## Testing Requirements

- Unit tests for cluster formation
- Unit tests for remainder carry-over
- Integration tests for tournament aggregation
- Edge cases: empty events, large datasets
