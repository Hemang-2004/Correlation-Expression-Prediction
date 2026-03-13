import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION — edit these two lines only
# ══════════════════════════════════════════════════════════════════════════════
WATER_QUALITY_CSV = "merged.csv"          # your merged/water quality file
GEE_CSV           = "GEE-Dataset-Cleaned.csv"   # ← CHANGE to your GEE file path

# Fixed water quality targets (always on one axis)
WQ_TARGETS = [
    'DO', 'BOD', 'CARBONATE', 'BICARBONATE',
    'TOTALALKALINITY',
    'TOTALHARDNESS', 'TOTALDISSOLVEDSOLIDS', 'TOTALSUSPENDEDSOLIDS'
]
# ══════════════════════════════════════════════════════════════════════════════

# ── Load datasets ─────────────────────────────────────────────────────────────
df_wq  = pd.read_csv(WATER_QUALITY_CSV)
df_gee = pd.read_csv(GEE_CSV)

# ── Extract GEE numeric columns (exclude non-numeric / identifier cols) ────────
NON_NUMERIC = {'LAKE_NAME', 'DATE', 'IMAGE_COUNT', 'B2_count', 'STN_CODE', 'YEAR'}
gee_numeric_cols = [
    c for c in df_gee.select_dtypes(include='number').columns
    if c not in NON_NUMERIC
]
print(f"GEE numeric columns found ({len(gee_numeric_cols)}): {gee_numeric_cols}")

# ── Validate WQ targets exist ─────────────────────────────────────────────────
missing = [c for c in WQ_TARGETS if c not in df_wq.columns]
if missing:
    print(f"WARNING — these WQ targets not found in {WATER_QUALITY_CSV}: {missing}")
    WQ_TARGETS = [c for c in WQ_TARGETS if c in df_wq.columns]

# ── Build combined matrix: GEE cols (rows) × WQ targets (columns) ─────────────
# Strategy: compute correlations from the merged dataset if columns co-exist,
# otherwise compute cross-file correlations column by column.

# Check if all columns live in one file already (merged scenario)
all_cols = set(df_wq.columns)
gee_in_wq = [c for c in gee_numeric_cols if c in all_cols]
gee_not_in_wq = [c for c in gee_numeric_cols if c not in all_cols]

if gee_not_in_wq:
    print(f"\nGEE columns not in water quality file — will align by row index.")
    print(f"Make sure both files are sorted the same way (same lakes × dates).")
    # Align by position (assumes same row order after cleaning)
    min_rows = min(len(df_wq), len(df_gee))
    df_combined = pd.concat([
        df_wq[WQ_TARGETS].iloc[:min_rows].reset_index(drop=True),
        df_gee[gee_numeric_cols].iloc[:min_rows].reset_index(drop=True)
    ], axis=1)
else:
    print("\nAll GEE columns found in water quality file — using directly.")
    df_combined = df_wq[WQ_TARGETS + gee_numeric_cols]

# ── Compute cross-correlation: GEE rows × WQ columns ─────────────────────────
corr_matrix = pd.DataFrame(index=gee_numeric_cols, columns=WQ_TARGETS, dtype=float)

for gee_col in gee_numeric_cols:
    for wq_col in WQ_TARGETS:
        pair = df_combined[[gee_col, wq_col]].dropna()
        if len(pair) > 5:
            corr_matrix.loc[gee_col, wq_col] = pair[gee_col].corr(pair[wq_col])
        else:
            corr_matrix.loc[gee_col, wq_col] = np.nan

corr_matrix = corr_matrix.astype(float)
print(f"\nCorrelation matrix shape: {corr_matrix.shape}  (GEE bands × WQ params)")

# ── Plot ──────────────────────────────────────────────────────────────────────
n_rows = len(gee_numeric_cols)
n_cols = len(WQ_TARGETS)

cell_size = 1.1                          # inches per cell
fig_w = max(14, n_cols * cell_size + 4)
fig_h = max(8,  n_rows * cell_size + 3)
font_size = max(8, min(12, int(200 / max(n_rows, n_cols))))

fig, ax = plt.subplots(figsize=(fig_w, fig_h))

sns.heatmap(
    corr_matrix,
    annot=True,
    fmt=".2f",
    cmap="coolwarm",
    center=0,
    vmin=-1, vmax=1,
    square=True,
    annot_kws={"size": font_size, "weight": "bold"},
    linewidths=0.6,
    linecolor="white",
    cbar_kws={"shrink": 0.7, "aspect": 25, "label": "Pearson r"},
    ax=ax
)

ax.set_xticklabels(ax.get_xticklabels(), rotation=35, ha="right",
                   fontsize=font_size + 1, fontweight="bold")
ax.set_yticklabels(ax.get_yticklabels(), rotation=0,
                   fontsize=font_size + 1, fontweight="bold")

ax.set_xlabel("Water Quality Parameters", fontsize=14, fontweight="bold", labelpad=12)
ax.set_ylabel("GEE Spectral Bands",       fontsize=14, fontweight="bold", labelpad=12)
ax.set_title("GEE Spectral Bands  ×  Water Quality Parameters\nPearson Correlation",
             fontsize=18, fontweight="bold", pad=16)

plt.tight_layout()
plt.savefig("correlation_gee_vs_wq.png", dpi=180, bbox_inches="tight", facecolor="white")
plt.show()
print("Saved → correlation_gee_vs_wq.png")