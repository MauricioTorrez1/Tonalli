# 2. Wall-clock time model

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

A time block needs a day and a start/end time. We could store an absolute
instant (epoch UTC) or wall-clock components.

## Decision

Store **wall-clock time**: a `day` string (`YYYY-MM-DD`) plus `startMinute` and
`endMinute` as integer minutes since midnight (0–1439).

## Rationale

A block titled "Deep work 09:00" means *9am wherever the user is*. If it were
stored as an epoch instant, crossing a timezone or a daylight-saving change
would shift every block on the user's calendar — the classic calendar-app bug.
Wall-clock components are immune to this and make filtering and sorting trivial
integer comparisons.

Audit fields (`createdAt`, `updatedAt`) *are* stored as absolute epoch millis,
because those genuinely are moments in time, not wall-clock intents.

## Consequences

- Comparisons and ordering are plain integer math (`timeline-layout.ts`).
- A future "block that crosses midnight" needs explicit handling (split or an
  end < start convention) — deferred until the feature exists.
