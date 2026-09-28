# TESTING.md — Financial Tracker Mobile App

Testing approach for this project. Since this is an early-stage MVP, focus
is on manual QA + targeted backend unit tests first; expand automated
coverage as the app stabilizes (see "Growing this" at the bottom).

---

## Backend (FastAPI)

### Unit tests
- Framework: `pytest` + `pytest-asyncio` + `httpx` (for async test client)
- Location: `/backend/tests/`
- Priority areas (test these first, before UI polish):
  - **Money math** — expense/savings totals must never lose precision.
    Test `Decimal` handling explicitly, not just "looks right" spot checks.
  - **Monthly/yearly aggregation queries** — edge cases: expenses spanning
    month boundaries, empty months, leap years, timezone-of-date edge cases.
  - **Auth** — token generation/validation, expired token rejection,
    refresh token rotation, password hashing (never comparing plaintext).
  - **Receipt → expense linkage** — confirm one receipt always produces
    exactly one expense row, deleting a receipt cascades to its items.

### Running backend tests
```bash
cd backend
pytest                      # run all
pytest -k "test_expenses"   # run a specific area
pytest --cov=app            # with coverage report
```

### API smoke test
Before shipping any backend change, hit the interactive docs
(`http://localhost:8000/docs`) and manually exercise the changed endpoint(s)
end to end — register → login → the new/changed route.

---

## Mobile (Expo)

Automated mobile testing is **not required for v1** — prioritize manual QA
on real devices (simulators can miss camera/biometric/notification behavior
entirely). Add component tests later if the codebase grows past MVP size.

### Manual QA checklist — run this before every phase demo

**Onboarding & Auth**
- [ ] First open (no account) shows onboarding carousel, not a blank/login screen
- [ ] Carousel is skippable and always routes back to Register
- [ ] Register with valid data succeeds
- [ ] Register with an already-used email shows a clear error
- [ ] Login with correct credentials succeeds
- [ ] Login with wrong password shows a clear error (not a crash)
- [ ] Token persists after closing and reopening the app (stays logged in)

**Receipts & OCR**
- [ ] Camera capture works on a real device
- [ ] Gallery picker works
- [ ] Upload triggers OCR and shows a loading state (not a frozen screen)
- [ ] Parsed items/total are shown on a review screen; incomplete OCR prompts a safe rescan
- [ ] Saving a reviewed receipt updates the dashboard total
- [ ] A second receipt uploaded the next day correctly adds to the same month's total
- [ ] A blurry/low-quality receipt image doesn't crash the app — shows a clear rescan/error state

**Manual Expenses**
- [ ] Manual entry form validates amount (no negative, no non-numeric)
- [ ] Manual entry appears correctly in the expense list and monthly total

**Reports**
- [ ] Monthly total matches the sum of visible entries for that month
- [ ] Yearly total matches the sum of all months in that year
- [ ] Switching months/years updates the view correctly, no stale data

**Savings**
- [ ] Adding a deposit increases the balance
- [ ] Adding a withdrawal decreases the balance
- [ ] Savings balance is NOT included in expense totals

**Security**
- [ ] Biometric lock prompt appears on app resume/foreground (if enabled)
- [ ] Disabling biometric lock in settings actually disables it
- [ ] JWT expiry is handled gracefully (auto-refresh or redirect to login, not a crash)

**Notifications**
- [ ] Local-notification permission prompt appears after the user signs in
- [ ] A delivered notification appears in the Notifications inbox and opens its detail screen
- [ ] Month-end, year-end, and Philippine-holiday reminders are scheduled for 10:00 AM

**UI/Design**
- [ ] Glass effect renders correctly on iOS 26+
- [ ] Glass gracefully falls back (blur or flat) on older iOS / Android — no broken/transparent-black boxes
- [ ] All screens usable in both light and dark mode
- [ ] No layout breakage on a small screen (e.g. iPhone SE) and a large one (e.g. tablet-width Android)

---

## Growing this later

As the codebase matures past MVP, consider adding:
- Component tests for mobile (`@testing-library/react-native`)
- E2E tests (Maestro or Detox) for the core loop: scan receipt → confirm → see total
- CI pipeline running `pytest` + basic lint on every push

Not needed for v1 — don't let test infrastructure slow down shipping the
core features first.
