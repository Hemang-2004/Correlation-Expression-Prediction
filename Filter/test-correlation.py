import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# Load data
df = pd.read_csv('Merged_Lake_Water_Quality_Master.csv')

# Select only numeric columns
df_numeric = df.select_dtypes(include=['number'])

# Compute correlation
corr = df_numeric.corr()

# Plot
plt.figure(figsize=(12, 12))  # square shape
sns.heatmap(
    corr,
    annot=False,                # show values
    fmt=".2f",
    cmap="coolwarm",           # good color scheme
    square=True,               # makes it square
    linewidths=0.5,
    cbar=True,
    annot_kws={"size":10, "weight":"bold"}  # bold values
)

plt.title("Correlation Matrix", fontsize=16, weight="bold")
plt.xticks(rotation=45, ha="right")
plt.yticks(rotation=0)

plt.tight_layout()
plt.show()