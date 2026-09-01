"""
Generate all figures for the research paper.
Reads results JSON files and produces publication-quality plots.
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import json
import os

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    confusion_matrix, roc_curve, auc
)
from sklearn.preprocessing import label_binarize
from sklearn.utils.class_weight import compute_sample_weight

# Publication style
plt.rcParams.update({
    'font.family': 'serif',
    'font.size': 10,
    'axes.labelsize': 11,
    'axes.titlesize': 12,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'legend.fontsize': 8,
    'figure.dpi': 300,
})

FIGURE_DIR = "results/figures"
LABEL_COL = 'priority_label'
FEATURE_COLS = [
    'category_encoded', 'status_encoded', 'density_score',
    'category_frequency', 'is_pending', 'Latitude', 'Longitude'
]


def load_data_and_models(data_path):
    """Load data and train all four models for figure generation."""
    df = pd.read_csv(data_path)
    X = df[FEATURE_COLS]
    y = df[LABEL_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    lr = LogisticRegression(max_iter=5000, class_weight='balanced', random_state=42)
    lr.fit(X_train, y_train)

    dt = DecisionTreeClassifier(max_depth=6, class_weight='balanced', random_state=42)
    dt.fit(X_train, y_train)

    rf = RandomForestClassifier(n_estimators=100, max_depth=6, class_weight='balanced', random_state=42)
    rf.fit(X_train, y_train)

    xgb = XGBClassifier(max_depth=6, random_state=42, eval_metric='mlogloss')
    sample_weight = compute_sample_weight('balanced', y_train)
    xgb.fit(X_train, y_train, sample_weight=sample_weight)

    return df, lr, dt, rf, xgb, X_train, X_test, y_train, y_test


def plot_confusion_matrix(model, X_test, y_test, model_name="Random Forest"):
    """Fig 2: Confusion matrix for Random Forest."""
    preds = model.predict(X_test)
    cm = confusion_matrix(y_test, preds)
    labels = ["Low", "Medium", "High"]

    fig, ax = plt.subplots(figsize=(4.5, 3.8))
    im = ax.imshow(cm, cmap="Blues", aspect='auto')

    ax.set_title(f"Confusion Matrix — {model_name}")
    ax.set_xlabel("Predicted Label")
    ax.set_ylabel("True Label")

    ax.set_xticks(range(3))
    ax.set_yticks(range(3))
    ax.set_xticklabels(labels)
    ax.set_yticklabels(labels)

    thresh = cm.max() / 2
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            color = "white" if cm[i, j] > thresh else "black"
            ax.text(j, i, str(cm[i, j]), ha='center', va='center',
                    fontsize=11, fontweight='bold', color=color)

    fig.colorbar(im, ax=ax, shrink=0.8)
    plt.tight_layout()
    plt.savefig(f"{FIGURE_DIR}/confusion_matrix.png", dpi=300, bbox_inches='tight')
    plt.close()
    print("  ✓ Confusion matrix saved")


def plot_spatial_distribution(df):
    """Fig 3: Spatial distribution of complaints colored by priority."""
    fig, ax = plt.subplots(figsize=(6, 5))

    colors = {0: '#2ecc71', 1: '#f39c12', 2: '#e74c3c'}
    labels = {0: 'Low', 1: 'Medium', 2: 'High'}
    sizes = {0: 8, 1: 12, 2: 18}

    for priority in [0, 1, 2]:
        mask = df[LABEL_COL] == priority
        ax.scatter(
            df.loc[mask, 'Longitude'], df.loc[mask, 'Latitude'],
            c=colors[priority], s=sizes[priority], alpha=0.6,
            label=f'{labels[priority]} Priority', edgecolors='none'
        )

    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_title("Spatial Distribution of Civic Complaints by Priority")
    ax.legend(loc='upper right', framealpha=0.9)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(f"{FIGURE_DIR}/spatial_distribution.png", dpi=300, bbox_inches='tight')
    plt.close()
    print("  ✓ Spatial distribution saved")


def plot_hotspot_clusters(df):
    """Fig 4: DBSCAN hotspot clusters."""
    from sklearn.cluster import DBSCAN

    coords = df[['Latitude', 'Longitude']].values
    dbscan = DBSCAN(eps=0.002, min_samples=3)
    cluster_ids = dbscan.fit_predict(coords)

    fig, ax = plt.subplots(figsize=(6, 5))

    noise_mask = cluster_ids == -1
    ax.scatter(
        df.loc[noise_mask, 'Longitude'], df.loc[noise_mask, 'Latitude'],
        c='lightgray', s=6, alpha=0.4, label='Noise', edgecolors='none'
    )

    unique_clusters = sorted(set(cluster_ids) - {-1})
    cmap = plt.cm.get_cmap('tab20', len(unique_clusters))

    for idx, cid in enumerate(unique_clusters):
        mask = cluster_ids == cid
        ax.scatter(
            df.loc[mask, 'Longitude'], df.loc[mask, 'Latitude'],
            c=[cmap(idx)], s=14, alpha=0.7,
            label=f'Cluster {cid}' if idx < 10 else None,
            edgecolors='none'
        )

    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_title("DBSCAN Hotspot Clusters")
    ax.legend(loc='upper right', framealpha=0.9, fontsize=7, ncol=2)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(f"{FIGURE_DIR}/hotspot_clusters.png", dpi=300, bbox_inches='tight')
    plt.close()
    print("  ✓ Hotspot clusters saved")


def plot_feature_importance(rf):
    """Fig 5: Feature importance bar chart for Random Forest."""
    importance = rf.feature_importances_
    feature_names = [
        'Category', 'Status', 'Density\nScore', 'Category\nFrequency',
        'Pending\nFlag', 'Latitude', 'Longitude'
    ]

    sorted_idx = np.argsort(importance)[::-1]
    sorted_names = [feature_names[i] for i in sorted_idx]
    sorted_imp = importance[sorted_idx]

    fig, ax = plt.subplots(figsize=(5.5, 3.5))

    colors = ['#3498db' if imp > 0.1 else '#95a5a6' for imp in sorted_imp]
    bars = ax.bar(range(len(sorted_imp)), sorted_imp, color=colors, edgecolor='white')

    for bar, val in zip(bars, sorted_imp):
        if val > 0.02:
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.008,
                    f'{val:.3f}', ha='center', va='bottom', fontsize=8)

    ax.set_xticks(range(len(sorted_names)))
    ax.set_xticklabels(sorted_names, fontsize=8)
    ax.set_ylabel("Importance Score")
    ax.set_title("Feature Importance — Random Forest Classifier")
    ax.grid(axis='y', alpha=0.3)

    plt.tight_layout()
    plt.savefig(f"{FIGURE_DIR}/feature_importance.png", dpi=300, bbox_inches='tight')
    plt.close()
    print("  ✓ Feature importance saved")


def plot_roc_curves(lr, dt, rf, xgb, X_test, y_test):
    """Fig 6: ROC curves for all four models in a 2x2 panel."""
    classes = [0, 1, 2]
    class_names = ['Low', 'Medium', 'High']
    y_test_bin = label_binarize(y_test, classes=classes)

    fig, axes = plt.subplots(2, 2, figsize=(9, 8))
    axes = axes.flatten()

    models = [lr, dt, rf, xgb]
    model_names = ['Logistic Regression', 'Decision Tree', 'Random Forest', 'XGBoost']

    for ax, model, model_name in zip(axes, models, model_names):
        proba = model.predict_proba(X_test)
        colors = ['#2ecc71', '#f39c12', '#e74c3c']

        for i, (cls_name, color) in enumerate(zip(class_names, colors)):
            fpr, tpr, _ = roc_curve(y_test_bin[:, i], proba[:, i])
            roc_auc = auc(fpr, tpr)
            ax.plot(fpr, tpr, color=color, lw=1.5,
                    label=f'{cls_name} (AUC={roc_auc:.3f})')

        ax.plot([0, 1], [0, 1], 'k--', lw=0.8, alpha=0.5)
        ax.set_xlabel("False Positive Rate", fontsize=8)
        ax.set_ylabel("True Positive Rate", fontsize=8)
        ax.set_title(f"{model_name}", fontsize=10)
        ax.legend(loc='lower right', fontsize=7)
        ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(f"{FIGURE_DIR}/roc_curves.png", dpi=300, bbox_inches='tight')
    plt.close()
    print("  ✓ 2x2 ROC curves saved")


def plot_ablation_accuracy(results_path):
    """Fig 7: Ablation study bar chart with error bars."""
    with open(results_path) as f:
        results = json.load(f)

    names = [r['name'] for r in results]
    acc_means = [r['accuracy_mean'] for r in results]
    acc_stds = [r['accuracy_std'] for r in results]
    f1_means = [r['f1_mean'] for r in results]
    f1_stds = [r['f1_std'] for r in results]

    x = np.arange(len(names))
    width = 0.35

    fig, ax = plt.subplots(figsize=(6, 4))

    bars1 = ax.bar(x - width/2, acc_means, width, yerr=acc_stds,
                   label='Accuracy', color='#3498db', capsize=4, edgecolor='white')
    bars2 = ax.bar(x + width/2, f1_means, width, yerr=f1_stds,
                   label='Macro F1', color='#e74c3c', capsize=4, edgecolor='white')

    for bar, val in zip(bars1, acc_means):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.012,
                f'{val:.3f}', ha='center', va='bottom', fontsize=8)
    for bar, val in zip(bars2, f1_means):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.012,
                f'{val:.3f}', ha='center', va='bottom', fontsize=8)

    ax.set_xticks(x)
    ax.set_xticklabels([n.replace(' (', '\n(') for n in names], fontsize=8)
    ax.set_ylabel("Score")
    ax.set_title("Ablation Study — Impact of Spatial Features")
    ax.legend(loc='lower right')
    ax.set_ylim(0.4, 1.05)
    ax.grid(axis='y', alpha=0.3)

    plt.tight_layout()
    plt.savefig(f"{FIGURE_DIR}/ablation_accuracy.png", dpi=300, bbox_inches='tight')
    plt.close()
    print("  ✓ Ablation accuracy saved")


def plot_class_distribution(df):
    """Supplementary: Class distribution pie chart."""
    counts = df[LABEL_COL].value_counts().sort_index()
    labels = ['Low', 'Medium', 'High']
    colors = ['#2ecc71', '#f39c12', '#e74c3c']

    fig, ax = plt.subplots(figsize=(4, 3.5))
    wedges, texts, autotexts = ax.pie(
        counts.values, labels=labels, colors=colors,
        autopct='%1.1f%%', startangle=90, pctdistance=0.85
    )
    for autotext in autotexts:
        autotext.set_fontsize(9)

    ax.set_title("Priority Label Distribution")
    plt.tight_layout()
    plt.savefig(f"{FIGURE_DIR}/class_distribution.png", dpi=300, bbox_inches='tight')
    plt.close()
    print("  ✓ Class distribution saved")


def generate_all_figures(data_path="data/processed/features_data.csv"):
    """Generate all figures for the paper."""
    os.makedirs(FIGURE_DIR, exist_ok=True)

    print("Generating publication figures...\n")

    df, lr, dt, rf, xgb, X_train, X_test, y_train, y_test = load_data_and_models(data_path)

    # Use Random Forest as the primary model for confusion matrix
    plot_confusion_matrix(rf, X_test, y_test, "Random Forest")
    plot_spatial_distribution(df)
    plot_hotspot_clusters(df)
    plot_feature_importance(rf)
    plot_roc_curves(lr, dt, rf, xgb, X_test, y_test)
    plot_class_distribution(df)

    # Ablation plot (needs ablation results)
    ablation_path = "results/ablation_results.json"
    if os.path.exists(ablation_path):
        plot_ablation_accuracy(ablation_path)
    else:
        print("  ⚠ Ablation results not found — run ablation.py first")

    print(f"\nAll figures saved to {FIGURE_DIR}/")


if __name__ == "__main__":
    generate_all_figures()
