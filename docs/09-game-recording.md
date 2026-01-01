# Game Recording (Critical Path)

## Two-Phase Save Model

### Phase 1: Staging
- All I/X taps stored in **local React state**
- No database writes
- Visual feedback on each tap
- Can undo/clear before saving

### Phase 2: Confirmation
- Mandatory confirmation screen
- Shows complete summary
- Optional comment and photo
- Explicit "Confirm & Save" action

## Staging Interface

- Large tap targets for I and X
- Per-player counters
- Visual remainder indicators (0-3)
- Clear/Reset button
- Save button (disabled if no events)

## Confirmation Screen

### Required Display
- Tournament name
- Timestamp (when save initiated)
- Per-player atomic summary (I count, X count)
- Irreversible warning message

### Optional Fields
- Comment (max 500 chars, textarea)
- Photo (camera or gallery upload)

### Actions
- "Confirm & Save" (primary, disabled if no events)
- "Cancel" (returns to staging)

## Save Process

1. User taps "Save" → Confirmation screen
2. User reviews summary
3. Optionally adds comment/photo
4. Taps "Confirm & Save"
5. API call: `POST /api/games` with events array
6. Success → Clear staging, return to dashboard
7. Error → Show message, stay on confirmation

## Photo Upload

- Non-blocking: game saves even if photo fails
- Background retry mechanism
- Photo stored as BYTEA in PostgreSQL
- Display as data URI when viewing game

## Undo Safeguard

- Last saved game can be deleted within 60 seconds
- Shows undo notification after save
- Hard delete (removes game and all score_events)
