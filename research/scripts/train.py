import pandas as pd
import numpy as np
import json
import os
from scipy.stats import ttest_rel

from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    f1_score, roc_auc_score, precision_recall_fscore_support
)
from sklearn.preprocessing import label_binarize
from sklearn.utils.class_weight import compute_sample_weight


FEATURE_COLS = [
    'category_encoded',
    'status_encoded',
    'density_score',
    'category_frequency',
    'is_pending',
    'Latitude',
    'Longitude'
]

LABEL_COL = 'priority_label'


def train_model(input_path, output_dir="results"):
    print("Training models (Logistic Regression, Decision Tree, Random Forest, XGBoost)...\n")

    os.makedirs(output_dir, exist_ok=True)

    # Load training data (labels assigned in preprocessing)
    df = pd.read_csv(input_path)

    X = df[FEATURE_COLS]
    y = df[LABEL_COL]

    # ===========================
    # Cross-Validation (5-fold)
    # ===========================
    print("===== 5-Fold Cross-Validation with Class Balancing =====\n")

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # Instantiate models
    dt_cv = DecisionTreeClassifier(max_depth=6, class_weight='balanced', random_state=42)
    lr_cv = LogisticRegression(max_iter=5000, class_weight='balanced', random_state=42)
    rf_cv = RandomForestClassifier(n_estimators=100, max_depth=6, class_weight='balanced', random_state=42)
    xgb_cv = XGBClassifier(max_depth=6, random_state=42, eval_metric='mlogloss')

    # Store CV results
    cv_accs = {'lr': [], 'dt': [], 'rf': [], 'xgb': []}
    cv_f1s = {'lr': [], 'dt': [], 'rf': [], 'xgb': []}

    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
        X_tr, X_va = X.iloc[train_idx], X.iloc[val_idx]
        y_tr, y_va = y.iloc[train_idx], y.iloc[val_idx]
        
        # Calculate sample weights for XGBoost class balancing
        sample_weight_tr = compute_sample_weight('balanced', y_tr)
        
        # Fit models
        lr_cv.fit(X_tr, y_tr)
        dt_cv.fit(X_tr, y_tr)
        rf_cv.fit(X_tr, y_tr)
        xgb_cv.fit(X_tr, y_tr, sample_weight=sample_weight_tr)
        
        # Evaluate accuracy
        cv_accs['lr'].append(accuracy_score(y_va, lr_cv.predict(X_va)))
        cv_accs['dt'].append(accuracy_score(y_va, dt_cv.predict(X_va)))
        cv_accs['rf'].append(accuracy_score(y_va, rf_cv.predict(X_va)))
        cv_accs['xgb'].append(accuracy_score(y_va, xgb_cv.predict(X_va)))
        
        # Evaluate Macro F1
        cv_f1s['lr'].append(f1_score(y_va, lr_cv.predict(X_va), average='macro'))
        cv_f1s['dt'].append(f1_score(y_va, dt_cv.predict(X_va), average='macro'))
        cv_f1s['rf'].append(f1_score(y_va, rf_cv.predict(X_va), average='macro'))
        cv_f1s['xgb'].append(f1_score(y_va, xgb_cv.predict(X_va), average='macro'))

    # Compute p-values relative to Logistic Regression (paired t-test)
    p_dt = ttest_rel(cv_accs['dt'], cv_accs['lr']).pvalue
    p_rf = ttest_rel(cv_accs['rf'], cv_accs['lr']).pvalue
    p_xgb = ttest_rel(cv_accs['xgb'], cv_accs['lr']).pvalue

    print(f"Logistic Reg.  — Accuracy: {np.mean(cv_accs['lr']):.4f} ± {np.std(cv_accs['lr']):.4f} | Macro F1: {np.mean(cv_f1s['lr']):.4f} ± {np.std(cv_f1s['lr']):.4f}")
    print(f"Decision Tree  — Accuracy: {np.mean(cv_accs['dt']):.4f} ± {np.std(cv_accs['dt']):.4f} | Macro F1: {np.mean(cv_f1s['dt']):.4f} ± {np.std(cv_f1s['dt']):.4f} | p-val vs LR: {p_dt:.6f}")
    print(f"Random Forest  — Accuracy: {np.mean(cv_accs['rf']):.4f} ± {np.std(cv_accs['rf']):.4f} | Macro F1: {np.mean(cv_f1s['rf']):.4f} ± {np.std(cv_f1s['rf']):.4f} | p-val vs LR: {p_rf:.6f}")
    print(f"XGBoost        — Accuracy: {np.mean(cv_accs['xgb']):.4f} ± {np.std(cv_accs['xgb']):.4f} | Macro F1: {np.mean(cv_f1s['xgb']):.4f} ± {np.std(cv_f1s['xgb']):.4f} | p-val vs LR: {p_xgb:.6f}")

    # ==================================
    # Hold-out Split & Final Models Fit
    # ==================================
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    models = {
        'lr': LogisticRegression(max_iter=5000, class_weight='balanced', random_state=42),
        'dt': DecisionTreeClassifier(max_depth=6, class_weight='balanced', random_state=42),
        'rf': RandomForestClassifier(n_estimators=100, max_depth=6, class_weight='balanced', random_state=42),
        'xgb': XGBClassifier(max_depth=6, random_state=42, eval_metric='mlogloss')
    }

    train_sample_weights = compute_sample_weight('balanced', y_train)
    
    # Fit final models on train split
    models['lr'].fit(X_train, y_train)
    models['dt'].fit(X_train, y_train)
    models['rf'].fit(X_train, y_train)
    models['xgb'].fit(X_train, y_train, sample_weight=train_sample_weights)

    # Predict on hold-out
    preds = {name: model.predict(X_test) for name, model in models.items()}
    probas = {name: model.predict_proba(X_test) for name, model in models.items()}

    print("\n===== Hold-out Test Accuracy =====")
    for name in models.keys():
        print(f"  {name.upper()}: {accuracy_score(y_test, preds[name]):.4f}")

    # ===========================
    # Zero-Shot Real-World Validation
    # ===========================
    print("\n===== Zero-Shot Validation on Eq. 1-Labeled NYC 311 Dataset =====")
    real_results_path = "data/processed/nyc311_zeroshot_features.csv"
    
    if os.path.exists(real_results_path):
        df_real = pd.read_csv(real_results_path)
        X_real = df_real[FEATURE_COLS]
        y_real = df_real[LABEL_COL]
        
        real_preds = {name: model.predict(X_real) for name, model in models.items()}
        
        real_metrics = {}
        for name in models.keys():
            acc = accuracy_score(y_real, real_preds[name])
            f1 = f1_score(y_real, real_preds[name], average='macro')
            real_metrics[name] = {
                "accuracy": float(acc),
                "macro_f1": float(f1),
                "evaluation_type": "zero_shot_synthetic_to_nyc",
                "label_source": "Equation 1 synthetic scoring transfer",
            }
            print(f"  {name.upper()} on NYC 311 - Accuracy: {acc:.4f} | Macro F1: {f1:.4f}")
    else:
        print("NYC 311 features file not found. Skipping real-world validation.")
        real_metrics = None

    # ===========================
    # Feature Importance (DT / RF / XGB)
    # ===========================
    print("\n===== Feature Importance (Random Forest) =====")
    rf_importance = models['rf'].feature_importances_
    feat_importance = dict(zip(FEATURE_COLS, rf_importance.tolist()))
    for feat, imp in sorted(feat_importance.items(), key=lambda x: -x[1]):
        print(f"  {feat}: {imp:.4f}")

    # ==================================
    # Save Comprehensive JSON Results
    # ==================================
    results = {
        'cv': {
            'lr_accuracy_mean': float(np.mean(cv_accs['lr'])),
            'lr_accuracy_std': float(np.std(cv_accs['lr'])),
            'lr_f1_mean': float(np.mean(cv_f1s['lr'])),
            'lr_f1_std': float(np.std(cv_f1s['lr'])),
            
            'dt_accuracy_mean': float(np.mean(cv_accs['dt'])),
            'dt_accuracy_std': float(np.std(cv_accs['dt'])),
            'dt_f1_mean': float(np.mean(cv_f1s['dt'])),
            'dt_f1_std': float(np.std(cv_f1s['dt'])),
            'dt_pvalue': float(p_dt),
            
            'rf_accuracy_mean': float(np.mean(cv_accs['rf'])),
            'rf_accuracy_std': float(np.std(cv_accs['rf'])),
            'rf_f1_mean': float(np.mean(cv_f1s['rf'])),
            'rf_f1_std': float(np.std(cv_f1s['rf'])),
            'rf_pvalue': float(p_rf),
            
            'xgb_accuracy_mean': float(np.mean(cv_accs['xgb'])),
            'xgb_accuracy_std': float(np.std(cv_accs['xgb'])),
            'xgb_f1_mean': float(np.mean(cv_f1s['xgb'])),
            'xgb_f1_std': float(np.std(cv_f1s['xgb'])),
            'xgb_pvalue': float(p_xgb),
        },
        'holdout': {
            'lr_accuracy': float(accuracy_score(y_test, preds['lr'])),
            'lr_macro_f1': float(f1_score(y_test, preds['lr'], average='macro')),
            'dt_accuracy': float(accuracy_score(y_test, preds['dt'])),
            'dt_macro_f1': float(f1_score(y_test, preds['dt'], average='macro')),
            'rf_accuracy': float(accuracy_score(y_test, preds['rf'])),
            'rf_macro_f1': float(f1_score(y_test, preds['rf'], average='macro')),
            'xgb_accuracy': float(accuracy_score(y_test, preds['xgb'])),
            'xgb_macro_f1': float(f1_score(y_test, preds['xgb'], average='macro')),
        },
        'zero_shot_nyc': real_metrics,
        'real_world': real_metrics,
        'feature_importance_rf': feat_importance,
        'confusion_matrices': {
            'lr': confusion_matrix(y_test, preds['lr']).tolist(),
            'dt': confusion_matrix(y_test, preds['dt']).tolist(),
            'rf': confusion_matrix(y_test, preds['rf']).tolist(),
            'xgb': confusion_matrix(y_test, preds['xgb']).tolist()
        }
    }

    # Per-class metrics on hold-out for each model
    results['per_class'] = {}
    for name, pred in preds.items():
        results['per_class'][name] = {}
        for label, class_name in enumerate(['Low', 'Medium', 'High']):
            p, r, f, _ = precision_recall_fscore_support(
                y_test, pred, labels=[label], average='micro'
            )
            results['per_class'][name][class_name] = {
                'precision': float(p), 'recall': float(r), 'f1': float(f)
            }

    # ROC-AUC (one-vs-rest)
    y_test_bin = label_binarize(y_test, classes=[0, 1, 2])
    for name, proba in probas.items():
        auc = roc_auc_score(y_test_bin, proba, average='macro', multi_class='ovr')
        results['holdout'][f'{name}_auc'] = float(auc)

    with open(os.path.join(output_dir, "train_results.json"), 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nAll results saved to {output_dir}/train_results.json")
    return models, X_test, y_test


if __name__ == "__main__":
    train_model("data/processed/features_data.csv")
