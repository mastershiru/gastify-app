# AGENTS.md — Financial Tracker Mobile App

This file is the source of truth for any AI coding agent (Claude Code, Cursor, etc.)
working on this repo. Read this fully before writing code. Keep it updated when
architecture decisions change. Always update `Gastify_progress_2026-09-25.md` after completing a task.

---

## 1. Project Overview

A mobile expense & savings tracker.

**Core value prop (must be obvious on first open, before login):**
- Kunan mo lang ng litrato/i-upload ang resibo → automatic na babasahin at
  icocompute ang gastos mo. Wala nang manual typing ng items.
- Makikita agad ang monthly at yearly na total expenses.
- May savings tracker na hiwalay sa "pang-gastos" na pera.
- Secure — may Face ID / biometric lock.

**Target users:** casual users na gustong mabilis ma-track ang gastos nila
without spreadsheets, walang bank connection required (manual savings entry lang
muna dahil wala pang budget para sa Open Banking / bank API integration).

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Mobile app | Expo (React Native) + Expo Go for dev | Use Expo SDK managed workflow |
| Navigation | expo-router or React Navigation | Prefer expo-router (file-based) |
| Backend | Python FastAPI | async endpoints, Pydantic v2 |
| Database | PostgreSQL (prod) / SQLite (local dev) | via SQLAlchemy 2.0 (async) + Alembic migrations |
| Auth | JWT (access + refresh token) | bcrypt/argon2 for password hashing |
| OCR / receipt parsing | Cloud OCR API (e.g. Google Cloud Vision / Mindee / Veryfi) with local Tesseract as fallback | Backend does OCR, not the phone |
| Image storage | S3-compatible bucket (or local disk in dev) | Store receipt image + parsed JSON |
| Biometrics | `expo-local-authentication` | Face ID / fingerprint app-lock, NOT a login replacement — used as a lock screen after login |
| Notifications | `expo-notifications` local scheduled reminders now; Expo Push Service later | Remote push needs a development build |
| State mgmt (mobile) | React Query (server state) + lightweight local state (Zustand/Context) | |
| Charts | `victory-native` or `react-native-gifted-charts` | for monthly/yearly view |
| UI styling | NativeWind (Tailwind for RN) | + optionally React Native Paper for form components (login/register/manual entry) |
| Glass effect | `expo-glass-effect` (primary) + `expo-blur` (fallback) | see §10 Design System |
| Animation | `react-native-reanimated` + `Moti` | spring-based, not linear/ease |
| Onboarding illustrations | `lottie-react-native` | free assets from LottieFiles.com |
| Icons | `@expo/vector-icons` (Ionicons) | SF Symbols-style, matches iOS aesthetic |
| Haptics | `expo-haptics` | tap/success feedback |

---

## 3. Repo Structure

```
/mobile                # Expo app
  /app                 # expo-router screens
    /(onboarding)       # pre-login screens
    /(auth)             # login, register
    /(tabs)             # main app: home, expenses, savings, profile
  /components
  /hooks
  /services            # api client, auth storage, biometrics, notifications
  /store
  app.json / eas.json

/backend               # FastAPI app
  /app
    /api/v1
      auth.py
      expenses.py
      receipts.py
      savings.py
      reports.py       # monthly/yearly aggregation
      notifications.py
    /core               # config, security (jwt, hashing)
    /db
      /models           # one file per table (see §8 Database Schema)
      session.py
    /services           # ocr_service.py, receipt_parser.py
    /schemas            # Pydantic models
  /alembic
  main.py
  requirements.txt

agents.md
Gastify_progress_2026-09-25.md
```

---

## 4. Screen Flow (pre-login is critical — this is what sells the app)

### Not logged in / first open
1. **Onboarding carousel (2–4 swipeable slides)** — catchy, benefit-driven, NOT
   feature-list dump. Each slide = one clear promise:
   - Slide 1: "Kunan mo lang ng litrato ang resibo mo" — visual of receipt → scan → total.
   - Slide 2: "Makita agad ang buong buwan at taon mong gastos" — visual of chart.
   - Slide 3: "May sariling savings tracker, ligtas sa gastusin" — piggy bank visual.
   - Slide 4 (optional): "Naka-lock gamit ang Face ID" — security angle.
   - Bottom CTA persists: **"Gumawa ng Account"** (primary) / "May account na? Login" (secondary).
2. Skippable, but always endpoint back to Register.
3. This carousel data should live in a config array (not hardcoded per-screen) so
   copy can be tweaked without touching layout code.

### Auth
- Register (email/username, password, confirm)
- Login (email/password) → returns JWT access + refresh token, stored in
  `expo-secure-store` (never AsyncStorage for tokens)
- After first successful login on a device, prompt: "Enable Face ID / Fingerprint
  lock?" → optional, stored as a device-local preference.

### Main app (tabs, after login)
- **Home / Dashboard** — this month's total, quick add buttons (Scan Receipt /
  Manual Entry), recent transactions, savings snapshot.
- **Expenses** — list, filter by day/month/year, tap into a receipt to see parsed
  line items, add manual expense.
- **Savings** — current saved amount, manual add/update/withdraw log, simple goal
  note (optional field, no computation needed beyond running total).
- **Notifications** — a user inbox; each received notification opens a detail view.
- **Profile/Settings** — PIN/biometric lock toggle and logout.

---

## 5. Receipt Upload & Multi-Receipt Logic (core feature — build carefully)

1. User taps "Scan Receipt" → camera or gallery picker (`expo-image-picker`).
2. Image uploaded to `POST /api/v1/receipts` (multipart).
3. Backend runs OCR → parses into structured data:
   ```json
   {
     "merchant": "SM Supermarket",
     "date": "2026-09-22",
     "items": [
       {"name": "Rice 5kg", "price": 250.00, "qty": 1},
       {"name": "Sardines", "price": 35.00, "qty": 3}
     ],
     "total": 355.00
   }
   ```
4. Store as one `receipt` row + related `receipt_item` rows, linked to `expense`
   entry for that date.
5. **Multi-receipt combination**: expenses are grouped and summed **by day** (and
   rolled up to month/year) automatically — the user does NOT manually merge
   receipts. If user uploads a receipt today and another tomorrow, the system
   just naturally sums all receipts (+ manual entries) whose date falls in the
   same month when computing the monthly total. Do not build a separate "merge"
   feature — this is just correct aggregation logic on the backend:
   ```
   monthly_total = SUM(expense.amount) WHERE user_id = X AND date BETWEEN month_start AND month_end
   yearly_total  = SUM(expense.amount) WHERE user_id = X AND date BETWEEN year_start AND year_end
   ```
6. Item-level list is shown per receipt (drill-down), but totals are always
   computed from the `expenses` table, not re-parsed from images each time.
7. Receipt review is read-only in the current UX. If required OCR data is
   missing or invalid (for example a blurry total), block confirmation and ask
   the user to rescan rather than silently trusting or editing OCR output.

### Manual expense (no receipt)
- Simple form: amount, category (optional), date (defaults today), note.
- Saved into the same `expenses` table with `source = "manual"` and no linked
  receipt.

---

## 6. Savings Feature (simple, manual — no bank integration yet)

- User manually adds/edits a savings balance and can log
  deposits/withdrawals (each with amount + date + optional note).
- Current balance = running sum of all savings transactions.
- Explicitly NOT counted in "expenses" — it's money set aside, not spent.
- Leave the data model open (a `provider` or `source` field defaulting to
  `"manual"`) so bank-linked auto-sync can be added later without a schema
  rewrite.

---

## 7. Security & Device Features

- Passwords: hashed with bcrypt/argon2, never stored/logged in plaintext.
- JWT access token short-lived (e.g. 15–30 min), refresh token longer-lived,
  rotate on use.
- Biometric lock (`expo-local-authentication`): local device-level app lock,
  triggered on app foreground/resume — this is separate from backend auth.
- Local scheduled notifications (`expo-notifications`): month-end and year-end expense reminders at 10:00 AM, plus published Philippine nationwide-holiday reminders.
- The app retains received notifications locally for the notification inbox. Remote push and Expo push-token registration remain later work.

---

## 8. Database Schema

SQLAlchemy 2.0 async models, one file per table under `/backend/app/db/models/`.
Every table has `id` (UUID or serial PK), `created_at`, `updated_at` unless
noted. Money fields are `NUMERIC(12,2)`, never `FLOAT`. Dates are `DATE` or
`TIMESTAMPTZ` as noted.

```
users
  id                PK
  email             string, unique, not null
  username          string, nullable
  password_hash     string, not null
  created_at        timestamptz

receipts
  id                PK
  user_id           FK -> users.id
  image_url         string (S3 key or local path)
  merchant          string, nullable
  receipt_date      date
  status            enum: "pending_review" | "confirmed"
  raw_ocr_json      jsonb, nullable (full OCR response, for debugging/reprocessing)
  created_at        timestamptz

receipt_items
  id                PK
  receipt_id        FK -> receipts.id, on delete cascade
  name              string
  price              numeric(12,2)
  qty               integer, default 1

expenses
  id                PK
  user_id           FK -> users.id
  receipt_id        FK -> receipts.id, nullable  (null = manual entry)
  amount            numeric(12,2), not null      (always the source of truth for totals)
  date              date, not null
  category          string, nullable
  note              string, nullable
  source            enum: "receipt" | "manual"
  created_at        timestamptz

savings_transactions
  id                PK
  user_id           FK -> users.id
  type              enum: "deposit" | "withdraw"
  amount            numeric(12,2), not null
  date              date, not null
  note              string, nullable
  source            string, default "manual"     (keeps room for future bank-linked sync)
  created_at        timestamptz

push_tokens
  id                PK
  user_id           FK -> users.id
  expo_push_token   string, unique
  device_id         string, nullable
  created_at        timestamptz
```

**Relationships**
- `users` 1→N `receipts`, `expenses`, `savings_transactions`, `push_tokens`
- `receipts` 1→N `receipt_items` (cascade delete — deleting a receipt removes its items)
- `receipts` 1→1 `expenses` (one receipt produces exactly one expense row holding
  the aggregate total; `receipt_items` are for the item-level drill-down view only)

**Key rules**
- `expenses.amount` is always the single source of truth for monthly/yearly
  totals — never re-derive totals by summing `receipt_items` at query time.
- `receipt_items` exist purely for display (drill-down into what was bought);
  they don't feed the aggregation math directly.
- Every schema change ships with an Alembic migration in the same commit as
  the model change (see §11 Agent Working Rules).
- Savings balance is computed, not stored: `SUM(amount WHERE type='deposit') -
  SUM(amount WHERE type='withdraw')`. Don't cache a running balance column
  unless a performance need proves it necessary.

---

## 9. API Conventions

- All endpoints under `/api/v1/`.
- Auth via `Authorization: Bearer <token>` header.
- Consistent error shape: `{"detail": "message"}`.
- Pagination for list endpoints: `?page=&page_size=`.
- Dates in ISO 8601, amounts as decimal (never float) — use `Decimal` in
  Python and store as `NUMERIC` in Postgres.

---

## 10. Design System — "Liquid Glass" UI

The app's visual identity follows Apple's iOS 26 **Liquid Glass** language:
translucent, refractive glass surfaces + bouncy, spring-based motion. Goal is
for the app to feel like a native, premium iOS app — not a generic
cross-platform template.

### Glass surfaces
- **Primary: `expo-glass-effect`** — official Expo SDK package, uses native
  iOS `UIVisualEffectView`. Use `GlassView` for individual glass panels
  (cards, floating action buttons, bottom sheets, tab bar) and
  `GlassContainer` to merge multiple adjacent glass views into one unified
  glass surface (e.g. grouped icon buttons, dock-style nav).
  - Requires **iOS 26+** for the real effect. On older iOS it falls back to a
    plain `View` automatically — this is expected, do not treat it as a bug.
  - iOS/tvOS only. Included in Expo Go — no dev client needed.
- **Fallback (Android / iOS < 26): `expo-blur`** — `BlurView` with
  `intensity` + `tint` props. Wrap glass-eligible components so they degrade
  gracefully instead of showing a flat/broken surface:
  ```jsx
  {isLiquidGlassSupported
    ? <GlassView style={styles.card}>{children}</GlassView>
    : <BlurView intensity={40} tint="light" style={styles.card}>{children}</BlurView>}
  ```
- Manual glass look (when neither is visually enough, e.g. custom shapes):
  semi-transparent fill (`rgba(255,255,255,0.12–0.18)`) + 1px translucent
  border (`rgba(255,255,255,0.2)`) + large radius (16–24px) + soft shadow.
- Re-evaluate `react-native-liquid-glassmorphism` (real glass + refraction on
  Android too) only if/when the project moves off Expo Go to a custom dev
  client — do not add it while still targeting pure Expo Go.

### Motion
- Use **spring** physics (`withSpring` in Reanimated, or Moti's default),
  never linear/ease-in-out timing — this is what makes motion feel "iOS-like"
  vs robotic.
- Screen transitions: native stack navigator (expo-router) gives iOS-style
  push/pop + swipe-back for free — don't override with custom JS-driven
  transitions unless necessary.
- Onboarding carousel: `react-native-reanimated-carousel` with a subtle
  parallax on slide change.
- Micro-interactions (button press, card entrance, success checkmark): Moti
  fade/scale, kept short (150–300ms).
- Pair state-changing actions (save expense, add savings, successful login)
  with `expo-haptics` light/medium impact — reinforces the native feel beyond
  just visuals.

### Where glass applies (don't overuse it — glass should highlight key surfaces, not every box)
- Bottom tab bar
- Dashboard summary card (this month's total)
- Floating "Scan Receipt" action button
- Modals / bottom sheets (receipt review, add savings)
- NOT for: dense list rows, form inputs, body text backgrounds — keep those
  flat/solid for readability and performance.

---

## 11. Agent Working Rules

1. Before starting any task, check `Gastify_progress_2026-09-25.md` for current status.
2. After finishing a task, update `Gastify_progress_2026-09-25.md`: move item to Done, note date,
   note any follow-up/tech debt.
3. Do not introduce a new major library/service (e.g. switching OCR provider,
   adding a state manager) without noting the reason in `Gastify_progress_2026-09-25.md` under
   "Decisions".
4. Keep money math in `Decimal`/integer-cents on backend — never trust
   client-computed totals for storage.
5. Mobile app should work fully in Expo Go during development — avoid native
   modules that require a custom dev client unless there is no Expo-compatible
   alternative (check `expo-local-authentication` and `expo-notifications`
   work fine in Expo Go for most cases, but push notifications require a
   development build for full functionality on physical devices with SDK 53+;
   verify against current Expo docs before assuming).
6. Write backend endpoints with Pydantic request/response schemas — no raw
   dict returns.
7. Every new table needs an Alembic migration, committed alongside the model
   change.
