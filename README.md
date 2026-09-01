# Civic Lens

A civic intelligence platform for reporting, prioritizing, and visualizing urban issues across a city.

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/ML-Scikit%20Learn%20%2B%20XGBoost-FF6F00" alt="ML" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

Civic Lens combines citizen issue reporting, mapping, dashboard analytics, and ML-based prioritization to help local authorities respond to civic problems faster and more intelligently.

The project supports issue categories such as waste, potholes, streetlights, drainage, and water supply, then turns those reports into actionable priority signals, hotspot analysis, and municipal decision support.

## Why this project exists

Most civic issue systems are either static complaint forms or disconnected analytics dashboards. Civic Lens brings both together in one workflow:

- citizens can report issues quickly
- reports are classified and prioritized using data-driven logic
- hotspots are highlighted on maps and dashboards
- municipalities can understand which problems need attention first

## Key features

- Citizen issue reporting with location-aware submission flow
- Complaint categories aligned with civic service reporting
- ML-based priority scoring and label assignment
- Spatial hotspot detection and density analysis
- Interactive dashboard visualizations for insights and trends
- Admin-style reporting workflows and city intelligence views
- Firebase-powered app data and auth integration
- Research-backed model experimentation and export pipeline

## Architecture overview

```text
Citizen Reports
    ↓
Frontend App (React + TypeScript + Firebase)
    ↓
Data Normalization + Report Storage
    ↓
Feature Engineering + Priority Modeling
    ↓
Hotspot Detection + Risk Scoring
    ↓
Dashboard / Map / Insights UI
```

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Data/UI: Firebase, Leaflet, Recharts
- ML: Python, scikit-learn, XGBoost, pandas, numpy, scipy
- Research: synthetic data experimentation + NYC 311 validation

## Project structure

```text
.
├── app/                         # React frontend and dashboard app
│   ├── public/                 # JSON exports consumed by frontend
│   ├── src/                    # pages, components, hooks, config, styles
│   ├── .env.example            # environment template
│   ├── package.json
│   └── README.md
│
├── ml/                          # model + export pipeline
│   ├── data/
│   ├── notebooks/
│   ├── scripts/
│   ├── results/
│   ├── export_pipeline.py
│   ├── run_pipeline.py
│   └── README.md
│
├── research/                    # research experiments and paper artifacts
│   ├── data/
│   ├── scripts/
│   ├── paper/
│   └── paper-one-column/
│
├── docs/                        # project documentation and phase artifacts
├── archive/                     # legacy and historical drafts
├── PROJECT_CHANGE_REPORT.md     # repo cleanup and project history summary
├── README.md                    # this file
├── .gitignore
└── LICENSE                      # if added later
```

## Quick start

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <repo-folder>
```

### 2. Install frontend dependencies

```bash
cd app
npm install
```

### 3. Configure environment variables

Create a `.env` file inside `app/` using the template in [app/README.md](app/README.md):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### 4. Run the app locally

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

### 6. Run the ML pipeline

```bash
cd ../ml
python -m pip install pandas numpy scikit-learn scipy xgboost
python run_pipeline.py
```

## Research and ML details

The project uses a hybrid-data style pipeline:

- synthetic civic complaint data for controlled experiments
- NYC 311 validation data for model benchmarking
- feature engineering based on category severity, density, status urgency, and location
- model comparison across classical and gradient-boosted approaches
- hotspot generation and export to the dashboard front end

## Recommended workflow

1. Start the frontend with `npm run dev`
2. Validate Firebase configuration
3. Run the ML export pipeline to refresh dashboard data
4. Review generated insights in the dashboard
5. Use research outputs for project documentation and future refinement

## Documentation and references

- [app/README.md](app/README.md) — frontend project guide
- [ml/README.md](ml/README.md) — ML pipeline documentation
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) — step-by-step repo rename and Vercel deployment guide
- [docs/](docs/) — project notes, reports, and submission artifacts
- [research/](research/) — research experiments and paper materials

## Current status

This repository is in a strong project-ready state with:

- a cleaned-up project structure
- a verified frontend production build
- a research-backed ML pipeline
- updated app branding and documentation

## Roadmap

- **[Ready]** step-by-step [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for final repo rename and Vercel deployment
- follow the deployment checklist to go live
- improve dashboard polish and analytics UX
- add stronger deployment and CI workflows
- expand ML evaluation and reporting outputs

## License

This project is currently structured for open development and portfolio use. Add a license file when you are ready to publish the repository publicly.

---

Built for civic visibility, smarter local action, and data-informed city management.

```text
S = 0.4 * category_severity
  + 0.3 * status_urgency
  + 0.3 * spatial_urgency
```

Spatial urgency uses same-category neighbors within a fixed radius, while the
model feature uses KNN density. This avoids directly reusing the same spatial
metric for both labels and features.

### Models

| Model | Role |
|------|------|
| Logistic Regression | Linear baseline |
| Decision Tree | Interpretable non-linear model |
| Random Forest | Robust ensemble model |
| XGBoost | High-performing boosted tree model |

### Hotspot Detection

DBSCAN identifies spatial clusters using:

```text
eps = 0.002 degrees
min_samples = 3
```

Cluster risk is computed from:

```text
0.4 * average_density_score
+ 0.3 * pending_ratio
+ 0.3 * high_priority_ratio
```

---

## Generated Outputs

| Output | Location | Description |
|--------|----------|-------------|
| Feature dataset | `ml/data/processed/features_data.csv` | ML-ready complaint features |
| Priority results | `ml/data/processed/priority_results.csv` | LOW/MEDIUM/HIGH labels |
| Hotspot results | `ml/data/processed/hotspot_results.csv` | Per-complaint DBSCAN cluster IDs |
| Hotspot summary | `ml/data/processed/hotspot_summary.csv` | Cluster-level risk summary |
| Training results | `ml/results/train_results.json` | CV and hold-out metrics |
| Cluster results | `ml/results/cluster_results.json` | DBSCAN summary |
| NYC features | `research/data/processed/nyc311_features.csv` | NYC 311 outcome-labeled features |
| NYC zero-shot sample | `research/data/processed/nyc311_zeroshot_features.csv` | Eq. 1-labeled NYC sample for synthetic-to-NYC transfer |
| NYC training results | `research/results/nyc_direct_training_results.json` | Direct NYC training metrics |
| NYC hotspot results | `research/results/nyc_hotspot_results.json` | Real-world DBSCAN hotspot summary |
| NYC hotspot figure | `research/results/figures/nyc_hotspot_clusters.png` | Top NYC hotspot visualization |
| Dashboard exports | `app/public/*.json` | JSON consumed by React dashboard |

---

## Research Paper

Two LaTeX paper variants are available:

| Folder | Format | Purpose |
|--------|--------|---------|
| `research/paper/` | IEEEtran two-column | Original research paper |
| `research/paper-one-column/` | IEEEtran one-column draft style | Review/submission-friendly one-column version |

The one-column version is generated as a separate paper artifact so the original
two-column paper remains untouched.

---

## Technologies Used

| Layer | Technology |
|------|------------|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui components |
| Maps | Leaflet, React Leaflet |
| Charts | Recharts |
| Authentication / Database | Firebase Auth, Firestore |
| ML / Data | Python, Pandas, NumPy |
| Models | scikit-learn, XGBoost |
| Spatial Clustering | DBSCAN |
| Paper | LaTeX, IEEEtran |

---

## Known Limitations

- The main Bhopal dataset is synthetic; it serves as a controlled experimental
  environment for isolating spatial feature contributions.
- Priority labels on the synthetic dataset are generated from a domain-informed
  scoring function. The NYC 311 direct training experiment uses outcome-based
  labels derived from observed resolution latency to validate on real data.
- Zero-shot NYC 311 validation in the research package shows significant domain
  shift (65.3% best zero-shot vs 95.7% with direct training), confirming that
  regional calibration is required before deployment.
- The high direct-NYC accuracy should be interpreted cautiously because the
  outcome-based labels are partially correlated with complaint status.
- NYC feature importance confirms this status dominance: status encoding and
  pending flag are the strongest predictors, while density contributes mainly
  as a complementary spatial signal.
- Live priority inference is still partly approximated at the client side for
  newly submitted reports.
- Firebase rules should be reviewed again before production deployment.
- Text-based complaint understanding and image-based damage severity estimation
  are not yet integrated.

---

## Future Improvements

- Cross-city generalization studies (e.g., Chicago 311) for urban
  transferability.
- Human-annotated ground truth with inter-annotator agreement (Cohen's Kappa).
- Add temporal features such as report age, recurrence, and seasonality.
- Add a backend inference service for live priority prediction.
- Add explainability with SHAP or feature-level justification cards.
- Add complaint text embeddings and image severity analysis.
- Add automated tests for schema normalization, ML outputs, and app views.
- Add role-specific municipal workflows for assignment, escalation, and SLA
  monitoring.
- Add regional density normalization for cross-city transfer.

---

## GitHub Upload Checklist

1. Remove or ignore local-only folders such as `node_modules/`, `dist/`,
   `.DS_Store`, and `.env`.
2. Initialize Git at the repository root:

   ```bash
   git init
   git add .
   git commit -m "Initial structured EPICS Civic Lens project"
   ```

3. Create a new empty GitHub repository.
4. Connect the local repository:

   ```bash
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```

5. Add Firebase secrets as local `.env` values or platform environment variables,
   not as committed files.

---

## Academic Context

Project: **Smart Civic Issue Register & Tracker using Geospatial Analytics and
Machine Learning**  
Course: **DSN3099 EPICS**  
Institution: **VIT Bhopal University**

This project is an academic engineering and research prototype intended to
demonstrate how ML-GIS workflows can support civic complaint prioritization and
urban hotspot analysis.
