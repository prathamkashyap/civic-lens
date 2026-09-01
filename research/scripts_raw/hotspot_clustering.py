import pandas as pd
import numpy as np

from sklearn.cluster import DBSCAN


def hotspot_risk(row):
    if row['complaint_count'] >= 5 or row['avg_density_score'] >= 0.7:
        return "HIGH"
    elif row['complaint_count'] >= 3:
        return "MEDIUM"
    else:
        return "LOW"


def main():
    print("Starting hotspot detection...\n")

    # Load data
    df = pd.read_csv("data/processed/features_data.csv")

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
        pending_ratio=('is_pending', 'mean')
    ).reset_index()

    # Assign risk level
    hotspot_summary['hotspot_risk_level'] = hotspot_summary.apply(
        hotspot_risk, axis=1
    )

    # Merge back
    df = df.merge(
        hotspot_summary[['cluster_id', 'hotspot_risk_level']],
        on='cluster_id',
        how='left'
    )

    # Save detailed results
    df[[
        'ID',
        'Latitude',
        'Longitude',
        'cluster_id',
        'hotspot_risk_level'
    ]].to_csv("data/processed/hotspot_results.csv", index=False)

    # Save summary
    hotspot_summary.to_csv(
        "data/processed/hotspot_summary.csv",
        index=False
    )

    print("Hotspot clustering completed!")
    print("Files saved:")
    print("- hotspot_results.csv")
    print("- hotspot_summary.csv")


if __name__ == "__main__":
    main()