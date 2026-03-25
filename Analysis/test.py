import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════
MERGED_CSV = "../Filter/Merged_Lake_Water_Quality_Master.csv"
# ══════════════════════════════════════════════════════════════════════════════

df = pd.read_csv(MERGED_CSV)
print(f"Merged dataset: {df.shape}")

# ── STEP 1: Keep only proxies with POSITIVE correlation to DO and/or BOD ─────
# From correlation analysis:
#   Positive with DO  (+): TurbidityIndex, SWIR_TDS_norm, NDWI, DO_est, TDS_est, TSS_est
#   Positive with BOD (+): TurbidityIndex, NDCI, NDCI_pos, FAI, BOD_est, COD_est, TSS_est, WQI_proxy
#
# Kept if positive with DO OR positive with BOD (union):
BASE_PROXIES = [
    # positive with BOTH DO and BOD
    'TurbidityIndex_mean',       # DO+0.037  BOD+0.029
    'TSS_est_mgL_mean',          # DO+0.016  BOD+0.038
    # positive with DO only
    'SWIR_TDS_norm_mean',        # DO+0.075
    'NDWI_mean',                 # DO+0.129
    'DO_est_mgL_mean',           # DO+0.073
    'TDS_est_mgL_mean',          # DO+0.081
    # positive with BOD only
    'NDCI_mean',                 # BOD+0.039
    'NDCI_pos_mean',             # BOD+0.028
    'FAI_mean',                  # BOD+0.083
    'BOD_est_mgL_mean',          # BOD+0.022
    'COD_est_mgL_mean',          # BOD+0.018
    'WQI_proxy_mean',            # BOD+0.049
]
BASE_PROXIES = [c for c in BASE_PROXIES if c in df.columns]
print(f"\nBase proxies kept (positive-corr filter): {len(BASE_PROXIES)}")

# ── STEP 2: Compute derived composite features ─────────────────────────────────
# Physics: when water is clean → DO ↑, NDWI ↑, turbidity ↓, algae ↓
#          when polluted     → BOD ↑, COD ↑, NDCI ↑, FAI ↑, turbidity ↑

# --- DO composites (combine proxies positive with DO) -------------------------
# Normalise each column 0→1 before multiplying to keep units consistent
def norm(s): return (s - s.min()) / (s.max() - s.min() + 1e-9)

# DO_clarity: NDWI × DO_est × TDS_est_norm — all positive with DO
df['DO_clarity_composite'] = (
    norm(df['NDWI_mean']) *
    norm(df['DO_est_mgL_mean']) *
    norm(df['TDS_est_mgL_mean'])
) * 100   # scale to ~[0,100]

# DO_swir_ndwi: SWIR × NDWI (both positive with DO, complementary sensors)
df['DO_swir_ndwi_product'] = (
    norm(df['SWIR_TDS_norm_mean']) *
    norm(df['NDWI_mean'])
) * 100

# --- BOD composites (combine proxies positive with BOD) -----------------------
# BOD_algal: NDCI_pos × FAI — both algal proxies, both positive with BOD
df['BOD_algal_composite'] = (
    norm(df['NDCI_pos_mean']) *
    norm(df['FAI_mean'].clip(lower=0))   # FAI: positive = floating algae
) * 100

# BOD_turbid_algal: TI × NDCI_pos — turbidity × algae product
df['BOD_turbid_algal'] = (
    norm(df['TurbidityIndex_mean']) *
    norm(df['NDCI_pos_mean'])
) * 100

# BOD_organic_load: BOD_est + COD_est (direct sum of both pollution proxies)
df['BOD_COD_sum'] = (
    norm(df['BOD_est_mgL_mean']) +
    norm(df['COD_est_mgL_mean'])
) * 50   # scale to ~[0,100]

# Stress index: high BOD/COD AND low DO → heavily polluted
df['Stress_Index'] = (
    norm(df['WQI_proxy_mean']) *
    norm(df['BOD_est_mgL_mean']) *
    (1 - norm(df['DO_est_mgL_mean']))
) * 100

DERIVED_COLS = [
    'DO_clarity_composite',
    'DO_swir_ndwi_product',
    'BOD_algal_composite',
    'BOD_turbid_algal',
    'BOD_COD_sum',
    'Stress_Index',
]

ALL_PROXY_COLS = BASE_PROXIES + DERIVED_COLS
print(f"Derived composites added: {DERIVED_COLS}")

# ── STEP 3: Correlation matrix ────────────────────────────────────────────────
WQ_TARGET_COLS = ['DO', 'BOD', 'COD', 'TOTALDISSOLVEDSOLIDS', 'TOTALSUSPENDEDSOLIDS',
                  'NITRATE_N', 'PHOSPHATE', 'AMMONICALN', 'CONDUCTIVITY', 'PH']
wq_cols = [c for c in WQ_TARGET_COLS if c in df.columns]

corr_matrix = pd.DataFrame(index=ALL_PROXY_COLS, columns=wq_cols, dtype=float)
for g in ALL_PROXY_COLS:
    for w in wq_cols:
        pair = df[[g, w]].dropna()
        corr_matrix.loc[g, w] = pair[g].corr(pair[w]) if len(pair) > 5 else np.nan

corr_matrix = corr_matrix.astype(float)
print(f"\nFull correlation matrix ({corr_matrix.shape[0]} rows × {corr_matrix.shape[1]} cols):")
print(corr_matrix.round(3).to_string())

# ── STEP 4: Plot ──────────────────────────────────────────────────────────────
n_rows, n_cols = len(ALL_PROXY_COLS), len(wq_cols)
cell_size = 1.1
fig_w = max(14, n_cols * cell_size + 5)
fig_h = max(8,  n_rows * cell_size + 3)
font_size = max(7, min(11, int(180 / max(n_rows, n_cols))))

# Separate the base and derived sections with a visual divider
row_colors = ['#eaf4fb'] * len(BASE_PROXIES) + ['#fef9e7'] * len(DERIVED_COLS)

fig, ax = plt.subplots(figsize=(fig_w, fig_h))
sns.heatmap(
    corr_matrix,
    annot=True, fmt=".2f",
    cmap="coolwarm", center=0, vmin=-1, vmax=1,
    square=True,
    annot_kws={"size": font_size, "weight": "bold"},
    linewidths=0.6, linecolor="white",
    cbar_kws={"shrink": 0.7, "aspect": 25, "label": "Pearson r"},
    ax=ax
)

# Divider line between base and derived rows
ax.axhline(len(BASE_PROXIES), color='black', linewidth=2.5, linestyle='--')
ax.annotate('▲ base proxies  |  derived composites ▼',
            xy=(n_cols / 2, len(BASE_PROXIES)),
            xytext=(n_cols / 2, len(BASE_PROXIES) - 0.6),
            ha='center', fontsize=9, color='black',
            arrowprops=dict(arrowstyle='-', color='black'))

ax.set_xticklabels(ax.get_xticklabels(), rotation=35, ha="right",
                   fontsize=font_size + 1, fontweight="bold")
ax.set_yticklabels(ax.get_yticklabels(), rotation=0,
                   fontsize=font_size + 1, fontweight="bold")
ax.set_xlabel("Ground-Truth WQ Parameters", fontsize=13, fontweight="bold", labelpad=10)
ax.set_ylabel("GEE Proxies + Derived Composites", fontsize=13, fontweight="bold", labelpad=10)
ax.set_title(
    "GEE Satellite Proxies & Composites  ×  Field WQ Parameters\n"
    "Pearson Correlation  (blue=base | yellow=derived)",
    fontsize=16, fontweight="bold", pad=14
)

plt.tight_layout()
plt.savefig("correlation_gee_vs_wq.png", dpi=180, bbox_inches="tight", facecolor="white")
plt.show()
print("\nSaved → correlation_gee_vs_wq.png")

# ── STEP 5: Best correlations summary ────────────────────────────────────────
print("\n=== Top correlations with DO ===")
print(corr_matrix['DO'].sort_values(ascending=False).round(4))
print("\n=== Top correlations with BOD ===")
print(corr_matrix['BOD'].sort_values(ascending=False).round(4))