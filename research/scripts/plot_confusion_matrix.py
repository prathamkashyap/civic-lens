import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier


def assign_priority(row):
    if row['risk_signal'] >= 0.7:
        return 2
    elif row['risk_signal'] >= 0.4:
        return 1
    else:
        return 0


def plot_confusion():
    df = pd.read_csv("data/processed/features_data.csv")

    df['priority_label'] = df.apply(assign_priority, axis=1)

    np.random.seed(42)
    mask = np.random.rand(len(df)) < 0.05
    df.loc[mask, 'priority_label'] = np.random.choice([0,1,2], size=mask.sum())

    X = df[
        [
            'category_encoded',
            'status_encoded',
            'density_score',
            'category_frequency',
            'is_pending',
            'Latitude',
            'Longitude'
        ]
    ]

    y = df['priority_label']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = DecisionTreeClassifier(max_depth=4, class_weight='balanced')
    model.fit(X_train, y_train)

    preds = model.predict(X_test)

    cm = confusion_matrix(y_test, preds)

    labels = ["Low", "Medium", "High"]

    plt.figure(figsize=(5,4))
    plt.imshow(cm, cmap="Blues")

    plt.title("Confusion Matrix (Decision Tree)", fontsize=12)
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout(pad=0.5)

    plt.xticks(range(3), labels)
    plt.yticks(range(3), labels)

    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            color = "white" if cm[i, j] > 100 else "black"
            plt.text(j, i, cm[i, j], ha='center', va='center', fontsize=10, color=color)

    plt.tight_layout()

    plt.savefig("results/figures/confusion_matrix.png", dpi=300)
    plt.close()

    print("Clean confusion matrix saved!")


if __name__ == "__main__":
    plot_confusion()