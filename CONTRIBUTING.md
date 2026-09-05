# Contributing to Civic Lens

## Setup

1. Clone the repository and create `app/.env` from `app/.env.example`.
2. Install frontend dependencies with `cd app && npm install`.
3. Start the frontend with `npm run dev`.
4. Install Python dependencies with `python -m pip install -r ml/requirements.txt` when working on analytics.

## Checks

Run the frontend checks from `app/`:

```bash
npm run lint
npm run build
```

Run the ML tests from `ml/`:

```bash
python -m unittest discover -s tests
```

## Changes

- Keep changes focused and explain behavior changes in the pull request description.
- Do not commit `.env` files, credentials, generated build output, or private academic material.
- Add or update tests when changing scoring, feature engineering, or data normalization.
- Prefer accessible labels, keyboard support, and responsive layouts for UI changes.
