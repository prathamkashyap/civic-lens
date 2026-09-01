# Civic Lens Dashboard

A modern React + TypeScript dashboard for civic issue reporting, prioritization, and city-level intelligence.

<p align="center">
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
</p>

## What the app does

The frontend is designed around a city reporting and response workflow:

- citizens report civic issues
- categories and statuses are normalized
- issue priority is surfaced in the dashboard
- reports can be reviewed in map and list views
- local problem hotspots become visible to admins and stakeholders

## Canonical report values

```text
Categories: Waste, Pothole, Streetlight, Drainage, Water Supply
Statuses: Pending, Completed, Cancelled
Priorities: LOW, MEDIUM, HIGH
```

Older records using labels such as `Fixed` or `Resolved` are normalized to `Completed` when loading from Firestore.

## Local setup

```bash
npm install
npm run dev
```

Create a `.env` file with Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Production build

```bash
npm run build
```

The generated `dist/` output is used by Vercel-style deployment flows and should be rebuilt whenever deployment config changes.

## Frontend workflow

```bash
npm run dev      # local development
npm run build    # production build
npm run lint     # code quality checks
```

## Notes

- The frontend is intentionally separate from the ML research pipeline.
- The ML outputs are exported into the app data layer for dashboard consumption.
- Real Firebase values should always be stored in environment variables rather than committed directly into source control.
