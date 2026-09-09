# Project Change Report

## Current Status

The project has been reorganized into a GitHub-ready academic repository with separate areas for the dashboard app, ML pipeline, research experiments, submitted EPICS documents, and archived legacy material.

The original two-column paper in `research/paper/` has not been edited. A separate one-column IEEEtran draft is maintained at `research/paper-one-column/`.

One remaining repository-setup caveat: `app/.git/` still exists as a nested Git repository. Before publishing the root repository, either archive that nested Git history or remove the nested `.git` folder after confirming it is no longer needed.

## Major Changes Completed

- Reorganized folders into `app/`, `ml/`, `research/`, `docs/`, and `archive/`.
- Rewrote the root `README.md` as a high-level GitHub repository README.
- Added `.gitignore` for macOS, Node, Python, LaTeX, environment files, and generated artifacts.
- Updated the React/Firebase dashboard schema to match the paper categories: Waste, Pothole, Streetlight, Drainage, and Water Supply.
- Updated Firestore rules for authenticated user and admin workflows.
- Aligned the ML feature pipeline with the paper: category/status encodings, KNN density, category frequency, pending flag, latitude, and longitude.
- Generated dashboard-facing ML artifacts under `ml/results/` and `app/public/`.
- Created a one-column IEEEtran paper at `research/paper-one-column/main.pdf`.

## Reviewer-Driven Research Updates

- Added a hybrid dataset strategy:
  - Synthetic Bhopal dataset for controlled spatial experimentation.
  - Real NYC 311 dataset for external validation.
- Added outcome-derived NYC labels based on observed resolution latency:
  - Low: resolved quickly or unresolved under 7 days.
  - Medium: resolved/unresolved between 7 and 30 days.
  - High: resolved/unresolved after more than 30 days.
- Added direct NYC training results:
  - XGBoost CV accuracy: 95.7%.
  - XGBoost CV macro F1: 0.903.
- Added a separate Eq. 1-labeled NYC zero-shot sample:
  - Best zero-shot transfer: Random Forest at 65.3% accuracy.
  - This keeps synthetic-to-NYC transfer separate from outcome-labeled NYC training.
- Added NYC real-world ablation:
  - No spatial: 94.2% accuracy.
  - Density only: 94.0% accuracy.
  - Density + coordinates: 95.0% accuracy.
- Added NYC status/density robustness diagnostics:
  - All XGBoost features: 95.7% accuracy, 0.903 macro F1.
  - Without status features: 79.9% accuracy, 0.754 macro F1.
  - Without density: 95.4% accuracy, 0.899 macro F1.
- Added NYC Random Forest feature importance:
  - Status encoding: 0.278.
  - Pending flag: 0.257.
  - Density score: 0.013.
  - This explicitly documents that NYC outcome-label prediction is status-dominant and that density is complementary rather than dominant on real data.
- Added NYC hotspot analysis:
  - 99 DBSCAN clusters from 5,469 NYC records.
  - Top hotspot figure: `research/results/figures/nyc_hotspot_clusters.png`.
  - Results JSON: `research/results/nyc_hotspot_results.json`.
- Added cautionary language about high NYC accuracy because outcome labels correlate with complaint status.
- Updated both paper variants:
  - `research/paper/main.pdf`: IEEE two-column conference-style version, now 8 pages.
  - `research/paper-one-column/main.pdf`: one-column review/submission-reading version, 21 pages.
- Replaced weak/unverifiable newer references with verifiable sources:
  - Gao et al., ACM CIKM 2019, DOI `10.1145/3357384.3357894`.
  - Cesario et al., Big Data and Cognitive Computing 2023, DOI `10.3390/bdcc7010029`.

## Important Generated Files

| File | Purpose |
|------|---------|
| `README.md` | Main GitHub repository README |
| `research/paper-one-column/main.pdf` | One-column IEEEtran paper |
| `research/paper/main.pdf` | Two-column IEEE conference-style paper |
| `research/data/processed/nyc311_features.csv` | Outcome-labeled NYC training dataset |
| `research/data/processed/nyc311_zeroshot_features.csv` | Eq. 1-labeled NYC zero-shot sample |
| `research/results/nyc_direct_training_results.json` | Direct NYC training + ablation metrics |
| `research/results/nyc_hotspot_results.json` | NYC DBSCAN hotspot summary |
| `research/results/figures/nyc_hotspot_clusters.png` | NYC hotspot figure |

## Verification Performed

```bash
cd research
python scripts/nyc_hotspot_analysis.py
python - <<'PY'
from scripts.train import train_model
from scripts.real_world_training import train_nyc_model
train_model('data/processed/features_data.csv')
train_nyc_model('data/processed/nyc311_features.csv')
PY
cd paper-one-column
latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex
```

Both paper variants compiled successfully. Final LaTeX logs have no unresolved citations and no overfull-box warnings. The two-column paper is 8 pages; the one-column paper is 21 pages. Normal float-placement warnings from LaTeX changing some `[h]` placements to `[ht]` may still appear.

Previously verified frontend commands:

```bash
cd app
npm run lint
npm run build
```

The frontend build passed. Lint passed with existing shadcn/Fast Refresh style warnings.

## GitHub Upload Steps

1. Review `app/.env` and ensure secrets are not committed.
2. Decide what to do with nested `app/.git/`.
   - Recommended: move it to `archive/app-git-history/` if you want to preserve old app history.
   - Alternative: delete `app/.git/` only after confirming the root repo should own the app.
3. Initialize the root repository:

   ```bash
   git init
   git add .
   git commit -m "Initial structured EPICS Civic Lens project"
   ```

4. Create a new empty GitHub repository.
5. Connect and push:

   ```bash
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```

6. Add Firebase and deployment secrets only as local `.env` values or platform environment variables.

## Suggested Next Improvements

- Add Chicago 311 for true cross-city validation.
- Add human-labeled priority ground truth with inter-annotator agreement.
- Add temporal features such as complaint age, season, recurrence, and SLA delay.
- Add backend inference so newly submitted dashboard reports use the trained model instead of client-side approximation.
- Add automated tests for report schema normalization and ML JSON outputs.
