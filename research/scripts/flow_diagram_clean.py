import matplotlib.pyplot as plt
import matplotlib.patches as patches


def get_box_width(text):
    # simple heuristic based on text length
    return max(1.6, 0.12 * len(text))


def draw_box(ax, x, text):
    width = get_box_width(text)

    rect = patches.FancyBboxPatch(
        (x, 0.35), width, 0.5,
        boxstyle="round,pad=0.02",
        edgecolor="black",
        facecolor="white"
    )
    ax.add_patch(rect)

    ax.text(
        x + width / 2, 0.6,
        text,
        ha='center',
        va='center',
        fontsize=9
    )

    return width


def create_flow():
    fig, ax = plt.subplots(figsize=(14, 3))

    steps = [
        "Raw Data",
        "Preprocessing",
        "Feature Engineering",
        "Priority Labeling",
        "Model Training",
        "Evaluation",
        "Clustering",
        "Output"
    ]

    spacing = 0.8
    x = 0

    for i, step in enumerate(steps):
        width = draw_box(ax, x, step)

        if i < len(steps) - 1:
            ax.arrow(
                x + width, 0.6,
                spacing - 0.2, 0,
                head_width=0.05,
                head_length=0.1,
                fc='black', ec='black',
                length_includes_head=True
            )

        x += width + spacing

    ax.set_xlim(-0.5, x)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.tight_layout()
    plt.savefig("results/figures/flow_clean.png", dpi=300)
    plt.close()

    print("Dynamic flow diagram generated!")


if __name__ == "__main__":
    create_flow()