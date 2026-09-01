import matplotlib.pyplot as plt

def plot_ablation():
    labels = ["Without Density", "With Density", "Full Features"]
    accuracy = [0.86875, 0.9625, 0.971875]

    plt.figure(figsize=(6,4))

    plt.plot(
        labels,
        accuracy,
        marker='o',
        linewidth=2
    )

    # Add value labels on points
    for i, val in enumerate(accuracy):
        plt.text(i, val + 0.002, f"{val:.3f}", ha='center', fontsize=9)

    plt.xlabel("Feature Set")
    plt.ylabel("Accuracy")
    plt.title("Effect of Spatial Density on Model Performance")

    plt.ylim(0.85, 1.0)

    plt.grid(True)

    plt.tight_layout()
    plt.savefig("results/figures/ablation_accuracy.png", dpi=300)
    plt.close()

    print("Improved ablation plot saved!")

if __name__ == "__main__":
    plot_ablation()