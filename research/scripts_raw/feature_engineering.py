import pandas as pd
import numpy as np

from sklearn.preprocessing import LabelEncoder
from sklearn.neighbors import NearestNeighbors


def main():
    print("Starting feature engineering...\n")
    np.random.seed(42)

    # Load data
    df = pd.read_csv("data/raw/urban_civic_reports_synthetic.csv")

    # Clean columns
    df.columns = df.columns.str.strip()
    df = df.sort_values(by='ID').reset_index(drop=True)

    # Encoding
    le_category = LabelEncoder()
    le_status = LabelEncoder()

    df['category_encoded'] = le_category.fit_transform(df['Category'])
    df['status_encoded'] = le_status.fit_transform(df['Status'])

    # Spatial Density Calculation
    coords = df[['Latitude', 'Longitude']].values

    nbrs = NearestNeighbors(n_neighbors=5)
    nbrs.fit(coords)

    distances, _ = nbrs.kneighbors(coords)

    df['avg_neighbour_distance'] = distances.mean(axis=1)

    df['density_score'] = 1 / (df['avg_neighbour_distance'] + 1e-6)

    # Normalize density score
    df['density_score'] = (
        df['density_score'] - df['density_score'].min()
    ) / (
        df['density_score'].max() - df['density_score'].min()
    )

    # Category frequency
    category_frequency = df['Category'].value_counts().to_dict()
    df['category_frequency'] = df['Category'].map(category_frequency)

    # Pending flag
    df['is_pending'] = df['Status'].apply(
        lambda x: 1 if x.lower() == 'pending' else 0
    )

    # Risk Signal
    df['risk_signal'] = (
        0.6 * df['density_score'] +
        0.4 * df['is_pending']
    )

    # Feature selection
    feature_columns = [
        'category_encoded',
        'status_encoded',
        'density_score',
        'category_frequency',
        'is_pending',
        'risk_signal',
        'Latitude',
        'Longitude'
    ]

    features_df = df[['ID'] + feature_columns]

    # Save output
    output_path = "data/processed/features_data.csv"
    features_df.to_csv(output_path, index=False)

    print(f"Feature engineering completed! Saved to: {output_path}")
    print(f"Total records: {len(features_df)}")


if __name__ == "__main__":
    main()