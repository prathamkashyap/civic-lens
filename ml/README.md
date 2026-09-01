# Dashboard ML Pipeline

This module generates the dashboard-facing analytics for the Smart Civic Issue
Register & Tracker. It is aligned with the current research paper methodology
while keeping outputs simple enough for the React app to consume.

## Pipeline

```text
data/raw/urban_civic_reports_synthetic.csv
        |
scripts/feature_engineering.py
        |
data/processed/features_data.csv
        |
scripts/train_model.py
        |
data/processed/priority_results.csv
        |
scripts/hotspot_clustering.py
        |
data/processed/hotspot_results.csv
data/processed/hotspot_summary.csv
        |
export_pipeline.py
        |
../app/public/*.json
```

## Methodology

- Categories: Waste, Pothole, Streetlight, Drainage, Water Supply
- Statuses: Pending, Completed, Cancelled
- Feature engineering:
  - KNN density score using 5 nearest neighbors
  - Category and status encodings
  - Category frequency
  - Pending flag
  - Latitude and longitude
- Label generation:
  - Category severity
  - Status urgency
  - Same-category neighbor count within a fixed radius
  - 5 percent random perturbation for annotation uncertainty
- Models:
  - Logistic Regression baseline
  - Decision Tree
  - Random Forest
  - XGBoost
- Hotspot detection:
  - DBSCAN with `eps=0.002` and `min_samples=3`
  - Cluster risk from density, pending ratio, and high-priority ratio

## Run

```bash
python -m pip install pandas numpy scikit-learn scipy xgboost
python run_pipeline.py
```

Run commands from inside the `ml/` directory.

## Outputs

- `data/processed/features_data.csv`
- `data/processed/priority_results.csv`
- `data/processed/hotspot_results.csv`
- `data/processed/hotspot_summary.csv`
- `results/train_results.json`
- `results/cluster_results.json`
- `../app/public/priority_results.json`
- `../app/public/hotspot_summary.json`
- `../app/public/category_priority_matrix.json`
- `../app/public/risk_score_bins.json`

## Notes

This module is intended for reproducible project analytics and dashboard
integration. For the full research experiment set, including NYC 311 validation,
ablation, sensitivity analysis, and publication figures, use `research/`.
