# 7. Long-press reschedule shortcut, not free-form drag

- **Status:** Accepted
- **Date:** 2026-07-23

## Context

The Phase 2 roadmap (and the original brief) called for "drag to reschedule". The day timeline, however, is a flex-stacked list of cards (`TimelineNode`s in a `ScrollView`) — blocks are not positioned by an absolute pixel-per-minute mapping the way a calendar-grid UI (Google Calendar, Structured's own week view) is. Real free-form dragging needs that grid: a ruler, blocks positioned by `top: startMinute * pxPerMinute`, drag gestures that translate pixel deltas back into minutes, auto-scroll while dragging near the edges of the `ScrollView`, and collision/snap behavior. That's a real redesign of the timeline's rendering model, not an incremental addition to the current card list.

## Decision

Ship the *outcome* — reschedule a block quickly, without opening the full form — as a **long-press action sheet** instead of a drag gesture: "Adelantar 15 min" / "Atrasar 15 min" / "Editar horario completo". Implemented with `Alert.alert` (already used for the delete confirmation) and a small pure function, `shiftBlockTime`, that shifts `[startMinute, endMinute)` by a delta while preserving duration and clamping to the day.

This was also a deliberate fit with [ADR 4](0004-focus-first-design-for-attention.md), not just a shortcut to avoid engineering cost: dragging is a sustained fine-motor interaction (hold, track pixel movement, release precisely) that can be *more* effortful for someone with attention or motor-control difficulty than two tap targets in a menu. The reduced-choice, low-friction quick action is arguably the better fit for this app's stated audience, not just the cheaper build.

## Consequences

- No new gesture-handler dependency, no risk of fighting the `ScrollView`'s own pan responder, no drag physics to get right without a device to iterate on live.
- Rescheduling a recurring block shifts the whole series (same rule as edit/delete — see ADR 5), because the shortcut patches the template's `id` regardless of which projected occurrence was long-pressed. The action sheet says so explicitly when `recurrenceId` is set.
- Notifications are cancelled and rescheduled after a shift, mirroring what `block-form.tsx` already does on save (`useRescheduleBlock`).
- **Revisit if:** the timeline ever moves to an absolute-position grid (e.g. for the week view's day columns) — free-form drag becomes natural at that point and this shortcut can stay as a fast keyboard/no-drag alternative rather than being replaced outright.
