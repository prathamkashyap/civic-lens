import pandas as pd
import numpy as np
import json
import os
from sklearn.cluster import DBSCAN


def cluster_data(input_path, output_dir="results"):
    print("Running spatial clustering (DBSCAN)...\n")

    os.makedirs(output_dir, exist_ok=True)

    df = pd.read_csv(input_path)

    coords = df[['Latitude', 'Longitude']].values

    dbscan = DBSCAN(eps=0.002, min_samples=3)
    df['cluster_id'] = dbscan.fit_predict(coords)

    # Save full results
    df.to_csv("data/processed/hotspot_results.csv", index=False)

    # === Hotspot Summary ===
    n_clusters = df['cluster_id'].nunique() - (1 if -1 in df['cluster_id'].values else 0)
    n_noise = (df['cluster_id'] == -1).sum()

    print(f"Clusters found: {n_clusters}")
    print(f"Noise points: {n_noise}")

    # Per-cluster summary
    cluster_summary = []
    for cid in sorted(df['cluster_id'].unique()):
        cluster_df = df[df['cluster_id'] == cid]

        summary = {
            'cluster_id': int(cid),
            'complaint_count': len(cluster_df),
            'avg_density_score': float(cluster_df['density_score'].mean()),
            'pending_ratio': float(cluster_df['is_pending'].mean()),
            'dominant_category': cluster_df['Category'].mode().iloc[0],
            'high_priority_ratio': float(
                (cluster_df['priority_label'] == 2).sum() / len(cluster_df)
            ),
            'center_lat': float(cluster_df['Latitude'].mean()),
            'center_lng': float(cluster_df['Longitude'].mean()),
        }

        # Risk level based on composite of density, pending ratio, and high-priority ratio
        risk_score = (
            0.4 * summary['avg_density_score'] +
            0.3 * summary['pending_ratio'] +
            0.3 * summary['high_priority_ratio']
        )
        summary['risk_score'] = float(risk_score)

        if risk_score >= 0.5:
            summary['risk_level'] = 'HIGH'
        elif risk_score >= 0.3:
            summary['risk_level'] = 'MEDIUM'
        else:
            summary['risk_level'] = 'LOW'

        cluster_summary.append(summary)

    summary_df = pd.DataFrame(cluster_summary)
    summary_df.to_csv("data/processed/hotspot_summary.csv", index=False)

    # Save as JSON for figures
    with open(os.path.join(output_dir, "cluster_results.json"), 'w') as f:
        json.dump({
            'n_clusters': int(n_clusters),
            'n_noise': int(n_noise),
            'total_points': int(len(df)),
            'clusters': cluster_summary,
        }, f, indent=2, default=str)

    print(f"\nCluster summary:")
    print(summary_df[['cluster_id', 'complaint_count', 'risk_level', 'dominant_category']].to_string(index=False))
    print(f"\nResults saved to data/processed/ and {output_dir}/")

    return df, summary_df


if __name__ == "__main__":
    cluster_data("data/processed/features_data.csv")