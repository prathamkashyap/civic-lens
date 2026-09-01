import pandas as pd
import numpy as np
import json
import os

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score, recall_score


LABEL_COL = 'priority_label'


def run_experiment(df, features, name, skf):
    """Run a single ablation experiment with cross-validation."""
    print(f"\n===== {name} =====")

    X = df[features]
    y = df[LABEL_COL]

    model = DecisionTreeClassifier(
        max_depth=6, class_weight='balanced', random_state=42
    )

    # Cross-validation
    acc_scores = cross_val_score(model, X, y, cv=skf, scoring='accuracy')
    f1_scores = cross_val_score(model, X, y, cv=skf, scoring='f1_macro')

    # Hold-out for per-class details
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    high_recall = recall_score(y_test, preds, labels=[2], average='micro')

    print(f"  CV Accuracy: {acc_scores.mean():.4f} ± {acc_scores.std():.4f}")
    print(f"  CV Macro F1: {f1_scores.mean():.4f} ± {f1_scores.std():.4f}")
    print(f"  High Recall (hold-out): {high_recall:.4f}")
    print(classification_report(y_test, preds, target_names=['Low', 'Medium', 'High']))

    return {
        'name': name,
        'features': features,
        'accuracy_mean': float(acc_scores.mean()),
        'accuracy_std': float(acc_scores.std()),
        'f1_mean': float(f1_scores.mean()),
        'f1_std': float(f1_scores.std()),
        'high_recall': float(high_recall),
        'holdout_accuracy': float(accuracy_score(y_test, preds)),
        'holdout_macro_f1': float(f1_score(y_test, preds, average='macro')),
    }


def ablation_study(input_path, output_dir="results"):
    print("Running ablation study with cross-validation...\n")

    os.makedirs(output_dir, exist_ok=True)

    df = pd.read_csv(input_path)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    results = []

    # Experiment 1: Category + Status only (baseline — no spatial features)
    results.append(run_experiment(
        df,
        ['category_encoded', 'status_encoded', 'category_frequency', 'is_pending'],
        "Baseline (No Spatial)",
        skf
    ))

    # Experiment 2: + Density
    results.append(run_experiment(
        df,
        ['category_encoded', 'status_encoded', 'density_score', 'category_frequency', 'is_pending'],
        "With Density",
        skf
    ))

    # Experiment 3: + Geographic Coordinates
    results.append(run_experiment(
        df,
        ['category_encoded', 'status_encoded', 'density_score', 'category_frequency',
         'is_pending', 'Latitude', 'Longitude'],
        "Full Features (Density + Coordinates)",
        skf
    ))

    # Save results
    with open(os.path.join(output_dir, "ablation_results.json"), 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nAblation results saved to {output_dir}/ablation_results.json")

    return results


if __name__ == "__main__":
    ablation_study("data/processed/features_data.csv")