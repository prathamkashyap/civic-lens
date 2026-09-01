import subprocess
import sys


def run_step(script):
    print(f"\nRunning {script}...\n")
    result = subprocess.run([sys.executable, script])

    if result.returncode != 0:
        print(f"Error in {script}")
        exit()


def main():
    print("Starting full ML pipeline...\n")

    run_step("scripts/generate_data.py")
    run_step("scripts/feature_engineering.py")
    run_step("scripts/train_model.py")
    run_step("scripts/hotspot_clustering.py")
    run_step("export_pipeline.py")

    print("\nFull ML pipeline completed successfully.")


if __name__ == "__main__":
    main()
