import json
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import ttest_rel
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score, precision_recall_fscore_support
from sklearn.model_selection import StratifiedKFold, train_test_split
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

LABEL_COL = "priority_label"

PRIORITY_NAMES = {
    0: "LOW",
    1: "MEDIUM",
    2: "HIGH",
}


def build_models():
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
    )
    xgb = XGBClassifier(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_lambda=1.0,
        random_state=42,
        eval_metric="mlogloss",
    )
    ensemble = VotingClassifier(
        estimators=[
            ("rf", rf),
            ("xgb", xgb),
        ],
        voting="soft",
        weights=[1.2, 1.8],
    )

    return {
        "logistic_regression": LogisticRegression(
            max_iter=5000,
            class_weight="balanced",
            random_state=42,
        ),
        "decision_tree": DecisionTreeClassifier(
            max_depth=8,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
        ),
        "random_forest": rf,
        "xgboost": xgb,
        "soft_voting_ensemble": ensemble,
    }


def fit_model(name, model, X_train, y_train):
    if name == "xgboost":
        weights = compute_sample_weight("balanced", y_train)
        model.fit(X_train, y_train, sample_weight=weights)
    elif name == "soft_voting_ensemble":
        weights = compute_sample_weight("balanced", y_train)
        model.fit(X_train, y_train, sample_weight=weights)
    else:
        model.fit(X_train, y_train)
    return model


def evaluate_models(models, X, y, X_train, y_train, X_test, y_test):
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_accs = {name: [] for name in models}
    cv_f1s = {name: [] for name in models}

    for train_idx, val_idx in skf.split(X, y):
        X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_tr, y_val = y.iloc[train_idx], y.iloc[val_idx]

        for name, model in models.items():
            fit_model(name, model, X_tr, y_tr)
            pred = model.predict(X_val)
            cv_accs[name].append(accuracy_score(y_val, pred))
            cv_f1s[name].append(f1_score(y_val, pred, average="macro", zero_division=0))

    for name, model in models.items():
        fit_model(name, model, X_train, y_train)

    holdout = {}
    per_class = {}
    print("Model Evaluation:\n")
    for name, model in models.items():
        y_pred = model.predict(X_test)
        holdout[name] = {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "macro_f1": float(f1_score(y_test, y_pred, average="macro", zero_division=0)),
        }
        print(f"{name}:")
        print(f"Accuracy: {holdout[name]['accuracy']:.4f}")
        print(classification_report(y_test, y_pred, target_names=["LOW", "MEDIUM", "HIGH"]))

        per_class[name] = {}
        for label, class_name in PRIORITY_NAMES.items():
            precision, recall, f1, _ = precision_recall_fscore_support(
                y_test,
                y_pred,
                labels=[label],
                average="micro",
                zero_division=0,
            )
            per_class[name][class_name] = {
                "precision": float(precision),
                "recall": float(recall),
                "f1": float(f1),
            }

    baseline = cv_accs["logistic_regression"]
    p_values = {}
    for name in ["decision_tree", "random_forest", "xgboost", "soft_voting_ensemble"]:
        p_values[name] = float(ttest_rel(cv_accs[name], baseline).pvalue)

    return cv_accs, cv_f1s, holdout, per_class, p_values


def main():
    print("Starting improved paper-aligned model training and priority generation...\n")

    df = pd.read_csv("data/processed/features_data.csv")
    X = df[FEATURE_COLS]
    y = df[LABEL_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    models = build_models()
    cv_accs, cv_f1s, holdout, per_class, p_values = evaluate_models(
        models, X, y, X_train, y_train, X_test, y_test
    )

    df["priority_level"] = df[LABEL_COL].map(PRIORITY_NAMES)
    df["risk_score"] = (df[LABEL_COL] + 1) / 3.0

    output_cols = [
        "ID",
        "Category",
        "Status",
        "Latitude",
        "Longitude",
        "priority_label",
        "priority_level",
        "risk_score",
    ]

    output_path = "data/processed/priority_results.csv"
    df[output_cols].to_csv(output_path, index=False)

    results = {
        "cv": {
            name: {
                "accuracy_mean": float(np.mean(cv_accs[name])),
                "accuracy_std": float(np.std(cv_accs[name])),
                "macro_f1_mean": float(np.mean(cv_f1s[name])),
                "macro_f1_std": float(np.std(cv_f1s[name])),
            }
            for name in models
        },
        "p_values_vs_logistic_regression": p_values,
        "holdout": holdout,
        "per_class": per_class,
        "feature_importance_random_forest": dict(
            zip(FEATURE_COLS, models["random_forest"].feature_importances_.tolist())
        ),
        "best_model": max(
            holdout,
            key=lambda name: holdout[name]["macro_f1"],
        ),
    }

    Path("results").mkdir(exist_ok=True)
    with open("results/train_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\npriority_results.csv saved to: {output_path}")
    print("train_results.json saved to: results/train_results.json")
    print(f"Total records: {len(df)}")
    print(f"Best holdout model by macro F1: {results['best_model']}")


if __name__ == "__main__":
    main()
