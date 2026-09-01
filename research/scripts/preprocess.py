import pandas as pd
import numpy as np

from sklearn.preprocessing import LabelEncoder
from sklearn.neighbors import NearestNeighbors, BallTree


# Domain-knowledge severity mapping
CATEGORY_SEVERITY = {
    'Water Supply': 5,    # Critical infrastructure — health/safety risk
    'Drainage': 4,        # Flood/sanitation risk
    'Pothole': 3,         # Road safety hazard
    'Streetlight': 2,     # Public safety (nighttime)
    'Waste': 1,           # Quality of life
}

STATUS_WEIGHT = {
    'Pending': 1.0,       # Unresolved — higher urgency
    'Completed': 0.0,     # Already resolved
    'Cancelled': 0.2,     # Low urgency
}


def assign_priority_label(score):
    """Assign priority from composite score."""
    if score >= 0.7:
        return 2   # HIGH
    elif score >= 0.4:
        return 1   # MEDIUM
    else:
        return 0   # LOW


def preprocess(input_path, output_path):
    print("Starting preprocessing...")

    df = pd.read_csv(input_path)
    df.columns = df.columns.str.strip()
    df = df.sort_values(by='ID').reset_index(drop=True)

    # === Encoding ===
    le_category = LabelEncoder()
    le_status = LabelEncoder()

    df['category_encoded'] = le_category.fit_transform(df['Category'])
    df['status_encoded'] = le_status.fit_transform(df['Status'])

    # =================================================================
    # FEATURE: KNN Density Score (k=5 nearest neighbors, all categories)
    # Used as a MODEL FEATURE — measures local complaint concentration
    # =================================================================
    coords = df[['Latitude', 'Longitude']].values

    nbrs = NearestNeighbors(n_neighbors=5)
    nbrs.fit(coords)
    distances, _ = nbrs.kneighbors(coords)

    df['density_score'] = 1 / (distances.mean(axis=1) + 1e-6)
    df['density_score'] = (
        df['density_score'] - df['density_score'].min()
    ) / (
        df['density_score'].max() - df['density_score'].min()
    )

    # === Category Frequency ===
    category_frequency = df['Category'].value_counts().to_dict()
    df['category_frequency'] = df['Category'].map(category_frequency)

    # === Pending Indicator ===
    df['is_pending'] = df['Status'].apply(
        lambda x: 1 if x.lower() == 'pending' else 0
    )

    # =================================================================
    # LABEL GENERATION: Domain knowledge + spatial neighbor count
    #
    # Uses RADIUS-BASED same-category complaint count (within 0.003°)
    # This is DIFFERENT from the KNN density feature (which uses
    # distance to k=5 nearest neighbors of ANY category).
    #
    # Rationale: Areas with many complaints of the SAME type indicate
    # systemic issues (e.g., repeated water supply failures in a zone)
    # that warrant higher priority. This captures spatial urgency
    # through a different lens than the KNN density feature.
    # =================================================================
    RADIUS = 0.003  # ~330 meters

    tree = BallTree(coords)
    all_neighbor_indices = tree.query_radius(coords, r=RADIUS)

    same_cat_counts = []
    for i in range(len(df)):
        neighbors = all_neighbor_indices[i]
        same_cat = sum(
            1 for j in neighbors
            if j != i and df.iloc[j]['Category'] == df.iloc[i]['Category']
        )
        same_cat_counts.append(same_cat)

    df['same_category_neighbors'] = same_cat_counts

    # Normalize to [0, 1]
    max_scn = max(same_cat_counts) if max(same_cat_counts) > 0 else 1
    df['spatial_urgency'] = df['same_category_neighbors'] / max_scn

    # Composite priority score
    severity_norm = df['Category'].map(CATEGORY_SEVERITY) / 5.0
    status_wt = df['Status'].map(STATUS_WEIGHT)

    # Priority = f(category_severity, status, spatial_urgency)
    # Weights: 40% category, 30% status, 30% spatial concentration
    df['priority_score'] = (
        0.4 * severity_norm +
        0.3 * status_wt +
        0.3 * df['spatial_urgency']
    )

    df['priority_label'] = df['priority_score'].apply(assign_priority_label)

    # Add 5% noise to simulate real-world labeling uncertainty
    np.random.seed(42)
    mask = np.random.rand(len(df)) < 0.05
    df.loc[mask, 'priority_label'] = np.random.choice([0, 1, 2], size=mask.sum())

    # Drop intermediate columns not used as features
    df.drop(columns=['same_category_neighbors', 'spatial_urgency', 'priority_score'],
            inplace=True)

    df.to_csv(output_path, index=False)

    print(f"Preprocessed data saved to: {output_path}")
    print(f"Label distribution:\n{df['priority_label'].value_counts().sort_index()}")


if __name__ == "__main__":
    preprocess(
        "data/raw/urban_civic_reports_synthetic.csv",
        "data/processed/features_data.csv"
    )