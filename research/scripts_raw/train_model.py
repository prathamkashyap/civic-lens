import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report


def assign_priority(row):
    if row['risk_signal'] >= 0.7:
        return 2   # HIGH
    elif row['risk_signal'] >= 0.4:
        return 1   # MEDIUM
    else:
        return 0   # LOW


def main():
    print("Starting model training and priority generation...\n")

    # Load features
    df = pd.read_csv("data/processed/features_data.csv")

    # Generate labels
    df['priority_label'] = df.apply(assign_priority, axis=1)

    # Feature set
    X = df[
        [
            'category_encoded',
            'status_encoded',
            'density_score',
            'category_frequency',
            'is_pending',
            'risk_signal'
        ]
    ]

    y = df['priority_label']

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Model
    model = DecisionTreeClassifier(
        max_depth=4,
        random_state=42
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    # Evaluation
    print("Model Evaluation:")
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print(classification_report(y_test, y_pred))

    # Map priority → risk score
    priority_to_risk = {
        0: 3,
        1: 6,
        2: 9
    }

    df['risk_score'] = df['priority_label'].map(priority_to_risk)

    # Map labels → names
    priority_names = {
        0: "LOW",
        1: "MEDIUM",
        2: "HIGH"
    }

    df['priority_level'] = df['priority_label'].map(priority_names)

    # Save results
    output_cols = [
        'ID',
        'priority_label',
        'priority_level',
        'risk_score'
    ]

    output_path = "data/processed/priority_results.csv"
    df[output_cols].to_csv(output_path, index=False)

    print(f"\npriority_results.csv saved to: {output_path}")
    print(f"Total records: {len(df)}")


if __name__ == "__main__":
    main()