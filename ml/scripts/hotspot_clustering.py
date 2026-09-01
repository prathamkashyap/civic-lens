import pandas as pd
import numpy as np
import json
from pathlib import Path

from sklearn.cluster import DBSCAN


def hotspot_risk_level(risk_score):
    if risk_score >= 0.5:
        return "HIGH"
    if risk_score >= 0.3:
        return "MEDIUM"
    return "LOW"


def main():
    print("Starting hotspot detection...\n")

    # Load data
    features_df = pd.read_csv("data/processed/features_data.csv")
    priority_df = pd.read_csv("data/processed/priority_results.csv")
    df = features_df.merge(
        priority_df[['ID', 'priority_level', 'risk_score']],
        on='ID',
        how='left',
    )

    # Coordinates
    coords = df[['Latitude', 'Longitude']].values

    # DBSCAN clustering
    dbscan = DBSCAN(
        eps=0.002,
        min_samples=3
    )

    df['cluster_id'] = dbscan.fit_predict(coords)

    # Cluster summary
    hotspot_summary = df.groupby('cluster_id').agg(
        complaint_count=('ID', 'count'),
        avg_density_score=('density_score', 'mean'),
        pending_ratio=('is_pending', 'mean'),
        dominant_category=('Category', lambda values: values.mode().iloc[0]),
        high_priority_ratio=('priority_label', lambda values: float((values == 2).sum() / len(values))),
        center_lat=('Latitude', 'mean'),
        center_lng=('Longitude', 'mean'),
    ).reset_index()

    hotspot_summary['risk_score'] = (
        0.4 * hotspot_summary['avg_density_score'] +
        0.3 * hotspot_summary['pending_ratio'] +
        0.3 * hotspot_summary['high_priority_ratio']
    )
    hotspot_summary['risk_level'] = hotspot_summary['risk_score'].apply(hotspot_risk_level)

    # Merge back
    df = df.merge(
        hotspot_summary[['cluster_id', 'risk_level']],
        on='cluster_id',
        how='left'
    )

    # Save detailed results
    df[[
        'ID',
        'Latitude',
        'Longitude',
        'Category',
        'Status',
        'priority_level',
        'cluster_id',
        'risk_level',
    ]].to_csv("data/processed/hotspot_results.csv", index=False)

    # Save summary
    hotspot_summary.to_csv(
        "data/processed/hotspot_summary.csv",
        index=False
    )

    Path("results").mkdir(exist_ok=True)
    with open("results/cluster_results.json", "w") as f:
        json.dump(
            {
                "n_clusters": int(df['cluster_id'].nunique() - (1 if -1 in df['cluster_id'].values else 0)),
                "n_noise": int((df['cluster_id'] == -1).sum()),
                "total_points": int(len(df)),
                "clusters": hotspot_summary.to_dict(orient="records"),
            },
            f,
            indent=2,
        )

    print("Hotspot clustering completed!")
    print("Files saved:")
    print("- hotspot_results.csv")
    print("- hotspot_summary.csv")
    print("- results/cluster_results.json")


if __name__ == "__main__":
    main()
