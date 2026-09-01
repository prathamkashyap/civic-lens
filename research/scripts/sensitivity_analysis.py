import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.neighbors import NearestNeighbors, BallTree

CATEGORY_SEVERITY = {
    'Water Supply': 5,
    'Drainage': 4,
    'Pothole': 3,
    'Streetlight': 2,
    'Waste': 1,
}

STATUS_WEIGHT = {
    'Pending': 1.0,
    'Completed': 0.0,
    'Cancelled': 0.2,
}

def assign_priority_label(score):
    if score >= 0.7:
        return 2   # HIGH
    elif score >= 0.4:
        return 1   # MEDIUM
    else:
        return 0   # LOW

def run_sensitivity():
    print("Starting sensitivity analysis on label weights...")
    
    # Load raw data
    raw_df = pd.read_csv("data/raw/urban_civic_reports_synthetic.csv")
    raw_df.columns = raw_df.columns.str.strip()
    raw_df = raw_df.sort_values(by='ID').reset_index(drop=True)
    
    coords = raw_df[['Latitude', 'Longitude']].values
    
    # Compute KNN Density feature (constant across runs)
    nbrs = NearestNeighbors(n_neighbors=5)
    nbrs.fit(coords)
    distances, _ = nbrs.kneighbors(coords)
    density_score = 1 / (distances.mean(axis=1) + 1e-6)
    density_score = (density_score - density_score.min()) / (density_score.max() - density_score.min())
    
    # Category and Status encodings (constant)
    le_category = LabelEncoder()
    le_status = LabelEncoder()
    category_encoded = le_category.fit_transform(raw_df['Category'])
    status_encoded = le_status.fit_transform(raw_df['Status'])
    category_frequency = raw_df['Category'].map(raw_df['Category'].value_counts())
    is_pending = raw_df['Status'].apply(lambda x: 1 if x.lower() == 'pending' else 0)
    
    # Compute spatial urgency (constant)
    RADIUS = 0.003
    tree = BallTree(coords)
    all_neighbor_indices = tree.query_radius(coords, r=RADIUS)
    
    same_cat_counts = []
    for i in range(len(raw_df)):
        neighbors = all_neighbor_indices[i]
        same_cat = sum(
            1 for j in neighbors
            if j != i and raw_df.iloc[j]['Category'] == raw_df.iloc[i]['Category']
        )
        same_cat_counts.append(same_cat)
    
    max_scn = max(same_cat_counts) if max(same_cat_counts) > 0 else 1
    spatial_urgency = np.array(same_cat_counts) / max_scn
    
    severity_norm = raw_df['Category'].map(CATEGORY_SEVERITY) / 5.0
    status_wt = raw_df['Status'].map(STATUS_WEIGHT)
    
    # Feature matrix X (constant)
    X = pd.DataFrame({
        'category_encoded': category_encoded,
        'status_encoded': status_encoded,
        'density_score': density_score,
        'category_frequency': category_frequency,
        'is_pending': is_pending,
        'Latitude': raw_df['Latitude'],
        'Longitude': raw_df['Longitude']
    })
    
    # Weight configurations to test: w1 (category), w2 (status), w3 (spatial)
    # Each must sum to 1.0, and they represent variations of +/- 0.1 around the baseline (0.4, 0.3, 0.3)
    configurations = [
        {"name": "Baseline", "w1": 0.4, "w2": 0.3, "w3": 0.3},
        {"name": "w_cat +0.1", "w1": 0.5, "w2": 0.25, "w3": 0.25},
        {"name": "w_cat -0.1", "w1": 0.3, "w2": 0.35, "w3": 0.35},
        {"name": "w_status +0.1", "w1": 0.4, "w2": 0.4, "w3": 0.2},
        {"name": "w_status -0.1", "w1": 0.4, "w2": 0.2, "w3": 0.4},
        {"name": "w_spatial +0.1", "w1": 0.35, "w2": 0.25, "w3": 0.4},
        {"name": "w_spatial -0.1", "w1": 0.45, "w2": 0.35, "w3": 0.2},
        {"name": "w_cat +0.1, w_status -0.1", "w1": 0.5, "w2": 0.2, "w3": 0.3},
        {"name": "w_cat -0.1, w_spatial +0.1", "w1": 0.3, "w2": 0.3, "w3": 0.4},
    ]
    
    results = []
    
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    model = DecisionTreeClassifier(max_depth=6, class_weight='balanced', random_state=42)
    
    for config in configurations:
        w1, w2, w3 = config["w1"], config["w2"], config["w3"]
        
        # Calculate composite score
        score = w1 * severity_norm + w2 * status_wt + w3 * spatial_urgency
        
        # Assign labels
        labels = score.apply(assign_priority_label)
        
        # Add seed-consistent 5% noise as in preprocess.py
        np.random.seed(42)
        mask = np.random.rand(len(raw_df)) < 0.05
        labels.loc[mask] = np.random.choice([0, 1, 2], size=mask.sum())
        
        # Label distributions
        counts = labels.value_counts().sort_index().to_dict()
        low_count = counts.get(0, 0)
        med_count = counts.get(1, 0)
        high_count = counts.get(2, 0)
        
        # Evaluate model performance using 5-fold CV
        acc_scores = cross_val_score(model, X, labels, cv=skf, scoring='accuracy')
        f1_scores = cross_val_score(model, X, labels, cv=skf, scoring='f1_macro')
        
        config_result = {
            "name": config["name"],
            "w_category": w1,
            "w_status": w2,
            "w_spatial": w3,
            "distribution": {
                "Low (0)": int(low_count),
                "Medium (1)": int(med_count),
                "High (2)": int(high_count)
            },
            "cv_accuracy_mean": float(acc_scores.mean()),
            "cv_accuracy_std": float(acc_scores.std()),
            "cv_f1_mean": float(f1_scores.mean()),
            "cv_f1_std": float(f1_scores.std())
        }
        results.append(config_result)
        
        print(f"Config '{config['name']}': Weights=({w1}, {w2}, {w3})")
        print(f"  Distribution: Low={low_count}, Med={med_count}, High={high_count}")
        print(f"  CV Accuracy: {acc_scores.mean():.4f} | CV Macro F1: {f1_scores.mean():.4f}")
        
    # Save results to JSON
    os.makedirs("results", exist_ok=True)
    with open("results/sensitivity_results.json", 'w') as f:
        json.dump(results, f, indent=2)
        
    print("\nSensitivity analysis completed and results saved to results/sensitivity_results.json")

if __name__ == "__main__":
    run_sensitivity()
