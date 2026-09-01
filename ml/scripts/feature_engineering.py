import numpy as np
import pandas as pd
from sklearn.neighbors import BallTree, NearestNeighbors
from sklearn.preprocessing import LabelEncoder


CATEGORY_SEVERITY = {
    "Water Supply": 5,
    "Drainage": 4,
    "Pothole": 3,
    "Streetlight": 2,
    "Waste": 1,
}

STATUS_WEIGHT = {
    "Pending": 1.0,
    "Completed": 0.0,
    "Cancelled": 0.2,
}


def compute_priority_score(severity_score, status_weight, spatial_urgency):
    """Return a normalized 0-1 civic-priority score based on severity, urgency and neighborhood concentration."""
    return float(np.clip(0.4 * severity_score + 0.3 * status_weight + 0.3 * spatial_urgency, 0.0, 1.0))


def assign_priority_label(score):
    """Map a normalized priority score into the LOW/MEDIUM/HIGH label set used by the dashboard."""
    if score >= 0.7:
        return 2
    if score >= 0.4:
        return 1
    return 0


def main():
    print("Starting feature engineering...\n")
    np.random.seed(42)

    df = pd.read_csv("data/raw/urban_civic_reports_synthetic.csv")
    df.columns = df.columns.str.strip()
    df = df.sort_values(by="ID").reset_index(drop=True)

    le_category = LabelEncoder()
    le_status = LabelEncoder()
    df["category_encoded"] = le_category.fit_transform(df["Category"])
    df["status_encoded"] = le_status.fit_transform(df["Status"])

    coords = df[["Latitude", "Longitude"]].to_numpy()

    nbrs = NearestNeighbors(n_neighbors=5)
    nbrs.fit(coords)
    distances, _ = nbrs.kneighbors(coords)
    df["avg_neighbour_distance"] = distances.mean(axis=1)

    density = 1.0 / (df["avg_neighbour_distance"] + 1e-6)
    df["density_score"] = (density - density.min()) / (density.max() - density.min() + 1e-8)

    category_frequency = df["Category"].value_counts().to_dict()
    df["category_frequency"] = df["Category"].map(category_frequency)

    df["is_pending"] = df["Status"].apply(lambda x: 1 if str(x).lower() == "pending" else 0)

    label_radius = 0.003
    tree = BallTree(coords)
    all_neighbor_indices = tree.query_radius(coords, r=label_radius)

    same_category_counts = []
    for idx, neighbors in enumerate(all_neighbor_indices):
        same_count = sum(
            1 for j in neighbors if j != idx and df.iloc[j]["Category"] == df.iloc[idx]["Category"]
        )
        same_category_counts.append(same_count)

    max_same_category = max(same_category_counts) if same_category_counts else 1
    max_same_category = max(max_same_category, 1)

    df["same_category_neighbors"] = same_category_counts
    df["spatial_urgency"] = df["same_category_neighbors"] / max_same_category

    severity_norm = df["Category"].map(CATEGORY_SEVERITY) / 5.0
    status_weight = df["Status"].map(STATUS_WEIGHT)

    df["priority_score"] = [
        compute_priority_score(severity, weight, urgency)
        for severity, weight, urgency in zip(severity_norm, status_weight, df["spatial_urgency"])
    ]
    df["priority_label"] = df["priority_score"].apply(assign_priority_label)

    feature_columns = [
        "category_encoded",
        "status_encoded",
        "density_score",
        "category_frequency",
        "is_pending",
        "Latitude",
        "Longitude",
        "priority_label",
    ]

    features_df = df[["ID", "Category", "Status"] + feature_columns]
    output_path = "data/processed/features_data.csv"
    features_df.to_csv(output_path, index=False)

    print(f"Feature engineering completed! Saved to: {output_path}")
    print(f"Total records: {len(features_df)}")
    print("Priority label distribution:")
    print(features_df["priority_label"].value_counts().sort_index())


if __name__ == "__main__":
    main()
