import os
from datetime import timezone

import numpy as np
import pandas as pd
import requests
from sklearn.neighbors import BallTree, NearestNeighbors


NYC311_ENDPOINT = "https://data.cityofnewyork.us/resource/erm2-nwe9.json"

CATEGORY_MAPPING = {
    "Water System": "Water Supply",
    "Water Quality": "Water Supply",
    "Sewer": "Drainage",
    "Sewer Backup": "Drainage",
    "Street Condition": "Pothole",
    "Pothole": "Pothole",
    "Street Light Condition": "Streetlight",
    "Traffic Signal Condition": "Streetlight",
    "Dirty Condition": "Waste",
    "Dirty Conditions": "Waste",
    "Illegal Dumping": "Waste",
    "Missed Collection": "Waste",
    "Missed Collection (All Materials)": "Waste",
}

STATUS_MAPPING = {
    "Pending": "Pending",
    "Open": "Pending",
    "In Progress": "Pending",
    "Assigned": "Pending",
    "Started": "Pending",
    "Closed": "Completed",
    "Cancel": "Cancelled",
    "Cancelled": "Cancelled",
}

MUNICIPAL_QUERIES = {
    "Water Supply": ["Water System", "Water Quality"],
    "Drainage": ["Sewer", "Sewer Backup"],
    "Pothole": ["Street Condition", "Pothole"],
    "Streetlight": ["Street Light Condition", "Traffic Signal Condition"],
    "Waste": [
        "Dirty Condition",
        "Dirty Conditions",
        "Illegal Dumping",
        "Missed Collection",
        "Missed Collection (All Materials)",
    ],
}

# Keep encodings consistent with sklearn LabelEncoder fitted on the synthetic
# Bhopal categories/statuses in scripts/preprocess.py.
CATEGORY_ENCODING = {
    "Drainage": 0,
    "Pothole": 1,
    "Streetlight": 2,
    "Waste": 3,
    "Water Supply": 4,
}

STATUS_ENCODING = {
    "Cancelled": 0,
    "Completed": 1,
    "Pending": 2,
}

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


def _quote_values(values):
    return ", ".join(f"'{value}'" for value in values)


def _format_socrata_datetime(timestamp):
    return timestamp.strftime("%Y-%m-%dT%H:%M:%S")


def _fetch_records_for_category(
    category_name,
    complaint_types,
    limit,
    start_date,
    reference_date,
):
    records = []
    closed_limit = max(1, int(limit * 0.6))
    high_open_limit = max(1, int(limit * 0.25))
    medium_open_limit = max(1, limit - closed_limit - high_open_limit)
    high_cutoff = _format_socrata_datetime(reference_date - pd.Timedelta(days=30))
    medium_start = _format_socrata_datetime(reference_date - pd.Timedelta(days=30))
    medium_end = _format_socrata_datetime(reference_date - pd.Timedelta(days=7))

    base_where = (
        "latitude is not null and longitude is not null "
        f"and complaint_type in ({_quote_values(complaint_types)}) "
        f"and created_date >= '{start_date}'"
    )

    query_groups = [
        ("Closed", closed_limit, "status = 'Closed'", "created_date DESC"),
        (
            "OpenHigh",
            high_open_limit,
            f"status != 'Closed' and created_date <= '{high_cutoff}'",
            "created_date ASC",
        ),
        (
            "OpenMedium",
            medium_open_limit,
            (
                "status != 'Closed' "
                f"and created_date > '{medium_start}' "
                f"and created_date <= '{medium_end}'"
            ),
            "created_date DESC",
        ),
    ]

    for status_group, group_limit, status_filter, order in query_groups:
        where_clause = f"{base_where} and {status_filter}"

        params = {
            "$select": (
                "unique_key,created_date,closed_date,complaint_type,status,"
                "latitude,longitude"
            ),
            "$where": where_clause,
            "$limit": group_limit,
            "$order": order,
        }

        try:
            response = requests.get(NYC311_ENDPOINT, params=params, timeout=45)
            response.raise_for_status()
            batch = response.json()
            print(f"  {category_name:<13} {status_group:<6}: {len(batch)} records")
            records.extend(batch)
        except Exception as exc:
            print(f"  {category_name:<13} {status_group:<6}: skipped ({exc})")

    return records


def _build_mock_records(sample_size):
    print("Falling back to mock NYC-like records because live download failed.")
    rng = np.random.default_rng(42)
    complaint_types = list(CATEGORY_MAPPING.keys())
    statuses = np.array(["Closed", "Closed", "Closed", "Assigned", "In Progress"])
    start = pd.Timestamp("2024-01-01T00:00:00Z")

    records = []
    for index in range(sample_size):
        created = start + pd.Timedelta(days=int(rng.integers(0, 600)))
        status = str(rng.choice(statuses))
        if status == "Closed":
            closed = created + pd.Timedelta(days=int(rng.choice([2, 4, 8, 15, 45])))
            closed_value = closed.isoformat()
        else:
            closed_value = None

        records.append(
            {
                "unique_key": f"MOCK_NYC_{index:05d}",
                "created_date": created.isoformat(),
                "closed_date": closed_value,
                "complaint_type": str(rng.choice(complaint_types)),
                "status": status,
                "latitude": 40.70 + rng.normal(0, 0.05),
                "longitude": -73.93 + rng.normal(0, 0.05),
            }
        )
    return records


def _normalize_density(values):
    minimum = values.min()
    maximum = values.max()
    if maximum == minimum:
        return np.zeros(len(values))
    return (values - minimum) / (maximum - minimum)


def _assign_outcome_priority(row):
    """Create priority labels from observed resolution outcomes only."""
    if row["Status"] == "Cancelled":
        return 0, "cancelled"

    if row["Status"] == "Completed":
        days = row["resolution_days"]
        if pd.isna(days):
            days = row["days_open"]
        if days > 30:
            return 2, "resolved_after_30_days"
        if days > 7:
            return 1, "resolved_between_7_and_30_days"
        return 0, "resolved_within_7_days"

    days = row["days_open"]
    if days > 30:
        return 2, "unresolved_after_30_days"
    if days >= 7:
        return 1, "unresolved_between_7_and_30_days"
    return 0, "unresolved_under_7_days"


def _assign_composite_priority(score):
    if score >= 0.7:
        return 2
    if score >= 0.4:
        return 1
    return 0


def _create_zero_shot_sample(df, output_path, sample_per_category=120):
    parts = []
    for _, category_df in df.groupby("Category"):
        parts.append(
            category_df.sample(
                n=min(sample_per_category, len(category_df)),
                random_state=42,
            )
        )

    sample = pd.concat(parts).sample(frac=1.0, random_state=42).reset_index(drop=True)
    coords = sample[["Latitude", "Longitude"]].to_numpy()
    tree = BallTree(coords)
    neighbor_indices = tree.query_radius(coords, r=0.003)

    same_category_counts = []
    for row_index, neighbors in enumerate(neighbor_indices):
        same_category_counts.append(
            sum(
                1
                for neighbor_index in neighbors
                if neighbor_index != row_index
                and sample.iloc[neighbor_index]["Category"]
                == sample.iloc[row_index]["Category"]
            )
        )

    max_count = max(same_category_counts) if same_category_counts else 1
    if max_count == 0:
        max_count = 1

    spatial_urgency = np.array(same_category_counts) / max_count
    severity_norm = sample["Category"].map(CATEGORY_SEVERITY) / 5.0
    status_weight = sample["Status"].map(STATUS_WEIGHT)

    sample["priority_score_eq1"] = (
        0.4 * severity_norm + 0.3 * status_weight + 0.3 * spatial_urgency
    )
    sample["priority_label"] = sample["priority_score_eq1"].apply(
        _assign_composite_priority
    )
    sample["label_source"] = "Equation 1 synthetic scoring transfer"
    sample.to_csv(output_path, index=False)
    return sample


def main():
    per_category_limit = int(os.getenv("NYC311_PER_CATEGORY_LIMIT", "2000"))
    sample_size = int(os.getenv("NYC311_SAMPLE_SIZE", str(per_category_limit * 5)))
    start_date = os.getenv("NYC311_START_DATE", "2023-01-01T00:00:00")
    reference_date_raw = os.getenv("NYC311_REFERENCE_DATE")

    if reference_date_raw:
        reference_date = pd.Timestamp(reference_date_raw)
        if reference_date.tzinfo is None:
            reference_date = reference_date.tz_localize(timezone.utc)
    else:
        reference_date = pd.Timestamp.now(tz=timezone.utc)

    print("Fetching NYC 311 service request data for real-world validation...")
    print(f"Source: {NYC311_ENDPOINT}")
    print(f"Per-category target: {per_category_limit}")
    print(f"Outcome-label reference date: {reference_date.isoformat()}")

    all_records = []
    for category_name, complaint_types in MUNICIPAL_QUERIES.items():
        all_records.extend(
            _fetch_records_for_category(
                category_name,
                complaint_types,
                per_category_limit,
                start_date,
                reference_date,
            )
        )
    data_source = "nyc_open_data"

    if len(all_records) < 300:
        print(f"Only {len(all_records)} live NYC records were fetched.")
        all_records = _build_mock_records(min(sample_size, 1000))
        data_source = "mock_fallback"

    df = pd.DataFrame(all_records)
    df["Category"] = df["complaint_type"].map(CATEGORY_MAPPING)
    df["Status"] = df["status"].map(STATUS_MAPPING).fillna("Pending")
    df["Latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["Longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df["ID"] = df["unique_key"].astype(str)
    df["created_at"] = pd.to_datetime(df["created_date"], errors="coerce", utc=True)
    df["closed_at"] = pd.to_datetime(df["closed_date"], errors="coerce", utc=True)

    df = df.dropna(subset=["Category", "Latitude", "Longitude", "created_at"])
    df = df.drop_duplicates(subset=["ID"]).reset_index(drop=True)

    df["days_open"] = (
        (reference_date - df["created_at"]).dt.total_seconds() / 86400.0
    ).clip(lower=0)
    df["resolution_days"] = (
        (df["closed_at"] - df["created_at"]).dt.total_seconds() / 86400.0
    ).clip(lower=0)

    labels_and_reasons = df.apply(_assign_outcome_priority, axis=1)
    df["priority_label"] = [item[0] for item in labels_and_reasons]
    df["outcome_label_reason"] = [item[1] for item in labels_and_reasons]

    if len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42)
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    coords = df[["Latitude", "Longitude"]].to_numpy()
    n_neighbors = min(5, len(df))
    nbrs = NearestNeighbors(n_neighbors=n_neighbors)
    nbrs.fit(coords)
    distances, _ = nbrs.kneighbors(coords)
    density_raw = 1 / (distances.mean(axis=1) + 1e-6)
    df["density_score"] = _normalize_density(density_raw)

    category_frequency = df["Category"].value_counts().to_dict()
    df["category_frequency"] = df["Category"].map(category_frequency)
    df["is_pending"] = (df["Status"] == "Pending").astype(int)
    df["category_encoded"] = df["Category"].map(CATEGORY_ENCODING)
    df["status_encoded"] = df["Status"].map(STATUS_ENCODING)
    df["data_source"] = data_source

    # Stored for audit only. The label is outcome-based, while model features
    # remain aligned with the original spatial pipeline.
    radius = 0.003
    tree = BallTree(coords)
    neighbor_indices = tree.query_radius(coords, r=radius)
    same_category_counts = []
    for row_index, neighbors in enumerate(neighbor_indices):
        same_category_counts.append(
            sum(
                1
                for neighbor_index in neighbors
                if neighbor_index != row_index
                and df.iloc[neighbor_index]["Category"] == df.iloc[row_index]["Category"]
            )
        )
    df["same_category_neighbors"] = same_category_counts

    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)

    raw_cols = [
        "ID",
        "Category",
        "Status",
        "Latitude",
        "Longitude",
        "complaint_type",
        "status",
        "created_at",
        "closed_at",
        "days_open",
        "resolution_days",
        "outcome_label_reason",
        "data_source",
    ]
    feature_cols = [
        "ID",
        "Category",
        "Status",
        "Latitude",
        "Longitude",
        "category_encoded",
        "status_encoded",
        "density_score",
        "category_frequency",
        "is_pending",
        "priority_label",
        "created_at",
        "closed_at",
        "days_open",
        "resolution_days",
        "outcome_label_reason",
        "same_category_neighbors",
        "data_source",
    ]

    df[raw_cols].to_csv("data/raw/nyc311_raw.csv", index=False)
    df[feature_cols].to_csv("data/processed/nyc311_features.csv", index=False)
    zero_shot_sample = _create_zero_shot_sample(
        df[feature_cols],
        "data/processed/nyc311_zeroshot_features.csv",
    )

    print(f"Saved raw NYC 311 data to data/raw/nyc311_raw.csv ({len(df)} records)")
    print("Saved processed NYC 311 data to data/processed/nyc311_features.csv")
    print("Saved Eq. 1 zero-shot NYC sample to data/processed/nyc311_zeroshot_features.csv")
    print("Outcome-based NYC priority label distribution:")
    print(df["priority_label"].value_counts().sort_index())
    print("Eq. 1 zero-shot NYC priority label distribution:")
    print(zero_shot_sample["priority_label"].value_counts().sort_index())
    print("NYC category distribution:")
    print(df["Category"].value_counts().sort_index())


if __name__ == "__main__":
    main()
