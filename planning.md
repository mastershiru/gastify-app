# PLANNING.md — Financial Tracker Mobile App

High-level roadmap and sequencing rationale. For technical specs see
`agents.md`; for granular task-level status see `Gastify_progress_2026-09-25.md`. This file
answers "what order, why this order, and roughly how long."

---

## Roadmap (sequential — each phase builds on the one before it)

| # | Phase | Depends on | Est. time* |
|---|---|---|---|
| 0 | Setup — project scaffold, DB schema, UI/animation stack | — | 2–3 days |
| 1 | Auth — register, login, JWT | Phase 0 | 3–4 days |
| 2 | Onboarding — pre-login carousel, catchy CTA | Phase 0, 1 | 3–5 days |
| 3 | Receipts & OCR — scan, parse, confirm | Phase 0, 1 | 1–1.5 weeks |
| 4 | Expenses & Reports — manual entry, monthly/yearly totals | Phase 3 | 4–6 days |
| 5 | Savings — manual balance tracker | Phase 1 | 2–3 days |
| 6 | Security & Alerts — PIN/biometric lock, local notifications | Phase 1 | 4–5 days |
| 7 | Polish — empty states, glass finishing, edge cases | All above | 3–5 days |

*_Rough estimate for a solo/part-time developer already comfortable with the
stack. Double it if learning Expo/FastAPI/OCR integration along the way._

**Total: roughly 5–7 weeks part-time** to a complete, polished v1.

---

## Why this order

1. **Phase 0 and 1 are non-negotiable first** — nothing else can be tested
   without a running project and a logged-in user.
2. **Phase 2 (Onboarding) comes early, ahead of some "core" features** —
   this is the first thing every new user sees, and it's the deciding
   factor in whether they bother registering at all. Worth locking down the
   visual polish (glass cards, Lottie illustrations, carousel motion) while
   the rest of the app is still simple, rather than bolting it on at the end.
3. **Phase 3 (Receipts & OCR) is the single hardest phase** — OCR accuracy on
   real-world Philippine receipts (faded thermal paper, handwritten sari-sari
   store receipts) is unpredictable. It gets the largest time buffer and
   should NOT be scheduled back-to-back with another hard phase.
4. **Phase 4 depends on Phase 3** because expenses need the `receipts` /
   `receipt_items` tables and the "source: receipt vs manual" logic already
   in place — building monthly/yearly aggregation before receipts exist means
   re-testing it twice.
5. **Phase 5 (Savings) is intentionally late but easy** — it only needs Auth,
   is simple CRUD, and is a good "breather" phase after the OCR grind.
6. **Phase 6 (Security & Alerts) needs a working Auth + a reason to notify
   (expenses/savings must exist first)** — also has physical-device testing
   quirks (biometrics, push tokens) that are easier to debug once the rest of
   the app already works, rather than chasing native-module issues early.
7. **Phase 7 (Polish) is last on purpose** — glass effects, empty states, and
   fallback behavior are easiest to get right once every screen they apply to
   already exists.

---

## Risk-aware scheduling notes

- **Don't parallelize Phase 3 and Phase 6** if working solo — both involve
  unpredictable native/device behavior (OCR edge cases, biometric APIs,
  physical push-notification testing) and context-switching between two hard
  problems slows both down.
- **Build the "review/edit before save" screen in Phase 3 from day one** —
  don't treat OCR as needing 100% accuracy; the UX safety net matters more
  than parsing perfection.
- **Test push notifications and biometrics on a real device early in Phase 6**
  — some behavior doesn't fully surface in Expo Go and may need a development
  build; confirm this against current Expo docs before assuming Expo Go is
  sufficient (see `Gastify_progress_2026-09-25.md` → Known Risks).

---

## Milestone checkpoints (good moments to demo / get feedback)

- **After Phase 2**: show the onboarding flow to a few target users before
  writing a single line of receipt-parsing code — cheap to validate the
  "hook" early.
- **After Phase 4**: first fully usable loop (scan or manually add an
  expense → see it reflected in monthly total). This is the app's core value
  proposition, working end to end.
- **After Phase 7**: v1 complete.

---

## Out of scope for v1 (explicitly deferred)

- Bank / Open Banking integration for savings (manual entry only — see
  agents.md §6)
- Budget-threshold push alerts (nice-to-have, not required for v1)
- Category-level spend analytics beyond monthly/yearly totals
- Multi-currency support
- Web/desktop version (mobile-only for v1)
