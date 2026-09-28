# Financial Tracker — Mobile App

A mobile expense & savings tracker built with **Expo (React Native)** and
**Python FastAPI**. Scan or upload a receipt and the app reads it
automatically, computes your totals, and rolls everything up into monthly
and yearly reports. Includes a manual expense entry option, a simple
savings tracker, biometric/PIN app-lock, and scheduled local notifications.

> For AI coding agents: read `agents.md` first — it's the technical source
> of truth for this repo. See also `planning.md` (roadmap) and
> `Gastify_progress_2026-09-25.md` (task tracker).

---

## Features

- 📸 Scan/upload a receipt → OCR reads items and total automatically
- 🧾 Multi-receipt support — totals auto-combine across days into monthly/yearly views
- ✍️ Manual expense entry (no receipt needed)
- 📊 Monthly and yearly expense reports
- 💰 Simple savings tracker (manual add/update, kept separate from expenses)
- 🔒 Face ID / biometric app-lock
- 🔔 Local monthly, yearly, and Philippine-holiday reminders with a notification inbox
- ✨ iOS-style "Liquid Glass" UI

---

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | Expo (React Native), Expo Go for dev, expo-router |
| Backend | Python FastAPI (async), SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL (prod) / SQLite (local dev) |
| Auth | JWT (access + refresh tokens) |
| OCR | Cloud OCR provider (see `agents.md` §2 for current choice) |

Full stack details, rationale, and design system: see `agents.md`.

---

## Project Structure

```
/mobile      # Expo app
/backend     # FastAPI app
agents.md    # technical blueprint for AI coding agents
planning.md  # roadmap and phase sequencing
Gastify_progress_2026-09-25.md  # task-level status tracker
```

---

## Prerequisites

- Node.js LTS + npm or yarn
- Python 3.11+
- Expo Go app on your phone (iOS/Android) — [expo.dev/go](https://expo.dev/go)
- PostgreSQL (or just use SQLite locally — no install needed)
- An OCR provider API key (see `.env.example`)

---

## Getting Started

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # fill in your values
alembic upgrade head            # run DB migrations

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at `http://localhost:8000` — interactive API docs at
`http://localhost:8000/docs`.

### 2. Mobile (Expo)

```bash
cd mobile
npm install

cp .env.example .env            # set EXPO_PUBLIC_API_URL to your backend's LAN IP
npx expo start
```

Scan the QR code with **Expo Go** on your phone. Make sure your phone and
computer are on the same Wi-Fi network, and that `EXPO_PUBLIC_API_URL`
points to your computer's LAN IP (not `localhost`) so the phone can reach
the backend — e.g. `http://192.168.1.10:8000`.

---

## Environment Variables

See `.env.example` in both `/backend` and `/mobile` for the full list.
Never commit a real `.env` file — only `.env.example` with placeholder
values belongs in the repo.

---

## Running Tests

See `TESTING.md` for the testing approach and manual QA checklist.

---

## Documentation

| File | Purpose |
|---|---|
| `agents.md` | Full technical spec — architecture, DB schema, API conventions, design system, rules for AI agents |
| `planning.md` | Phase-by-phase roadmap, sequencing rationale, timeline estimates |
| `Gastify_progress_2026-09-25.md` | Live task tracker — what's done, in progress, and next |
| `TESTING.md` | Testing approach and QA checklist |
| `CHANGELOG.md` | Version history |

---

## License

TBD.
