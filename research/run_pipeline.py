from scripts.preprocess import preprocess
from scripts.fetch_nyc311 import main as fetch_nyc311
from scripts.train import train_model
from scripts.real_world_training import train_nyc_model
from scripts.ablation import ablation_study
from scripts.cluster import cluster_data
from scripts.nyc_hotspot_analysis import analyze_nyc_hotspots
from scripts.generate_figures import generate_all_figures


def main():
    print("=" * 60)
    print("  Urban Civic Research Pipeline — Full Run")
    print("=" * 60 + "\n")

    # Step 1: Preprocess raw data + generate labels
    preprocess(
        "data/raw/urban_civic_reports_synthetic.csv",
        "data/processed/features_data.csv"
    )

    # Step 2: Fetch and featurize outcome-labeled NYC 311 data
    print("\n" + "=" * 60)
    fetch_nyc311()

    # Step 3: Train and evaluate synthetic/Bhopal models
    print("\n" + "=" * 60)
    train_model("data/processed/features_data.csv")

    # Step 4: Train directly on NYC 311 using observed outcome proxy labels
    print("\n" + "=" * 60)
    train_nyc_model("data/processed/nyc311_features.csv")

    # Step 5: Ablation study
    print("\n" + "=" * 60)
    ablation_study("data/processed/features_data.csv")

    # Step 6: Synthetic/Bhopal spatial clustering
    print("\n" + "=" * 60)
    cluster_data("data/processed/features_data.csv")

    # Step 7: NYC spatial hotspot validation
    print("\n" + "=" * 60)
    analyze_nyc_hotspots("data/processed/nyc311_features.csv")

    # Step 8: Generate all figures
    print("\n" + "=" * 60)
    generate_all_figures()

    print("\n" + "=" * 60)
    print("  Pipeline completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
