# PROGRESS.md — Gastify Financial Tracker Mobile App

Last updated: 2026-09-25

Status legend:
- [x] Done
- [ ] Not started
- [~] In progress
- [!] Blocked / needs attention

---

## Phase 0 — Setup
- [x] Expo + expo-router mobile scaffold
- [x] FastAPI backend scaffold
- [x] SQLite local development database
- [x] Async SQLAlchemy + Alembic
- [x] Initial schema and migrations
- [x] `users`, `receipts`, `receipt_items`, `expenses`, `savings_transactions`, `push_tokens`
- [x] Backend/mobile environment configuration
- [x] NativeWind, expo-glass-effect, expo-blur, Reanimated, Moti, Lottie, Ionicons, haptics
- [x] Reusable `GlassCard` and `GlassButton`
- [x] Liquid Glass -> Blur -> Manual fallback chain
- [x] Device-based Light/Dark theme
- [x] Self-hosted PaddleOCR selected

## Phase 1 — Authentication
- [x] User model
- [x] Argon2id password hashing
- [x] JWT access + refresh tokens
- [x] Register/login/refresh/current-user backend flow
- [x] Mobile Register screen
- [x] Mobile Login screen
- [x] SecureStore token storage
- [x] AuthProvider/session restoration
- [x] Authenticated API client + automatic refresh
- [x] Logout on refresh failure
- [x] Auth navigation guard
- [x] Registration and login verified
- [x] Login/Register Light/Dark visual language standardized
- [x] Shared `AuthBrand`, `AuthCard`, and `AuthField`
- [x] Shared glass surface and consistent auth input/button geometry
- [x] Registration safe-area/scroll behavior corrected

## Phase 2 — Pre-login Onboarding
- [x] Four English onboarding slides
- [x] Config-driven carousel
- [x] Swipe, Next, Skip, Create Account, Sign In
- [x] Subtle parallax + spring motion
- [x] Receipt, expense, savings, and security Lottie animations
- [x] Single cross-theme animation per slide
- [x] Device-based Light/Dark support
- [x] TypeScript and lint checks passed

## Phase 3 — Receipts & OCR

### Database and OCR
- [x] Receipt and receipt-item models
- [x] Receipt-linked Expense model
- [x] Fractional quantity migration (`NUMERIC(12,3)`)
- [x] Self-hosted PaddleOCR
- [x] Windows MKLDNN/oneDNN workaround
- [x] Real PETRON receipt OCR test
- [x] Raw OCR text/confidence/line retention

### Parser
- [x] Provider-independent receipt parser
- [x] Merchant/date/time/reference parsing
- [x] Item/quantity/unit-price/amount parsing
- [x] Subtotal/tax/discount/total parsing
- [x] Payment/tendered/change parsing
- [x] Parser confidence and warnings
- [x] Robust OCR header matching including `Desaiption`
- [x] Printed receipt amount preserved without forcing `qty * unit_price`

### Draft and confirmation
- [x] Authenticated `POST /api/v1/receipts/parse`
- [x] JPEG/PNG/WebP support and 10 MB limit
- [x] UUID user-scoped private drafts
- [x] Source image + `ocr.json` draft persistence
- [x] Read-only parsed draft response with confirm/rescan safeguards
- [x] Authenticated `POST /api/v1/receipts/confirm`
- [x] Receipt + ReceiptItems + linked Expense transaction
- [x] `Expense.amount` as canonical confirmed total
- [x] Raw OCR retained
- [x] Permanent private image storage
- [x] Rollback/storage cleanup behavior
- [x] Successful draft cleanup after confirmation

### Mobile capture and review
- [x] Expo image picker
- [x] Camera + gallery
- [x] Image preview
- [x] Authenticated multipart parse request
- [x] MIME normalization / unsupported-media handling
- [x] ReceiptDraftProvider
- [x] Receipt-style Review screen
- [x] Read-only merchant/date/items/quantity/unit price/total presentation
- [x] Persistent Liquid Glass Confirm action
- [x] Mobile confirmation integration
- [x] Draft cleared only after successful save
- [x] Physical-iPhone scan -> OCR -> review -> confirm verified
- [x] HTTP 201 confirmation verified
- [x] Mobile-created Receipt/ReceiptItem/Expense verified in DB
- [x] Permanent image exists and draft directory removed

### Receipt history/detail
- [x] Authenticated user-scoped receipt history API
- [x] Receipt history connected to Receipts screen
- [x] Receipt count, merchant, date, total, category displayed
- [x] Uncategorized fallback
- [x] Refresh action
- [x] Physical-iPhone receipt-history GET returns 200
- [x] Hidden `receipt-detail` route registered
- [x] Receipt detail/drill-down screen
- [x] Display saved receipt items in detail
- [x] Display linked expense total/category/note in detail
- [ ] Add authenticated private receipt-image access if detail should show the image

### Phase 3 UI/regression
- [x] Receipts scan/history layout refined
- [x] Light/Dark theme support
- [~] Liquid Glass consistency audit
- [x] Final receipt-detail UI
- [x] Final Phase 3 TypeScript/lint regression check

Core lifecycle verified:
`camera/gallery -> authenticated upload -> PaddleOCR -> parser -> read-only review -> confirm -> Receipt + ReceiptItems + Expense -> private permanent storage -> receipt history`

**Phase 3 complete — 2026-09-25.** Private receipt-image rendering is deferred; receipt detail remains private metadata/item-only for this release.

## Phase 4 — Expenses & Aggregation
- [x] `expenses` table/model
- [x] Receipt-linked expense foundation and `source` field
- [x] Manual expense POST endpoint
- [x] Expense list API foundation
- [ ] Monthly report endpoint
- [ ] Yearly report endpoint
- [x] Manual expense form
- [~] Expenses list (day/month/year filters pending)
- [x] Dashboard monthly-total GlassCard
- [x] Quick Scan Receipt / Manual Expense actions
- [ ] Monthly/yearly charts
- [ ] Expense save/success haptics

## Phase 5 — Savings
- [x] `savings_transactions` table/model
- [ ] Savings transaction API
- [ ] Savings balance/history API
- [ ] Savings screen
- [ ] Deposit/withdraw flows
- [ ] Savings history

## Phase 6 — Security & Device Features
- [x] `push_tokens` table/model
- [x] PIN-gated app lock
- [x] Biometric app lock
- [x] Settings biometric toggle
- [ ] Push-token registration
- [x] Local notification permission flow
- [x] Monthly/year-end local expense-summary reminders
- [x] Philippine holiday local reminders (2026–2027 published nationwide dates)
- [ ] Foreground/background notification handling

## Phase 7 — Polish
- [ ] Expense/savings empty states
- [~] Loading/error states
- [~] Input validation audit
- [ ] App icon and final splash/config audit
- [x] Floating Liquid Glass tab-bar treatment
- [ ] Appropriate modal/bottom-sheet glass treatment
- [~] Liquid Glass consistency audit
- [ ] Older-iOS/Android glass fallback tests
- [ ] Full Light/Dark visual regression
- [ ] Full mobile TypeScript/lint check
- [ ] Backend regression testing

---

## Decisions Log
- 2026-09-23 — SQLite selected for local development.
- 2026-09-23 — JWT access/refresh authentication selected.
- 2026-09-23 — Savings remains manual for v1; no bank/Open Banking integration.
- 2026-09-23 — Liquid Glass uses `expo-glass-effect` with blur/manual fallbacks.
- 2026-09-24 — Onboarding finalized as four English slides with one cross-theme Lottie per slide.
- 2026-09-24 — Device appearance controls Light/Dark mode; no manual toggle.
- 2026-09-24 — Self-hosted PaddleOCR selected instead of paid cloud OCR.
- 2026-09-24 — PaddleOCR local Windows setup uses `enable_mkldnn=False`.
- 2026-09-24 — Receipt parsing remains OCR-provider-independent.
- 2026-09-24 — Receipt drafts are private/user-scoped and require confirmation before DB persistence.
- 2026-09-24 — `Expense.amount` is the canonical confirmed receipt total.
- 2026-09-24 — Receipt quantities support three decimal places.
- 2026-09-25 — Physical-iPhone receipt lifecycle verified through DB and permanent storage.
- 2026-09-25 — Receipt history added to the authenticated Receipts screen.
- 2026-09-25 — Login/Register standardized around shared `AuthBrand`, `AuthCard`, and `AuthField`.
- 2026-09-25 — Shared UI primitives are preferred over independent screen-specific glass styling.
- 2026-09-25 — Main navigation uses a floating Liquid Glass dock with an animated active capsule and shared GlassView/Blur/manual fallback chain.
- 2026-09-25 — Restored `receipts.tsx` as the scan and receipt-history screen; saved-history cards are the only entry point to `receipt-detail.tsx`.
- 2026-09-25 — Receipt review is a read-only, receipt-style confirmation screen with a persistent header Confirm action; category and note are omitted from receipt confirmation.
- 2026-09-25 — Receipt history supports swipe-left deletion with explicit confirmation; deletion removes the user-scoped receipt, linked expense/items, and private receipt-image directory.
- 2026-09-25 — Receipt history supports edit-mode multi-select deletion and coordinated swipe actions (one open row at a time; pull-to-refresh closes open rows).
- 2026-09-25 — Saved receipt detail was redesigned as a Liquid Glass receipt surface with itemized totals and compact metadata.
- 2026-09-25 — Restored a compatibility `Colors` palette for unused Expo starter themed components so the project-wide TypeScript check can pass.
- 2026-09-25 — Phase 3 marked complete; Phase 4 began with authenticated manual expense creation and a Liquid Glass mobile form.
- 2026-09-25 — Successful manual entries clear the form and open the All Expenses list, which shows manual and receipt-sourced expenses.
- 2026-09-25 — Home replaced the temporary auth test screen with a Liquid Glass dashboard, monthly spending snapshot, quick actions, and recent-expense preview.
- 2026-09-25 — Profile now supports a SecureStore-backed 4–6 digit app PIN and optional device biometric unlock; the app locks on foreground after a PIN is created.
- 2026-09-25 — Profile PIN fields use a keyboard-avoiding, scrollable layout so the active input stays reachable above the keyboard.
- 2026-09-25 — App-lock state is resolved behind a neutral loading screen before routes mount, preventing onboarding or Home from flashing before PIN unlock.
- 2026-09-25 — The unlock screen now shifts above the numeric keyboard and dismisses it before PIN or biometric authentication is submitted.
- 2026-09-25 — App unlock was redesigned as a username-led Liquid Glass PIN keypad with biometric unlock; it intentionally has no account-switching, phone-number, or background-person imagery.
- 2026-09-25 — The lock UI uses the device number keyboard again; biometric prompts suppress their temporary foreground event so a successful unlock does not immediately relock.
- 2026-09-25 — When biometrics are enabled, the unlock screen starts with an MPIN Login Liquid Glass switch; PIN entry is shown only after the user explicitly selects it, with PIN-dot indicators removed.
- 2026-09-25 — MPIN Login now gates PIN entry in every lock state. Relocking is limited to true background-to-foreground transitions so Face ID does not cause a successful unlock to loop back to the welcome screen.
- 2026-09-25 — Primary tab headers now share the same 20px horizontal padding, 17px top spacing, 11px eyebrow, and 29px title treatment. Profile reserves dock clearance for Log out.
- 2026-09-25 — The PIN/biometric lock screen is theme-aware in light and dark modes, including text, glass surfaces, controls, loading state, and background glows.
- 2026-09-25 — Notifications tab is a user inbox only: received local notifications are retained securely on-device and each item opens a dedicated Liquid Glass detail screen. Scheduling is kept out of the inbox UI.

## Known Risks / Open Questions
- OCR accuracy varies across faded, crumpled, handwritten, and unusual receipt layouts; the current read-only review sends incomplete OCR results back to a rescan flow.
- More real-world merchant samples will be needed to harden parser rules.
- Production receipt-image storage strategy must be selected before deployment.
- Push-notification/Expo development-build requirements should be rechecked in Phase 6.
- Remote push delivery and server-computed notification bodies remain future work; local reminders work on-device, while Expo Go requires a development build for remote push support.
- PHP currency formatting should remain consistent across receipts, expenses, reports, and savings.
- Liquid Glass must be validated on supported iOS and fallback environments.

## Next Up
1. Add day/month/year filtering to All Expenses.
2. Implement monthly/yearly report endpoints and charts.
3. Build the Phase 5 savings API and screens.
