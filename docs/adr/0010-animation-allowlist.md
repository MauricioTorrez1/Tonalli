# 10. Animation allowlist, replacing the two-per-view cap

- **Status:** Accepted
- **Date:** 2026-07-24
- **Amends:** [ADR 4](0004-focus-first-design-for-attention.md), [ADR 6](0006-vivid-category-colors-on-warm-black.md), [ADR 7](0007-reschedule-shortcut-not-drag.md)

## Context

[ADR 4](0004-focus-first-design-for-attention.md) capped the UI at "≤ 2
animations per view … Nothing else moves. No background or looping motion",
with nothing over 500 ms. That rule did its job: it kept Phase 0 and Phase 1
calm, and it is the reason this app does not feel like a productivity toy.

It also turned out to be the wrong shape of rule. A numeric cap counts
animations without asking what they are for, so it forbids press feedback —
which *reduces* uncertainty — while permitting any two decorative flourishes.
Meanwhile the app grew controls the cap could not accommodate honestly: the
day view alone now wants press feedback, a staggered entrance, a layout
transition when a block is completed, and the "now" pulse. Four. Either the
rule changes or it gets quietly broken, and a quietly broken rule is worse
than none.

## Decision

**Replace the numeric cap with an allowlist plus two structural limits.**

Motion is permitted only when it falls into one of these categories:

| Category | Example | Why it earns its place |
| --- | --- | --- |
| Press feedback | `PressableScale` dips a control to 0.97 while held | Touch has no hover state; without it a tap gives no confirmation it registered |
| State transition | The checkbox's check springs in on completion | Makes a change in state legible instead of instantaneous and easy to miss |
| Entrance | Staggered `FadeInDown` on timeline nodes | Establishes reading order on arrival |
| Layout transition | Nodes settle after a reschedule | Shows *that* something moved and *where*, instead of teleporting |
| Surface transition | Sheets sliding up, backdrop fading | Says where the surface came from, so dismissing it is obvious |
| Temporal landmark | The "now" indicator's pulse | The one continuous motion — see below |

Explicitly forbidden: decorative background loops, parallax, confetti,
celebratory bursts, anything that moves without being asked to, and anything
that moves to draw attention to something the user did not initiate.

Two structural limits replace the count:

1. **At most one continuous motion on screen at a time.**
2. **At most one animation triggered by a single user action.**

Durations stay short — 120–300 ms, ease-out — with one exception.

### The exception: the "now" pulse

The `NowIndicator` dot breathes on an infinite 2.4 s loop (scale 1 → 1.18,
opacity 1 → 0.75). This breaks both ADR 4's 500 ms ceiling and its no-loops
rule, deliberately.

"Where am I in my day" is the question the entire day view is organized
around, and as a static dot the answer had to be hunted for. The slowness is
the point: a fast pulse reads as an alarm, a slow one as a heartbeat. Worded
as a rule — *no decorative background loops; the now-indicator pulse is the
single sanctioned continuous motion.*

### Reduce-motion is not negotiable

Every animation above is gated. `src/ui/motion.tsx` subscribes to
`AccessibilityInfo` once at the root and shares the result, because the
per-component hook would open one listener per rendered control. Gated means
the animation does not run at all — the shared value is never written, the
repeat is cancelled — not that it runs faster or smaller.

## Amendments to earlier ADRs

- **ADR 4** — the "≤ 2 animations per view" row and the "nothing over 500 ms"
  line are superseded by the allowlist and the two structural limits above.
  Everything else in ADR 4 stands, including "motion with purpose, never
  decoration", which this ADR is an attempt to state precisely rather than
  numerically.
- **ADR 6** — §3 says only the current block renders as a solid fill. The
  timeline node's rail pill is filled in its category color at all times, but
  with the *soft* shade; the *solid* shade is still reserved for the current
  block. The pill is a category landmark, the solid fill remains the marker
  of "now", and the rule survives intact.
- **ADR 7** — its decision (reschedule by shortcut, not drag) stands
  unchanged. Its supporting argument that the project avoids
  `react-native-gesture-handler` no longer holds: draggable sheets require it,
  and it is now a direct dependency. Nothing about the reschedule interaction
  changes.

## Consequences

- `jest-setup.ts`'s Reanimated mock is now load-bearing infrastructure rather
  than a two-symbol stub. `__tests__/reanimated-mock.test.ts` guards it so
  drift surfaces as one named failure instead of a confusing error inside an
  unrelated component.
- NativeWind only maps `className` for components it has registered, and
  animated or wrapped components are not among them — the class is accepted,
  ignored, and dropped silently. This cost the timeline its `flex-row` and
  `opacity-60` on the web build before anyone noticed. Use
  `src/ui/AnimatedView.tsx`, or pass `style` directly, wherever an animated or
  third-party wrapper needs layout.
- Every new animation needs a category from the table above. If it does not
  fit one, that is the answer.
