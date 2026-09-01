import json
import os

os.environ.setdefault("MPLCONFIGDIR", os.path.join(os.getcwd(), ".matplotlib_cache"))

import matplotlib.pyplot as plt
import pandas as pd
from sklearn.cluster import DBSCAN


def analyze_nyc_hotspots(
    input_path="data/processed/nyc311_features.csv",
    output_dir="results",
    eps=0.005,
    min_samples=10,
):
    print("Running NYC 311 hotspot analysis (DBSCAN)...\n")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)
    os.makedirs(os.path.join(output_dir, "figures"), exist_ok=True)

    df = pd.read_csv(input_path)
    coords = df[["Latitude", "Longitude"]].to_numpy()

    labels = DBSCAN(eps=eps, min_samples=min_samples).fit_predict(coords)
    df["nyc_cluster_id"] = labels
    df.to_csv("data/processed/nyc311_hotspot_results.csv", index=False)

    n_clusters = df["nyc_cluster_id"].nunique() - (
        1 if -1 in df["nyc_cluster_id"].values else 0
    )
    n_noise = int((df["nyc_cluster_id"] == -1).sum())

    cluster_rows = []
    for cluster_id in sorted(df["nyc_cluster_id"].unique()):
        if cluster_id == -1:
            continue

        cluster_df = df[df["nyc_cluster_id"] == cluster_id]
        high_priority_ratio = float((cluster_df["priority_label"] == 2).mean())
        medium_or_high_ratio = float((cluster_df["priority_label"] >= 1).mean())
        pending_ratio = float(cluster_df["is_pending"].mean())

        risk_score = (
            0.4 * float(cluster_df["density_score"].mean())
            + 0.3 * pending_ratio
            + 0.3 * medium_or_high_ratio
        )

        if risk_score >= 0.5:
            risk_level = "HIGH"
        elif risk_score >= 0.3:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        cluster_rows.append(
            {
                "cluster_id": int(cluster_id),
                "complaint_count": int(len(cluster_df)),
                "pending_ratio": pending_ratio,
                "high_priority_ratio": high_priority_ratio,
                "medium_or_high_ratio": medium_or_high_ratio,
                "avg_density_score": float(cluster_df["density_score"].mean()),
                "risk_score": float(risk_score),
                "risk_level": risk_level,
                "dominant_category": str(cluster_df["Category"].mode().iloc[0]),
                "center_lat": float(cluster_df["Latitude"].mean()),
                "center_lng": float(cluster_df["Longitude"].mean()),
            }
        )

    summary_df = (
        pd.DataFrame(cluster_rows)
        .sort_values(["risk_score", "complaint_count"], ascending=[False, False])
        .reset_index(drop=True)
    )
    summary_df.to_csv("data/processed/nyc311_hotspot_summary.csv", index=False)

    top_clusters = summary_df.head(10)["cluster_id"].tolist()
    plot_df = df[df["nyc_cluster_id"].isin(top_clusters)].copy()
    noise_df = df[df["nyc_cluster_id"] == -1]

    fig, ax = plt.subplots(figsize=(6.5, 5.2))
    ax.scatter(
        noise_df["Longitude"],
        noise_df["Latitude"],
        s=3,
        color="lightgray",
        alpha=0.25,
        label="Noise / non-top clusters",
    )

    cmap = plt.get_cmap("tab10")
    for idx, cluster_id in enumerate(top_clusters):
        cluster_df = plot_df[plot_df["nyc_cluster_id"] == cluster_id]
        ax.scatter(
            cluster_df["Longitude"],
            cluster_df["Latitude"],
            s=10,
            alpha=0.72,
            color=cmap(idx % 10),
            label=f"C{cluster_id} ({len(cluster_df)})",
            edgecolors="none",
        )

    ax.set_title("Top NYC 311 Hotspots by DBSCAN Risk Score")
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.grid(True, alpha=0.25)
    ax.legend(loc="upper right", fontsize=7, framealpha=0.9, ncol=2)
    plt.tight_layout()
    figure_path = os.path.join(output_dir, "figures", "nyc_hotspot_clusters.png")
    plt.savefig(figure_path, dpi=300, bbox_inches="tight")
    plt.close()

    result = {
        "n_clusters": int(n_clusters),
        "n_noise": n_noise,
        "total_points": int(len(df)),
        "eps": eps,
        "min_samples": int(min_samples),
        "top_10_clusters": summary_df.head(10).to_dict(orient="records"),
    }

    output_path = os.path.join(output_dir, "nyc_hotspot_results.json")
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"NYC clusters found: {n_clusters}")
    print(f"Noise points: {n_noise}")
    print("Top NYC hotspots:")
    print(
        summary_df.head(10)[
            [
                "cluster_id",
                "complaint_count",
                "risk_level",
                "dominant_category",
                "pending_ratio",
                "high_priority_ratio",
            ]
        ].to_string(index=False)
    )
    print(f"\nNYC hotspot figure saved to {figure_path}")
    print(f"NYC hotspot results saved to {output_path}")
    return summary_df


if __name__ == "__main__":
    analyze_nyc_hotspots()
