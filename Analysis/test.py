import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# Read dataset
df = pd.read_csv("merged.csv")

# Select numeric columns
numeric_df = df.select_dtypes(include=['number'])
corr_matrix = numeric_df.corr()

n = len(corr_matrix.columns)

# Dynamically scale figure size based on number of columns
fig_size = max(20, n * 1.1)
font_size = max(7, min(11, 180 // n))  # shrinks font as columns grow

fig, ax = plt.subplots(figsize=(fig_size, fig_size * 0.85))

# Mask upper triangle to halve the visual noise
mask = np.triu(np.ones_like(corr_matrix, dtype=bool), k=1)

# Draw heatmap
sns.heatmap(
    corr_matrix,
    mask=mask,
    annot=True,
    fmt=".2f",
    cmap="coolwarm",
    center=0,
    vmin=-1, vmax=1,
    square=True,
    annot_kws={"size": font_size, "weight": "bold"},
    linewidths=0.4,
    linecolor="white",
    cbar_kws={"shrink": 0.6, "aspect": 30},
    ax=ax
)

# Labels
ax.set_xticklabels(
    ax.get_xticklabels(),
    rotation=45, ha="right",
    fontsize=font_size + 1, fontweight="bold"
)
ax.set_yticklabels(
    ax.get_yticklabels(),
    rotation=0,
    fontsize=font_size + 1, fontweight="bold"
)

ax.set_title("Correlation Matrix", fontsize=26, fontweight="bold", pad=20)

plt.tight_layout()
plt.savefig("correlation_matrix.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved to correlation_matrix.png")