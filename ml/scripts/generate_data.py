import pandas as pd
import numpy as np


def generate_cluster(center_lat, center_lon, n_points, spread=0.002):
    lats = np.random.normal(center_lat, spread, n_points)
    lons = np.random.normal(center_lon, spread, n_points)
    return lats, lons


def main():
    print("Generating synthetic civic complaint data...\n")

    BASE_LAT = 23.2599
    BASE_LON = 77.4126

    clusters = [
        (23.2599, 77.4126, 400),   # City center
        (23.2700, 77.4300, 350),   # Residential
        (23.2500, 77.4000, 300),   # Industrial
        (23.2400, 77.4200, 250),   # Market area
    ]

    all_lats = []
    all_lons = []

    np.random.seed(42)

    # Generate clustered data
    for lat, lon, size in clusters:
        lats, lons = generate_cluster(lat, lon, size)
        all_lats.extend(lats)
        all_lons.extend(lons)

    # Add noise points
    noise_points = 300
    noise_lats = np.random.uniform(BASE_LAT - 0.03, BASE_LAT + 0.03, noise_points)
    noise_lons = np.random.uniform(BASE_LON - 0.03, BASE_LON + 0.03, noise_points)

    all_lats.extend(noise_lats)
    all_lons.extend(noise_lons)

    categories = [
        "Waste",
        "Pothole",
        "Streetlight",
        "Drainage",
        "Water Supply"
    ]

    statuses = ["Pending", "Completed", "Cancelled"]

    data_size = len(all_lats)

    category_col = np.random.choice(
        categories,
        size=data_size,
        p=[0.30, 0.25, 0.20, 0.15, 0.10]
    )

    status_col = []

    for cat in category_col:
        if cat in ["Waste", "Drainage"]:
            status_col.append(
                np.random.choice(statuses, p=[0.6, 0.3, 0.1])
            )
        else:
            status_col.append(
                np.random.choice(statuses, p=[0.4, 0.5, 0.1])
            )

    df = pd.DataFrame({
        "ID": range(1, data_size + 1),
        "Category": category_col,
        "Status": status_col,
        "Latitude": all_lats,
        "Longitude": all_lons
    })

    output_path = "data/raw/urban_civic_reports_synthetic.csv"
    df.to_csv(output_path, index=False)

    print(f"Data generated successfully! Saved to: {output_path}")
    print(f"Total records: {len(df)}")


if __name__ == "__main__":
    main()