import json
import os

import numpy as np
import pandas as pd
from scipy.stats import ttest_rel
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_recall_fscore_support,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import label_binarize
from sklearn.tree import DecisionTreeClassifier
from sklearn.utils.class_weight import compute_sample_weight
from xgboost import XGBClassifier


FEATURE_COLS = [
    "category_encoded",
    "status_encoded",
    "density_score",
    "category_frequency",
    "is_pending",
    "Latitude",
    "Longitude",
]

# Feature subsets for ablation study
BASELINE_COLS = [
    "category_encoded",
    "status_encoded",
    "category_frequency",
    "is_pending",
]

BASELINE_PLUS_DENSITY = BASELINE_COLS + ["density_score"]

BASELINE_PLUS_DENSITY_COORDS = BASELINE_COLS + [
    "density_score",
    "Latitude",
    "Longitude",
]

ROBUSTNESS_FEATURE_SETS = {
    "All features": FEATURE_COLS,
    "Without status": [
        "category_encoded",
        "density_score",
        "category_frequency",
        "Latitude",
        "Longitude",
    ],
    "Without density": [
        "category_encoded",
        "status_encoded",
        "category_frequency",
        "is_pending",
        "Latitude",
        "Longitude",
    ],
}

LABEL_COL = "priority_label"
CLASS_NAMES = ["Low", "Medium", "High"]


def _make_models():
    return {
        "lr": LogisticRegression(max_iter=5000, class_weight="balanced", random_state=42),
        "dt": DecisionTreeClassifier(max_depth=6, class_weight="balanced", random_state=42),
        "rf": RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            class_weight="balanced",
            random_state=42,
        ),
        "xgb": XGBClassifier(max_depth=6, random_state=42, eval_metric="mlogloss"),
    }


def _fit_model(name, model, X_train, y_train):
    if name == "xgb":
        weights = compute_sample_weight("balanced", y_train)
        model.fit(X_train, y_train, sample_weight=weights)
    else:
        model.fit(X_train, y_train)
    return model


def _safe_auc(y_true, probabilities):
    try:
        y_true_bin = label_binarize(y_true, classes=[0, 1, 2])
        return float(roc_auc_score(y_true_bin, probabilities, average="macro", multi_class="ovr"))
    except ValueError:
        return None


def _per_class_metrics(y_true, y_pred):
    metrics = {}
    for label, class_name in enumerate(CLASS_NAMES):
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_true,
            y_pred,
            labels=[label],
            average="micro",
            zero_division=0,
        )
        support = int((np.asarray(y_true) == label).sum())
        metrics[class_name] = {
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
            "support": support,
        }
    return metrics


def _run_cv(X, y, skf, model_name):
    """Run cross-validation for a single model, returning fold-wise accuracies and F1s."""
    accuracies = []
    macro_f1s = []

    for train_idx, val_idx in skf.split(X, y):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
        model = _make_models()[model_name]
        _fit_model(model_name, model, X_train, y_train)
        preds = model.predict(X_val)
        accuracies.append(accuracy_score(y_val, preds))
        macro_f1s.append(f1_score(y_val, preds, average="macro", zero_division=0))

    return accuracies, macro_f1s


def _ablation_cv(X_full, y, skf):
    """Run ablation study on NYC data: baseline → +density → +density+coords."""
    ablation_configs = [
        ("Baseline (No Spatial)", BASELINE_COLS),
        ("+ Density", BASELINE_PLUS_DENSITY),
        ("+ Density + Coords", BASELINE_PLUS_DENSITY_COORDS),
    ]

    ablation_results = {}
    for config_name, feature_cols in ablation_configs:
        X_subset = X_full[feature_cols]
        accuracies, macro_f1s = _run_cv(X_subset, y, skf, "dt")
        ablation_results[config_name] = {
            "features": feature_cols,
            "accuracy_mean": float(np.mean(accuracies)),
            "accuracy_std": float(np.std(accuracies)),
            "macro_f1_mean": float(np.mean(macro_f1s)),
            "macro_f1_std": float(np.std(macro_f1s)),
        }
        print(
            f"  Ablation [{config_name}] - "
            f"Accuracy: {ablation_results[config_name]['accuracy_mean']:.4f} "
            f"+/- {ablation_results[config_name]['accuracy_std']:.4f} | "
            f"Macro F1: {ablation_results[config_name]['macro_f1_mean']:.4f} "
            f"+/- {ablation_results[config_name]['macro_f1_std']:.4f}"
        )

    return ablation_results


def _robustness_cv(X_full, y, skf):
    """Run targeted reviewer diagnostic with XGBoost feature removal."""
    robustness_results = {}

    for config_name, feature_cols in ROBUSTNESS_FEATURE_SETS.items():
        X_subset = X_full[feature_cols]
        accuracies = []
        macro_f1s = []

        for train_idx, val_idx in skf.split(X_subset, y):
            X_train, X_val = X_subset.iloc[train_idx], X_subset.iloc[val_idx]
            y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
            model = XGBClassifier(max_depth=6, random_state=42, eval_metric="mlogloss")
            weights = compute_sample_weight("balanced", y_train)
            model.fit(X_train, y_train, sample_weight=weights)
            preds = model.predict(X_val)
            accuracies.append(accuracy_score(y_val, preds))
            macro_f1s.append(f1_score(y_val, preds, average="macro", zero_division=0))

        robustness_results[config_name] = {
            "features": feature_cols,
            "accuracy_mean": float(np.mean(accuracies)),
            "accuracy_std": float(np.std(accuracies)),
            "macro_f1_mean": float(np.mean(macro_f1s)),
            "macro_f1_std": float(np.std(macro_f1s)),
        }
        print(
            f"  Robustness [{config_name}] - "
            f"Accuracy: {robustness_results[config_name]['accuracy_mean']:.4f} "
            f"+/- {robustness_results[config_name]['accuracy_std']:.4f} | "
            f"Macro F1: {robustness_results[config_name]['macro_f1_mean']:.4f} "
            f"+/- {robustness_results[config_name]['macro_f1_std']:.4f}"
        )

    return robustness_results


def train_nyc_model(input_path="data/processed/nyc311_features.csv", output_dir="results"):
    print("Training models directly on outcome-labeled NYC 311 data...\n")
    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(input_path):
        raise FileNotFoundError(
            f"{input_path} not found. Run scripts/fetch_nyc311.py before direct NYC training."
        )

    df = pd.read_csv(input_path)
    df = df.dropna(subset=FEATURE_COLS + [LABEL_COL])
    X = df[FEATURE_COLS]
    y = df[LABEL_COL].astype(int)

    label_counts = y.value_counts().sort_index()
    min_class_count = int(label_counts.min())
    n_splits = min(5, min_class_count)
    if n_splits < 2:
        raise ValueError(
            "NYC outcome-labeled data needs at least two records in every class "
            "for stratified evaluation."
        )

    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

    # ===========================
    # Cross-Validation with fold-wise tracking
    # ===========================
    print("===== 5-Fold Cross-Validation =====\n")
    cv_results = {}
    fold_accuracies = {}  # Store fold-wise accuracies for paired t-tests

    for name in _make_models().keys():
        accuracies, macro_f1s = _run_cv(X, y, skf, name)
        fold_accuracies[name] = accuracies

        cv_results[name] = {
            "accuracy_mean": float(np.mean(accuracies)),
            "accuracy_std": float(np.std(accuracies)),
            "macro_f1_mean": float(np.mean(macro_f1s)),
            "macro_f1_std": float(np.std(macro_f1s)),
            "fold_accuracies": [float(a) for a in accuracies],
        }
        print(
            f"  {name.upper():<3} CV - Accuracy: {cv_results[name]['accuracy_mean']:.4f} "
            f"+/- {cv_results[name]['accuracy_std']:.4f} | Macro F1: "
            f"{cv_results[name]['macro_f1_mean']:.4f} +/- {cv_results[name]['macro_f1_std']:.4f}"
        )

    # ===========================
    # Paired t-tests (vs LR baseline)
    # ===========================
    print("\n===== Paired t-Tests (vs LR baseline) =====\n")
    lr_accs = np.array(fold_accuracies["lr"])
    paired_ttests = {}
    for name in ["dt", "rf", "xgb"]:
        other_accs = np.array(fold_accuracies[name])
        t_stat, p_val = ttest_rel(other_accs, lr_accs)
        paired_ttests[name] = {
            "t_statistic": float(t_stat),
            "p_value": float(p_val),
        }
        cv_results[name]["p_val_vs_lr"] = float(p_val)
        print(f"  {name.upper()} vs LR: t={t_stat:.4f}, p={p_val:.6f}")

    # ===========================
    # Ablation Study on NYC Data
    # ===========================
    print("\n===== NYC Ablation Study (Decision Tree) =====\n")
    ablation_results = _ablation_cv(X, y, skf)

    # ===========================
    # Status/Density Robustness Diagnostic
    # ===========================
    print("\n===== NYC Robustness Study (XGBoost feature removal) =====\n")
    robustness_results = _robustness_cv(X, y, skf)

    # ===========================
    # Hold-out Evaluation
    # ===========================
    print("\n===== Hold-out Evaluation (80/20 split) =====\n")
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    holdout_results = {}
    per_class = {}
    feature_importance_rf = None
    for name, model in _make_models().items():
        _fit_model(name, model, X_train, y_train)
        preds = model.predict(X_test)
        probabilities = model.predict_proba(X_test)

        holdout_results[name] = {
            "accuracy": float(accuracy_score(y_test, preds)),
            "macro_f1": float(f1_score(y_test, preds, average="macro", zero_division=0)),
            "weighted_f1": float(f1_score(y_test, preds, average="weighted", zero_division=0)),
            "auc": _safe_auc(y_test, probabilities),
        }
        per_class[name] = _per_class_metrics(y_test, preds)
        print(
            f"  {name.upper():<3} Hold-out - Accuracy: {holdout_results[name]['accuracy']:.4f} "
            f"| Macro F1: {holdout_results[name]['macro_f1']:.4f} "
            f"| AUC: {holdout_results[name]['auc']}"
        )

        if name == "rf":
            feature_importance_rf = {
                feature: float(importance)
                for feature, importance in zip(FEATURE_COLS, model.feature_importances_)
            }

    print("\n===== NYC Feature Importance (Random Forest hold-out model) =====\n")
    for feature, importance in sorted(
        feature_importance_rf.items(), key=lambda item: item[1], reverse=True
    ):
        print(f"  {feature}: {importance:.4f}")

    results = {
        "dataset": {
            "records": int(len(df)),
            "label_source": "NYC 311 observed resolution outcome proxy",
            "label_rule": {
                "low": "resolved within 7 days, cancelled, or unresolved under 7 days",
                "medium": "resolved/unresolved between 7 and 30 days",
                "high": "resolved/unresolved after more than 30 days",
            },
            "label_distribution": {
                CLASS_NAMES[int(label)].lower(): int(count)
                for label, count in label_counts.items()
            },
            "category_distribution": {
                str(category): int(count)
                for category, count in df["Category"].value_counts().sort_index().items()
            },
            "status_distribution": {
                str(status): int(count)
                for status, count in df["Status"].value_counts().sort_index().items()
            },
            "data_source": (
                str(df["data_source"].iloc[0]) if "data_source" in df.columns else "unknown"
            ),
        },
        "cv": cv_results,
        "paired_ttests": paired_ttests,
        "ablation": ablation_results,
        "robustness": robustness_results,
        "holdout": holdout_results,
        "per_class": per_class,
        "feature_importance_rf": feature_importance_rf,
    }

    output_path = os.path.join(output_dir, "nyc_direct_training_results.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nNYC direct training results saved to {output_path}")
    return results


if __name__ == "__main__":
    train_nyc_model()
