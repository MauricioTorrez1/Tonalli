# 4. Focus-first design for attention (ADHD)

- **Status:** Accepted, partially superseded by [ADR 10](0010-animation-allowlist.md) and [ADR 11](0011-structured-visual-language.md)
- **Date:** 2026-07-22

> **Amendment (2026-07-24):** the "≤ 2 animations per view" limit and the
> "nothing over 500 ms" rule below are replaced by the allowlist and the two
> structural limits in [ADR 10](0010-animation-allowlist.md). The principle
> they were trying to express — motion with purpose, never decoration — is
> unchanged.

> **Amendment (2026-07-25):** the reduced-choice principle is relaxed in two
> specific places by [ADR 11](0011-structured-visual-language.md) and
> [ADR 12](0012-free-form-block-colors.md): the icon set roughly doubles and
> gains a search field, and block colors become free-form rather than a fixed
> six. Every other part of this ADR — one focus at a time, low cognitive load,
> reduce-motion — is unchanged.

## Context

A core goal of TonalliBlock is to help people with ADHD, or anyone who struggles
to hold attention. This is a design constraint, not a nice-to-have, and it
creates a real tension: animation makes an app feel alive, but poorly-used motion
is exactly what steals attention from those who have least to spare.

## Decision

Govern all UI by the rule **motion with purpose, never decoration**, plus:

| Principle | Implementation |
| --- | --- |
| One focus at a time | Only the *current* block is highlighted; all other states are muted. |
| ≤ 2 animations per view | A staggered entrance and the "now" indicator. Nothing else moves. No background or looping motion. |
| Motion that informs | Animations signal *where you are in the day*, reinforcing temporal orientation. |
| Respect reduce-motion | `useReducedMotion` (via `AccessibilityInfo`) replaces animation with instant state. |
| Low cognitive load | Minimal single column, generous whitespace, clear type hierarchy. |
| Short durations | 150–300 ms, ease-out; nothing over 500 ms. |
| Calming palette | Warm earth tones (sand / terracotta / sage). Earth tones lower arousal. |

## Notes

- Animation uses **React Native Reanimated**, not GSAP. The `ui-ux-pro-max`
  design skill was consulted for direction, but its GSAP snippets (web) and its
  teal+orange palette suggestion were rejected where they conflicted with the RN
  stack and the Tonalli identity. The skill advises; the project decides.
- Every node exposes an `accessibilityLabel` with temporal context
  ("Deep work, de 9:00 a 11:00, en curso") for screen readers.
- Contrast target: AA floor, AAA (7:1) on primary text.
