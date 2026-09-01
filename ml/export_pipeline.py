import pandas as pd
import json
from pathlib import Path


PUBLIC_DIR = Path("../app/public")


def write_json(filename, payload):
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    with open(PUBLIC_DIR / filename, "w") as f:
        json.dump(payload, f, indent=2)


def export_priority_results():
    df = pd.read_csv("data/processed/priority_results.csv")

    records = df.to_dict(orient="records")

    write_json("priority_results.json", records)

    print("priority_results.json exported")


def export_hotspot_summary():
    df = pd.read_csv("data/processed/hotspot_summary.csv")

    records = df.to_dict(orient="records")

    write_json("hotspot_summary.json", records)

    print("hotspot_summary.json exported")


def export_category_priority_matrix():
    priority_df = pd.read_csv("data/processed/priority_results.csv")

    matrix = pd.crosstab(
        priority_df['Category'],
        priority_df['priority_level']
    )

    result = {
        "categories": matrix.index.tolist(),
        "priorities": matrix.columns.tolist(),
        "matrix": matrix.values.tolist()
    }

    write_json("category_priority_matrix.json", result)

    print("category_priority_matrix.json exported")


def export_risk_score_bins():
    df = pd.read_csv("data/processed/priority_results.csv")

    bins = [0, 0.3, 0.5, 0.7, 1.0]
    labels = ["Very Low", "Low", "Medium", "High"]

    df['risk_bin'] = pd.cut(
        df['risk_score'],
        bins=bins,
        labels=labels
    )

    counts = df['risk_bin'].value_counts().sort_index()

    result = [
        {"bin": str(bin_name), "count": int(count)}
        for bin_name, count in counts.items()
    ]

    write_json("risk_score_bins.json", result)

    print("risk_score_bins.json exported")


def run_pipeline():
    print("Running export pipeline...\n")

    export_priority_results()
    export_hotspot_summary()
    export_category_priority_matrix()
    export_risk_score_bins()

    print("\nAll exports completed successfully!")


if __name__ == "__main__":
    run_pipeline()
