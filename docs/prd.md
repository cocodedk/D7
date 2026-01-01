# D7 Card Game – Product Requirements & Functional Specification

## 1. Purpose & Scope

This document defines the **complete product requirements and functional specifications** for the D7 Card Game web application.

The application digitizes a **manual, paper-based scoring system** used in the D7 card game. The system is designed to be **admin-operated**, **mobile-first**, and **error-resistant**, with a strong emphasis on **correct scoring**, **auditability**, and **speed of use during live games**.

This PRD intentionally avoids speculative features. Anything not explicitly defined here is **out of scope** for version 1.

---

## 2. Product Vision

D7 is a **scoring instrument**, not a social platform.

It should feel like:

* a calculator
* a cash register
* a referee’s notebook

The app must:

* minimize mistakes
* prevent silent corruption of scores
* preserve memories (comments + photos) without blocking gameplay

---

## 3. User Roles

### 3.1 Admin (Only Role)

There is exactly **one role** in the system.

Admin capabilities:

* authenticate
* manage players
* create and control tournaments
* record games
* view results

There are:

* no player logins
* no permissions matrix
* no public access

---

## 4. Core Game & Scoring Model (Authoritative)

### 4.1 Atomic Units

| Symbol | Meaning        |
| ------ | -------------- |
| `I`    | +1 atomic unit |
| `X`    | −1 atomic unit |

Atomic units are the **only** score inputs allowed.

---

### 4.2 Cluster Rule

* Atomic units accumulate per player
* **4 identical atomic units form one cluster**

| Cluster | Result             |
| ------- | ------------------ |
| `IIII`  | +1 point           |
| `XXXX`  | −1 point           |
| mixed   | invalid (0 points) |

Mixed clusters (e.g. `XXII`) **never score**.

---

### 4.3 Carry-Over

* Partial clusters (1–3 atomic units) are retained
* Carry-over **persists across games**
* Carry-over **resets per tournament**

---

### 4.4 Polarity Handling (Locked Rule)

* Plus (`I`) and minus (`X`) are tracked **independently**
* They never cancel each other

Each player maintains:

* `plus_remainder` (0–3)
* `minus_remainder` (0–3)

This removes ambiguity and ensures deterministic scoring.

---

### 4.5 Derived Scoring

* Cluster totals are **derived**, never manually edited
* Net score is **computed**, never stored

This guarantees auditability.

---

## 5. Tournament Lifecycle

### 5.1 Tournament States

A tournament is always in exactly one state:

1. **Draft**

   * Players editable
   * No games allowed

2. **Active**

   * Players locked
   * Games allowed

3. **Closed**

   * No new games allowed
   * Scores frozen
   * Used for historical and yearly aggregation

---

### 5.2 Tournament Rules

* Only **one Active tournament** may exist at any time
* Transition rules:

  * Draft → Active (explicit start)
  * Active → Closed (explicit termination)
* Closing a tournament is **irreversible**

Closing requires:

* typing the tournament name to confirm

---

## 6. Functional Requirements

### 6.1 Authentication

* Single admin password
* Password stored in Netlify environment variables
* No client-side secrets

---

### 6.2 Player Management

Admin can:

* create player
* edit player
* soft-delete player

Player fields:

* full name (required)
* nickname (required)
* avatar/photo (optional)

Avatar rules:

* uploaded from camera or gallery
* never required
* used only for visual identification

---

### 6.3 Tournament Management

Admin can:

* create tournament
* name tournament
* add/remove players (Draft only)
* start tournament
* close tournament

---

### 6.4 Game Creation (Critical Path)

A **game** represents a batch of atomic scoring events.

#### 6.4.1 Two-Phase Save Model (Mandatory)

**Phase 1 – Staging**

* All `I` / `X` taps are stored locally
* No database writes

**Phase 2 – Confirmation**

* Save triggers a mandatory confirmation screen

---

#### 6.4.2 Confirmation Screen Requirements

The confirmation view must show:

* tournament name
* timestamp
* per-player atomic summary
* irreversible warning
* optional comment field
* optional photo capture/upload

Confirm button rules:

* disabled if no atomic events exist
* explicit “Confirm & Save” action required

---

### 6.5 Game Immutability

Once saved:

* games cannot be edited
* scores cannot be modified

Optional safeguard:

* admin may undo **last saved game** within 60 seconds

---

### 6.6 Game Comments & Photos

Each game may include:

* comment (max 500 chars)
* single photo

Rules:

* photo upload must not block save
* photo upload retries in background
* game exists even if photo fails

---

### 6.7 Results & Reporting

#### Tournament Results

* plus clusters
* minus clusters
* net score

#### Yearly Results

* aggregated by calendar year
* based on game timestamps

---

## 7. Non-Functional Requirements

### Performance

* optimized for mobile (375px baseline)
* sub-100ms perceived latency for taps

### Reliability

* append-only score events
* no destructive writes

### Security

* admin-only access
* no exposed secrets

---

## 8. Data Storage

### Database

* PostgreSQL (Neon)

### Storage

* external object storage for photos

---

## 9. High-Level Data Model

### Player

* id
* name
* nickname
* avatar_url
* created_at

### Tournament

* id
* name
* state
* started_at
* closed_at

### Game

* id
* tournament_id
* comment
* photo_url
* created_at

### ScoreEvent

* id
* game_id
* player_id
* type (`I` | `X`)
* created_at

---

## 10. UX Principles (Non-Negotiable)

* mobile-first
* large tap targets
* minimal navigation
* no silent actions
* explicit confirmation for irreversible steps

---

## 11. Out of Scope (v1)

* player accounts
* multiple admins
* public leaderboards
* social sharing
* editing historical games

---

## 12. Acceptance Criteria

The product is acceptable when:

* scoring matches manual system exactly
* admin cannot accidentally corrupt scores
* tournaments enforce lifecycle rules
* mobile usage feels fast and safe

---

## 13. Implementation Guidance (Opinionated)

* event-sourced scoring
* derived aggregates only
* build scoring engine first
* UI before optimization

---

**This document is the single source of truth for D7 v1.**
